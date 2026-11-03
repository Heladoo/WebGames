// Drops carry pigment, not RGB: amounts of red, yellow and blue dye. Mixing two
// drops adds their pigment (weighted by volume, since a drop's pigment already
// scales with its volume), and the colour is found with a paint-like RYB cube,
// so red + yellow makes orange and blue + yellow makes green, as children expect
// from paint, rather than the light-mixing results of RGB.

export type Pig = [number, number, number]; // red, yellow, blue
export type RGB = [number, number, number]; // 0..1

export const PIG = {
  red: [1, 0, 0] as Pig,
  yellow: [0, 1, 0] as Pig,
  blue: [0, 0, 1] as Pig,
  orange: [1, 1, 0] as Pig,
  purple: [1, 0, 1] as Pig,
  green: [0, 1, 1] as Pig,
};
/** Every colour a child can make from the three base colours, by its nearest mix. */
export type ColorName =
  | keyof typeof PIG
  | 'redOrange' | 'yellowOrange' | 'lime' | 'turquoise' | 'indigo' | 'magenta' | 'brown';

// Corners of the RYB cube, tuned to look like food colouring in water.
const W: RGB = [0.97, 0.97, 0.95];
const R: RGB = [0.89, 0.11, 0.16];
const Y: RGB = [0.99, 0.80, 0.10];
const B: RGB = [0.09, 0.37, 0.86];
const O: RGB = [0.99, 0.49, 0.07];
const P: RGB = [0.50, 0.17, 0.66];
const G: RGB = [0.10, 0.62, 0.24];
const K: RGB = [0.36, 0.22, 0.14];

/** Pigment proportions (sum 1); a drop's strength does not depend on its size. */
export function share(p: Pig): Pig {
  const s = p[0] + p[1] + p[2] || 1;
  return [p[0] / s, p[1] / s, p[2] / s];
}

export function pigToRgb(p: Pig): RGB {
  const m = Math.max(p[0], p[1], p[2], 1e-6);
  const r = p[0] / m, y = p[1] / m, b = p[2] / m;
  const w = [
    (1 - r) * (1 - y) * (1 - b), r * (1 - y) * (1 - b), (1 - r) * y * (1 - b), (1 - r) * (1 - y) * b,
    r * y * (1 - b), r * (1 - y) * b, (1 - r) * y * b, r * y * b,
  ];
  const c = [W, R, Y, B, O, P, G, K];
  const out: RGB = [0, 0, 0];
  for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) out[k] += w[i] * c[i][k];
  return out;
}

export function mixPig(a: Pig, b: Pig): Pig {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function scalePig(p: Pig, s: number): Pig {
  return [p[0] * s, p[1] * s, p[2] * s];
}

/** Do two pigments look like the same colour? */
export function sameColor(a: Pig, b: Pig): boolean {
  const x = share(a), y = share(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 0.12;
}

// The in-between mixes: two parts of one colour and one of its neighbour.
const MIXES: [ColorName, Pig][] = [
  ['redOrange', [2, 1, 0]], ['yellowOrange', [1, 2, 0]], ['lime', [0, 2, 1]],
  ['turquoise', [0, 1, 2]], ['indigo', [1, 0, 2]], ['magenta', [2, 0, 1]], ['brown', [1, 1, 1]],
];

export function colorName(p: Pig): ColorName {
  const q = share(p);
  const all: [ColorName, Pig][] = [
    ...(Object.entries(PIG) as [ColorName, Pig][]),
    ...MIXES,
  ].map(([n, v]) => [n, share(v)] as [ColorName, Pig]);
  let best: ColorName = 'red', bd = Infinity;
  for (const [n, v] of all) {
    const d = Math.hypot(q[0] - v[0], q[1] - v[1], q[2] - v[2]);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

/** Colour names in Hebrew (nouns: "בצבע טורקיז"). */
export const COLOR_HE: Record<ColorName, string> = {
  red: 'אדום', yellow: 'צהוב', blue: 'כחול', orange: 'כתום', purple: 'סגול', green: 'ירוק',
  redOrange: 'אדום-כתום', yellowOrange: 'צהוב-כתום', lime: 'ירוק-ליים', turquoise: 'טורקיז',
  indigo: 'כחול-סגול', magenta: 'סגול-אדום', brown: 'חום',
};

export function css(c: RGB, a = 1): string {
  const f = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a})`;
}

/** Mix toward another colour: t = 0 keeps c, t = 1 gives `to`. */
export function tint(c: RGB, to: RGB, t: number): RGB {
  return [c[0] + (to[0] - c[0]) * t, c[1] + (to[1] - c[1]) * t, c[2] + (to[2] - c[2]) * t];
}
export const WHITE: RGB = [1, 1, 1];
export const INK: RGB = [0.05, 0.06, 0.12];
