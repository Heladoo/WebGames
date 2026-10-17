// Geometry for drawing characters in code: smooth closed blobs and open curves through points (Catmull-Rom turned
// into cubic Béziers), tapered limbs and ribbons, and "inked" groups that get one outline around their joined
// silhouette, the way a cel animator outlines a character.

export interface P { x: number; y: number }

export const f = (n: number) => (Math.round(n * 10) / 10).toString();
export const pt = (x: number, y: number): P => ({ x, y });
export const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
export const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const deg = (d: number) => (d * Math.PI) / 180;
/** A point at `len` from `p`, at an angle measured from straight down (positive turns toward +x, i.e. forward). */
export const down = (p: P, a: number, len: number): P => ({ x: p.x + Math.sin(deg(a)) * len, y: p.y + Math.cos(deg(a)) * len });
export const rot = (p: P, c: P, a: number): P => {
  const s = Math.sin(deg(a));
  const k = Math.cos(deg(a));
  return { x: c.x + (p.x - c.x) * k - (p.y - c.y) * s, y: c.y + (p.x - c.x) * s + (p.y - c.y) * k };
};

/** A smooth closed shape through the points. */
export function blob(ps: P[], tension = 1): string {
  const n = ps.length;
  let d = `M${f(ps[0].x)} ${f(ps[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = ps[(i - 1 + n) % n];
    const p1 = ps[i];
    const p2 = ps[(i + 1) % n];
    const p3 = ps[(i + 2) % n];
    const k = tension / 6;
    d += `C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)} ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + 'Z';
}

/** A smooth open curve through the points (for strokes). */
export function curve(ps: P[], tension = 1, move = true): string {
  let d = move ? `M${f(ps[0].x)} ${f(ps[0].y)}` : '';
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)];
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const p3 = ps[Math.min(ps.length - 1, i + 2)];
    const k = tension / 6;
    d += `C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)} ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

/** Points along a smooth curve, for ribbons. */
export function sample(ps: P[], per = 6): P[] {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)];
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const p3 = ps[Math.min(ps.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, dd: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - dd) * t2 + (-a + 3 * b - 3 * cc + dd) * t3);
      out.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
}

/** A filled ribbon along a curve whose width goes from w0 to w1 (a lock of mane, a strand of hair, a tail). */
export function ribbon(ps: P[], w0: number, w1: number, ease = 1): string {
  const s = sample(ps, 8);
  const L: P[] = [];
  const R: P[] = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(s.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1;
    const t = Math.pow(i / (s.length - 1), ease);
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push({ x: s[i].x - (dy / m) * w, y: s[i].y + (dx / m) * w });
    R.push({ x: s[i].x + (dy / m) * w, y: s[i].y - (dx / m) * w });
  }
  return 'M' + L.map((p) => `${f(p.x)} ${f(p.y)}`).join('L') + 'L' + R.reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join('L') + 'Z';
}

/** A ribbon whose width along the curve (t from 0 to 1) is given by a function: locks of hair that swell and taper. */
export function lockPath(ps: P[], width: (t: number) => number): string {
  const s = sample(ps, 8);
  const L: P[] = [];
  const R: P[] = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(s.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1;
    const w = width(i / (s.length - 1)) / 2;
    L.push({ x: s[i].x - (dy / m) * w, y: s[i].y + (dx / m) * w });
    R.push({ x: s[i].x + (dy / m) * w, y: s[i].y - (dx / m) * w });
  }
  return curve(L, 1) + 'L' + curve(R.reverse(), 1).slice(1) + 'Z';
}

/** The usual width profile of a lock: attached at the root, fullest a third of the way, then a point. */
export const swell = (w: number) => (t: number) => w * (0.7 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 1.4))) * Math.pow(1 - t, 0.8);

/** A tapered segment with round ends from a (radius ra) to b (radius rb). */
export function capsule(a: P, b: P, ra: number, rb: number): string {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const p1 = { x: a.x + nx * ra, y: a.y + ny * ra };
  const p2 = { x: b.x + nx * rb, y: b.y + ny * rb };
  const p3 = { x: b.x - nx * rb, y: b.y - ny * rb };
  const p4 = { x: a.x - nx * ra, y: a.y - ny * ra };
  return `M${f(p1.x)} ${f(p1.y)}L${f(p2.x)} ${f(p2.y)}A${f(rb)} ${f(rb)} 0 0 0 ${f(p3.x)} ${f(p3.y)}L${f(p4.x)} ${f(p4.y)}A${f(ra)} ${f(ra)} 0 0 0 ${f(p1.x)} ${f(p1.y)}Z`;
}

export const circle = (c: P, r: number) => `M${f(c.x - r)} ${f(c.y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
export const ellipse = (c: P, rx: number, ry: number) => `M${f(c.x - rx)} ${f(c.y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;

/** A shape to ink: its path and fill (a colour or `url(#id)`). */
export interface Sh { d: string; fill: string; extra?: string }

/**
 * Shapes drawn as one inked piece: first every shape thickly stroked in the ink colour, then the fills on top,
 * so the outline goes around the joined silhouette and not between the pieces.
 */
export function inked(shapes: Sh[], ink: string, w = 2.4): string {
  return (
    `<g stroke="${ink}" stroke-width="${w * 2}" stroke-linejoin="round" fill="${ink}">${shapes.map((s) => `<path d="${s.d}"/>`).join('')}</g>` +
    shapes.map((s) => `<path d="${s.d}" fill="${s.fill}"${s.extra ?? ''}/>`).join('')
  );
}

export const linG = (id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
export const radG = (id: string, stops: [number, string, number?][], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</radialGradient>`;

/** Lighten (k > 0) or darken (k < 0) a #rrggbb colour. */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** Mix two #rrggbb colours (t = 0 gives a, 1 gives b). */
export function mix(a: string, b: string, t: number): string {
  const A = parseInt(a.slice(1), 16);
  const B = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
