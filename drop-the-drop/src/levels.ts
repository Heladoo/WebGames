// Levels are data, in world units on a fixed landscape sheet: WORLD_W x WORLD_H
// (16:10). The game is landscape only, so every level is designed for one
// shape; other screen shapes show the table around the sheet.
//
// The path, slow and gentle:
//   1-2   drag drops into a cup
//   3     sort two colours (keep them apart)
//   4-5   join drops: the cup wants a bigger drop
//   6-8   join each colour and keep the colours apart
//   9-12  mix colours: red + yellow make orange, and so on

import { PIG } from './color';
import type { TowelDef } from './towel';

export const WORLD_W = 160;
export const WORLD_H = 100;

export type Base = 'red' | 'yellow' | 'blue';
export type CupColor = keyof typeof PIG;

export interface CupDef {
  color: CupColor;
  /** the size of drop it takes (volume; 1 is a small drop) */
  need: number;
  /** how much it holds in all (default: one drop of `need`) */
  total?: number;
  /** centre, in world units (default: spread evenly) */
  x?: number;
  /** wants glittery drops (true) or plain ones (default) */
  glitter?: boolean;
}

/** A stripe of glitter glue on the paper, from (x0, y0) to (x1, y1), w wide (default 7). A drop dragged through it gets glitter. */
export interface Glue { x0: number; y0: number; x1: number; y1: number; w?: number }
/** A drop: usually a base colour, but a level may start with a mixed one (a big green drop). */
export interface DropDef { color: CupColor; x: number; y: number; vol?: number }
export interface Level {
  id: string;
  cups: CupDef[];
  drops: DropDef[];
  /** may drops of different colours join? (true in mixing levels) */
  mixing: boolean;
  /** a level that teaches something shows its hint sooner */
  teach?: 'split' | 'glitter' | 'towel';
  /** glitter glue stripes */
  glue?: Glue[];
  /** a paper towel to colour, instead of cups */
  towel?: TowelDef;
  /** a level with no way to go wrong: no dead-end check */
  free?: boolean;
}

// Picture levels: the towel pieces lie on the right; the drops wait in a 3 × 3 grid on the
// left, below the plant's corner, 18 and 23 units apart so a drop can be led out between the others.
const PIECES = { x0: 62, y0: 4, x1: 156, y1: 96 };
const SLOTS = [[12, 38], [30, 38], [48, 38], [12, 61], [30, 61], [48, 61], [12, 84], [30, 84], [48, 84]];
const at = (colors: Base[]): DropDef[] => colors.map((color, i) => ({ color, x: SLOTS[i][0], y: SLOTS[i][1] }));

export const LEVELS: Level[] = [
  { id: 'l1', mixing: false, cups: [{ color: 'red', need: 1, x: 105 }], drops: [{ color: 'red', x: 45, y: 32 }] },
  {
    id: 'l2', mixing: false, cups: [{ color: 'yellow', need: 1, total: 3 }],
    drops: [{ color: 'yellow', x: 30, y: 26 }, { color: 'yellow', x: 80, y: 42 }, { color: 'yellow', x: 130, y: 24 }],
  },
  {
    id: 'l3', mixing: false, cups: [{ color: 'red', need: 1, total: 2 }, { color: 'blue', need: 1, total: 2 }],
    drops: [{ color: 'blue', x: 28, y: 24 }, { color: 'red', x: 64, y: 40 }, { color: 'blue', x: 100, y: 22 }, { color: 'red', x: 134, y: 40 }],
  },
  {
    id: 'l4', mixing: false, cups: [{ color: 'blue', need: 2 }],
    drops: [{ color: 'blue', x: 42, y: 30 }, { color: 'blue', x: 118, y: 30 }],
  },
  {
    id: 'l5', mixing: false, cups: [{ color: 'red', need: 3 }],
    drops: [{ color: 'red', x: 30, y: 42 }, { color: 'red', x: 80, y: 20 }, { color: 'red', x: 130, y: 42 }],
  },
  {
    id: 'l6', mixing: false, cups: [{ color: 'red', need: 3 }, { color: 'blue', need: 3 }],
    drops: [
      { color: 'red', x: 22, y: 24 }, { color: 'blue', x: 58, y: 18 }, { color: 'red', x: 100, y: 28 },
      { color: 'blue', x: 32, y: 48 }, { color: 'red', x: 76, y: 44 }, { color: 'blue', x: 138, y: 46 },
    ],
  },
  {
    id: 'l7', mixing: false, cups: [{ color: 'red', need: 2 }, { color: 'yellow', need: 2 }, { color: 'blue', need: 2 }],
    drops: [
      { color: 'yellow', x: 20, y: 22 }, { color: 'blue', x: 52, y: 30 }, { color: 'red', x: 84, y: 20 },
      { color: 'yellow', x: 116, y: 34 }, { color: 'red', x: 30, y: 48 }, { color: 'blue', x: 140, y: 20 },
    ],
  },
  {
    id: 'l8', mixing: false, cups: [{ color: 'blue', need: 3 }, { color: 'yellow', need: 2 }, { color: 'red', need: 3 }],
    drops: [
      { color: 'red', x: 18, y: 20 }, { color: 'blue', x: 44, y: 22 }, { color: 'red', x: 70, y: 18 },
      { color: 'yellow', x: 96, y: 24 }, { color: 'blue', x: 122, y: 18 }, { color: 'red', x: 146, y: 26 },
      { color: 'yellow', x: 40, y: 48 }, { color: 'blue', x: 112, y: 48 },
    ],
  },
  {
    id: 'l9', mixing: true, cups: [{ color: 'orange', need: 2 }],
    drops: [{ color: 'red', x: 42, y: 30 }, { color: 'yellow', x: 118, y: 30 }],
  },
  {
    id: 'l10', mixing: true, cups: [{ color: 'green', need: 2 }, { color: 'purple', need: 2 }],
    drops: [{ color: 'blue', x: 30, y: 22 }, { color: 'yellow', x: 70, y: 44 }, { color: 'red', x: 100, y: 20 }, { color: 'blue', x: 136, y: 42 }],
  },
  {
    id: 'l11', mixing: true, cups: [{ color: 'orange', need: 2 }, { color: 'green', need: 2 }, { color: 'purple', need: 2 }],
    drops: [
      { color: 'red', x: 22, y: 24 }, { color: 'yellow', x: 54, y: 44 }, { color: 'blue', x: 82, y: 20 },
      { color: 'yellow', x: 108, y: 44 }, { color: 'red', x: 138, y: 22 }, { color: 'blue', x: 30, y: 50 },
    ],
  },
  {
    id: 'l12', mixing: true, cups: [{ color: 'orange', need: 2 }, { color: 'blue', need: 2 }],
    drops: [{ color: 'blue', x: 24, y: 40 }, { color: 'red', x: 60, y: 22 }, { color: 'blue', x: 98, y: 42 }, { color: 'yellow', x: 136, y: 24 }],
  },
  // ---- the in-between colours (two parts of one colour, one of another)
  {
    id: 'l13', mixing: true, cups: [{ color: 'turquoise', need: 3 }],
    drops: [{ color: 'blue', x: 32, y: 26 }, { color: 'yellow', x: 80, y: 44 }, { color: 'blue', x: 128, y: 26 }],
  },
  {
    id: 'l14', mixing: true, cups: [{ color: 'lime', need: 3 }, { color: 'blue', need: 1 }],
    drops: [{ color: 'yellow', x: 26, y: 24 }, { color: 'blue', x: 62, y: 44 }, { color: 'yellow', x: 98, y: 22 }, { color: 'blue', x: 134, y: 44 }],
  },
  // ---- splitting: tap a big drop twice and it splits in two
  {
    id: 'l15', mixing: false, teach: 'split', cups: [{ color: 'red', need: 1, x: 45 }, { color: 'red', need: 1, x: 115 }],
    drops: [{ color: 'red', x: 80, y: 32, vol: 2 }],
  },
  {
    id: 'l16', mixing: true, cups: [{ color: 'orange', need: 2 }, { color: 'purple', need: 2 }],
    drops: [{ color: 'yellow', x: 28, y: 40 }, { color: 'red', x: 80, y: 26, vol: 2 }, { color: 'blue', x: 132, y: 40 }],
  },
  {
    id: 'l17', mixing: true, cups: [{ color: 'redOrange', need: 3 }, { color: 'indigo', need: 3 }],
    drops: [
      { color: 'yellow', x: 22, y: 26 }, { color: 'red', x: 52, y: 44 }, { color: 'red', x: 80, y: 20 },
      { color: 'red', x: 108, y: 44 }, { color: 'blue', x: 138, y: 26 }, { color: 'blue', x: 128, y: 50 },
    ],
  },
  {
    id: 'l18', mixing: true, cups: [{ color: 'magenta', need: 3 }, { color: 'turquoise', need: 3 }],
    drops: [
      { color: 'red', x: 26, y: 30, vol: 2 }, { color: 'blue', x: 60, y: 46 }, { color: 'blue', x: 84, y: 20 },
      { color: 'yellow', x: 110, y: 44 }, { color: 'blue', x: 138, y: 24 },
    ],
  },
  {
    id: 'l19', mixing: true, cups: [{ color: 'lime', need: 3 }, { color: 'turquoise', need: 3 }],
    drops: [{ color: 'yellow', x: 28, y: 40 }, { color: 'green', x: 80, y: 30, vol: 4 }, { color: 'blue', x: 132, y: 40 }],
  },
  {
    id: 'l20', mixing: true, cups: [{ color: 'orange', need: 2 }, { color: 'green', need: 2 }, { color: 'purple', need: 2 }],
    drops: [{ color: 'red', x: 32, y: 32, vol: 2 }, { color: 'yellow', x: 80, y: 44, vol: 2 }, { color: 'blue', x: 128, y: 32, vol: 2 }],
  },
  // ---- free mixing: many tiny dots of all three colours make one huge brown drop.
  // Any join is fine (the totals are exactly equal), so nothing can go wrong (owner's request:
  // children loved mixing, and this lets them mix freely).
  {
    id: 'l29', mixing: true, free: true, cups: [{ color: 'brown', need: 6 }],
    drops: ([
      [50, 14, 'red'], [70, 24, 'yellow'], [90, 14, 'blue'], [110, 24, 'red'], [130, 14, 'yellow'], [148, 28, 'blue'],
      [14, 42, 'red'], [34, 50, 'yellow'], [56, 40, 'blue'], [78, 50, 'yellow'], [104, 46, 'red'], [128, 48, 'blue'],
    ] as const).map(([x, y, c]) => ({ color: c, x, y, vol: 0.5 })),
  },
  // ---- glitter glue: pass through it for a sparkly cup, go around it for a plain one
  {
    id: 'l21', mixing: false, teach: 'glitter', glue: [{ x0: 80, y0: 3, x1: 80, y1: 97 }],
    cups: [{ color: 'red', need: 1, x: 122, glitter: true }],
    drops: [{ color: 'red', x: 32, y: 32 }],
  },
  {
    id: 'l22', mixing: false, glue: [{ x0: 80, y0: 3, x1: 80, y1: 50 }],
    cups: [{ color: 'red', need: 1, x: 108, glitter: true }, { color: 'blue', need: 1, x: 140 }],
    drops: [{ color: 'red', x: 46, y: 30 }, { color: 'blue', x: 30, y: 54 }],
  },
  {
    id: 'l23', mixing: true, glue: [{ x0: 80, y0: 3, x1: 80, y1: 52 }],
    cups: [{ color: 'green', need: 2, x: 32 }, { color: 'orange', need: 2, x: 128, glitter: true }],
    drops: [{ color: 'blue', x: 24, y: 46 }, { color: 'yellow', x: 48, y: 26, vol: 2 }, { color: 'red', x: 128, y: 32 }],
  },
  // ---- more sharing: big drops split between mixes
  {
    id: 'l24', mixing: true, cups: [{ color: 'orange', need: 2 }, { color: 'purple', need: 2 }, { color: 'green', need: 2 }],
    drops: [{ color: 'red', x: 30, y: 30, vol: 2 }, { color: 'yellow', x: 70, y: 46 }, { color: 'blue', x: 100, y: 24, vol: 2 }, { color: 'yellow', x: 136, y: 46 }],
  },
  {
    id: 'l25', mixing: true, cups: [{ color: 'turquoise', need: 3 }, { color: 'indigo', need: 3 }],
    drops: [{ color: 'yellow', x: 28, y: 42 }, { color: 'blue', x: 80, y: 30, vol: 4 }, { color: 'red', x: 132, y: 42 }],
  },
  {
    id: 'l26', mixing: true, glue: [{ x0: 3, y0: 40, x1: 104, y1: 40 }],
    cups: [{ color: 'lime', need: 3, x: 40, glitter: true }, { color: 'turquoise', need: 3, x: 122 }],
    drops: [{ color: 'yellow', x: 46, y: 22 }, { color: 'green', x: 76, y: 22, vol: 4 }, { color: 'blue', x: 136, y: 52 }],
  },
  {
    id: 'l27', mixing: true, glue: [{ x0: 55, y0: 3, x1: 55, y1: 54 }, { x0: 105, y0: 3, x1: 105, y1: 54 }],
    cups: [{ color: 'orange', need: 2, x: 27, glitter: true }, { color: 'green', need: 2, x: 80 }, { color: 'purple', need: 2, x: 133, glitter: true }],
    drops: [{ color: 'red', x: 28, y: 30, vol: 2 }, { color: 'yellow', x: 80, y: 30, vol: 2 }, { color: 'blue', x: 132, y: 30, vol: 2 }],
  },
  {
    id: 'l28', mixing: true, glue: [{ x0: 80, y0: 3, x1: 80, y1: 52 }],
    cups: [{ color: 'lime', need: 3, x: 36 }, { color: 'magenta', need: 3, x: 124, glitter: true }],
    drops: [{ color: 'red', x: 30, y: 26, vol: 2 }, { color: 'blue', x: 52, y: 46, vol: 2 }, { color: 'yellow', x: 130, y: 30, vol: 2 }],
  },
  // ---- the paper towel: a drop that touches it soaks in right there, and the colour wicks through.
  // First free colouring on a towel square (the drops wait around it), then pictures of
  // cut-out towel pieces (the drops wait on the left, clear of the plant).
  {
    id: 'l30', mixing: true, free: true, teach: 'towel', cups: [], towel: { x0: 66, y0: 22, x1: 140, y1: 86 },
    drops: [{ color: 'red', x: 40, y: 54 }, { color: 'yellow', x: 103, y: 11 }, { color: 'blue', x: 151, y: 54 }],
  },
  {
    id: 'l31', mixing: true, free: true, cups: [], towel: { x0: 66, y0: 22, x1: 140, y1: 86 },
    drops: [
      { color: 'red', x: 42, y: 38 }, { color: 'yellow', x: 84, y: 11, vol: 2 }, { color: 'blue', x: 151, y: 36 },
      { color: 'yellow', x: 42, y: 72 }, { color: 'blue', x: 122, y: 11, vol: 2 }, { color: 'red', x: 151, y: 72 },
    ],
  },
  {
    // a first target: bring the red drop to the red dot
    id: 'l35', mixing: true, teach: 'towel', cups: [], towel: { ...PIECES, picture: 'dot', scale: 1.4 },
    drops: [{ color: 'red', x: 30, y: 61 }],
  },
  {
    id: 'l32', mixing: true, cups: [], towel: { ...PIECES, picture: 'flower', scale: 1.5 },
    drops: at(['red', 'red', 'yellow', 'red', 'blue', 'yellow', 'red']),
  },
  {
    id: 'l33', mixing: true, cups: [], towel: { ...PIECES, picture: 'sun', scale: 1.1 },
    drops: at(['yellow', 'yellow', 'red', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow']),
  },
  {
    id: 'l34', mixing: true, cups: [], towel: { ...PIECES, picture: 'balloons', scale: 1.5 },
    drops: at(['red', 'yellow', 'blue', 'blue', 'red', 'yellow']),
  },
];

/** A preview of a level that is still to come, for ?level=lab. */
export const LAB: Level = {
  id: 'lab', mixing: true, cups: [],
  drops: (['red', 'yellow', 'blue'] as Base[]).flatMap((c, i) => [0, 1, 2].map((j) => ({ color: c, x: 30 + j * 50 + i * 8, y: 18 + i * 16 }))),
};
