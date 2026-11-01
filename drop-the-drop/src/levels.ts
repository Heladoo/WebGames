// Levels are data. Positions are fractions (u across, v down) of the free part
// of the paper above the cups; the layout spreads them out on any screen.
//
// The planned path (only the first sample level exists so far, see BACKLOG.md):
//   1. one colour, just drag drops into the cup
//   2. join drops of one colour to make a drop big enough for the cup
//   3. two colours: join each colour, and keep the colours apart
//   4. mixing: red + yellow for an orange cup, and so on

import { PIG } from './color';

export type Base = 'red' | 'yellow' | 'blue';
export type CupColor = keyof typeof PIG;

export interface CupDef { color: CupColor; /** the volume of the drop it wants */ need: number }
export interface DropDef { color: Base; u: number; v: number; vol?: number }
export interface Level {
  id: string;
  cups: CupDef[];
  drops: DropDef[];
  /** may drops of different colours touch? (true in mixing levels) */
  mixing: boolean;
}

export const LEVELS: Record<string, Level> = {
  // The sample: two colours. Each cup wants one big drop (three small ones
  // joined), and the red and blue drops sit between each other.
  sample: {
    id: 'sample',
    mixing: false,
    cups: [{ color: 'red', need: 3 }, { color: 'blue', need: 3 }],
    drops: [
      { color: 'red', u: 0.1, v: 0.22 },
      { color: 'blue', u: 0.38, v: 0.1 },
      { color: 'red', u: 0.68, v: 0.3 },
      { color: 'blue', u: 0.18, v: 0.82 },
      { color: 'red', u: 0.48, v: 0.68 },
      { color: 'blue', u: 0.9, v: 0.78 },
    ],
  },
  // ?level=mix: a preview of the last kind of level (debug only for now)
  mix: {
    id: 'mix',
    mixing: true,
    cups: [{ color: 'orange', need: 2 }, { color: 'green', need: 2 }, { color: 'purple', need: 2 }],
    drops: [
      { color: 'red', u: 0.1, v: 0.2 }, { color: 'yellow', u: 0.35, v: 0.15 }, { color: 'blue', u: 0.62, v: 0.2 },
      { color: 'yellow', u: 0.9, v: 0.3 }, { color: 'red', u: 0.2, v: 0.8 }, { color: 'blue', u: 0.5, v: 0.75 },
    ],
  },
};
