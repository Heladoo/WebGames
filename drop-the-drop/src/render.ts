// Drawing. Everything is code: a sheet of paper, cups drawn in marker like the
// ones in the children's activity, and drops of coloured water, which get all
// the care: a soft shadow with a coloured light pool beside it (the drop is a
// lens), a body that is light in the middle and dark at the rim (refraction),
// a bright caustic on the far side, a thin reflected rim, and a glossy window
// highlight on the side facing the light (top left). Everything follows the
// drop's outline, so stretches and wobbles move the gloss too.

import { css, INK, tint, WHITE, type RGB } from './color';
import { type Drop, N, R1, COS, SIN } from './drop';
import type { Glue } from './levels';
import { PICTURES, PictureShape, type Picture, type TowelDef } from './towel';
import { PIG, pigToRgb as toRgb } from './color';

/** Glitter colours: gold, silver, pink, cyan, violet. */
const GLITTER = ['#ffd54a', '#eef3fb', '#ff7ac8', '#6fe3ff', '#b88cff'];

/** A small seeded random, so glitter sits in the same places every frame. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A four-pointed glint. */
function glint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = 'rgba(255,255,255,0.95)') {
  if (r <= 0.05) return;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.18, y - r * 0.18); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.18, y + r * 0.18);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.18, y + r * 0.18); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.18, y - r * 0.18);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Glitter flecks scattered in a circle of radius r (world units), twinkling with time t. */
function flecks(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, seed: number, t: number, size: number, squash = 1) {
  for (let i = 0; i < n; i++) {
    const u = hash(seed * 31 + i), v = hash(seed * 57 + i * 3.1);
    const rr = Math.sqrt(u) * r, an = v * Math.PI * 2;
    const px = cx + Math.cos(an) * rr, py = cy + Math.sin(an) * rr * squash;
    const tw = 0.45 + 0.55 * Math.max(0, Math.sin(t * 5 + i * 1.7));
    const sz = size * (0.6 + hash(i * 13 + seed) * 0.8);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(hash(i + seed) * 3 + t * 0.6);
    ctx.globalAlpha = tw;
    ctx.fillStyle = GLITTER[i % GLITTER.length];
    ctx.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2);
    ctx.restore();
  }
}

/** A little heap of glitter (for the mistake card's picture sum). */
export function drawGlitterPile(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.35, r * 1.05, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(230,232,245,0.85)';
  ctx.fill();
  flecks(ctx, x, y + r * 0.25, r, 120, 7, 0.4, r * 0.08, 0.62);
  flecks(ctx, x, y - r * 0.1, r * 0.75, 80, 9, 1.1, r * 0.08, 0.6);
  flecks(ctx, x, y - r * 0.4, r * 0.45, 40, 11, 2.3, r * 0.08, 0.6);
  glint(ctx, x - r * 0.45, y - r * 0.15, r * 0.35);
  glint(ctx, x + r * 0.5, y + r * 0.05, r * 0.25);
  glint(ctx, x + r * 0.05, y - r * 0.55, r * 0.42);
  ctx.restore();
}

const xs = new Float32Array(N), ys = new Float32Array(N);

function trace(ctx: CanvasRenderingContext2D, px: Float32Array, py: Float32Array, ox = 0, oy = 0) {
  ctx.beginPath();
  ctx.moveTo((px[N - 1] + px[0]) / 2 + ox, (py[N - 1] + py[0]) / 2 + oy);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    ctx.quadraticCurveTo(px[i] + ox, py[i] + oy, (px[i] + px[j]) / 2 + ox, (py[i] + py[j]) / 2 + oy);
  }
  ctx.closePath();
}

// Soft round blobs, one per colour, painted once: shadows and light pools.
const blobs = new Map<string, HTMLCanvasElement>();
function softBlob(color: string): HTMLCanvasElement {
  let c = blobs.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color);
  gr.addColorStop(0.62, color);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  blobs.set(color, c);
  return c;
}

/**
 * A drop that has stopped moving is painted once into its own small picture
 * and reused, so a level with many resting drops costs little. Glittery drops
 * refresh their picture a few times a second so their glitter still twinkles.
 */
export function drawDropCached(ctx: CanvasRenderingContext2D, dr: Drop, S: number) {
  if (dr.still < 0.25) { dr.cache = null; drawDrop(ctx, dr, S); return; }
  const tick = dr.glitter ? Math.floor(performance.now() / 300) : 0;
  const key = `${S.toFixed(3)}|${dr.vol}|${dr.x.toFixed(2)}|${dr.y.toFixed(2)}|${dr.rgb.join()}|${dr.glitter}|${tick}`;
  const half = Math.ceil((dr.R * 1.7 + 2) * S);
  if (!dr.cache || dr.cacheKey !== key) {
    const c = dr.cache && dr.cache.width === half * 2 ? dr.cache : document.createElement('canvas');
    c.width = c.height = half * 2;
    const g = c.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(S, 0, 0, S, half - dr.x * S, half - dr.y * S);
    drawDrop(g, dr, S);
    dr.cache = c;
    dr.cacheKey = key;
  }
  ctx.drawImage(dr.cache, dr.x - half / S, dr.y - half / S, (half * 2) / S, (half * 2) / S);
}

/**
 * Draw one drop in world coordinates. `S` is device pixels per world unit
 * (shadow offsets and blurs ignore the canvas transform, so they need it).
 */
export function drawDrop(ctx: CanvasRenderingContext2D, dr: Drop, S: number, scale = 1, alpha = 1) {
  const k = dr.grow * scale;
  if (k <= 0.01) return;
  dr.outline(xs, ys, k);
  const R = dr.R * k;
  const col = dr.rgb;
  const cx = dr.x, cy = dr.y;

  // shape analysis: the first two Fourier modes give the shift and the stretch
  let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
  for (let i = 0; i < N; i++) {
    const r = dr.d[i] * k;
    a1 += r * COS[i]; b1 += r * SIN[i];
    const c2 = COS[i] * COS[i] - SIN[i] * SIN[i], s2 = 2 * SIN[i] * COS[i];
    a2 += r * c2; b2 += r * s2;
  }
  a1 *= 2 / N; b1 *= 2 / N; a2 *= 2 / N; b2 *= 2 / N;
  const gx = cx + a1 * 0.5, gy = cy + b1 * 0.5;
  const m = Math.min(0.6, Math.hypot(a2, b2) / R);
  const psi = Math.atan2(b2, a2) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // big drops spread into flat puddles: the curved rim stays about as wide as a small drop's
  const rim = Math.min(R * 0.5, R1 * 0.55 * k);
  const flat = 1 - rim / R; // 0.5 for a small drop, more for big ones

  // 1. shadow on the paper (down and right of the light), then the coloured
  //    light that passed through the drop and lands just beside it. Both are
  //    soft blobs painted once (a live canvas blur is far too slow on old
  //    tablets), stretched like the drop.
  const sx = 1 + m, sy = Math.max(0.4, 1 - m * 0.8);
  const blob = (c: string, a: number, ox: number, oy: number, r: number) => {
    ctx.save();
    ctx.globalAlpha = alpha * a;
    ctx.translate(gx + ox, gy + oy);
    ctx.rotate(psi);
    ctx.scale(sx, sy);
    ctx.drawImage(softBlob(c), -r, -r, r * 2, r * 2);
    ctx.restore();
  };
  blob(css(tint(col, INK, 0.75)), 0.2, rim * 0.35, rim * 0.5, R + rim * 0.55);
  blob(css(col), 0.28, rim * 0.22, rim * 0.3, R + rim * 0.25);
  void S;

  // 2. the body: clear water with dye, see-through in the middle (the paper
  //    shows), deeper colour toward the rim; the gradient stretches with the drop
  trace(ctx, xs, ys);
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(psi);
  ctx.scale(1 + m, Math.max(0.4, 1 - m * 0.8));
  ctx.rotate(-psi);
  const body = ctx.createRadialGradient(R * 0.16, R * 0.2, 0, 0, 0, R * 1.0);
  body.addColorStop(0, css(tint(col, WHITE, 0.35), 0.42));
  body.addColorStop(Math.max(0.3, flat * 0.75), css(tint(col, WHITE, 0.08), 0.62));
  body.addColorStop(Math.max(0.55, flat), css(col, 0.80));
  body.addColorStop(1, css(tint(col, INK, 0.3), 0.93));
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();

  ctx.save();
  trace(ctx, xs, ys);
  ctx.clip();
  // 3. the rim darkens inside (light bends away at the curved edge)
  ctx.lineJoin = 'round';
  ctx.strokeStyle = css(tint(col, INK, 0.4), 0.16);
  ctx.lineWidth = rim * 0.9;
  ctx.stroke();
  ctx.strokeStyle = css(tint(col, INK, 0.5), 0.55);
  ctx.lineWidth = rim * 0.16;
  ctx.stroke();
  // 4. caustic: the light gathered on the side away from the light
  const cxs = cx + (xs[8] - cx) * (0.4 + flat * 0.4), cys = cy + (ys[8] - cy) * (0.4 + flat * 0.4);
  const cr = rim * 1.3;
  const ca = ctx.createRadialGradient(cxs, cys, 0, cxs, cys, cr);
  ca.addColorStop(0, 'rgba(255,255,255,0.62)');
  ca.addColorStop(0.45, css(tint(col, WHITE, 0.75), 0.28));
  ca.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = ca;
  ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  ctx.restore();

  // 4b. glitter inside the drop: specks that twinkle, floating with it
  if (dr.glitter) {
    const t = performance.now() / 1000;
    ctx.save();
    trace(ctx, xs, ys);
    ctx.clip();
    // a pale shimmer, then lots of flecks
    ctx.fillStyle = `rgba(255,248,220,${0.08 * alpha})`;
    ctx.fill();
    ctx.globalAlpha = alpha;
    flecks(ctx, gx, gy, R * 0.85, Math.round(22 + dr.vol * 12), dr.id, t, R * 0.075);
    ctx.restore();
    // glints that twinkle over the drop
    for (let i = 0; i < 3; i++) {
      const s = Math.max(0, Math.sin(t * (2.2 + i * 0.7) + i * 2.1 + dr.id));
      if (s < 0.4) continue;
      const an = hash(dr.id * 5 + i) * Math.PI * 2, rr = R * (0.3 + hash(i * 9 + dr.id) * 0.5);
      ctx.globalAlpha = alpha;
      glint(ctx, gx + Math.cos(an) * rr, gy + Math.sin(an) * rr, R * 0.32 * (s - 0.4) / 0.6);
    }
    ctx.globalAlpha = alpha;
  }

  // 5. reflected rim along the lower right
  ctx.beginPath();
  for (let i = 3; i <= 14; i++) {
    const f = 1 - (rim * 0.28) / (R + dr.d[i] * k);
    const px = cx + (xs[i] - cx) * f, py = cy + (ys[i] - cy) * f;
    if (i === 3) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = rim * 0.1;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 6. the window highlight on the curved rim facing the light (top left)
  const hr = rim * 1.1;
  const hf = 1 - (rim * 0.55) / (R + dr.d[41] * k);
  const hx = cx + (xs[41] - cx) * hf, hy = cy + (ys[41] - cy) * hf;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-0.72);
  ctx.scale(1, 0.42);
  const hl = ctx.createRadialGradient(0, 0, 0, 0, 0, hr * 0.5);
  hl.addColorStop(0, 'rgba(255,255,255,1)');
  hl.addColorStop(0.6, 'rgba(255,255,255,0.85)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(0, 0, hr * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const hf2 = 1 - (rim * 0.95) / (R + dr.d[46] * k);
  const dx = cx + (xs[46] - cx) * hf2, dy = cy + (ys[46] - cy) * hf2;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(dx, dy, rim * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------- table, card and paper

/** The paper sheet, in world units (the world is WORLD_W x WORLD_H). */
export const PAPER = { x0: 3, y0: 3, x1: 157, y1: 97 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

let grain: HTMLCanvasElement | null = null;
function paperGrain(): HTMLCanvasElement {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const g = c.getContext('2d')!;
  const img = g.createImageData(192, 192);
  const rnd = rng(12345);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 247 + rnd() * 8;
    img.data[i] = v; img.data[i + 1] = v - 1; img.data[i + 2] = v - 4; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(160,150,130,0.06)';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * 192, y = rnd() * 192, a = rnd() * Math.PI;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke();
  }
  grain = c;
  return c;
}

/** Light oak planks, in device pixels. */
function wood(g: CanvasRenderingContext2D, w: number, h: number, k: number) {
  g.fillStyle = '#e4cfae';
  g.fillRect(0, 0, w, h);
  const rnd = rng(7);
  const plank = 26 * k;
  for (let y0 = -plank * 0.4, p = 0; y0 < h; y0 += plank, p++) {
    const tone = 0.9 + rnd() * 0.18;
    g.fillStyle = `rgba(${Math.round(228 * tone)},${Math.round(205 * tone)},${Math.round(170 * tone)},0.55)`;
    g.fillRect(0, y0, w, plank);
    // grain: long wavy lines
    for (let i = 0; i < 26; i++) {
      const yy = y0 + rnd() * plank, amp = (0.5 + rnd() * 2) * k, fr = 0.002 + rnd() * 0.004, ph = rnd() * 9;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) g.lineTo(x, yy + Math.sin(x * fr / k * 3 + ph) * amp + Math.sin(x * 0.0007 + ph) * amp * 3);
      g.strokeStyle = `rgba(150,105,60,${0.05 + rnd() * 0.08})`;
      g.lineWidth = (0.3 + rnd() * 0.8) * k * 0.4;
      g.stroke();
    }
    // a knot now and then
    if (rnd() < 0.6) {
      const kx = rnd() * w, ky = y0 + plank * (0.3 + rnd() * 0.4);
      for (let r = 1; r < 5; r++) {
        g.beginPath();
        g.ellipse(kx, ky, r * 2.2 * k, r * 0.8 * k, 0, 0, Math.PI * 2);
        g.strokeStyle = `rgba(140,95,50,${0.16 - r * 0.025})`;
        g.lineWidth = 0.4 * k;
        g.stroke();
      }
    }
    // seam
    g.fillStyle = 'rgba(120,85,50,0.22)';
    g.fillRect(0, y0 + plank - 0.35 * k, w, 0.35 * k);
    g.fillStyle = 'rgba(255,245,225,0.35)';
    g.fillRect(0, y0 + plank, w, 0.25 * k);
  }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(255,250,240,0.15)');
  v.addColorStop(1, 'rgba(90,60,30,0.18)');
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
}

/**
 * The plant leaves of each leaf: when it appears (level index), its angle from
 * the corner and its full length and width. The plant grows over the levels:
 * new leaves come and grow for a few levels, the leaves turn a little from
 * level to level (as if following the light), and late in the game a bud
 * appears and blooms.
 */
const LEAVES = [
  { at: 0, a: 0.25, l: 34, w: 15 }, { at: 0, a: 0.75, l: 40, w: 17 }, { at: 0, a: 1.2, l: 32, w: 14 },
  { at: 2, a: 0.5, l: 26, w: 12 }, { at: 4, a: 0.02, l: 28, w: 12 }, { at: 6, a: 0.98, l: 30, w: 13 },
  { at: 8, a: 1.42, l: 24, w: 11 }, { at: 9, a: 0.38, l: 20, w: 9 },
  { at: 13, a: 0.86, l: 22, w: 10 }, { at: 16, a: 0.14, l: 21, w: 9 },
  { at: 20, a: 1.1, l: 19, w: 8.5 }, { at: 23, a: 0.62, l: 18, w: 8 }, { at: 27, a: 1.32, l: 17, w: 7.5 }, { at: 31, a: 0.28, l: 16, w: 7 },
];

function leaf(g: CanvasRenderingContext2D, k: number, ang: number, L: number, W: number, young: number) {
  g.save();
  g.translate(-6 * k, -6 * k);
  g.rotate(ang);
  L *= k; W *= k;
  g.shadowColor = 'rgba(40,50,20,0.3)';
  g.shadowBlur = 3 * k;
  g.shadowOffsetX = 1.5 * k; g.shadowOffsetY = 2 * k;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(L * 0.3, -W * 0.75, L * 0.85, -W * 0.55, L, 0);
  g.bezierCurveTo(L * 0.85, W * 0.55, L * 0.3, W * 0.75, 0, 0);
  // young leaves are a lighter green
  const gr = g.createLinearGradient(0, -W / 2, 0, W / 2);
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * young)).join(',')})`;
  gr.addColorStop(0, mix([95, 154, 62], [140, 196, 90]));
  gr.addColorStop(0.5, mix([76, 138, 52], [122, 184, 74]));
  gr.addColorStop(1, mix([58, 112, 40], [98, 160, 60]));
  g.fillStyle = gr;
  g.fill();
  g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(200,230,160,0.55)';
  g.lineWidth = 0.35 * k;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -W * 0.05, L * 0.95, 0); g.stroke();
  for (let i = 1; i < 6; i++) {
    const x = (L * i) / 6.5;
    g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + L * 0.08, -W * 0.18, x + L * 0.14, -W * 0.3); g.stroke();
    g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + L * 0.08, W * 0.18, x + L * 0.14, W * 0.3); g.stroke();
  }
  g.restore();
}

/** A pink flower on a stem: a closed bud (open = 0) to a full bloom (open = 1). */
function flower(g: CanvasRenderingContext2D, k: number, open: number, ang = 1.28, len = 36 * k, petal = '#ee6f98') {
  const ex = -6 * k + Math.cos(ang) * len, ey = -6 * k + Math.sin(ang) * len;
  g.save();
  g.strokeStyle = '#4f8a36';
  g.lineWidth = 1.1 * k;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(-6 * k, -6 * k); g.quadraticCurveTo(len * 0.35, len * 0.4, ex, ey); g.stroke();
  g.translate(ex, ey);
  g.shadowColor = 'rgba(80,30,40,0.25)';
  g.shadowBlur = 2 * k; g.shadowOffsetY = 1 * k;
  if (open < 0.5) {
    // the bud
    g.beginPath(); g.ellipse(0, 0, 2.2 * k, 3.4 * k, ang - Math.PI / 2, 0, Math.PI * 2);
    g.fillStyle = '#f07aa0'; g.fill();
    g.beginPath(); g.ellipse(-0.8 * k, 0.8 * k, 1.6 * k, 2.4 * k, ang - Math.PI / 2, 0, Math.PI * 2);
    g.fillStyle = '#5f9a3e'; g.fill();
  } else {
    const r = (3.5 + open * 2) * k;
    for (let i = 0; i < 5; i++) {
      g.save();
      g.rotate((i / 5) * Math.PI * 2 + 0.3);
      g.beginPath(); g.ellipse(r * 0.55, 0, r * 0.6, r * 0.38, 0, 0, Math.PI * 2);
      const pg = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.1);
      pg.addColorStop(0, '#fff1f6'); pg.addColorStop(1, petal);
      g.fillStyle = pg; g.fill();
      g.restore();
    }
    g.shadowColor = 'transparent';
    g.beginPath(); g.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    g.fillStyle = '#ffcf3a'; g.fill();
  }
  g.restore();
}

/** The plant as it is at this level (index 0..11). */
function plant(g: CanvasRenderingContext2D, k: number, stage: number) {
  LEAVES.forEach((lf, i) => {
    if (stage < lf.at) return;
    // the first leaves start well grown; later ones sprout small and grow for a few levels
    const grown = lf.at === 0 ? Math.min(1, 0.8 + stage * 0.05) : Math.min(1, 0.55 + (stage - lf.at) * 0.18);
    const sway = Math.sin(stage * 1.7 + i * 2.1) * 0.06;
    leaf(g, k, lf.a + sway, lf.l * grown * 0.82, lf.w * grown * 0.82, Math.max(0, 1 - (stage - lf.at) * 0.35));
  });
  if (stage >= 8) flower(g, k, stage >= 10 ? Math.min(1, (stage - 9) / 2) : 0);
  // a second, violet flower later in the game
  if (stage >= 14) flower(g, k, stage >= 16 ? Math.min(1, (stage - 15) / 2) : 0, 0.32, 40 * k, '#a874e8');
  // a third, yellow one near the end of the game
  if (stage >= 25) flower(g, k, stage >= 28 ? Math.min(1, (stage - 27) / 2) : 0, 0.95, 32 * k, '#f3c633');
}

/**
 * Paint the still scene once: the table, the black card under the paper
 * (its corners peek out), and the paper sheet. ox, oy and k place the world
 * in device pixels.
 */
export function drawBackdrop(w: number, h: number, ox: number, oy: number, k: number, stage = 0, glue: Glue[] = [], towel?: TowelDef): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  wood(g, w, h, k);
  const X = (x: number) => ox + x * k, Y = (y: number) => oy + y * k;
  // the black diamond card
  g.save();
  g.translate(X(80), Y(50));
  g.rotate(Math.PI / 4);
  const half = 40 * k;
  g.shadowColor = 'rgba(40,30,20,0.35)';
  g.shadowBlur = 2.5 * k; g.shadowOffsetY = 0.8 * k;
  g.fillStyle = '#17181c';
  g.fillRect(-half, -half, half * 2, half * 2);
  g.restore();
  // the paper sheet
  const px = X(PAPER.x0), py = Y(PAPER.y0), pw = (PAPER.x1 - PAPER.x0) * k, ph = (PAPER.y1 - PAPER.y0) * k;
  g.save();
  g.shadowColor = 'rgba(60,40,20,0.28)';
  g.shadowBlur = 3 * k; g.shadowOffsetY = 1 * k;
  g.fillStyle = '#fbfaf6';
  g.fillRect(px, py, pw, ph);
  g.restore();
  g.save();
  g.beginPath(); g.rect(px, py, pw, ph); g.clip();
  g.fillStyle = g.createPattern(paperGrain(), 'repeat')!;
  g.fillRect(px, py, pw, ph);
  const v = g.createRadialGradient(px + pw * 0.4, py + ph * 0.35, Math.min(pw, ph) * 0.2, px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.75);
  v.addColorStop(0, 'rgba(255,255,255,0.35)');
  v.addColorStop(1, 'rgba(120,110,95,0.10)');
  g.fillStyle = v;
  g.fillRect(px, py, pw, ph);
  g.restore();
  // glitter glue stripes on the paper
  g.save();
  g.setTransform(k, 0, 0, k, ox, oy);
  glue.forEach((q, gi) => drawGlue(g, q, gi));
  if (towel) drawTowel(g, towel);
  g.restore();
  // the plant leans over the paper's corner, as in the reference photo
  g.save();
  g.translate(ox, oy);
  plant(g, k, stage);
  g.restore();
  return c;
}

/** A stripe of glitter glue (world units): silvery glue, a wet shine and lots of glitter flecks. */
function drawGlue(g: CanvasRenderingContext2D, q: Glue, gi: number) {
  const w = q.w ?? 7;
  const len = Math.hypot(q.x1 - q.x0, q.y1 - q.y0) || 1;
  const ux = (q.x1 - q.x0) / len, uy = (q.y1 - q.y0) / len;
  const nx = -uy, ny = ux;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(q.x0, q.y0); g.lineTo(q.x1, q.y1);
  g.shadowColor = 'rgba(90,90,120,0.25)'; g.shadowBlur = 4; g.shadowOffsetY = 1;
  g.strokeStyle = 'rgba(225,228,240,0.85)'; g.lineWidth = w;
  g.stroke();
  g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = w * 0.7;
  g.stroke();
  // flecks
  const n = Math.round(len * w * 0.9);
  for (let i = 0; i < n; i++) {
    const a = hash(gi * 1000 + i), b = hash(gi * 2000 + i * 1.3) - 0.5;
    const x = q.x0 + ux * len * a + nx * b * w * 0.9, y = q.y0 + uy * len * a + ny * b * w * 0.9;
    const sz = 0.18 + hash(i * 7 + gi) * 0.32;
    g.save();
    g.translate(x, y);
    g.rotate(hash(i * 3 + gi) * 3);
    g.globalAlpha = 0.65 + hash(i * 11) * 0.35;
    g.fillStyle = GLITTER[i % GLITTER.length];
    g.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2);
    g.restore();
  }
  // a wet shine along one edge
  g.beginPath();
  g.moveTo(q.x0 + nx * w * 0.25, q.y0 + ny * w * 0.25);
  g.lineTo(q.x1 + nx * w * 0.25, q.y1 + ny * w * 0.25);
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = w * 0.12;
  g.stroke();
}

/** The towel's texture (world units) inside the current clip: quilted dots and fibres. */
function towelTexture(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const step = 4.2;
  for (let y = y0 + step / 2, row = 0; y < y1; y += step * 0.5, row++) {
    for (let x = x0 + (row % 2 ? step / 2 : 0); x < x1; x += step) {
      g.beginPath(); g.arc(x + 0.15, y + 0.2, 0.55, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
      g.beginPath(); g.arc(x, y, 0.5, 0, Math.PI * 2);
      g.fillStyle = 'rgba(170,160,145,0.22)'; g.fill();
    }
  }
  const w = x1 - x0, h = y1 - y0;
  for (let i = 0; i < w * h * 0.5; i++) {
    const x = x0 + hash(i * 3.1) * w, y = y0 + hash(i * 7.7) * h, a = hash(i) * Math.PI;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9);
    g.strokeStyle = 'rgba(160,150,135,0.08)'; g.lineWidth = 0.12; g.stroke();
  }
}

/**
 * Paper towel (world units): a whole sheet for free colouring (quilted,
 * perforated edges), or a picture of cut-out pieces lying on the paper, each
 * with a pale hint of the colour it wants.
 */
function drawTowel(g: CanvasRenderingContext2D, t: TowelDef) {
  const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
  if (!t.picture) {
    const w = t.x1 - t.x0, h = t.y1 - t.y0;
    g.save();
    g.shadowColor = 'rgba(70,60,40,0.22)';
    g.shadowBlur = 6; g.shadowOffsetY = 1.5;
    g.fillStyle = '#fefdfb';
    g.fillRect(t.x0, t.y0, w, h);
    g.restore();
    g.save();
    g.beginPath(); g.rect(t.x0, t.y0, w, h); g.clip();
    towelTexture(g, t.x0, t.y0, t.x1, t.y1);
    g.restore();
    g.save();
    g.setLineDash([0.9, 0.9]);
    g.strokeStyle = 'rgba(150,140,125,0.45)'; g.lineWidth = 0.35;
    for (const x of [t.x0 + 1.2, t.x1 - 1.2]) { g.beginPath(); g.moveTo(x, t.y0 + 1); g.lineTo(x, t.y1 - 1); g.stroke(); }
    g.restore();
    return;
  }
  const sc = t.scale ?? 1;
  const pic: Picture = PICTURES[t.picture];
  // lines drawn on the paper (balloon strings)
  for (const [x0, y0, qx, qy, x1, y1] of pic.decor ?? []) {
    g.beginPath();
    g.moveTo(cx + x0 * sc, cy + y0 * sc);
    g.quadraticCurveTo(cx + qx * sc, cy + qy * sc, cx + x1 * sc, cy + y1 * sc);
    g.strokeStyle = 'rgba(90,90,110,0.55)'; g.lineWidth = 0.45; g.lineCap = 'round';
    g.stroke();
  }
  const cut = cutPicture(pic, t, Math.min(12, g.getTransform().a));
  if (!cut) return;
  // the towel's shadow on the paper, then the towel
  g.save();
  g.shadowColor = 'rgba(70,60,40,0.25)';
  g.shadowBlur = 4 * g.getTransform().a; g.shadowOffsetY = 1 * g.getTransform().a;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(cut.img, cut.x, cut.y, cut.w, cut.h);
  g.restore();
}

/**
 * A picture cut out of towel, painted once into its own canvas at `res` pixels
 * per world unit: the hand-cut outline (soft and a little fibrous at the edge),
 * a faint hint of each part's colour, a faint line between the parts, and the
 * towel's quilted texture. The white middle stays plain.
 */
function cutPicture(pic: Picture, t: TowelDef, res: number) {
  const shape = new PictureShape(pic, t.scale ?? 1);
  const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
  // where the picture is (a quick coarse look)
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (let y = t.y0; y <= t.y1; y += 0.5) for (let x = t.x0; x <= t.x1; x += 0.5) {
    if (shape.at(x - cx, y - cy).edge < 1) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
  }
  if (bx0 > bx1) return null;
  bx0 -= 1; by0 -= 1; bx1 += 1; by1 += 1;
  const W = Math.ceil((bx1 - bx0) * res), H = Math.ceil((by1 - by0) * res);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H), px = img.data;
  const id = new Int16Array(W * H);
  const cols = shape.areas.map((a) => toRgb(PIG[a.color]));
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = bx0 + (i + 0.5) / res - cx, y = by0 + (j + 0.5) / res - cy;
    const q = shape.at(x, y);
    const k = j * W + i, o = k * 4;
    // fibres at the cut edge: a little fuzz
    const e = q.edge + (hash(k * 0.37) - 0.5) * 0.18;
    const alpha = Math.max(0, Math.min(1, 0.5 - e * res));
    id[k] = alpha > 0 ? (q.area + 1) * 32 + q.piece + 1 : -1;
    if (alpha <= 0) continue;
    let r = 254, gg = 253, b = 251;
    if (q.area >= 0) {
      const cc = cols[q.area];
      r = r * 0.86 + cc[0] * 255 * 0.14; gg = gg * 0.86 + cc[1] * 255 * 0.14; b = b * 0.86 + cc[2] * 255 * 0.14;
    }
    // the cut edge is a touch darker (the towel's thickness)
    const rim = Math.max(0, Math.min(1, 1 + q.edge / 0.6)) * 0.07;
    px[o] = r * (1 - rim); px[o + 1] = gg * (1 - rim); px[o + 2] = b * (1 - rim); px[o + 3] = alpha * 255;
  }
  // a faint guide line where one part meets another
  const lw = Math.max(1, Math.round(res * 0.3));
  for (let j = 0; j < H - lw; j++) for (let i = 0; i < W - lw; i++) {
    const k = j * W + i, a = id[k];
    if (a < 0) continue;
    const r = id[k + lw], d = id[k + lw * W];
    if ((r >= 0 && r !== a) || (d >= 0 && d !== a)) {
      const area = Math.floor(a / 32) - 1 >= 0 ? Math.floor(a / 32) - 1 : Math.floor((r !== a && r >= 0 ? r : d) / 32) - 1;
      const cc = area >= 0 ? tint(cols[area], INK, 0.3) : ([0.6, 0.58, 0.55] as RGB);
      const o = k * 4, f = 0.3;
      px[o] = px[o] * (1 - f) + cc[0] * 255 * f; px[o + 1] = px[o + 1] * (1 - f) + cc[1] * 255 * f; px[o + 2] = px[o + 2] * (1 - f) + cc[2] * 255 * f;
    }
  }
  g.putImageData(img, 0, 0);
  // the towel's quilted texture, only on the towel
  g.globalCompositeOperation = 'source-atop';
  g.setTransform(res, 0, 0, res, -bx0 * res, -by0 * res);
  towelTexture(g, bx0, by0, bx1, by1);
  return { img: c, x: bx0, y: by0, w: W / res, h: H / res };
}

/** A few glints twinkling on the glue stripes (drawn every frame, world units). */
export function drawGlueTwinkle(ctx: CanvasRenderingContext2D, glue: Glue[], t: number) {
  glue.forEach((q, gi) => {
    const w = q.w ?? 7;
    const len = Math.hypot(q.x1 - q.x0, q.y1 - q.y0);
    const n = Math.max(3, Math.round(len / 9));
    for (let i = 0; i < n; i++) {
      const ph = hash(gi * 97 + i) * 6.28, sp = 1.5 + hash(i * 5 + gi) * 2;
      const s = Math.max(0, Math.sin(t * sp + ph));
      if (s < 0.6) continue;
      const a = hash(gi * 300 + i * 7), b = hash(gi * 400 + i) - 0.5;
      const x = q.x0 + (q.x1 - q.x0) * a - ((q.y1 - q.y0) / (len || 1)) * b * w * 0.7;
      const y = q.y0 + (q.y1 - q.y0) * a + ((q.x1 - q.x0) / (len || 1)) * b * w * 0.7;
      const r = (s - 0.6) * 4.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.18, -r * 0.18); ctx.lineTo(r, 0); ctx.lineTo(r * 0.18, r * 0.18);
      ctx.lineTo(0, r); ctx.lineTo(-r * 0.18, r * 0.18); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.18, -r * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });
}

/** Plain paper filling a small canvas (for the cards). */
export function drawPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = ctx.createPattern(paperGrain(), 'repeat')!;
  ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------- cups

export interface CupView {
  x: number; top: number; tw: number; bw: number; h: number;
  rgb: RGB;
  /** water level, 0..1 of the height */
  level: number;
  wave: number;
  need: number;
  filled: boolean;
  /** hint pulse (0..1): 'size' grows the dashed circle, 'color' throbs the outline */
  pulse: number;
  pulseKind: 'size' | 'color' | '';
  /** how much it holds in all and how much is in it (dots show the drops when it takes several) */
  total: number;
  got: number;
  /** 0..1: the happy hop at the end of a level */
  hop: number;
  /** wants glittery drops: glitter in its water and a sparkle badge */
  glitter: boolean;
}

function cupSide(c: CupView, f: number): [number, number] {
  // x of the left side at fraction f of the height (0 top, 1 bottom)
  const half = c.tw / 2 + (c.bw / 2 - c.tw / 2) * f;
  return [c.x - half, c.x + half];
}

export function drawCup(ctx: CanvasRenderingContext2D, c: CupView, t: number) {
  const rx = c.tw / 2, ry = c.tw * 0.11, bry = c.bw * 0.1;
  const bottom = c.top + c.h;
  const ink = tint(c.rgb, INK, 0.12);
  const throb = c.pulseKind === 'color' ? c.pulse : 0;
  ctx.save();
  if (c.hop > 0) {
    // jump and squash around the cup's foot
    ctx.translate(c.x, bottom);
    ctx.translate(0, -c.hop * c.h * 0.35);
    const sq = 1 + Math.sin(c.hop * Math.PI) * 0.06;
    ctx.scale(1 / sq, sq);
    ctx.translate(-c.x, -bottom);
  }

  // glass, very faint
  ctx.beginPath();
  ctx.moveTo(c.x - rx, c.top);
  ctx.lineTo(c.x - c.bw / 2, bottom);
  ctx.ellipse(c.x, bottom, c.bw / 2, bry, 0, Math.PI, 0, true);
  ctx.lineTo(c.x + rx, c.top);
  ctx.ellipse(c.x, c.top, rx, ry, 0, 0, Math.PI, false);
  ctx.fillStyle = css(tint(c.rgb, WHITE, 0.85), 0.25);
  ctx.fill();

  // water with a scalloped top, like the drawing
  const lvl = Math.max(0.02, Math.min(0.95, c.level));
  const f = 1 - lvl;
  const wy = c.top + c.h * f;
  const [wl, wr] = cupSide(c, f);
  const bumps = 6;
  ctx.beginPath();
  ctx.moveTo(wl, wy);
  for (let i = 0; i < bumps; i++) {
    const x0 = wl + ((wr - wl) * i) / bumps, x1 = wl + ((wr - wl) * (i + 1)) / bumps;
    const amp = c.tw * 0.035 + c.wave * c.tw * 0.05 * Math.sin(t * 9 + i * 1.7);
    ctx.quadraticCurveTo((x0 + x1) / 2, wy - amp * 2, x1, wy);
  }
  ctx.lineTo(c.x + c.bw / 2, bottom);
  ctx.ellipse(c.x, bottom, c.bw / 2, bry, 0, 0, Math.PI, false);
  ctx.closePath();
  const wg = ctx.createLinearGradient(0, wy - 2, 0, bottom);
  wg.addColorStop(0, css(tint(c.rgb, WHITE, 0.08), 0.92));
  wg.addColorStop(1, css(tint(c.rgb, INK, 0.08), 0.92));
  ctx.fillStyle = wg;
  ctx.fill();
  if (c.glitter) {
    // glitter in the water
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 90; i++) {
      const x = c.x + (hash(i * 3 + c.x) - 0.5) * c.tw, y = bottom - hash(i * 7 + c.x) * c.h * lvl;
      const tw = 0.45 + 0.55 * Math.max(0, Math.sin(t * 4 + i * 1.3));
      ctx.globalAlpha = tw;
      ctx.fillStyle = GLITTER[i % GLITTER.length];
      ctx.fillRect(x - 0.45, y - 0.3, 0.9, 0.6);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 2; i++) {
      const s = Math.max(0, Math.sin(t * 2.5 + i * 2.6 + c.x));
      const x = c.x + (hash(i * 17 + c.x) - 0.5) * c.bw * 0.7, y = bottom - (0.3 + hash(i * 23 + c.x) * 0.6) * c.h * lvl;
      glint(ctx, x, y, 2.2 * s);
    }
    ctx.restore();
  }

  // marker outline (drawn twice, slightly apart, for a hand-drawn line)
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const j = pass * 0.25;
    ctx.beginPath();
    ctx.ellipse(c.x + j, c.top - j * 0.5, rx, ry, 0, 0, Math.PI * 2);
    ctx.moveTo(c.x - rx + j, c.top);
    ctx.lineTo(c.x - c.bw / 2 + j, bottom);
    ctx.ellipse(c.x + j, bottom, c.bw / 2, bry, 0, Math.PI, 0, true);
    ctx.lineTo(c.x + rx + j, c.top);
    ctx.strokeStyle = css(ink, pass ? 0.35 : 0.9);
    ctx.lineWidth = (pass ? 0.4 : 0.75) + throb * 0.9;
    ctx.stroke();
  }
  // a glint on the glass
  ctx.beginPath();
  const [gl0] = cupSide(c, 0.15), [gl1] = cupSide(c, 0.7);
  ctx.moveTo(gl0 + c.tw * 0.12, c.top + c.h * 0.15);
  ctx.lineTo(gl1 + c.tw * 0.1, c.top + c.h * 0.7);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // the drop this cup is waiting for: a dashed circle of the right size on its mouth
  if (!c.filled) {
    const r = R1 * Math.sqrt(c.need) * (1 + (c.pulseKind === 'size' ? c.pulse * 0.25 : 0));
    ctx.save();
    ctx.setLineDash([1.4, 1.1]);
    ctx.lineDashOffset = -t * 1.2;
    ctx.beginPath();
    ctx.arc(c.x, c.top - r * 0.35, r, 0, Math.PI * 2);
    ctx.fillStyle = css(c.rgb, 0.07 + (c.pulseKind === 'size' ? c.pulse * 0.12 : 0));
    ctx.fill();
    ctx.strokeStyle = css(ink, 0.55 + (c.pulseKind === 'size' ? c.pulse * 0.4 : 0));
    ctx.lineWidth = 0.55;
    ctx.stroke();
    ctx.restore();
  }

  // a glitter cup wears glitter on its rim (not a star): flecks along the mouth, and glints
  if (c.glitter) {
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const an = hash(i * 7 + c.x) * Math.PI * 2;
      const x = c.x + Math.cos(an) * rx * (0.96 + hash(i * 3) * 0.1), y = c.top + Math.sin(an) * ry * (0.9 + hash(i * 5) * 0.3);
      const tw = 0.5 + 0.5 * Math.max(0, Math.sin(t * 4 + i * 1.9));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(hash(i * 11) * 3);
      ctx.globalAlpha = tw;
      ctx.fillStyle = GLITTER[i % GLITTER.length];
      ctx.fillRect(-0.55, -0.35, 1.1, 0.7);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const s = Math.max(0, Math.sin(t * 2 + i * 2.1 + c.x * 0.3));
      const an = Math.PI + (i + 0.5) * (Math.PI / 3);
      glint(ctx, c.x + Math.cos(an) * rx * 0.9, c.top + Math.sin(an) * ry - 1.2, 2.6 * s);
    }
    ctx.restore();
  }

  // a cup that takes several drops shows them as dots on the glass, filled as they come
  const count = Math.round(c.total / c.need);
  if (count > 1) {
    const done = Math.round(c.got / c.need);
    const gap = 3.2, y = c.top + c.h * 0.32;
    for (let i = 0; i < count; i++) {
      const x = c.x + (i - (count - 1) / 2) * gap;
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = i < done ? css(c.rgb, 0.95) : 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.strokeStyle = css(ink, 0.7);
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the celebration

// Pictures painted once and reused: stickers, the writing, falling droplets.
// (Blurred shadows, gradients and text redrawn every frame were too heavy for old tablets.)
const sprites = new Map<string, HTMLCanvasElement>();
function sprite(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  paint(c.getContext('2d')!);
  if (sprites.size > 60) sprites.clear();
  sprites.set(key, c);
  return c;
}

/** Celebration timing, in seconds from its start: quick, so it feels immediate (owner's request). */
export const PARTY = { stars: [0.12, 0.22, 0.32], pop: 0.22, write: 0.3, writeFor: 0.55, buttons: 1.0, hop0: 0.05, hopGap: 0.1, hopLand: 0.38 };

const easeBack = (q: number) => { const c = 2.2; q = Math.max(0, Math.min(1, q)); return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };

function sticker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, s: number, k: number) {
  if (s <= 0) return;
  const half = r * 1.45;
  const img = sprite(`sticker|${r}|${k.toFixed(2)}`, half * 2 * k, half * 2 * k, (g) => {
    g.setTransform(k, 0, 0, k, half * k, half * k);
    stickerShape(g, r);
  });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(img, -half, -half, half * 2, half * 2);
  ctx.restore();
}

function stickerShape(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  const star = (rr: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const q = i % 2 ? rr * 0.5 : rr;
      ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
    }
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  // white sticker edge with a soft shadow
  star(r);
  ctx.shadowColor = 'rgba(80,60,20,0.3)';
  ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = r * 0.32;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  star(r);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, 0, 0, r * 1.1);
  g.addColorStop(0, '#fff3a6'); g.addColorStop(0.45, '#ffcf33'); g.addColorStop(1, '#f2a20c');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,120,0,0.5)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-r * 0.22, -r * 0.3, r * 0.22, r * 0.1, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
}

/**
 * Drawn over the paper after the last cup fills: three star stickers pop on,
 * then "כל הכבוד!" is written in marker from right to left, in the cups' colours.
 */
export function drawParty(ctx: CanvasRenderingContext2D, t: number, colors: RGB[], k = 4) {
  const cx = 80;
  const [s0, s1, s2] = PARTY.stars;
  sticker(ctx, cx + 18, 17, 5.5, 0.2, easeBack((t - s0) / PARTY.pop), k);
  sticker(ctx, cx, 13, 7, 0, easeBack((t - s1) / PARTY.pop), k);
  sticker(ctx, cx - 18, 17, 5.5, -0.2, easeBack((t - s2) / PARTY.pop), k);
  const p = Math.max(0, Math.min(1, (t - PARTY.write) / PARTY.writeFor));
  if (p <= 0) return;
  // the writing is painted once; it is revealed from right to left by showing more of the picture
  const W = 64, H = 22; // world units around the text
  const cols = colors.length ? colors : [[0.2, 0.4, 0.9] as RGB];
  const img = sprite(`write|${k.toFixed(2)}|${cols.map((c) => c.join()).join('/')}`, W * k, H * k, (g) => {
    g.setTransform(k, 0, 0, k, (W / 2) * k, (H / 2) * k);
    const text = 'כל הכבוד!';
    g.font = '700 15px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = 'rtl';
    const w = g.measureText(text).width;
    const gr = g.createLinearGradient(w / 2, 0, -w / 2, 0);
    cols.forEach((c, i) => gr.addColorStop(cols.length === 1 ? 0 : i / (cols.length - 1), css(c)));
    if (cols.length === 1) gr.addColorStop(1, css(tint(cols[0], INK, 0.2)));
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 2.2;
    g.strokeText(text, 0, 0.5);
    g.fillStyle = gr;
    g.fillText(text, 0, 0.5);
  });
  const shown = img.width * p;
  ctx.drawImage(img, img.width - shown, 0, shown, img.height, cx + W / 2 - W * p, 31.5 - H / 2, W * p, H);
}

// ---------------------------------------------------------------- particles and hints

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number;
  kind: 'spark' | 'drop' | 'ring';
  rgb: RGB; size: number; rot: number;
}

export function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[]) {
  for (const p of ps) {
    const a = Math.max(0, Math.min(1, p.life / p.max * 1.6));
    if (p.kind === 'spark') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size * (0.5 + 0.5 * a);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 ? s * 0.32 : s;
        const an = (i / 8) * Math.PI * 2;
        ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
      }
      ctx.closePath();
      ctx.fillStyle = css(tint(p.rgb, WHITE, 0.35), a);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'ring') {
      const k = 1 - p.life / p.max;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * (0.3 + k), p.size * (0.3 + k) * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = css(tint(p.rgb, WHITE, 0.3), (1 - k) * 0.8);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      // a small falling droplet, with its own little shine (one picture per colour)
      const img = sprite(`pdrop|${p.rgb.map((v) => v.toFixed(2)).join()}`, 32, 32, (g) => {
        const gr = g.createRadialGradient(11, 10, 0, 16, 16, 16);
        gr.addColorStop(0, css(tint(p.rgb, WHITE, 0.75)));
        gr.addColorStop(0.45, css(p.rgb, 0.9));
        gr.addColorStop(1, css(tint(p.rgb, INK, 0.35)));
        g.fillStyle = gr;
        g.beginPath(); g.arc(16, 16, 16, 0, Math.PI * 2); g.fill();
      });
      ctx.globalAlpha = a;
      ctx.drawImage(img, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      ctx.globalAlpha = 1;
    }
  }
}

/** A see-through fingertip tapping twice on a drop (the split gesture). */
function drawDoubleTap(ctx: CanvasRenderingContext2D, x: number, y: number, p: number) {
  const taps = [0.2, 0.42];
  let press = 0;
  for (const t of taps) press = Math.max(press, 1 - Math.min(1, Math.abs(p - t) / 0.08));
  const a = p < 0.08 ? p / 0.08 : p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.2) : 1;
  ctx.save();
  for (const t of taps) {
    const q = (p - t) / 0.3;
    if (q <= 0 || q >= 1) continue;
    ctx.beginPath();
    ctx.arc(x, y, 4 + q * 7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * (1 - q)})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  ctx.globalAlpha = 0.75 * a;
  ctx.shadowColor = 'rgba(40,40,60,0.35)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x + 1.2, y + 1.6 - (1 - press) * 2.5, 3.4 - press * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#fff6ee';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(120,90,80,0.6)';
  ctx.lineWidth = 0.45;
  ctx.stroke();
  ctx.restore();
}

/** A see-through fingertip showing a move: press at a, slide to b, lift. */
export function drawHand(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, p: number, tap2 = false, via?: { x: number; y: number } | { x: number; y: number }[]) {
  if (tap2) { drawDoubleTap(ctx, ax, ay, p); return; }
  // the path: straight, or round a glue stripe through `via`
  const vias = via ? (Array.isArray(via) ? via : [via]) : [];
  const pts = [[ax, ay], ...vias.map((v) => [v.x, v.y]), [bx, by]];
  const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = segs.reduce((m, v) => m + v, 0) || 1;
  const at = (e: number): [number, number] => {
    let d = e * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) {
        const f = segs[i] ? Math.min(1, d / segs[i]) : 1;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
      }
      d -= segs[i];
    }
    return [bx, by];
  };
  let x = ax, y = ay, a = 1, press = 0;
  if (p < 0.18) { a = p / 0.18; press = p / 0.18; }
  else if (p < 0.78) {
    const q = (p - 0.18) / 0.6;
    const e = q * q * (3 - 2 * q);
    [x, y] = at(e); press = 1;
  } else { x = bx; y = by; a = 1 - (p - 0.78) / 0.22; press = a; }
  // dotted path
  ctx.save();
  ctx.setLineDash([1, 2]);
  ctx.strokeStyle = `rgba(70,80,110,${0.25 * Math.min(1, a + 0.3)})`;
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(ax, ay); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.stroke();
  ctx.restore();
  // fingertip
  ctx.save();
  ctx.globalAlpha = 0.75 * a;
  ctx.shadowColor = 'rgba(40,40,60,0.35)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x + 1.2, y + 1.6, 3.4 - press * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#fff6ee';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(120,90,80,0.6)';
  ctx.lineWidth = 0.45;
  ctx.stroke();
  if (press > 0.5 && p < 0.25) {
    ctx.beginPath();
    ctx.arc(ax, ay, 5 + (p / 0.25) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - p / 0.25)})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}
