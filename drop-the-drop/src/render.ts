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

// ---------------------------------------------------------------- paper

let grain: HTMLCanvasElement | null = null;
function paperGrain(): HTMLCanvasElement {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const g = c.getContext('2d')!;
  const img = g.createImageData(192, 192);
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 246 + rnd() * 9;
    img.data[i] = v; img.data[i + 1] = v - 1; img.data[i + 2] = v - 4; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // a few faint fibres
  g.strokeStyle = 'rgba(160,150,130,0.06)';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * 192, y = rnd() * 192, a = rnd() * Math.PI;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke();
  }
  grain = c;
  return c;
}

/** The paper, in device pixels (identity transform). */
export function drawPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pat = ctx.createPattern(paperGrain(), 'repeat')!;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  const v = ctx.createRadialGradient(w * 0.4, h * 0.35, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
  v.addColorStop(0, 'rgba(255,255,255,0.35)');
  v.addColorStop(1, 'rgba(120,110,95,0.10)');
  ctx.fillStyle = v;
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
