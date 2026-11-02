// The level: layout, input, rules and the frame loop.
//
// The world is a fixed landscape sheet, WORLD_W x WORLD_H units (16:10),
// scaled to fit the screen; the table shows around it. The game is landscape
// only: in portrait the page asks to turn the device and the game pauses.

import { PIG, type Pig, type RGB, pigToRgb, sameColor, scalePig, share, tint, WHITE } from './color';
import { Drop, mergeInto, reach, stepDrop } from './drop';
import { type Level, WORLD_H, WORLD_W } from './levels';
import { type CupView, type Particle, drawBackdrop, drawCup, drawDrop, drawHand, drawParticles, drawParty, PAPER } from './render';
import { sfx } from './sfx';

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
  kind: 'touch' | 'nocup';
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
  hint: { ax: number; ay: number; bx: number; by: number; t: number } | null = null;
  timers: { at: number; fn: () => void }[] = [];
  drips: { at: number; drop: Drop; i: number }[] = [];
  /** the celebration, seconds since it began (-1: none) */
  party = -1;
  partyStars = 0;
  last = 0;

  constructor(canvas: HTMLCanvasElement, events: GameEvents) {
    this.canvas = canvas;
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
    this.dpr = Math.min(3, devicePixelRatio || 1);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.S = Math.min(w / this.W, h / this.H);
    this.ox = (w - this.W * this.S) / 2;
    this.oy = (h - this.H * this.S) / 2;
    this.backdrop = null; // painted again on the next frame
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
        level: LOW, goal: LOW, wave: 0, filled: false, pulse: 0, pulseKind: '', hop: 0,
      };
    });
  }

  start(level: Level, drip: boolean) {
    this.level = level;
    this.layoutCups();
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
    for (const def of level.drops) {
      const vol = def.vol ?? 1;
      this.drops.push(new Drop(def.x, def.y, vol, scalePig(PIG[def.color], vol)));
    }
    this.spread();
    if (drip) this.dripIn();
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
    best.excite(0.06, Math.atan2(gy, gx));
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
    if (c.filled || !sameColor(d.pig, c.pig)) why = 'color';
    else if (d.vol < c.need - 0.01) why = 'size';
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

  /** Could this drop still go, whole, into some cup (alone or with more drops)? */
  fitsACup(p: Pig): boolean {
    return this.cups.some((c) => {
      if (c.filled) return false;
      const room = c.total - c.got;
      const t = share(c.pig);
      return p.every((v, k) => v <= t[k] * room + 0.02);
    });
  }

  touchCheck(d: Drop) {
    for (const o of this.drops) {
      if (o === d || o.state !== 'rest' || o.grow < 0.9) continue;
      if (Math.hypot(o.x - d.x, o.y - d.y) > d.R * 2.2 + o.R + 14) continue;
      const r = reach(d, o);
      const same = sameColor(d.pig, o.pig);
      if (r > 0) {
        const info: FailInfo = { a: [...d.pig] as Pig, b: [...o.pig] as Pig, mix: [0, 0, 0], kind: 'touch' };
        mergeInto(d, o);
        info.mix = [...d.pig] as Pig;
        this.grab.x *= 0.5; this.grab.y *= 0.5;
        this.splash(d.x, d.y, d.rgb, 5);
        const ok = (same || this.level.mixing) && this.fitsACup(d.pig);
        if (ok) {
          sfx.merge(d.vol, !same);
        } else {
          // show it really happen, then explain
          if (this.level.mixing || same) info.kind = 'nocup';
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
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0);
    this.last = now;
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
    this.acc += dt;
    const dragged = this.dragged();
    while (this.acc >= DT) {
      this.acc -= DT;
      for (const d of this.drops) {
        if (d.state === 'gone' || d.state === 'pour') continue;
        stepDrop(d, DT, this.time);
        this.clamp(d);
      }
    }
    for (const d of this.drops) {
      d.shiver = Math.max(0, d.shiver - dt * 2.5);
      d.shake = Math.max(0, d.shake - dt);
    }
    if (dragged && dragged.state === 'drag') {
      sfx.slide(Math.hypot(dragged.vx, dragged.vy), dragged.vol);
      this.touchCheck(dragged);
    }
    this.updatePours(dt);
    this.drops = this.drops.filter((d) => d.state !== 'gone');

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

    // a hint after a quiet while
    if (!this.paused && !this.over && !dragged && !portrait.matches) {
      this.idle += dt;
      if (this.idle > 7 && !this.hint) this.hint = this.suggest();
      if (this.hint) {
        this.hint.t += dt / 2.6;
        if (this.hint.t >= 1) { this.hint.t = 0; if (this.idle > 30) { this.hint = null; this.idle = 7; } }
      }
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
        c.got += d.vol;
        c.filled = c.got >= c.total - 0.01;
        c.goal = LOW + (HIGH - LOW) * Math.min(1, c.got / c.total);
        c.wave = 1;
        this.splash(c.x, wy, c.rgb, 10);
        for (let k = 0; k < 2; k++) this.particles.push({ x: c.x, y: wy, vx: 0, vy: 0, life: 0.9 + k * 0.3, max: 0.9 + k * 0.3, kind: 'ring', rgb: c.rgb, size: c.bw * 0.45, rot: 0 });
        sfx.cup(this.cups.indexOf(c), c.filled);
        if (this.cups.every((k) => k.filled)) {
          this.over = true;
          this.won = true;
          this.later(0.9, () => { this.party = 0; this.partyStars = 0; sfx.win(); });
        }
      }
    }
  }

  /** The celebration plays on the paper: cups hop and splash, stickers, writing. */
  updateParty(dt: number) {
    const t0 = this.party;
    this.party += dt;
    const t = this.party;
    this.cups.forEach((c, i) => {
      const start = 0.15 + i * 0.18;
      const q = (t - start) / 0.55;
      c.hop = q > 0 && q < 1 ? Math.sin(q * Math.PI) * (1 - q * 0.3) : 0;
      // a little fountain from each cup as it lands
      if (t0 < start + 0.5 && t >= start + 0.5) {
        c.wave = 1;
        const n = reduced ? 4 : 12;
        for (let k = 0; k < n; k++) {
          this.particles.push({
            x: c.x + (Math.random() - 0.5) * c.tw * 0.5, y: c.top, vx: (Math.random() - 0.5) * 22, vy: -30 - Math.random() * 25,
            life: 1.3, max: 1.3, kind: 'drop', rgb: tint(c.rgb, WHITE, Math.random() * 0.15), size: 0.7 + Math.random() * 0.9, rot: 0,
          });
        }
        sfx.hop(i);
      }
    });
    const starsAt = [0.9, 1.15, 1.4];
    while (this.partyStars < 3 && t >= starsAt[this.partyStars]) { sfx.sticker(this.partyStars); this.partyStars++; }
    if (t0 < 2.6 && t >= 2.6) this.events.win();
  }

  /** What should a stuck player try next? */
  suggest(): Game['hint'] {
    const free = this.drops.filter((d) => d.state === 'rest');
    // a drop that a cup takes now
    for (const d of free) {
      const c = this.cups.find((k) => !k.filled && sameColor(d.pig, k.pig) && d.vol >= k.need - 0.01);
      if (c) return { ax: d.x, ay: d.y, bx: c.x, by: c.top + c.h * 0.3, t: 0 };
    }
    // two drops that make something a cup wants (prefer the closest pair)
    let best: [number, typeof free[0], typeof free[0]] | null = null;
    for (const a of free) for (const b of free) {
      if (a === b || a.vol < b.vol) continue;
      if (!this.level.mixing && !sameColor(a.pig, b.pig)) continue;
      const p: Pig = [a.pig[0] + b.pig[0], a.pig[1] + b.pig[1], a.pig[2] + b.pig[2]];
      if (!this.fitsACup(p)) continue;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!best || dist < best[0]) best = [dist, a, b];
    }
    if (best) return { ax: best[2].x, ay: best[2].y, bx: best[1].x, by: best[1].y, t: 0 };
    return null;
  }

  draw() {
    const ctx = this.ctx;
    const k = this.dpr * this.S;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!this.backdrop) this.backdrop = drawBackdrop(this.canvas.width, this.canvas.height, this.ox * this.dpr, this.oy * this.dpr, k);
    ctx.drawImage(this.backdrop, 0, 0);
    ctx.setTransform(k, 0, 0, k, this.ox * this.dpr, this.oy * this.dpr);
    for (const c of this.cups) drawCup(ctx, c, this.time);
    // resting drops first, the moving one on top
    const order = [...this.drops].sort((a, b) => (a.state === 'drag' ? 1 : 0) - (b.state === 'drag' ? 1 : 0));
    for (const d of order) drawDrop(ctx, d, k);
    if (this.party >= 0) drawParty(ctx, this.party, this.cups.map((c) => c.rgb));
    drawParticles(ctx, this.particles);
    if (this.hint) drawHand(ctx, this.hint.ax, this.hint.ay, this.hint.bx, this.hint.by, this.hint.t);
  }

  /** For tests and debugging: positions in CSS pixels. */
  snapshot() {
    const X = (x: number) => this.ox + x * this.S, Y = (y: number) => this.oy + y * this.S;
    return {
      over: this.over, won: this.won,
      drops: this.drops.map((d) => ({ id: d.id, x: X(d.x), y: Y(d.y), r: d.R * this.S, vol: d.vol, pig: d.pig, state: d.state })),
      cups: this.cups.map((c) => ({ x: X(c.x), y: Y(c.top + c.h * 0.35), filled: c.filled, need: c.need, total: c.total, got: c.got, pig: c.pig })),
    };
  }
}
