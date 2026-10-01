// Stroke paths for tracing, in a box where capitals and ascenders reach y=0,
// small letters start at y=45, the baseline is y=100 and descenders reach
// y=135. Strokes follow the order children are usually taught.

export interface Glyph {
  w: number;
  strokes: string[];
}

const O_UP = 'M40 0 A35 50 0 0 0 40 100 A35 50 0 0 0 40 0';
const P_BOWL = 'M10 0 L38 0 Q62 0 62 26 Q62 52 38 52 L10 52';
const A_BOWL = 'M45 60 A20 27.5 0 1 0 45 85';

export const UPPER: Record<string, Glyph> = {
  A: { w: 70, strokes: ['M35 0 L5 100', 'M35 0 L65 100', 'M17 62 L53 62'] },
  B: { w: 72, strokes: ['M10 0 L10 100', 'M10 0 L38 0 Q60 0 60 25 Q60 50 38 50 L10 50', 'M10 50 L42 50 Q66 50 66 75 Q66 100 42 100 L10 100'] },
  C: { w: 76, strokes: ['M70 18 A36 50 0 1 0 70 82'] },
  D: { w: 74, strokes: ['M10 0 L10 100', 'M10 0 L30 0 Q66 0 66 50 Q66 100 30 100 L10 100'] },
  E: { w: 62, strokes: ['M10 0 L10 100', 'M10 0 L55 0', 'M10 50 L48 50', 'M10 100 L55 100'] },
  F: { w: 60, strokes: ['M10 0 L10 100', 'M10 0 L55 0', 'M10 50 L48 50'] },
  G: { w: 82, strokes: ['M70 18 A36 50 0 1 0 76 62', 'M76 62 L48 62'] },
  H: { w: 70, strokes: ['M10 0 L10 100', 'M60 0 L60 100', 'M10 50 L60 50'] },
  I: { w: 40, strokes: ['M20 0 L20 100', 'M5 0 L35 0', 'M5 100 L35 100'] },
  J: { w: 56, strokes: ['M45 0 L45 72 Q45 100 25 100 Q5 100 5 78'] },
  K: { w: 66, strokes: ['M10 0 L10 100', 'M58 0 L10 60', 'M26 45 L60 100'] },
  L: { w: 58, strokes: ['M10 0 L10 100 L52 100'] },
  M: { w: 86, strokes: ['M10 100 L10 0 L43 70 L76 0 L76 100'] },
  N: { w: 70, strokes: ['M10 100 L10 0 L60 100 L60 0'] },
  O: { w: 80, strokes: [O_UP] },
  P: { w: 66, strokes: ['M10 0 L10 100', P_BOWL] },
  Q: { w: 84, strokes: [O_UP, 'M50 72 L76 104'] },
  R: { w: 68, strokes: ['M10 0 L10 100', P_BOWL, 'M34 52 L62 100'] },
  S: { w: 68, strokes: ['M60 14 Q50 0 34 0 Q8 0 8 25 Q8 45 34 50 Q62 56 62 76 Q62 100 34 100 Q14 100 5 86'] },
  T: { w: 70, strokes: ['M5 0 L65 0', 'M35 0 L35 100'] },
  U: { w: 70, strokes: ['M10 0 L10 65 Q10 100 35 100 Q60 100 60 65 L60 0'] },
  V: { w: 70, strokes: ['M5 0 L35 100 L65 0'] },
  W: { w: 96, strokes: ['M5 0 L25 100 L47 30 L69 100 L90 0'] },
  X: { w: 66, strokes: ['M5 0 L60 100', 'M60 0 L5 100'] },
  Y: { w: 70, strokes: ['M5 0 L35 50 L65 0', 'M35 50 L35 100'] },
  Z: { w: 66, strokes: ['M5 0 L60 0 L5 100 L60 100'] },
};

export const LOWER: Record<string, Glyph> = {
  a: { w: 56, strokes: [A_BOWL, 'M47 45 L47 100'] },
  b: { w: 58, strokes: ['M10 0 L10 100', 'M10 64 Q18 45 32 45 Q50 45 50 72 Q50 100 32 100 Q18 100 10 82'] },
  c: { w: 52, strokes: ['M44 60 A21 27.5 0 1 0 44 85'] },
  d: { w: 58, strokes: ['M46 64 Q38 45 26 45 Q6 45 6 72 Q6 100 26 100 Q38 100 46 82', 'M46 0 L46 100'] },
  e: { w: 54, strokes: ['M8 72 L46 72 Q46 45 27 45 Q8 45 8 72 Q8 100 28 100 Q40 100 46 90'] },
  f: { w: 42, strokes: ['M36 6 Q30 0 24 0 Q14 0 14 14 L14 100', 'M4 48 L32 48'] },
  g: { w: 56, strokes: [A_BOWL, 'M47 45 L47 118 Q47 135 28 135 Q14 135 8 126'] },
  h: { w: 56, strokes: ['M10 0 L10 100', 'M10 64 Q18 45 30 45 Q46 45 46 64 L46 100'] },
  i: { w: 26, strokes: ['M13 45 L13 100', 'M13 20 L13 26'] },
  j: { w: 36, strokes: ['M24 45 L24 118 Q24 135 10 135 Q4 135 2 130', 'M24 20 L24 26'] },
  k: { w: 52, strokes: ['M10 0 L10 100', 'M44 45 L10 78', 'M22 67 L46 100'] },
  l: { w: 26, strokes: ['M13 0 L13 100'] },
  m: { w: 82, strokes: ['M10 45 L10 100', 'M10 62 Q14 45 26 45 Q40 45 40 62 L40 100', 'M40 62 Q44 45 56 45 Q70 45 70 62 L70 100'] },
  n: { w: 56, strokes: ['M10 45 L10 100', 'M10 64 Q18 45 30 45 Q46 45 46 64 L46 100'] },
  o: { w: 58, strokes: ['M28 45 A21 27.5 0 0 0 28 100 A21 27.5 0 0 0 28 45'] },
  p: { w: 58, strokes: ['M10 45 L10 135', 'M10 64 Q18 45 32 45 Q50 45 50 72 Q50 100 32 100 Q18 100 10 82'] },
  q: { w: 58, strokes: ['M46 64 Q38 45 26 45 Q6 45 6 72 Q6 100 26 100 Q38 100 46 82', 'M46 45 L46 135'] },
  r: { w: 46, strokes: ['M10 45 L10 100', 'M10 66 Q16 45 32 45 Q38 45 42 48'] },
  s: { w: 48, strokes: ['M40 52 Q34 45 24 45 Q8 45 8 58 Q8 70 24 72 Q40 75 40 87 Q40 100 22 100 Q10 100 5 92'] },
  t: { w: 42, strokes: ['M18 12 L18 88 Q18 100 30 100 Q34 100 37 97', 'M4 45 L34 45'] },
  u: { w: 56, strokes: ['M10 45 L10 80 Q10 100 28 100 Q46 100 46 80', 'M46 45 L46 100'] },
  v: { w: 52, strokes: ['M5 45 L26 100 L47 45'] },
  w: { w: 78, strokes: ['M5 45 L20 100 L38 55 L56 100 L72 45'] },
  x: { w: 50, strokes: ['M6 45 L44 100', 'M44 45 L6 100'] },
  y: { w: 52, strokes: ['M5 45 L26 100', 'M47 45 L22 118 Q17 135 5 135'] },
  z: { w: 50, strokes: ['M6 45 L44 45 L6 100 L44 100'] },
};

export const glyph = (ch: string): Glyph => UPPER[ch] ?? LOWER[ch] ?? { w: 40, strokes: [] };
