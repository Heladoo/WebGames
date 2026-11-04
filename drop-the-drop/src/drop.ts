// A drop is a soft body seen from above: a centre that moves, plus N radial
// offsets around a circle of the drop's rest radius. Each offset is a damped
// spring toward a target shape and is coupled to its neighbours (surface
// tension smooths the outline). The area is kept equal to the drop's volume
// (water does not compress), so pulling one side out pulls the sides in.
//
// While dragged, the centre follows the finger on a soft spring (the drop is
// viscous and lags), and the target shape becomes a teardrop pointing at the
// finger. On release the target turns round again, and the springs ring down
// as a visible wobble: that is how the drop "settles".

import { type Pig, type RGB, pigToRgb } from './color';

export const N = 64;
/** Rest radius of a drop of volume 1, in world units (the short side of the screen is 100). */
export const R1 = 5;
export const COS = new Float32Array(N);
export const SIN = new Float32Array(N);
for (let i = 0; i < N; i++) { COS[i] = Math.cos((i / N) * Math.PI * 2); SIN[i] = Math.sin((i / N) * Math.PI * 2); }

export type DropState = 'rest' | 'drag' | 'auto' | 'pour' | 'gone';

let nextId = 1;

export class Drop {
  id = nextId++;
  x: number; y: number;
  vx = 0; vy = 0;
  vol: number;
  pig: Pig;
  rgb: RGB;
  d = new Float32Array(N);
  dv = new Float32Array(N);
  tgt = new Float32Array(N);
  state: DropState = 'rest';
  /** 0..1 while dripping onto the paper at the start */
  grow = 1;
  /** trembling when a drop of another colour comes close (0..1) */
  shiver = 0;
  /** a gentle "no" shake after a cup refused it (seconds left) */
  shake = 0;
  /** where it is being pulled (finger, or an automatic move) */
  pull: { x: number; y: number } | null = null;
  /** seconds it has been perfectly still (resting drops are drawn from a cached picture) */
  still = 0;
  cache: HTMLCanvasElement | null = null;
  cacheKey = '';
  /** picked up glitter from a glue stripe (kept through joins and splits) */
  glitter = false;
  /** pour animation */
  pour: { cup: number; t: number; x0: number; y0: number } | null = null;

  constructor(x: number, y: number, vol: number, pig: Pig) {
    this.x = x; this.y = y; this.vol = vol; this.pig = pig; this.rgb = pigToRgb(pig);
  }

  get R(): number { return R1 * Math.sqrt(this.vol); }

  setPig(p: Pig) { this.pig = p; this.rgb = pigToRgb(p); }

  /** Kick the outline into an oval wobble (dripping in, merging, being refused). */
  excite(amount: number, angle = 0, mode = 2) {
    const R = this.R;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2 - angle;
      this.d[i] += amount * R * Math.cos(mode * th);
    }
  }

  /** A touch makes the drop jiggle: a squash toward the finger and a smaller three-lobed ripple. */
  jiggle(angle: number) {
    this.excite(0.2, angle, 2);
    this.excite(0.08, angle + 0.5, 3);
    for (let i = 0; i < N; i++) this.dv[i] += (Math.random() - 0.5) * this.R * 0.6;
  }

  /** Outline points in world coordinates. */
  outline(xs: Float32Array, ys: Float32Array, scale = 1) {
    const R = this.R;
    for (let i = 0; i < N; i++) {
      const r = (R + this.d[i]) * scale;
      xs[i] = this.x + r * COS[i];
      ys[i] = this.y + r * SIN[i];
    }
  }
}

// Speed limits, in world units per second: a slow finger gets a calm drop; a
// fast finger pulls the drop along faster (owner's request), up to VMAX_FAST.
const VMAX = 95, VMAX_FAST = 280;

/** One small fixed physics step. `t` is the time in seconds (for the shiver). */
export function stepDrop(dr: Drop, dt: number, t: number) {
  const R = dr.R;
  const v4 = Math.pow(dr.vol, 0.3);
  let lx = 0, ly = 0;
  if (dr.pull) {
    lx = dr.pull.x - dr.x; ly = dr.pull.y - dr.y;
    const far = Math.min(1, Math.max(0, (Math.hypot(lx, ly) - R) / (R * 4)));
    // a little under-damped: it overshoots softly; it pulls harder when the finger is far ahead
    const k = (150 / v4) * (1 + far * 1.5), c = 2 * Math.sqrt(k) * 0.85;
    dr.vx += (k * lx - c * dr.vx) * dt;
    dr.vy += (k * ly - c * dr.vy) * dt;
    const sp = Math.hypot(dr.vx, dr.vy), cap = VMAX + (VMAX_FAST - VMAX) * far;
    if (sp > cap) { dr.vx *= cap / sp; dr.vy *= cap / sp; }
  } else {
    // water on smooth paper stops almost at once, with a short glide
    const f = Math.exp(-12 * dt);
    dr.vx *= f; dr.vy *= f;
  }
  dr.x += dr.vx * dt;
  dr.y += dr.vy * dt;

  // the target shape: a teardrop toward the finger, round at rest
  const lag = Math.hypot(lx, ly);
  const e = Math.min(0.55, (lag / R) * 0.42 + Math.hypot(dr.vx, dr.vy) / (R * 40));
  const phi = Math.atan2(ly + dr.vy * 0.04, lx + dr.vx * 0.04);
  const cp = Math.cos(phi), sp = Math.sin(phi);
  const sh = dr.shiver, shake = dr.shake;
  for (let i = 0; i < N; i++) {
    const c = COS[i] * cp + SIN[i] * sp; // cos(theta - phi)
    let g = e > 0.002 ? R * e * (c > 0 ? 1.15 * c * c * c : 0.35 * c * c) : 0;
    if (sh > 0) g += sh * R * 0.05 * Math.sin(t * 46 + i * 0.29 * 3);
    // a side-to-side sway of the outline (a radial cos term shifts the circle sideways)
    if (shake > 0) g += R * 0.22 * Math.sin(shake * 20) * Math.min(1, shake * 2) * COS[i];
    dr.tgt[i] = g;
  }

  // outline springs: toward the target, coupled to the neighbours, damped
  // a lighter damping (C) lets a touched or released drop ring a little longer
  const K = 330 / Math.sqrt(dr.vol), C = 5, Kn = 900, Cn = 26;
  const d = dr.d, dv = dr.dv, tg = dr.tgt;
  for (let i = 0; i < N; i++) {
    const a = d[(i + N - 1) % N], b = d[(i + 1) % N];
    const va = dv[(i + N - 1) % N], vb = dv[(i + 1) % N];
    const acc = -K * (d[i] - tg[i]) - C * dv[i] + Kn * (a + b - 2 * d[i]) + Cn * (va + vb - 2 * dv[i]);
    dv[i] += acc * dt;
  }
  for (let i = 0; i < N; i++) d[i] += dv[i] * dt;
  keepArea(dr);
}

/** Scale the outline so its area matches the drop's volume. */
export function keepArea(dr: Drop) {
  const R = dr.R, d = dr.d;
  let a = 0;
  const s2 = Math.sin((Math.PI * 2) / N);
  for (let i = 0; i < N; i++) {
    const r0 = Math.max(R * 0.05, R + d[i]), r1 = Math.max(R * 0.05, R + d[(i + 1) % N]);
    a += 0.5 * r0 * r1 * s2;
  }
  // aim at the area of the 64-sided polygon of radius R (a little less than a
  // circle's), so a round drop at rest has zero offsets
  const s = Math.sqrt((0.5 * N * s2 * R * R) / a);
  for (let i = 0; i < N; i++) d[i] = Math.max(R * 0.05, R + d[i]) * s - R;
  // the area is fixed, so the outline has no uniform (breathing) speed: remove it,
  // or it settles into a constant drift and the drop never comes to rest
  const dv = dr.dv;
  let mean = 0;
  for (let i = 0; i < N; i++) mean += dv[i];
  mean /= N;
  for (let i = 0; i < N; i++) dv[i] -= mean;
}

const tmpX = new Float32Array(N), tmpY = new Float32Array(N);

/**
 * `a` swallows `b`. The new outline starts as the two old outlines seen from
 * the joint centre (a peanut with a narrow neck), and the springs pull it round
 * in a fraction of a second, with a wobble: the way two real drops coalesce.
 */
export function mergeInto(a: Drop, b: Drop) {
  const va = a.vol, vb = b.vol, v = va + vb;
  const cx = (a.x * va + b.x * vb) / v, cy = (a.y * va + b.y * vb) / v;
  const polys: [Float32Array, Float32Array][] = [];
  for (const dr of [a, b]) {
    const xs = new Float32Array(N), ys = new Float32Array(N);
    dr.outline(xs, ys);
    polys.push([xs, ys]);
  }
  a.x = cx; a.y = cy;
  a.vx = (a.vx * va + b.vx * vb) / v; a.vy = (a.vy * va + b.vy * vb) / v;
  a.vol = v;
  a.setPig([a.pig[0] + b.pig[0], a.pig[1] + b.pig[1], a.pig[2] + b.pig[2]]);
  a.glitter = a.glitter || b.glitter;
  const R = a.R;
  for (let i = 0; i < N; i++) {
    let far = 0;
    for (const [xs, ys] of polys) far = Math.max(far, rayFar(cx, cy, COS[i], SIN[i], xs, ys));
    a.d[i] = (far > 0 ? far : R * 0.7) - R;
    a.dv[i] = 0;
  }
  keepArea(a);
  b.state = 'gone';
}

/** The farthest point where the ray from (cx, cy) along (ux, uy) leaves the polygon. */
function rayFar(cx: number, cy: number, ux: number, uy: number, xs: Float32Array, ys: Float32Array): number {
  let best = 0;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const ex = xs[j] - xs[i], ey = ys[j] - ys[i];
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const wx = xs[i] - cx, wy = ys[i] - cy;
    const t = (wx * ey - wy * ex) / den;
    const s = (wx * uy - wy * ux) / den;
    if (t > 0 && s >= 0 && s <= 1 && t > best) best = t;
  }
  return best;
}

/** How far the outline of `a` reaches into drop `b` (> 0 means they touch). */
export function reach(a: Drop, b: Drop): number {
  a.outline(tmpX, tmpY);
  const rb = b.R * 0.97;
  let best = -Infinity;
  for (let i = 0; i < N; i++) {
    const dx = tmpX[i] - b.x, dy = tmpY[i] - b.y;
    // b's own radius in that direction
    const k = ((Math.round((Math.atan2(dy, dx) / (Math.PI * 2)) * N) % N) + N) % N;
    const rr = rb + b.d[k] * 0.97;
    best = Math.max(best, rr - Math.hypot(dx, dy));
  }
  return best;
}
