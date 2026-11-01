// The level: layout, input, rules and the frame loop.
//
// World units: the short side of the screen is 100 units, so a drop has the
// same size relative to the screen on a phone and on a tablet.

import { PIG, type Pig, pigToRgb, sameColor, scalePig, tint, WHITE } from './color';
import { Drop, R1, mergeInto, reach, stepDrop } from './drop';
import { type Level } from './levels';
import { type CupView, type Particle, drawCup, drawDrop, drawHand, drawPaper, drawParticles } from './render';
import { sfx } from './sfx';

export interface Cup extends CupView {
  pig: Pig;
  /** water level it is easing toward */
  goal: number;
}

export interface FailInfo { a: Pig; b: Pig; mix: Pig }

export interface GameEvents {
  fail(info: FailInfo): void;
  win(): void;
}

const DT = 1 / 240;
const TOP_PX = 64; // room for the top bar
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  events: GameEvents;
  level!: Level;
  drops: Drop[] = [];
  cups: Cup[] = [];
  particles: Particle[] = [];
  /** world size */
  W = 100; H = 100;
  /** CSS pixels per world unit */
  S = 1;
  dpr = 1;
  time = 0;
  acc = 0;
  /** input is ignored while a screen covers the game */
  paused = true;
  /** the level has ended (won or a wrong mix) */
  over = false;
  /** something was done (for "Continue" and the restart question) */
  touched = false;
  dragId = -1;
  pointerId = -1;
  grab = { x: 0, y: 0 };
  idle = 0;
  hint: { ax: number; ay: number; bx: number; by: number; t: number } | null = null;
  timers: { at: number; fn: () => void }[] = [];
  drips: { at: number; drop: Drop; i: number }[] = [];
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
    this.resize();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ------------------------------------------------------------ layout

  resize() {
    const w = innerWidth, h = innerHeight;
    const oldW = this.W, oldH = this.H;
    this.dpr = Math.min(3, devicePixelRatio || 1);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.S = Math.min(w, h) / 100;
    this.W = w / this.S; this.H = h / this.S;
    if (this.level) {
      for (const d of this.drops) { d.x *= this.W / oldW; d.y *= this.H / oldH; if (d.pull) { d.pull.x *= this.W / oldW; d.pull.y *= this.H / oldH; } }
      this.layoutCups();
      for (const d of this.drops) this.clamp(d);
    }
  }

  get topY() { return TOP_PX / this.S + 2; }

  layoutCups() {
    const n = this.level.cups.length;
    const cw = Math.min(27, ((this.W - 8) / n) * 0.62);
    const ch = cw * 1.05;
    const top = this.H - 5 - ch;
    const old = this.cups;
    this.cups = this.level.cups.map((def, i) => {
      const pig = PIG[def.color];
      const prev = old[i];
      return {
        x: (this.W * (i + 0.5)) / n, top, tw: cw, bw: cw * 0.76, h: ch,
        rgb: pigToRgb(pig), pig, need: def.need,
        level: prev?.level ?? 0.2, goal: prev?.goal ?? 0.2, wave: prev?.wave ?? 0,
        filled: prev?.filled ?? false, pulse: 0, pulseKind: '',
      };
    });
  }

  /** The free part of the paper, above the cups. */
  zone() {
    const c = this.cups[0];
    const bottom = c ? c.top - c.tw * 0.11 - R1 * Math.sqrt(c.need) - 6 : this.H - 8;
    return { x0: 8, x1: this.W - 8, y0: this.topY + 5, y1: Math.max(this.topY + 20, bottom) };
  }

  start(level: Level, drip: boolean) {
    this.level = level;
    this.cups = [];
    this.layoutCups();
    this.drops = [];
    this.particles = [];
    this.timers = [];
    this.drips = [];
    this.over = false;
    this.touched = false;
    this.dragId = -1;
    this.pointerId = -1;
    this.idle = 0;
    this.hint = null;
    const z = this.zone();
    for (const def of level.drops) {
      const vol = def.vol ?? 1;
      const d = new Drop(z.x0 + (z.x1 - z.x0) * def.u, z.y0 + (z.y1 - z.y0) * def.v, vol, scalePig(PIG[def.color], vol));
      this.drops.push(d);
    }
    this.spread(z);
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
  spread(z: { x0: number; x1: number; y0: number; y1: number }) {
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
        d.x = Math.max(z.x0, Math.min(z.x1, d.x));
        d.y = Math.max(z.y0, Math.min(z.y1, d.y));
      }
      if (!moved) break;
    }
  }

  clamp(d: Drop) {
    const R = d.R;
    d.x = Math.max(R + 1, Math.min(this.W - R - 1, d.x));
    d.y = Math.max(this.topY + R, Math.min(this.H - R - 1, d.y));
  }

  // ------------------------------------------------------------ input

  toWorld(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / this.S, y: (e.clientY - r.top) / this.S };
  }

  down(e: PointerEvent) {
    if (this.paused || this.over || this.pointerId !== -1) return;
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
    this.canvas.setPointerCapture(e.pointerId);
    this.pointerId = e.pointerId;
    this.dragId = best.id;
    best.state = 'drag';
    // hold the drop where it was touched, but not further than its own edge
    let gx = p.x - best.x, gy = p.y - best.y;
    const gl = Math.hypot(gx, gy), max = best.R * 0.6;
    if (gl > max) { gx *= max / gl; gy *= max / gl; }
    this.grab = { x: gx, y: gy };
    best.pull = { x: p.x - gx, y: p.y - gy };
    this.touched = true;
    sfx.pick();
  }

  move(e: PointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    const d = this.dragged();
    if (!d || !d.pull) return;
    const p = this.toWorld(e);
    d.pull.x = p.x - this.grab.x;
    d.pull.y = p.y - this.grab.y;
    d.pull.x = Math.max(d.R, Math.min(this.W - d.R, d.pull.x));
    d.pull.y = Math.max(this.topY + d.R * 0.5, Math.min(this.H - d.R, d.pull.y));
  }

  up(e: PointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    const d = this.dragged();
    this.dragId = -1;
    if (!d) return;
    this.release(d);
  }

  dragged(): Drop | undefined {
    return this.dragId < 0 ? undefined : this.drops.find((d) => d.id === this.dragId && d.state === 'drag');
  }

  release(d: Drop) {
    d.state = 'rest';
    d.pull = null;
    const cup = this.cupUnder(d);
    if (cup >= 0) this.tryCup(d, cup);
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
    const y = c.top - c.tw * 0.11 - d.R - 6;
    let best = { x: d.x, y }, found = false;
    for (let ring = 0; ring < 12 && !found; ring++) {
      for (const side of [0, -1, 1]) {
        const x = Math.max(d.R + 2, Math.min(this.W - d.R - 2, c.x + side * ring * d.R * 1.2));
        const yy = y - (ring > 4 ? (ring - 4) * d.R : 0);
        const free = this.drops.every((o) => o === d || o.state === 'gone' || Math.hypot(o.x - x, o.y - yy) > o.R + d.R + 4);
        if (free) { best = { x, y: yy }; found = true; break; }
      }
    }
    d.state = 'auto';
    d.pull = best;
    this.later(0.9, () => { if (d.state === 'auto') { d.state = 'rest'; d.pull = null; } });
  }

  later(s: number, fn: () => void) { this.timers.push({ at: this.time + s, fn }); }

  // ------------------------------------------------------------ rules

  touchCheck(d: Drop) {
    for (const o of this.drops) {
      if (o === d || o.state !== 'rest' || o.grow < 0.9) continue;
      if (Math.hypot(o.x - d.x, o.y - d.y) > d.R * 2.2 + o.R + 14) { continue; }
      const r = reach(d, o);
      const same = sameColor(d.pig, o.pig);
      if (r > 0) {
        if (same || this.level.mixing) {
          mergeInto(d, o);
          this.grab.x *= 0.5; this.grab.y *= 0.5;
          this.splash(d.x, d.y, d.rgb, 5);
          sfx.merge(d.vol);
        } else {
          // the colours mix: show it really happen, then explain
          const info: FailInfo = { a: [...d.pig] as Pig, b: [...o.pig] as Pig, mix: [0, 0, 0] };
          mergeInto(d, o);
          info.mix = [...d.pig] as Pig;
          d.state = 'rest'; d.pull = null;
          this.dragId = -1; this.pointerId = -1;
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

  splash(x: number, y: number, rgb: [number, number, number], n: number) {
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
    if (dragged && dragged.state === 'drag') this.touchCheck(dragged);
    this.updatePours(dt);
    this.drops = this.drops.filter((d) => d.state !== 'gone');

    for (const c of this.cups) {
      c.level += (c.goal - c.level) * Math.min(1, dt * 2.2);
      c.wave = Math.max(0, c.wave - dt * 0.7);
      c.pulse = Math.max(0, c.pulse - dt * 0.6);
      if (c.pulse === 0) c.pulseKind = '';
    }
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'drop') p.vy += 30 * dt; else { p.vx *= 0.94; p.vy *= 0.94; }
      p.rot += dt * 2;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // a hint after a quiet while
    if (!this.paused && !this.over && !dragged) {
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
        c.goal = 0.68;
        c.filled = true;
        c.wave = 1;
        this.splash(c.x, wy, c.rgb, 10);
        for (let k = 0; k < 2; k++) this.particles.push({ x: c.x, y: wy, vx: 0, vy: 0, life: 0.9 + k * 0.3, max: 0.9 + k * 0.3, kind: 'ring', rgb: c.rgb, size: c.bw * 0.45, rot: 0 });
        sfx.cup(this.cups.indexOf(c));
        if (this.cups.every((k) => k.filled)) {
          this.over = true;
          this.later(1.1, () => { this.confetti(); sfx.win(); this.events.win(); });
        }
      }
    }
  }

  confetti() {
    const n = reduced ? 20 : 70;
    const cols = this.cups.map((c) => c.rgb);
    for (let i = 0; i < n; i++) {
      const rgb = cols[i % cols.length];
      this.particles.push({
        x: Math.random() * this.W, y: -5 - Math.random() * 40, vx: (Math.random() - 0.5) * 6, vy: 10 + Math.random() * 15,
        life: 4 + Math.random() * 2, max: 6, kind: 'drop', rgb: tint(rgb, WHITE, Math.random() * 0.2), size: 0.9 + Math.random() * 1.4, rot: 0,
      });
    }
  }

  /** What should a stuck player try next? */
  suggest(): Game['hint'] {
    const free = this.drops.filter((d) => d.state === 'rest');
    for (const c of this.cups) {
      if (c.filled) continue;
      const mine = free.filter((d) => sameColor(d.pig, c.pig) || this.level.mixing);
      const big = mine.find((d) => d.vol >= c.need - 0.01 && sameColor(d.pig, c.pig));
      if (big) return { ax: big.x, ay: big.y, bx: c.x, by: c.top + c.h * 0.3, t: 0 };
      const same = mine.filter((d) => sameColor(d.pig, c.pig));
      if (same.length >= 2) {
        same.sort((a, b) => b.vol - a.vol);
        const target = same[0];
        const from = same.slice(1).sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))[0];
        return { ax: from.x, ay: from.y, bx: target.x, by: target.y, t: 0 };
      }
    }
    return null;
  }

  draw() {
    const ctx = this.ctx;
    const k = this.dpr * this.S;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawPaper(ctx, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    for (const c of this.cups) drawCup(ctx, c, this.time);
    // resting drops first, the moving one on top
    const order = [...this.drops].sort((a, b) => (a.state === 'drag' ? 1 : 0) - (b.state === 'drag' ? 1 : 0));
    for (const d of order) drawDrop(ctx, d, k);
    drawParticles(ctx, this.particles);
    if (this.hint) drawHand(ctx, this.hint.ax, this.hint.ay, this.hint.bx, this.hint.by, this.hint.t);
  }

  /** For tests and debugging: drop positions in CSS pixels. */
  snapshot() {
    return {
      over: this.over,
      drops: this.drops.map((d) => ({ id: d.id, x: d.x * this.S, y: d.y * this.S, r: d.R * this.S, vol: d.vol, pig: d.pig, state: d.state })),
      cups: this.cups.map((c) => ({ x: c.x * this.S, y: (c.top + c.h * 0.35) * this.S, filled: c.filled, need: c.need, pig: c.pig })),
    };
  }
}
