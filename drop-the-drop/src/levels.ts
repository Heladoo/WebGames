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
}
export interface DropDef { color: Base; x: number; y: number; vol?: number }
export interface Level {
  id: string;
  cups: CupDef[];
  drops: DropDef[];
  /** may drops of different colours join? (true in mixing levels) */
  mixing: boolean;
}

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
];

/** A preview of a level that is still to come, for ?level=lab. */
export const LAB: Level = {
  id: 'lab', mixing: true, cups: [],
  drops: (['red', 'yellow', 'blue'] as Base[]).flatMap((c, i) => [0, 1, 2].map((j) => ({ color: c, x: 30 + j * 50 + i * 8, y: 18 + i * 16 }))),
};
