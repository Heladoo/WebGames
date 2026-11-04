// The level: layout, input, rules and the frame loop.
//
// The world is a fixed landscape sheet, WORLD_W x WORLD_H units (16:10),
// scaled to fit the screen; the table shows around it. The game is landscape
// only: in portrait the page asks to turn the device and the game pauses.

import { PIG, type Pig, type RGB, pigToRgb, sameColor, scalePig, share, tint, WHITE } from './color';
import { Drop, mergeInto, R1, reach, stepDrop } from './drop';
import { type Glue, type Level, LEVELS, WORLD_H, WORLD_W } from './levels';
import { type CupView, type Particle, drawBackdrop, drawCup, drawDropCached, drawGlueTwinkle, drawHand, drawParticles, drawParty, PAPER, PARTY } from './render';
import { playParty, prepareParty, sfx } from './sfx';
import { stats } from './stats';
import { type Answer, quarters, QUARTER, solve } from './solver';
import { areaTarget, Towel } from './towel';

export interface Cup extends CupView {
  pig: Pig;
  /** how much it holds in all, and how much is in it */
  total: number;
  got: number;
  /** water level it is easing toward */
  goal: number;
}

export interface FailInfo {
  a: Pig; b: Pig; mix: Pig;
  /** 'touch': colours touched in a level that keeps them apart; 'nocup': no cup wants the new drop */
  kind: 'touch' | 'nocup' | 'stuck' | 'glitter' | 'towel';
  /** for 'towel': the area of the picture that got the wrong colour */
  area?: string;
  /** the drop that caused it has glitter (and no cup wants glitter of that colour) */
  glitter?: boolean;
}

export interface GameEvents {
  fail(info: FailInfo): void;
  /** the celebration has played; show the buttons */
  win(): void;
}

const DT = 1 / 240;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const portrait = matchMedia('(orientation: portrait)');
/** water level of an empty cup (the coloured hint at the bottom) and of a full one */
const LOW = 0.2, HIGH = 0.68;

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  events: GameEvents;
  level!: Level;
  drops: Drop[] = [];
  cups: Cup[] = [];
  particles: Particle[] = [];
  readonly W = WORLD_W;
  readonly H = WORLD_H;
  /** CSS pixels per world unit, and where the world starts on screen */
  S = 1; ox = 0; oy = 0;
  dpr = 1;
  backdrop: HTMLCanvasElement | null = null;
  time = 0;
  acc = 0;
  /** input is ignored while a screen covers the game */
  paused = true;
  /** the level has ended (won or a wrong mix) */
  over = false;
  won = false;
  /** something was done (for "Continue" and the restart question) */
  touched = false;
  dragId = -1;
  pointerId = -1;
  grab = { x: 0, y: 0 };
  idle = 0;
  /** a move to show: slide from a to b, or (tap2) tap a drop twice to split it */
  hint: { ax: number; ay: number; bx: number; by: number; t: number; tap2?: boolean; via?: { x: number; y: number } | { x: number; y: number }[] } | null = null;
  /** the last tap on a drop, to catch a double tap (split) */
  lastTap: { id: number; t: number; x: number; y: number } | null = null;
  /** seconds with no useful move left (a dead end ends the level gently) */
  stuckFor = 0;
  /** the solver's answer for the drops as they are now (worked out again after every change) */
  answer: Answer | null = null;
  /** the drops the answer's move numbers refer to */
  answerDrops: Drop[] = [];
  dirty = true;
  timers: { at: number; fn: () => void }[] = [];
  drips: { at: number; drop: Drop; i: number }[] = [];
  /** the celebration, seconds since it began (-1: none) */
  party = -1;
  partyStars = 0;
  /** the paper towel of this level, and its layer (between the still scene and the drops) */
  towel: Towel | null = null;
  towelEl: HTMLCanvasElement;
  areaDone: boolean[] = [];
  /** the paint each area of the picture has been given (drops let go over it) */
  areaGot: Pig[] = [];
  towelCheckIn = 0;
  /** the celebration's sound plays live (its recording was not ready) */
  liveParty = true;
  last = 0;

  /** the still scene (table, card, paper, glue, plant) on its own canvas under the game, painted only when it changes */
  bg: HTMLCanvasElement;
  /** the sharpest resolution allowed now; lowered on slow devices (see `frame`) */
  maxDpr = 2;
  slowFor = 0;
  frameMs = 16;

  constructor(canvas: HTMLCanvasElement, bg: HTMLCanvasElement, events: GameEvents) {
    this.canvas = canvas;
    this.bg = bg;
    this.towelEl = document.createElement('canvas');
    this.towelEl.id = 'towel';
    this.towelEl.setAttribute('aria-hidden', 'true');
    bg.after(this.towelEl);
    this.ctx = canvas.getContext('2d')!;
    this.events = events;
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.up(e));
    addEventListener('resize', () => this.resize());
    portrait.addEventListener('change', () => { if (portrait.matches) this.cancelDrag(); });
    this.resize();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ------------------------------------------------------------ layout

  resize() {
    const w = innerWidth, h = innerHeight;
    this.dpr = Math.min(this.maxDpr, devicePixelRatio || 1);
    for (const c of [this.canvas, this.bg]) {
      c.width = Math.round(w * this.dpr);
      c.height = Math.round(h * this.dpr);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
    }
    this.S = Math.min(w / this.W, h / this.H);
    this.ox = (w - this.W * this.S) / 2;
    this.oy = (h - this.H * this.S) / 2;
    this.backdrop = null; // painted again on the next frame
    if (this.towelEl) this.layoutTowel();
  }

  /** The towel's stain is a small picture the browser stretches smoothly over the towel. */
  layoutTowel() {
    const el = this.towelEl, t = this.towel;
    el.style.display = t ? 'block' : 'none';
    if (!t) return;
    const d = t.def;
    el.style.left = this.ox + d.x0 * this.S + 'px';
    el.style.top = this.oy + d.y0 * this.S + 'px';
    el.style.width = (d.x1 - d.x0) * this.S + 'px';
    el.style.height = (d.y1 - d.y0) * this.S + 'px';
    t.dirty = true;
  }

  layoutCups() {
    const defs = this.level.cups;
    const n = defs.length;
    const cw = 23, ch = 23;
    const top = PAPER.y1 - 3 - ch;
    this.cups = defs.map((def, i) => {
      const pig = PIG[def.color];
      return {
        x: def.x ?? (this.W * (i + 0.5)) / n, top, tw: cw, bw: cw * 0.76, h: ch,
        rgb: pigToRgb(pig), pig, need: def.need, total: def.total ?? def.need, got: 0,
        level: LOW, goal: LOW, wave: 0, filled: false, pulse: 0, pulseKind: '', hop: 0, glitter: !!def.glitter,
      };
    });
  }

  start(level: Level, drip: boolean) {
    if (this.level !== level) this.backdrop = null; // the plant grows from level to level
    this.level = level;
    this.layoutCups();
    this.towel = level.towel ? new Towel(level.towel) : null;
    if (this.towel) {
      // the towel paints its stain straight into its layer
      this.towelEl.width = this.towel.canvas.width; this.towelEl.height = this.towel.canvas.height;
      this.towel.canvas = this.towelEl;
      this.towelEl.getContext('2d')!.clearRect(0, 0, this.towelEl.width, this.towelEl.height);
    }
    this.areaDone = this.towel ? this.towel.areas.map(() => false) : [];
    this.areaGot = this.towel ? this.towel.areas.map(() => [0, 0, 0] as Pig) : [];
    this.layoutTowel();
    this.drops = [];
    this.particles = [];
    this.timers = [];
    this.drips = [];
    this.over = false;
    this.won = false;
    this.party = -1;
    this.touched = false;
    this.dragId = -1;
    this.pointerId = -1;
    this.idle = 0;
    this.hint = null;
    this.lastTap = null;
    this.stuckFor = 0;
    this.dirty = true;
    for (const def of level.drops) {
      const vol = def.vol ?? 1;
      // one unit of paint per unit of water, whatever the colour
      this.drops.push(new Drop(def.x, def.y, vol, scalePig(share(PIG[def.color]), vol)));
    }
    this.spread();
    if (drip) this.dripIn();
    // mix this level's celebration sound in the background while it is played
    prepareParty(this.cups.length);
  }

  /** Let the drops drip onto the paper one by one. */
  dripIn() {
    this.drips = [];
    this.drops.forEach((d, i) => {
      d.grow = 0;
      this.drips.push({ at: this.time + 0.35 + i * 0.16, drop: d, i });
    });
  }

  /** Push apart drops that start too close (more room between colours). */
  spread() {
    const x0 = PAPER.x0 + 6, x1 = PAPER.x1 - 6, y0 = PAPER.y0 + 10, y1 = this.cups.length ? this.cups[0].top - 14 : PAPER.y1 - 8;
    for (let it = 0; it < 200; it++) {
      let moved = false;
      for (let i = 0; i < this.drops.length; i++) {
        for (let j = i + 1; j < this.drops.length; j++) {
          const a = this.drops[i], b = this.drops[j];
          const gap = sameColor(a.pig, b.pig) ? 7 : 10;
          const want = a.R + b.R + gap;
          let dx = b.x - a.x, dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          if (dist >= want) continue;
          if (dist < 1e-3) { dx = 1; dy = 0; dist = 1; }
          const push = (want - dist) / 2 + 0.1;
          a.x -= (dx / dist) * push; a.y -= (dy / dist) * push;
          b.x += (dx / dist) * push; b.y += (dy / dist) * push;
          moved = true;
        }
      }
      for (const d of this.drops) {
        d.x = Math.max(x0, Math.min(x1, d.x));
        d.y = Math.max(y0, Math.min(y1, d.y));
      }
      if (!moved) break;
    }
  }

  clamp(d: Drop) {
    const R = d.R;
    d.x = Math.max(PAPER.x0 + R * 0.8, Math.min(PAPER.x1 - R * 0.8, d.x));
    d.y = Math.max(PAPER.y0 + R * 0.8, Math.min(PAPER.y1 - R * 0.8, d.y));
  }

  // ------------------------------------------------------------ input

  toWorld(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - this.ox) / this.S, y: (e.clientY - r.top - this.oy) / this.S };
  }

  down(e: PointerEvent) {
    if (this.paused || this.over || this.pointerId !== -1 || portrait.matches) return;
    const p = this.toWorld(e);
    this.idle = 0;
    this.hint = null;
    // the nearest drop under the finger, with a generous margin for small fingers
    let best: Drop | null = null, bd = Infinity;
    for (const d of this.drops) {
      if (d.state !== 'rest' || d.grow < 0.6) continue;
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      const reachR = d.R * 1.15 + 14 / this.S;
      if (dist < reachR && dist - d.R < bd) { bd = dist - d.R; best = d; }
    }
    if (!best) return;
    e.preventDefault();
    // a second tap on the same drop, quickly and in the same place: split it
    const lt = this.lastTap;
    if (lt && lt.id === best.id && this.time - lt.t < 0.4 && Math.hypot(p.x - lt.x, p.y - lt.y) < 6) {
      this.lastTap = null;
      this.split(best);
      return;
    }
    this.lastTap = { id: best.id, t: this.time, x: p.x, y: p.y };
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    this.pointerId = e.pointerId;
    this.dragId = best.id;
    best.state = 'drag';
    // hold the drop where it was touched, but not further than its own edge
    let gx = p.x - best.x, gy = p.y - best.y;
    const gl = Math.hypot(gx, gy), max = best.R * 0.6;
    if (gl > max) { gx *= max / gl; gy *= max / gl; }
    this.grab = { x: gx, y: gy };
    best.pull = { x: p.x - gx, y: p.y - gy };
    best.jiggle(Math.atan2(gy, gx));
    this.touched = true;
    sfx.pick(best.vol, best.pig);
  }

  move(e: PointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    const d = this.dragged();
    if (!d || !d.pull) return;
    const p = this.toWorld(e);
    d.pull.x = Math.max(PAPER.x0 + d.R, Math.min(PAPER.x1 - d.R, p.x - this.grab.x));
    d.pull.y = Math.max(PAPER.y0 + d.R, Math.min(PAPER.y1 - d.R, p.y - this.grab.y));
  }

  up(e: PointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    const d = this.dragged();
    this.dragId = -1;
    sfx.slide(0);
    if (!d) return;
    this.release(d);
  }

  cancelDrag() {
    const d = this.dragged();
    this.pointerId = -1;
    this.dragId = -1;
    sfx.slide(0);
    if (d) { d.state = 'rest'; d.pull = null; }
  }

  dragged(): Drop | undefined {
    return this.dragId < 0 ? undefined : this.drops.find((d) => d.id === this.dragId && d.state === 'drag');
  }

  release(d: Drop) {
    d.state = 'rest';
    d.pull = null;
    // let go over the paper towel: it drinks the drop right there (it can be carried anywhere first)
    if (this.towel && this.onTowel(d)) { this.soak(d); return; }
    d.excite(0.08, Math.atan2(d.vy, d.vx));
    const cup = this.cupUnder(d);
    if (cup >= 0) this.tryCup(d, cup);
    else sfx.settle(d.vol);
  }

  cupUnder(d: Drop): number {
    for (let i = 0; i < this.cups.length; i++) {
      const c = this.cups[i];
      const ry = c.tw * 0.11;
      const top = c.top - ry - d.R * 0.6, bottom = c.top + c.h;
      if (d.y < top || d.y > bottom) continue;
      const f = Math.max(0, (d.y - c.top) / c.h);
      const half = c.tw / 2 + (c.bw / 2 - c.tw / 2) * f + d.R * 0.3;
      if (Math.abs(d.x - c.x) <= half) return i;
    }
    return -1;
  }

  tryCup(d: Drop, i: number) {
    const c = this.cups[i];
    let why: 'size' | 'color' | '' = '';
    if (c.filled || !sameColor(d.pig, c.pig) || c.glitter !== d.glitter) why = 'color';
    else if (d.vol < c.need - 0.01 || d.vol > c.total - c.got + 0.01) why = 'size';
    if (why) {
      c.pulse = 1; c.pulseKind = why;
      d.shake = 1.1;
      this.moveOut(d, c);
      sfx.refuse();
      return;
    }
    d.state = 'pour';
    d.pour = { cup: i, t: 0, x0: d.x, y0: d.y };
    d.vx = d.vy = 0;
  }

  /** A refused drop slides back up onto the paper, to a free spot. */
  moveOut(d: Drop, c: Cup) {
    const y = c.top - c.tw * 0.11 - d.R - 7;
    let best = { x: d.x, y };
    search: for (let ring = 0; ring < 14; ring++) {
      for (const side of [0, -1, 1]) {
        const x = Math.max(PAPER.x0 + d.R + 2, Math.min(PAPER.x1 - d.R - 2, c.x + side * ring * d.R * 1.2));
        const yy = y - (ring > 4 ? (ring - 4) * d.R * 0.8 : 0);
        const free = this.drops.every((o) => o === d || o.state === 'gone' || Math.hypot(o.x - x, o.y - yy) > o.R + d.R + 4);
        if (free) { best = { x, y: yy }; break search; }
      }
    }
    d.state = 'auto';
    d.pull = best;
    this.later(0.9, () => { if (d.state === 'auto') { d.state = 'rest'; d.pull = null; } });
  }

  later(s: number, fn: () => void) { this.timers.push({ at: this.time + s, fn }); }

  // ------------------------------------------------------------ rules

  /**
   * Could this drop still go into some cup, alone or with more drops? A drop
   * can be split in halves (down to a volume of 1), so a half that fits counts.
   */
  fitsACup(p: Pig, vol = p[0] + p[1] + p[2], glitter = false): boolean {
    return this.cups.some((c) => {
      if (c.filled) return false;
      // a glittery drop only goes to a glitter cup; a plain one can still get glitter where there is glue
      if (glitter && !c.glitter) return false;
      if (!glitter && c.glitter && !this.glue.length) return false;
      const room = c.total - c.got;
      const t = share(c.pig);
      for (let s = 1; s === 1 || vol * s >= 0.99; s /= 2) {
        if (p.every((v, k) => v * s <= t[k] * room + 0.02)) return true;
      }
      return false;
    });
  }

  /** Split a drop in two halves (double tap). Drops smaller than 2 only wobble. */
  split(d: Drop) {
    this.touched = true;
    this.idle = 0;
    this.hint = null;
    if (d.vol < 1.99) {
      d.shake = 0.6;
      sfx.noSplit();
      return;
    }
    const v = d.vol / 2, Rn = R1 * Math.sqrt(v);
    // pick the direction with the most room: away from other drops and the paper's edges
    let best = 0, bestScore = -Infinity;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI, ux = Math.cos(a), uy = Math.sin(a);
      let score = Infinity;
      for (const sgn of [-1, 1]) {
        const x = d.x + sgn * ux * (Rn + 2.5), y = d.y + sgn * uy * (Rn + 2.5);
        score = Math.min(score, x - PAPER.x0 - Rn, PAPER.x1 - x - Rn, y - PAPER.y0 - Rn, PAPER.y1 - y - Rn);
        for (const o of this.drops) if (o !== d && o.state !== 'gone') score = Math.min(score, Math.hypot(o.x - x, o.y - y) - o.R - Rn);
        for (const c of this.cups) score = Math.min(score, c.top - c.tw * 0.11 - (y + Rn) + 2);
      }
      if (score > bestScore) { bestScore = score; best = a; }
    }
    const ux = Math.cos(best), uy = Math.sin(best);
    const half: Pig = scalePig(d.pig, 0.5);
    const b = new Drop(d.x + ux * Rn * 0.5, d.y + uy * Rn * 0.5, v, half);
    b.glitter = d.glitter;
    const cx = d.x, cy = d.y;
    d.vol = v; d.setPig(half);
    d.x = cx - ux * Rn * 0.5; d.y = cy - uy * Rn * 0.5;
    d.d.fill(0); d.dv.fill(0);
    // both start stretched toward each other, then pull apart and round off
    for (const h of [d, b]) {
      h.excite(0.32, best);
      h.state = 'auto';
    }
    d.pull = { x: cx - ux * (Rn + 2.5), y: cy - uy * (Rn + 2.5) };
    b.pull = { x: cx + ux * (Rn + 2.5), y: cy + uy * (Rn + 2.5) };
    this.drops.push(b);
    this.dirty = true;
    this.splash(cx, cy, d.rgb, 4);
    sfx.split(v);
    this.later(0.55, () => {
      for (const h of [d, b]) if (h.state === 'auto') { h.state = 'rest'; h.pull = null; }
    });
  }

  get glue(): Glue[] { return this.level?.glue ?? []; }

  /** A dragged drop crossing a glitter glue stripe picks up glitter. */
  glueCheck(d: Drop) {
    if (d.glitter) return;
    for (const g of this.glue) {
      if (segDist(d.x, d.y, g) > (g.w ?? 7) / 2 + d.R * 0.3) continue;
      d.glitter = true;
      this.dirty = true;
      d.jiggle(Math.random() * 3);
      this.splash(d.x, d.y, [1, 0.85, 0.3], 8);
      sfx.glitter();
      if (!this.fitsACup(d.pig, d.vol, true)) {
        // no cup wants this colour with glitter: say so
        const info: FailInfo = { a: [...d.pig] as Pig, b: [...d.pig] as Pig, mix: [...d.pig] as Pig, kind: 'glitter', glitter: true };
        this.cancelDrag();
        this.over = true;
        sfx.oops();
        this.later(1.3, () => this.events.fail(info));
      }
      return;
    }
  }

  /** If the straight way from a to b crosses glue that would spoil the drop, go round the stripe's end. */
  around(ax: number, ay: number, bx: number, by: number, R: number): { x: number; y: number } | undefined {
    for (const g of this.glue) {
      const w = (g.w ?? 7) / 2 + R;
      if (segSegDist(ax, ay, bx, by, g) > w) continue;
      const len = Math.hypot(g.x1 - g.x0, g.y1 - g.y0) || 1;
      const ux = (g.x1 - g.x0) / len, uy = (g.y1 - g.y0) / len;
      let best: { x: number; y: number } | undefined, bl = Infinity;
      for (const [ex, ey, s] of [[g.x0, g.y0, -1], [g.x1, g.y1, 1]] as const) {
        const x = ex + s * ux * (w + 5), y = ey + s * uy * (w + 5);
        if (x < PAPER.x0 + R || x > PAPER.x1 - R || y < PAPER.y0 + R || y > PAPER.y1 - R) continue;
        const l = Math.hypot(x - ax, y - ay) + Math.hypot(bx - x, by - y);
        if (l < bl) { bl = l; best = { x, y }; }
      }
      return best;
    }
    return undefined;
  }

  touchCheck(d: Drop) {
    for (const o of this.drops) {
      if (o === d || o.state !== 'rest' || o.grow < 0.9) continue;
      // only drops within reach of the dragged one's stretched outline
      if (Math.hypot(o.x - d.x, o.y - d.y) > d.R * 1.8 + o.R + 10) continue;
      const r = reach(d, o);
      const same = sameColor(d.pig, o.pig);
      if (r > 0) {
        const info: FailInfo = { a: [...d.pig] as Pig, b: [...o.pig] as Pig, mix: [0, 0, 0], kind: 'touch', glitter: d.glitter || o.glitter };
        mergeInto(d, o);
        this.dirty = true;
        info.mix = [...d.pig] as Pig;
        this.grab.x *= 0.5; this.grab.y *= 0.5;
        this.splash(d.x, d.y, d.rgb, 5);
        const ok = (same || this.level.mixing) && (!!this.towel || this.level.free || this.fitsACup(d.pig, d.vol, d.glitter));
        if (ok) {
          sfx.merge(d.vol, !same);
        } else {
          // show it really happen, then explain
          if (this.level.mixing || same) info.kind = d.glitter && this.fitsACup(d.pig, d.vol, false) ? 'glitter' : 'nocup';
          this.cancelDrag();
          this.over = true;
          sfx.oops();
          this.later(1.5, () => this.events.fail(info));
        }
        return;
      }
      if (!same && !this.level.mixing) {
        // a drop of another colour is close: it trembles, as a warning
        const near = 1 - Math.max(0, -r) / (d.R + 9);
        if (near > 0) o.shiver = Math.max(o.shiver, near);
      }
    }
  }

  splash(x: number, y: number, rgb: RGB, n: number) {
    if (reduced) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 8 + Math.random() * 10;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.7, max: 0.7, kind: 'spark', rgb, size: 1 + Math.random() * 0.8, rot: Math.random() * 3 });
    }
  }

  // ------------------------------------------------------------ frame

  frame(now: number) {
    const raw = this.last ? now - this.last : 16;
    const dt = Math.min(0.05, raw / 1000);
    this.last = now;
    // a device that keeps missing frames gets a lower resolution (2 → 1.5 → 1), once and for good
    this.frameMs += (Math.min(raw, 250) - this.frameMs) * 0.05;
    if (!document.hidden && this.frameMs > 30 && this.dpr > 1) {
      this.slowFor += raw / 1000;
      if (this.slowFor > 2) {
        this.maxDpr = Math.max(1, this.dpr - 0.5);
        this.slowFor = 0;
        this.frameMs = 16;
        this.resize();
      }
    } else this.slowFor = 0;
    this.update(dt);
    this.draw();
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt: number) {
    this.time += dt;
    for (const tm of this.timers.splice(0)) {
      if (tm.at <= this.time) tm.fn(); else this.timers.push(tm);
    }
    for (const dp of this.drips.splice(0)) {
      if (dp.at <= this.time) {
        dp.drop.grow = 0.01;
        sfx.drip(dp.i);
      } else this.drips.push(dp);
    }
    for (const d of this.drops) {
      if (d.grow < 1 && d.grow > 0) {
        d.grow = Math.min(1, d.grow + dt * 5);
        if (d.grow >= 1) d.excite(0.22, Math.random() * 3);
      }
    }

    // physics in small fixed steps
    // a slow device does at most 8 steps a frame (the drops then move a little
    // slower, rather than each frame taking longer and longer)
    this.acc = Math.min(this.acc + dt, DT * 8);
    const dragged = this.dragged();
    while (this.acc >= DT) {
      this.acc -= DT;
      for (const d of this.drops) {
        if (d.state === 'gone' || d.state === 'pour') continue;
        // a drop that has come to rest sleeps until something touches it
        if (d.still > 0.25) continue;
        stepDrop(d, DT, this.time);
        this.clamp(d);
      }
      // touches every step, so a fast drop cannot jump over another one
      if (dragged && dragged.state === 'drag') {
        this.glueCheck(dragged);
        this.touchCheck(dragged);
      }
    }
    for (const d of this.drops) {
      d.shiver = Math.max(0, d.shiver - dt * 2.5);
      d.shake = Math.max(0, d.shake - dt);
      // is it perfectly still? (then it is drawn from a cached picture)
      let moving = d.state !== 'rest' || d.grow < 1 || d.shiver > 0 || d.shake > 0 || Math.hypot(d.vx, d.vy) > 0.05;
      if (!moving) for (let i = 0; i < d.dv.length; i++) if (Math.abs(d.dv[i]) > d.R * 0.01) { moving = true; break; }
      d.still = moving ? 0 : d.still + dt;
    }
    if (dragged && dragged.state === 'drag') {
      sfx.slide(Math.hypot(dragged.vx, dragged.vy), dragged.vol);
    }
    this.updatePours(dt);
    if (this.towel) this.updateTowel(dt);
    this.drops = this.drops.filter((d) => d.state !== 'gone');
    this.checkStuck(dt);

    for (const c of this.cups) {
      c.level += (c.goal - c.level) * Math.min(1, dt * 2.2);
      c.wave = Math.max(0, c.wave - dt * 0.7);
      c.pulse = Math.max(0, c.pulse - dt * 0.6);
      if (c.pulse === 0) c.pulseKind = '';
    }
    if (this.party >= 0) this.updateParty(dt);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'drop') p.vy += 60 * dt; else { p.vx *= 0.94; p.vy *= 0.94; }
      p.rot += dt * 2;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // play time counts only while a level is really on screen
    if (!this.paused && !portrait.matches && !document.hidden) stats.tick(dt);

    // a hint after a quiet while
    if (!this.paused && !this.over && !dragged && !portrait.matches) {
      this.idle += dt;
      const wait = this.level.teach ? 2.5 : 7;
      if (this.idle > wait && !this.hint) this.hint = this.suggest();
      if (this.hint) {
        this.hint.t += dt / 2.6;
        if (this.hint.t >= 1) { this.hint.t = 0; if (this.idle > 30) { this.hint = null; this.idle = 7; } }
      }
    }
  }

  /** Ask the solver again when something changed (a join, split, pour or glitter). */
  think() {
    if (!this.dirty || !this.level) return;
    this.dirty = false;
    if (this.level.free || this.towel) { this.answer = null; return; }
    const live = this.drops.filter((d) => d.state !== 'gone' && d.state !== 'pour');
    const pouring = this.drops.filter((d) => d.state === 'pour');
    const cups = this.cups.map((c, i) => {
      const coming = pouring.filter((d) => d.pour?.cup === i).reduce((m, d) => m + d.vol, 0);
      return { pig: c.pig, need: c.need * QUARTER, room: Math.round((c.total - c.got - coming) * QUARTER), g: c.glitter };
    });
    this.answerDrops = live;
    this.answer = solve(live.map((d) => ({ p: quarters(d.pig), g: d.glitter })), cups, { mixing: this.level.mixing, glue: this.glue.length > 0 });
  }

  /** A dead end (the solver finds no way left): after a moment, the level ends gently and says so. */
  checkStuck(dt: number) {
    this.think();
    const busy = this.over || this.paused || this.drips.length > 0 || this.drops.some((d) => d.state !== 'rest' || d.grow < 1);
    if (busy || !this.cups.length || this.level.free || this.answer?.solvable !== 'no') { this.stuckFor = 0; return; }
    this.stuckFor += dt;
    if (this.stuckFor > 1.2) {
      this.over = true;
      const p = this.drops[0]?.pig ?? [1, 1, 1];
      sfx.oops();
      this.events.fail({ a: p, b: p, mix: p, kind: 'stuck' });
    }
  }

  updatePours(dt: number) {
    for (const d of this.drops) {
      if (d.state !== 'pour' || !d.pour) continue;
      const c = this.cups[d.pour.cup];
      const p = d.pour;
      p.t += dt;
      const mx = c.x, my = c.top - c.tw * 0.05;
      const wy = c.top + c.h * (1 - c.level);
      if (p.t < 0.3) {
        const q = p.t / 0.3, e = q * q * (3 - 2 * q);
        d.x = p.x0 + (mx - p.x0) * e; d.y = p.y0 + (my - p.y0) * e;
      } else if (p.t < 0.7) {
        const q = (p.t - 0.3) / 0.4;
        d.x = mx; d.y = my + (wy - my) * q * q;
        d.grow = Math.max(0.05, 1 - q * 0.8);
      } else {
        d.state = 'gone';
        this.dirty = true;
        c.got += d.vol;
        c.filled = c.got >= c.total - 0.01;
        c.goal = LOW + (HIGH - LOW) * Math.min(1, c.got / c.total);
        c.wave = 1;
        this.splash(c.x, wy, c.rgb, 10);
        for (let k = 0; k < 2; k++) this.particles.push({ x: c.x, y: wy, vx: 0, vy: 0, life: 0.9 + k * 0.3, max: 0.9 + k * 0.3, kind: 'ring', rgb: c.rgb, size: c.bw * 0.45, rot: 0 });
        sfx.cup(this.cups.indexOf(c), c.filled);
        if (this.cups.every((k) => k.filled)) this.winLevel();
      }
    }
  }

  winLevel() {
    this.over = true;
    this.won = true;
    this.later(0.35, () => {
      this.party = 0;
      this.partyStars = 0;
      // the recorded celebration sound if it is ready; else it plays live
      this.liveParty = !playParty(this.cups.length);
      if (this.liveParty) sfx.win();
    });
  }

  // ------------------------------------------------------------ the paper towel

  /** Is any part of the drop's outline on the towel? */
  onTowel(d: Drop): boolean {
    const t = this.towel!;
    const R = d.R;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (t.covers(d.x + Math.cos(a) * R * 0.9, d.y + Math.sin(a) * R * 0.9)) return true;
    }
    return false;
  }

  /** The towel drinks the drop: it stays where it was let go and soaks in. */
  soak(d: Drop) {
    const i = this.towel!.areaAt(d.x, d.y);
    if (i >= 0) d.pig.forEach((v, k) => (this.areaGot[i][k] += v));
    d.state = 'soak';
    d.pull = null;
    d.vx *= 0.2; d.vy *= 0.2;
    d.jiggle(Math.random() * 3);
    this.touched = true;
    sfx.soak(d.vol);
  }

  updateTowel(dt: number) {
    const t = this.towel!;
    for (const d of this.drops) {
      if (d.state !== 'soak') continue;
      // the drop shrinks into the towel, giving it its water and dye; it slides on a little as it goes
      const amt = Math.min(d.vol, (1.2 + d.vol * 1.5) * dt);
      const sh = share(d.pig);
      const tx = Math.max(t.def.x0 + 1, Math.min(t.def.x1 - 1, d.x)), ty = Math.max(t.def.y0 + 1, Math.min(t.def.y1 - 1, d.y + d.R * 0.3));
      t.absorb(tx, ty, d.R * 0.8, amt, [sh[0] * amt, sh[1] * amt, sh[2] * amt]);
      d.vol -= amt;
      d.setPig(scalePig(sh, d.vol));
      if (d.vol < 0.04) d.state = 'gone';
    }
    t.step(dt);
    t.render();
    if (this.over || this.paused) return;
    this.towelCheckIn -= dt;
    if (this.towelCheckIn > 0) return;
    this.towelCheckIn = 0.25;
    const soaking = this.drops.some((d) => d.state === 'soak');
    const left = this.drops.filter((d) => d.state !== 'gone');
    if (!t.areas.length) {
      // free colouring: done when every drop has soaked in
      if (!left.length && t.quiet > 1) this.winLevel();
      return;
    }
    // a picture: each area wants its colour, judged by eye: coloured in, mostly in its colour
    const look = t.areaLook();
    t.areas.forEach((a, i) => {
      const l = look[i], tg = areaTarget(a);
      // a clear wrong colour (more than a third of what is coloured), once the paint has settled
      if (l.wrong > 0.2 && !soaking && t.quiet > 0.8) {
        this.over = true;
        sfx.oops();
        const want = scalePig(tg, a.need);
        this.later(1, () => this.events.fail({ a: l.colour, b: want, mix: l.colour, kind: 'towel', area: a.name }));
        return;
      }
      // or: it was given all its paint and a good part shows its colour (a patchy job is fine)
      const given = tg.every((v, k) => this.areaGot[i][k] >= v * a.need * 0.85 - 0.01);
      // every piece (each petal, each ray, each wing) shows its colour
      const each = Math.min(...l.pieces);
      if (!this.areaDone[i] && (each >= 0.5 || (given && each >= 0.25 && !soaking && t.quiet > 1.2))) {
        this.areaDone[i] = true;
        const c = t.areaCentre(i);
        this.splash(c.x, c.y, pigToRgb(tg), 10);
        sfx.cup(i, true);
      }
    });
    if (this.over) return;
    if (this.areaDone.every(Boolean) && !soaking) { this.winLevel(); return; }
    // a dead end: an area still needs a colour that no drop left has
    if (!soaking && t.quiet > 1) {
      const have = [0, 0, 0];
      for (const d of left) d.pig.forEach((v, k) => (have[k] += v));
      // an area still lacks a colour (by what it was given) that no drop left has
      // (a colour it already has doesn't count: mixing happens on the towel too)
      const stuck = t.areas.some((a, i) => {
        if (this.areaDone[i]) return false;
        return areaTarget(a).some((v, k) => v > 0.05 && this.areaGot[i][k] < v * a.need * 0.5 && have[k] < 0.05);
      });
      if (stuck) {
        this.over = true;
        sfx.oops();
        const p = left[0]?.pig ?? [1, 1, 1];
        this.later(0.8, () => this.events.fail({ a: p, b: p, mix: p, kind: 'stuck' }));
      }
    }
  }

  /** The celebration plays on the paper: cups hop and splash, stickers, writing. */
  updateParty(dt: number) {
    const t0 = this.party;
    this.party += dt;
    const t = this.party;
    this.cups.forEach((c, i) => {
      const start = PARTY.hop0 + i * PARTY.hopGap;
      const q = (t - start) / 0.45;
      c.hop = q > 0 && q < 1 ? Math.sin(q * Math.PI) * (1 - q * 0.3) : 0;
      // a little fountain from each cup as it lands
      if (t0 < start + PARTY.hopLand && t >= start + PARTY.hopLand) {
        c.wave = 1;
        const n = reduced ? 4 : 12;
        for (let k = 0; k < n; k++) {
          this.particles.push({
            x: c.x + (Math.random() - 0.5) * c.tw * 0.5, y: c.top, vx: (Math.random() - 0.5) * 22, vy: -30 - Math.random() * 25,
            life: 1.3, max: 1.3, kind: 'drop', rgb: tint(c.rgb, WHITE, Math.random() * 0.15), size: 0.7 + Math.random() * 0.9, rot: 0,
          });
        }
        if (this.liveParty) sfx.hop(i);
      }
    });
    const starsAt = PARTY.stars;
    while (this.partyStars < 3 && t >= starsAt[this.partyStars]) { if (this.liveParty) sfx.sticker(this.partyStars); this.partyStars++; }
    if (t0 < PARTY.buttons && t >= PARTY.buttons) this.events.win();
  }

  /** What should a stuck player try next? The first move of the solver's shortest way, else a rule of thumb. */
  suggest(): Game['hint'] {
    if (this.towel) return this.suggestTowel();
    this.think();
    const mv = this.answer?.move, L = this.answerDrops;
    if (mv) {
      if (mv.kind === 'pour') {
        const d = L[mv.drop], c = this.cups[mv.cup];
        const px = c.x, py = c.top + c.h * 0.3;
        return { ax: d.x, ay: d.y, bx: px, by: py, t: 0, via: d.glitter ? undefined : this.around(d.x, d.y, px, py, d.R) };
      }
      if (mv.kind === 'join') {
        const a = L[mv.a], b = L[mv.b];
        return { ax: b.x, ay: b.y, bx: a.x, by: a.y, t: 0, via: b.glitter ? undefined : this.around(b.x, b.y, a.x, a.y, b.R) };
      }
      if (mv.kind === 'split') { const d = L[mv.drop]; return { ax: d.x, ay: d.y, bx: d.x, by: d.y, t: 0, tap2: true }; }
      if (mv.kind === 'glitter') {
        const d = L[mv.drop];
        const g = this.glue.reduce((m, q) => (segDist(d.x, d.y, q) < segDist(d.x, d.y, m) ? q : m));
        const p = nearest(d.x, d.y, g);
        return { ax: d.x, ay: d.y, bx: p.x, by: p.y, t: 0 };
      }
    }
    if (this.answer?.solvable === 'no') return null;
    return this.suggestRough();
  }

  /**
   * On a towel: a drop of an area's colour to that area. For a mixed colour
   * (green, orange, purple) the two drops are joined first on the paper, so the
   * colour really mixes. Free colouring: anywhere on the towel.
   */
  suggestTowel(): Game['hint'] {
    const t = this.towel!;
    const free = this.drops.filter((d) => d.state === 'rest');
    if (!free.length) return null;
    if (!t.areas.length) {
      const d = free[0];
      return { ax: d.x, ay: d.y, bx: d.x, by: (t.def.y0 + t.def.y1) / 2, t: 0 };
    }
    const fits = (p: Pig, want: number[]) => p.every((v, c) => v < 0.01 || v <= want[c] + 0.05);
    for (let k = 0; k < t.areas.length; k++) {
      if (this.areaDone[k]) continue;
      const a = t.areas[k], tg = areaTarget(a);
      const want = tg.map((v, c) => v * a.need - this.areaGot[k][c]);
      // a drop that already has the colour: onto the area (first straight onto the towel, past the other drops)
      const ready = free.find((d) => sameColor(d.pig, PIG[a.color]) && fits(d.pig, want));
      if (ready) {
        const c = t.areaCentre(k);
        return { ax: ready.x, ay: ready.y, bx: c.x, by: c.y, t: 0, via: this.outOfTheRow(ready) };
      }
      // two drops that make the colour together: join them first (the closest pair)
      let pair: [number, Drop, Drop] | null = null;
      for (const x of free) for (const y of free) {
        if (x === y || x.vol < y.vol) continue;
        const p: Pig = [x.pig[0] + y.pig[0], x.pig[1] + y.pig[1], x.pig[2] + y.pig[2]];
        // only a join that makes the area's colour (red + blue for purple, not blue + blue)
        if (!fits(p, want) || !sameColor(p, PIG[a.color])) continue;
        const dist = Math.hypot(x.x - y.x, x.y - y.y);
        if (!pair || dist < pair[0]) pair = [dist, x, y];
      }
      if (pair) return { ax: pair[2].x, ay: pair[2].y, bx: pair[1].x, by: pair[1].y, t: 0 };
    }
    return null;
  }

  /**
   * A way out from among the other drops onto the towel: if another drop is in the
   * way to the towel's edge, first step into the gap between them.
   */
  outOfTheRow(d: Drop): { x: number; y: number }[] {
    const td = this.towel!.def;
    const others = this.drops.filter((o) => o !== d && o.state === 'rest');
    const room = (o: Drop) => o.R + d.R + 1;
    // across to the towel at height y: no other drop near that line
    const across = (y: number) => others.every((o) => o.x < d.x - 1 || o.x > td.x0 || Math.abs(o.y - y) > room(o));
    // up or down to height y in the drop's own column: no drop on the way
    const along = (y: number) => others.every((o) => Math.abs(o.x - d.x) > room(o) || o.y < Math.min(d.y, y) - room(o) || o.y > Math.max(d.y, y) + room(o));
    if (across(d.y)) return [{ x: td.x0 + 3, y: d.y }];
    for (let dy = 2; dy < 30; dy += 0.5) for (const y of [d.y + dy, d.y - dy]) {
      if (y < PAPER.y0 + d.R || y > PAPER.y1 - d.R) continue;
      if (along(y) && across(y)) return [{ x: d.x, y }, { x: td.x0 + 3, y }];
    }
    return [{ x: td.x0 + 3, y: d.y }];
  }

  /** Rules of thumb, for when the solver gave up (a very big search). */
  suggestRough(): Game['hint'] {
    const free = this.drops.filter((d) => d.state === 'rest');
    const takes = (k: Cup, d: { pig: Pig; vol: number }, glitter: boolean) =>
      !k.filled && sameColor(d.pig, k.pig) && k.glitter === glitter && d.vol >= k.need - 0.01 && d.vol <= k.total - k.got + 0.01;
    const cupPoint = (c: Cup) => ({ x: c.x, y: c.top + c.h * 0.3 });
    // a drop that a cup takes now (going round glue if it must stay plain)
    for (const d of free) {
      const c = this.cups.find((k) => takes(k, d, d.glitter));
      if (!c) continue;
      const p = cupPoint(c);
      return { ax: d.x, ay: d.y, bx: p.x, by: p.y, t: 0, via: d.glitter ? undefined : this.around(d.x, d.y, p.x, p.y, d.R) };
    }
    // a drop that a glitter cup would take once it has glitter: through the glue
    for (const d of free) {
      if (d.glitter || !this.glue.length || !this.cups.some((k) => takes(k, d, true))) continue;
      const g = this.glue.reduce((m, q) => (segDist(d.x, d.y, q) < segDist(d.x, d.y, m) ? q : m));
      const p = nearest(d.x, d.y, g);
      return { ax: d.x, ay: d.y, bx: p.x, by: p.y, t: 0 };
    }
    // two drops that make something a cup wants (prefer the closest pair)
    let best: [number, Drop, Drop, { x: number; y: number } | undefined] | null = null;
    for (const a of free) for (const b of free) {
      if (a === b || a.vol < b.vol) continue;
      if (!this.level.mixing && !sameColor(a.pig, b.pig)) continue;
      const p: Pig = [a.pig[0] + b.pig[0], a.pig[1] + b.pig[1], a.pig[2] + b.pig[2]];
      const glit = a.glitter || b.glitter;
      if (!this.fitsACup(p, a.vol + b.vol, glit)) continue;
      // the smaller drop (b) moves; it must not pick up glitter if the join has to stay plain
      const via = !glit && !this.fitsACup(p, a.vol + b.vol, true) ? this.around(b.x, b.y, a.x, a.y, b.R) : undefined;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!best || dist < best[0]) best = [dist, a, b, via];
    }
    if (best) return { ax: best[2].x, ay: best[2].y, bx: best[1].x, by: best[1].y, t: 0, via: best[3] };
    // a big drop whose halves a cup wants: tap it twice
    const big = free.find((d) => d.vol >= 1.99 && this.fitsACup(scalePig(d.pig, 0.5), d.vol / 2, d.glitter));
    if (big) return { ax: big.x, ay: big.y, bx: big.x, by: big.y, t: 0, tap2: true };
    return null;
  }

  draw() {
    const ctx = this.ctx;
    const k = this.dpr * this.S;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!this.backdrop) {
      // paint the still scene once, onto the layer underneath
      this.backdrop = drawBackdrop(this.canvas.width, this.canvas.height, this.ox * this.dpr, this.oy * this.dpr, k, this.stage(), this.glue, this.level?.towel);
      const b = this.bg.getContext('2d')!;
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.drawImage(this.backdrop, 0, 0);
    }
    // the game layer itself is transparent: clear it and draw only what lives
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, this.ox * this.dpr, this.oy * this.dpr);
    if (this.glue.length) drawGlueTwinkle(ctx, this.glue, this.time);
    for (const c of this.cups) drawCup(ctx, c, this.time);
    // resting drops first, the moving one on top
    const order = [...this.drops].sort((a, b) => (a.state === 'drag' ? 1 : 0) - (b.state === 'drag' ? 1 : 0));
    for (const d of order) drawDropCached(ctx, d, k);
    if (this.party >= 0) drawParty(ctx, this.party, this.partyColors(), k);
    drawParticles(ctx, this.particles);
    if (this.hint) drawHand(ctx, this.hint.ax, this.hint.ay, this.hint.bx, this.hint.by, this.hint.t, this.hint.tap2, this.hint.via);
  }

  /** How far along the game this level is (0..11), for the plant on the table. */
  stage(): number {
    const i = LEVELS.findIndex((l) => l.id === this.level?.id);
    return i < 0 ? 5 : i;
  }

  /** The colours of the writing in the celebration: the cups', or the picture's / the drops'. */
  partyColors(): RGB[] {
    if (this.cups.length) return this.cups.map((c) => c.rgb);
    if (this.towel?.areas.length) return this.towel.areas.map((a) => pigToRgb(PIG[a.color]));
    return [pigToRgb(PIG.red), pigToRgb(PIG.yellow), pigToRgb(PIG.blue)];
  }

  /** For tests and debugging: positions in CSS pixels. */
  snapshot() {
    const X = (x: number) => this.ox + x * this.S, Y = (y: number) => this.oy + y * this.S;
    return {
      over: this.over, won: this.won,
      areas: this.towel ? this.towel.areas.map((a, i) => ({ name: a.name, done: this.areaDone[i], paint: this.towel!.areaPaint()[i], centre: (() => { const c = this.towel!.areaCentre(i); return { x: X(c.x), y: Y(c.y) }; })() })) : [],
      towel: this.towel ? { x0: X(this.towel.def.x0), y0: Y(this.towel.def.y0), x1: X(this.towel.def.x1), y1: Y(this.towel.def.y1) } : null,
      drops: this.drops.map((d) => ({ id: d.id, x: X(d.x), y: Y(d.y), r: d.R * this.S, vol: d.vol, pig: d.pig, state: d.state, glitter: d.glitter })),
      cups: this.cups.map((c) => ({ x: X(c.x), y: Y(c.top + c.h * 0.35), filled: c.filled, need: c.need, total: c.total, got: c.got, pig: c.pig, glitter: c.glitter })),
      toScreen: (x: number, y: number) => ({ x: X(x), y: Y(y) }),
    };
  }
}

// ---------------------------------------------------------------- geometry for glue stripes

/** The point of segment g nearest to (x, y). */
function nearest(x: number, y: number, g: Glue) {
  const dx = g.x1 - g.x0, dy = g.y1 - g.y0;
  const t = Math.max(0, Math.min(1, ((x - g.x0) * dx + (y - g.y0) * dy) / (dx * dx + dy * dy || 1)));
  return { x: g.x0 + dx * t, y: g.y0 + dy * t };
}

function segDist(x: number, y: number, g: Glue) {
  const p = nearest(x, y, g);
  return Math.hypot(x - p.x, y - p.y);
}

/** Distance between segment a-b and segment g (0 when they cross). */
function segSegDist(ax: number, ay: number, bx: number, by: number, g: Glue) {
  const cross = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const d1 = cross(ax, ay, bx, by, g.x0, g.y0), d2 = cross(ax, ay, bx, by, g.x1, g.y1);
  const d3 = cross(g.x0, g.y0, g.x1, g.y1, ax, ay), d4 = cross(g.x0, g.y0, g.x1, g.y1, bx, by);
  if (d1 * d2 < 0 && d3 * d4 < 0) return 0;
  const ab: Glue = { x0: ax, y0: ay, x1: bx, y1: by };
  return Math.min(segDist(ax, ay, g), segDist(bx, by, g), segDist(g.x0, g.y0, ab), segDist(g.x1, g.y1, ab));
}
