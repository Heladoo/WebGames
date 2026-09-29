import { bake, Grid, Sprite } from './sprite';
import { done, ellipse, grid, put, stampRows, Pix, shape } from './shapes';

// The otter is a pixel "puppet": separate parts drawn at whole-pixel offsets
// so it can breathe, bob, blink, paddle its feet and sway its tail.
// Coordinates are relative to the otter origin (belly centre). Bodies are
// built from shaded shapes; the face is hand-placed pixel by pixel.

const FUR = { fill: 'B', shade: 'b', light: 'h' };

// big sparkly eyes: a large shine top-left and a tiny one bottom-right
const EYE = [
  '.EEE.',
  'EWWEE',
  'EWEEE',
  'EEEWE',
  '.EEE.',
];

const NOSE = [
  'NWNN',
  'NNNN',
  '.NN.',
];

function head(): Grid {
  const g = grid(34, 23);
  // soft round ears behind the head
  ellipse(g, 0, 5, 8, 7, { ...FUR });
  ellipse(g, 26, 5, 8, 7, { ...FUR });
  put(g, 2, 8, 'P'); put(g, 3, 8, 'P'); put(g, 2, 9, 'p');
  put(g, 31, 8, 'P'); put(g, 30, 8, 'P'); put(g, 31, 9, 'p');
  // head
  ellipse(g, 2, 0, 30, 23, { ...FUR, power: 2.2, lightAt: 0.5 });
  // fur tuft on the forehead
  put(g, 15, 1, 'h'); put(g, 16, 2, 'h'); put(g, 17, 1, 'h'); put(g, 18, 2, 'h');
  // small round muzzle
  ellipse(g, 11, 12, 12, 8, { fill: 'L', shade: 'l', outline: null, shadeAt: 0.55 });
  put(g, 12, 13, 'C'); put(g, 13, 13, 'C');
  // eyes
  stampRows(g, EYE, 8, 8);
  stampRows(g, EYE, 21, 8);
  // rosy cheeks
  for (const [x, y] of [[5, 14], [6, 14], [7, 14], [5, 15], [6, 15], [7, 15], [6, 16]]) { put(g, x, y, 'P'); put(g, 33 - x, y, 'P'); }
  put(g, 5, 14, 'p'); put(g, 28, 14, 'p');
  // nose + mouth (ω) with a tiny smile highlight
  stampRows(g, NOSE, 15, 13);
  for (const [x, y] of [[16, 16], [17, 16], [14, 17], [16, 17], [17, 17], [19, 17], [15, 18], [18, 18]]) put(g, x, y, 'o');
  put(g, 16, 18, 'C'); put(g, 17, 18, 'C');
  // whisker dots
  for (const [x, y] of [[13, 15], [12, 17], [20, 15], [21, 17]]) put(g, x, y, 'o');
  return done(g);
}

const EYES_CLOSED = eyesOverlay([
  'BBBBB',
  'BBBBB',
  'OBBBO',
  'BOOOB',
  'BBBBB',
]);

const EYES_HAPPY = eyesOverlay([
  'BBBBB',
  'BOOOB',
  'OBBBO',
  'BBBBB',
  'BBBBB',
]);

function eyesOverlay(eye: Grid): Grid {
  const g = grid(18, 5);
  stampRows(g, eye, 0, 0);
  stampRows(g, eye, 13, 0);
  return done(g);
}

function body(): Grid {
  const g = grid(34, 33);
  ellipse(g, 2, 0, 30, 33, { ...FUR, lightAt: 0.6 });
  // belly
  ellipse(g, 6, 3, 22, 27, { fill: 'L', shade: 'l', light: 'C', outline: null, shadeAt: 0.4, lightAt: 0.45 });
  // chest fluff
  for (const x of [11, 14, 17, 20]) { put(g, x, 3, 'B'); put(g, x + 1, 3, 'L'); }
  // belly button + fur texture
  put(g, 17, 20, 'l');
  for (const [x, y] of [[9, 14], [24, 17], [10, 24], [23, 9]]) put(g, x, y, 'l');
  return done(g);
}

/** A hind foot with toe beans (the otter has exactly two). */
function foot(mirror: boolean): Grid {
  const g = grid(10, 9);
  ellipse(g, 0, 0, 10, 9, { fill: 'B', shade: 'b', light: 'h' });
  const beans: [number, number][] = [[3, 5], [5, 5], [7, 5], [4, 3], [6, 3]];
  for (const [x, y] of beans) put(g, mirror ? 9 - x : x, y, 'D');
  put(g, mirror ? 4 : 5, 6, 'D');
  return done(g);
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
  head: { x: -17, y: -38 },
  body: { x: BODY_LEFT, y: BODY_TOP },
  pawL: { x: -13, y: -12 },
  pawR: { x: 4, y: -12 },
  footL: { x: -15, y: 11 },
  footR: { x: 5, y: 11 },
  tailTop: { x: -7, y: 12 },
  tailTip: { x: -7, y: 19 },
  eyes: { x: -9, y: -30 }, // over head cols 8..25, rows 8..12
};

export interface OtterArt {
  head: Sprite;
  body: Sprite;
  paw: Sprite;
  footL: Sprite;
  footR: Sprite;
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
      footL: bake('otter.footL', foot(false)),
      footR: bake('otter.footR', foot(true)),
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
  put(g, 5, 4, 'E'); put(g, 5, 5, 'E'); put(g, 12, 4, 'E'); put(g, 12, 5, 'E'); put(g, 5, 4, 'W'); put(g, 12, 4, 'W');
  put(g, 8, 6, 'N'); put(g, 9, 6, 'N');
  put(g, 4, 7, 'P'); put(g, 13, 7, 'P');
  ellipse(g, 3, 12, 5, 4, { ...FUR });
  ellipse(g, 10, 12, 5, 4, { ...FUR });
  return done(g);
}

export type { Pix };
