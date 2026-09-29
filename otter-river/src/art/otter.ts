import { bake, Grid, Sprite } from './sprite';
import { done, ellipse, grid, put, stampRows, Pix, shape } from './shapes';

// The otter is a pixel "puppet": separate parts drawn at whole-pixel offsets
// so it can breathe, bob, blink, paddle and sway its tail.
// Coordinates are relative to the otter origin (belly centre). Bodies are
// built from shaded shapes; the face is hand-placed pixel by pixel.

const FUR = { fill: 'B', shade: 'b', light: 'h' };

const EYE = [
  '.EE.',
  'EWEE',
  'EEEE',
  '.EE.',
];

const NOSE = [
  'NWNN',
  'NNNN',
  '.NN.',
];

function head(): Grid {
  const g = grid(34, 22);
  // ears behind the head
  ellipse(g, 0, 4, 8, 7, { ...FUR });
  ellipse(g, 26, 4, 8, 7, { ...FUR });
  put(g, 2, 7, 'P'); put(g, 3, 7, 'P'); put(g, 2, 8, 'p');
  put(g, 31, 7, 'P'); put(g, 30, 7, 'P'); put(g, 31, 8, 'p');
  // head
  ellipse(g, 2, 0, 30, 22, { ...FUR, power: 2.4, lightAt: 0.5 });
  // fur tuft on the forehead
  put(g, 15, 1, 'h'); put(g, 16, 2, 'h'); put(g, 17, 1, 'h');
  // muzzle (light fur, no outline)
  ellipse(g, 10, 11, 14, 9, { fill: 'L', shade: 'l', outline: null, shadeAt: 0.55 });
  put(g, 11, 12, 'C'); put(g, 12, 12, 'C');
  // eyes
  stampRows(g, EYE, 8, 8);
  stampRows(g, EYE, 22, 8);
  // cheeks
  for (const [x, y] of [[6, 13], [7, 13], [8, 13], [7, 14]]) { put(g, x, y, 'P'); put(g, 33 - x, y, 'P'); }
  put(g, 6, 14, 'p'); put(g, 27, 14, 'p');
  // nose + mouth (ω)
  stampRows(g, NOSE, 15, 12);
  for (const [x, y] of [[16, 15], [17, 15], [14, 16], [19, 16], [15, 17], [18, 17], [16, 16], [17, 16]]) put(g, x, y, 'o');
  // whisker dots
  for (const [x, y] of [[12, 14], [11, 16], [21, 14], [22, 16]]) put(g, x, y, 'o');
  return done(g);
}

const EYES_CLOSED = eyesOverlay([
  'BBBB',
  'BBBB',
  'OBBO',
  'BOOB',
]);

const EYES_HAPPY = eyesOverlay([
  'BBBB',
  'BOOB',
  'OBBO',
  'BBBB',
]);

function eyesOverlay(eye: Grid): Grid {
  const g = grid(18, 4);
  stampRows(g, eye, 0, 0);
  stampRows(g, eye, 14, 0);
  return done(g);
}

function body(): Grid {
  const g = grid(34, 38);
  // hind feet (behind body)
  foot(g, 1, 27);
  foot(g, 24, 27);
  ellipse(g, 2, 0, 30, 33, { ...FUR, lightAt: 0.6 });
  // belly
  ellipse(g, 6, 3, 22, 27, { fill: 'L', shade: 'l', light: 'C', outline: null, shadeAt: 0.4, lightAt: 0.45 });
  // chest fluff
  for (const x of [11, 14, 17, 20]) { put(g, x, 3, 'B'); put(g, x + 1, 3, 'L'); }
  // belly button + fur texture
  put(g, 17, 20, 'l');
  for (const [x, y] of [[9, 14], [24, 17], [10, 24], [23, 9]]) put(g, x, y, 'l');
  // feet in front at the bottom
  foot(g, 3, 29);
  foot(g, 22, 29);
  return done(g);
}

function foot(g: Pix, x0: number, y0: number) {
  ellipse(g, x0, y0, 9, 8, { fill: 'B', shade: 'b', light: 'h' });
  // toe beans
  put(g, x0 + 3, y0 + 3, 'D'); put(g, x0 + 5, y0 + 3, 'D');
  put(g, x0 + 4, y0 + 5, 'D'); put(g, x0 + 3, y0 + 5, 'D'); put(g, x0 + 5, y0 + 5, 'D');
}

function paw(): Grid {
  const g = grid(9, 8);
  ellipse(g, 0, 0, 9, 8, { ...FUR });
  put(g, 3, 5, 'o'); put(g, 5, 5, 'o');
  put(g, 3, 2, 'h');
  return done(g);
}

/** Tapered tail; rows [from, to) so it can be split into a steady base and a swaying tip. */
function tail(from: number, to: number): Grid {
  const L = 16;
  const widthAt = (r: number) => Math.max(3, Math.round(12 - r * 0.62));
  const inside = (x: number, r: number) => {
    if (r < 0 || r >= L) return false;
    const w = widthAt(r);
    return x >= 7 - Math.ceil(w / 2) && x < 7 + Math.floor(w / 2);
  };
  const full = grid(14, L);
  shape(full, 0, 0, 14, L, (x, y) => inside(x, y), { fill: 'B', shade: 'b', light: 'h', shadeAt: 0.2, lightAt: 0.2 });
  // round the tip
  put(full, 7, L - 1, '.');
  for (let r = 0; r < L; r += 4) put(full, 7, r + 2, 'b');
  return full.slice(from, to).map((r) => r.join(''));
}

const BODY_GRID = body();
export const OTTER_BODY_GRID = BODY_GRID;
export const BODY_LEFT = -17;
export const BODY_TOP = -16;

// Part placement (top-left) relative to the origin.
export const PART = {
  head: { x: -17, y: -37 },
  body: { x: BODY_LEFT, y: BODY_TOP },
  pawL: { x: -13, y: -12 },
  pawR: { x: 4, y: -12 },
  tailTop: { x: -7, y: 12 },
  tailTip: { x: -7, y: 19 },
  eyes: { x: -9, y: -29 }, // over head cols 8..25, rows 8..11
};

export interface OtterArt {
  head: Sprite;
  body: Sprite;
  paw: Sprite;
  tailTop: Sprite;
  tailTip: Sprite;
  eyesClosed: Sprite;
  eyesHappy: Sprite;
}

let cache: OtterArt | null = null;
export function otterArt(): OtterArt {
  if (!cache) {
    cache = {
      head: bake('otter.head', head()),
      body: bake('otter.body', BODY_GRID),
      paw: bake('otter.paw', paw()),
      tailTop: bake('otter.tailTop', tail(0, 7)),
      tailTip: bake('otter.tailTip', tail(7, 16)),
      eyesClosed: bake('otter.eyesClosed', EYES_CLOSED),
      eyesHappy: bake('otter.eyesHappy', EYES_HAPPY),
    };
  }
  return cache;
}

/** A small otter built from the same parts language (for the Baby Otter pet). */
export function babyOtter(): Grid {
  const g = grid(18, 26);
  const t = grid(8, 8);
  shape(t, 0, 0, 8, 8, (x, y) => x >= 2 + (y >> 2) && x < 6 - (y >> 2), { fill: 'B', shade: 'b' });
  stampRows(g, done(t), 5, 18);
  ellipse(g, 2, 8, 14, 14, { ...FUR });
  ellipse(g, 4, 10, 10, 10, { fill: 'L', shade: 'l', outline: null });
  ellipse(g, 0, 2, 5, 5, { ...FUR });
  ellipse(g, 13, 2, 5, 5, { ...FUR });
  ellipse(g, 1, 0, 16, 12, { ...FUR, power: 2.4 });
  ellipse(g, 6, 5, 6, 5, { fill: 'L', outline: null });
  put(g, 5, 4, 'E'); put(g, 5, 5, 'E'); put(g, 12, 4, 'E'); put(g, 12, 5, 'E');
  put(g, 8, 6, 'N'); put(g, 9, 6, 'N');
  put(g, 4, 7, 'P'); put(g, 13, 7, 'P');
  ellipse(g, 3, 12, 5, 4, { ...FUR });
  ellipse(g, 10, 12, 5, 4, { ...FUR });
  return done(g);
}
