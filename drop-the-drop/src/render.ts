// Drawing. Everything is code: a sheet of paper, cups drawn in marker like the
// ones in the children's activity, and drops of coloured water, which get all
// the care: a soft shadow with a coloured light pool beside it (the drop is a
// lens), a body that is light in the middle and dark at the rim (refraction),
// a bright caustic on the far side, a thin reflected rim, and a glossy window
// highlight on the side facing the light (top left). Everything follows the
// drop's outline, so stretches and wobbles move the gloss too.

import { css, INK, tint, WHITE, type RGB } from './color';
import { type Drop, N, R1, COS, SIN } from './drop';

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
  //    light that passed through the drop and lands just beside it
  const OFF = 4000;
  ctx.fillStyle = '#000';
  trace(ctx, xs, ys, -OFF, 0);
  ctx.shadowColor = css(tint(col, INK, 0.75), 0.16 * alpha);
  ctx.shadowBlur = rim * 0.9 * S;
  ctx.shadowOffsetX = (OFF + rim * 0.35) * S;
  ctx.shadowOffsetY = rim * 0.5 * S;
  ctx.fill();
  ctx.shadowColor = css(col, 0.22 * alpha);
  ctx.shadowBlur = rim * 0.45 * S;
  ctx.shadowOffsetX = (OFF + rim * 0.22) * S;
  ctx.shadowOffsetY = rim * 0.3 * S;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

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
function flower(g: CanvasRenderingContext2D, k: number, open: number) {
  const ang = 1.28, len = 36 * k;
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
      pg.addColorStop(0, '#ffd1e0'); pg.addColorStop(1, '#ee6f98');
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
  if (stage >= 8) flower(g, k, stage >= 10 ? (stage - 9) / 2 : 0);
}

/**
 * Paint the still scene once: the table, the black card under the paper
 * (its corners peek out), and the paper sheet. ox, oy and k place the world
 * in device pixels.
 */
export function drawBackdrop(w: number, h: number, ox: number, oy: number, k: number, stage = 0): HTMLCanvasElement {
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
  // the plant leans over the paper's corner, as in the reference photo
  g.save();
  g.translate(ox, oy);
  plant(g, k, stage);
  g.restore();
  return c;
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

/** Celebration timing, in seconds from its start: quick, so it feels immediate (owner's request). */
export const PARTY = { stars: [0.12, 0.22, 0.32], pop: 0.22, write: 0.3, writeFor: 0.55, buttons: 1.0 };

const easeBack = (q: number) => { const c = 2.2; q = Math.max(0, Math.min(1, q)); return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };

function sticker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, s: number) {
  if (s <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
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
export function drawParty(ctx: CanvasRenderingContext2D, t: number, colors: RGB[]) {
  const cx = 80;
  const [s0, s1, s2] = PARTY.stars;
  sticker(ctx, cx + 18, 17, 5.5, 0.2, easeBack((t - s0) / PARTY.pop));
  sticker(ctx, cx, 13, 7, 0, easeBack((t - s1) / PARTY.pop));
  sticker(ctx, cx - 18, 17, 5.5, -0.2, easeBack((t - s2) / PARTY.pop));
  const p = Math.max(0, Math.min(1, (t - PARTY.write) / PARTY.writeFor));
  if (p <= 0) return;
  const text = 'כל הכבוד!';
  ctx.save();
  ctx.font = '700 15px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  const w = ctx.measureText(text).width + 4;
  ctx.beginPath();
  ctx.rect(cx + w / 2 - w * p, 20, w * p, 22);
  ctx.clip();
  const gr = ctx.createLinearGradient(cx + w / 2, 0, cx - w / 2, 0);
  const cols = colors.length ? colors : [[0.2, 0.4, 0.9] as RGB];
  cols.forEach((c, i) => gr.addColorStop(cols.length === 1 ? 0 : i / (cols.length - 1), css(c)));
  if (cols.length === 1) gr.addColorStop(1, css(tint(cols[0], INK, 0.2)));
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2.2;
  ctx.strokeText(text, cx, 31.5);
  ctx.fillStyle = gr;
  ctx.fillText(text, cx, 31.5);
  ctx.restore();
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
      // a small falling droplet, with its own little shine
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(p.x - p.size * 0.3, p.y - p.size * 0.35, 0, p.x, p.y, p.size);
      g.addColorStop(0, css(tint(p.rgb, WHITE, 0.75), a));
      g.addColorStop(0.45, css(p.rgb, a * 0.9));
      g.addColorStop(1, css(tint(p.rgb, INK, 0.35), a));
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
}

/** A see-through fingertip showing a move: press at a, slide to b, lift. */
export function drawHand(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, p: number) {
  let x = ax, y = ay, a = 1, press = 0;
  if (p < 0.18) { a = p / 0.18; press = p / 0.18; }
  else if (p < 0.78) {
    const q = (p - 0.18) / 0.6;
    const e = q * q * (3 - 2 * q);
    x = ax + (bx - ax) * e; y = ay + (by - ay) * e; press = 1;
  } else { x = bx; y = by; a = 1 - (p - 0.78) / 0.22; press = a; }
  // dotted path
  ctx.save();
  ctx.setLineDash([1, 2]);
  ctx.strokeStyle = `rgba(70,80,110,${0.25 * Math.min(1, a + 0.3)})`;
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
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
