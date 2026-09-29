import { bake, Sprite } from './sprite';

// The otter is a pixel "puppet": separate parts drawn at whole-pixel offsets
// so it can breathe, bob, blink, paddle and sway its tail.
// Coordinates below are relative to the otter origin (belly centre).

const HEAD = [
  '......OOOOOOOOOO......',
  '....OOBBBBBBBBBBOO....',
  '.OOOBBBBBBBBBBBBBBOOO.',
  '.OPOBBBBBBBBBBBBBBOPO.',
  '.OOBBBBBBBBBBBBBBBBOO.',
  '.OBBBBBBBBBBBBBBBBBBO.',
  '.OBBBWEBBBBBBBBWEBBBO.',
  '.OBBBEEBLLLLLLBEEBBBO.',
  '.OBBPPBLLLNNLLLBPPBBO.',
  '.OBBBCCLLOLLOLLCCBBBO.',
  '..OBBBBBLLOOLLBBBBBO..',
  '...OBBBBBLLLLBBBBBO...',
  '....OOOBBBBBBBBOOO....',
];

const EYES_CLOSED = [
  'BB........BB',
  'OO........OO',
];

const EYES_HAPPY = [
  'OO........OO',
  'BB........BB',
];

const BODY = [
  '...OBBBBBBBBBBBBBBO...',
  '..OBBLLLLLLLLLLLLBBO..',
  '.OBBLLLLLLLLLLLLLLBBO.',
  '.OBCCLLLLLLLLLLLLLLBO.',
  '.OBCLLLLLLLLLLLLLLLBO.',
  '.OBLLLLLLLLLLLLLLLLBO.',
  '.OBLLLLLLLLLLLLLLLLBO.',
  '.OBLLLLLLLLLLLLLLLLBO.',
  '.OBLLLLLLLLLLLLLLLLBO.',
  '.OBBLLLLLLLLLLLLLLBBO.',
  '..OBLLLLLLLLLLLLLLBO..',
  '..OBBLLLLLLLLLLLLBBO..',
  '...OBBBLLLLLLLLBBBO...',
  '..OOOBBBBBBBBBBBBOOO..',
  '.OBBDOBBBBBBBBBBODBBO.',
  '.OBDBOOBBBBBBBBOOBDBO.',
  '..OOO..OOBBBBOO..OOO..',
];

const PAW = [
  '.OOOO.',
  'OBBBBO',
  'OBDBDO',
  '.OOOO.',
];

const TAIL_TOP = [
  '.OBBBBO.',
  '.OBBBBO.',
  '.OBDBBO.',
];

const TAIL_TIP = [
  '..OBBO..',
  '..OBDO..',
  '..OBBO..',
  '...OO...',
];

export const OTTER_BODY_GRID = BODY;

// Part placement (top-left) relative to the origin.
export const PART = {
  head: { x: -11, y: -24 },
  body: { x: -11, y: -13 },
  pawL: { x: -9, y: -9 },
  pawR: { x: 3, y: -9 },
  tailTop: { x: -4, y: 4 },
  tailTip: { x: -4, y: 7 },
  eyes: { x: -6, y: -18 }, // over head cols 5..16, rows 6..7
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
      head: bake('otter.head', HEAD),
      body: bake('otter.body', BODY),
      paw: bake('otter.paw', PAW),
      tailTop: bake('otter.tailTop', TAIL_TOP),
      tailTip: bake('otter.tailTip', TAIL_TIP),
      eyesClosed: bake('otter.eyesClosed', EYES_CLOSED),
      eyesHappy: bake('otter.eyesHappy', EYES_HAPPY),
    };
  }
  return cache;
}
