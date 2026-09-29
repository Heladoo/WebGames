import { bake, blank, line, stamp, toRows, Grid, Sprite } from './sprite';
import { OTTER_BODY_GRID } from './otter';

export type Slot = 'hat' | 'eyes' | 'ears' | 'neck' | 'suit' | 'held' | 'pet';
export type AnchorName = 'headTop' | 'eyes' | 'ears' | 'neck' | 'body' | 'pawR' | 'belly';
export type PetMode = 'follow' | 'ride' | 'fly';

export interface ItemDef {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  anchor: AnchorName;
  z: number;
  frames: Sprite[];
  frameTime: number; // seconds per frame
  pet?: PetMode;
}

export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'hat', label: 'Hats' },
  { id: 'eyes', label: 'Shades' },
  { id: 'ears', label: 'Ears' },
  { id: 'neck', label: 'Neck' },
  { id: 'suit', label: 'Swimwear' },
  { id: 'held', label: 'Hold' },
  { id: 'pet', label: 'Friends' },
];

// Z order of the puppet (items slot in between these).
export const Z = {
  tail: 0,
  body: 10,
  suit: 20,
  heldBack: 25,
  head: 30,
  neck: 33,
  held: 35,
  paws: 40,
  ride: 45,
  eyes: 50,
  ears: 55,
  hat: 60,
};

// ---------- Headwear ----------
const SUN_HAT = [
  '.......OOOOOOOO.......',
  '......OYYYYYYYYO......',
  '......ORRRRRRRRO......',
  '..OOOOOYYYYYYYYOOOOO..',
  '.OYYYYYYYYYYYYYYYYYYO.',
  '..OOyyyyyyyyyyyyyyOO..',
  '....OOOOOOOOOOOOOO....',
];

const FLOWER_CROWN = [
  '...K...Y...V...Y...K..',
  '..KYK.YFY.VYV.YFY.KYK.',
  '..gKggGYGggVggGYGgKg..',
];

const BUCKET_HAT = [
  '......OOOOOOOOOO......',
  '.....OUUUUUUUUUUO.....',
  '.....OUUUUUKUUUUO.....',
  '...OOuuuuuuuuuuuuOO...',
  '..OUUUUUUUUUUUUUUUUO..',
  '...OOOOOOOOOOOOOOOO...',
];

const CROWN = [
  '.O...O...O.',
  'OYO.OYO.OYO',
  'OYYOYYYOYYO',
  'OYYYYYYYYYO',
  'OYRYYKYYUYO',
  'OyyyyyyyyyO',
  '.OOOOOOOOO.',
];

// ---------- Eyewear ----------
const SUNGLASSES = [
  'OOOOOOOOOOOOOOOO',
  'OIHHO......OIHHO',
  'OHHHO......OHHHO',
  '.OOO........OOO.',
];

const HEART_SHADES = [
  'KK.KK......KK.KK',
  'KWKKKkkkkkkKWKKK',
  'KKKKK......KKKKK',
  '.KKK........KKK.',
  '..K..........K..',
];

const ROUND_SPECS = [
  '.OOO........OOO.',
  'OW..O......OW..O',
  'O...OOOOOOOO...O',
  '.OOO........OOO.',
];

// ---------- Ears ----------
const EARPHONES = [
  '......kkkkkkkkkk......',
  '....kk..........kk....',
  '...k..............k...',
  '..k................k..',
  'OKKO..............OKKO',
  'OKWO..............OWKO',
  'OKKO..............OKKO',
  '.OO................OO.',
];

const EAR_FLOWER = [
  '.K.',
  'KYK',
  '.Kg',
  '..g',
];

// ---------- Neck ----------
const BOWTIE = [
  'OO...OO',
  'ORrOrRO',
  'ORRrRRO',
  'ORrOrRO',
  'OO...OO',
];

const LEI = [
  'KY............YK',
  '.VK..........KV.',
  '..YVKYKVYKVKYV..',
];

const SCARF = [
  'OOOOOOOOOOOOOOOO',
  'OTWTWTWTWTWTWTWO',
  '.OOOOOOOOOOOTWO.',
  '...........OWTO.',
  '...........OTWO.',
  '...........OOOO.',
];

// ---------- Held ----------
const ICE_CREAM = [
  '.OOO.',
  'OKWKO',
  'OKKKO',
  'OYyYO',
  '.OyO.',
  '.OYO.',
  '..O..',
];

const LILY = [
  '.K.K.',
  'KKYKK',
  '.KKK.',
  '..g..',
  '..g..',
  '..g..',
];

const CANOPY = [
  '.......OOOOOOO.......',
  '.....OORRWWWRROO.....',
  '...OORRRRWWWRRRROO...',
  '..ORRRRRRWWWRRRRRRO..',
  '.ORRRRRRWWWWWRRRRRRO.',
  '.ORRRRRWWWWWWWRRRRRO.',
  'OOrrOOrrOOrOOrrOOrrOO',
];

function umbrella(swap: boolean): Grid {
  const g = blank(23, 32);
  const canopy = swap
    ? CANOPY.map((r) => r.replace(/[RW]/g, (c) => (c === 'R' ? 'W' : 'R')))
    : CANOPY;
  line(g, 1, 30, 12, 7, 'y');
  stamp(g, canopy, 2, 0);
  g[30][0] = 'y';
  g[31][0] = 'y';
  g[31][1] = 'y';
  return toRows(g);
}

// ---------- Swimwear: generated from the otter body so it always fits ----------
type Pattern = (x: number, y: number) => string;

function suit(rowsFrom: number, rowsTo: number, pattern: Pattern, band: string): Grid {
  return OTTER_BODY_GRID.map((row, y) =>
    row
      .split('')
      .map((ch, x) => {
        if (y < rowsFrom || y > rowsTo) return '.';
        if (ch !== 'L' && ch !== 'B' && ch !== 'C') return '.';
        if (y === rowsFrom) return band;
        return pattern(x, y);
      })
      .join(''),
  );
}

const STRIPES = suit(9, 13, (_x, y) => (y % 2 ? 'W' : 'U'), 'u');
const POLKA = suit(9, 13, (x, y) => ((x + (y % 2) * 2) % 4 === 0 && y % 2 === 0 ? 'W' : 'K'), 'k');
const FLORAL = suit(9, 13, (x, y) => {
  if ((x + y * 3) % 6 === 0) return 'Y';
  if ((x + y * 3) % 6 === 3) return 'K';
  return 'T';
}, 't');
const RAINBOW = suit(3, 13, (_x, y) => ['R', 'F', 'Y', 'G', 'T', 'U', 'V'][Math.floor((y - 3) / 1.6) % 7], 'r');

// ---------- Pets ----------
const DUCKLING = [
  '...OOO..',
  '..OYYYO.',
  '..OYEYFF',
  'O.OYYYO.',
  'OYOYYYYO',
  'OYYYYyYO',
  '.OOOOOO.',
];

const BABY_OTTER = [
  '..OOOOOO..',
  '.OBBBBBBO.',
  'OBEBBBBEBO',
  'OBPBNNBPBO',
  '.OBLLLLBO.',
  'OBOLLLLOBO',
  '.OLLLLLLO.',
  'OBLLLLLLBO',
  '.OBLLLLBO.',
  '..OBOOBO..',
  '...OBBO...',
  '....OO....',
];

const CRAB_A = [
  '.O.O...O.O.',
  '.ORO...ORO.',
  '..OROOORO..',
  '.ORWERWERO.',
  'ORRRRRRRRRO',
  '.OrRRRRRrO.',
  'O.O.O.O.O.O',
];

const CRAB_B = [
  '...........',
  '.OOO...OOO.',
  '.OROOOOORO.',
  '.ORWERWERO.',
  'ORRRRRRRRRO',
  '.OrRRRRRrO.',
  '.O.O.O.O.O.',
];

const BUTTERFLY_A = [
  'KK...KK',
  'KWKOKWK',
  '.KKOKK.',
  'KK.O.KK',
];

const BUTTERFLY_B = [
  '.......',
  '.KKOKK.',
  '..KOK..',
  '..KOK..',
];

function item(
  id: string,
  name: string,
  slot: Slot,
  price: number,
  anchor: AnchorName,
  z: number,
  grids: Grid[],
  pivot: [number, number],
  frameTime = 0.6,
  pet?: PetMode,
): ItemDef {
  return {
    id, name, slot, price, anchor, z,
    frames: grids.map((g, i) => bake(`${id}.${i}`, g, pivot)),
    frameTime,
    pet,
  };
}

let catalog: ItemDef[] | null = null;

export function items(): ItemDef[] {
  if (catalog) return catalog;
  catalog = [
    item('flower-crown', 'Flower Crown', 'hat', 40, 'headTop', Z.hat, [FLOWER_CROWN], [11, 2]),
    item('sun-hat', 'Straw Sun Hat', 'hat', 90, 'headTop', Z.hat, [SUN_HAT], [11, 6]),
    item('bucket-hat', 'Bucket Hat', 'hat', 120, 'headTop', Z.hat, [BUCKET_HAT], [11, 5]),
    item('crown', 'Little Crown', 'hat', 400, 'headTop', Z.hat, [CROWN], [5, 6]),

    item('sunglasses', 'Cool Shades', 'eyes', 30, 'eyes', Z.eyes, [SUNGLASSES], [8, 1]),
    item('round-specs', 'Round Specs', 'eyes', 60, 'eyes', Z.eyes, [ROUND_SPECS], [8, 1]),
    item('heart-shades', 'Heart Shades', 'eyes', 110, 'eyes', Z.eyes, [HEART_SHADES], [8, 1]),

    item('ear-flower', 'Ear Flower', 'ears', 25, 'ears', Z.ears, [EAR_FLOWER], [10, 0]),
    item('earphones', 'Earphones', 'ears', 150, 'ears', Z.ears, [EARPHONES], [11, 2]),

    item('bowtie', 'Bow Tie', 'neck', 35, 'neck', Z.neck, [BOWTIE], [3, 2]),
    item('lei', 'Flower Lei', 'neck', 80, 'neck', Z.neck, [LEI], [8, 1]),
    item('scarf', 'Cozy Scarf', 'neck', 100, 'neck', Z.neck, [SCARF], [8, 1]),

    item('suit-stripes', 'Sailor Stripes', 'suit', 50, 'body', Z.suit, [STRIPES], [0, 0]),
    item('suit-polka', 'Pink Polka', 'suit', 70, 'body', Z.suit, [POLKA], [0, 0]),
    item('suit-floral', 'Tropical Trunks', 'suit', 100, 'body', Z.suit, [FLORAL], [0, 0]),
    item('suit-rainbow', 'Rainbow Suit', 'suit', 220, 'body', Z.suit, [RAINBOW], [0, 0]),

    item('lily', 'Water Lily', 'held', 20, 'pawR', Z.held, [LILY], [2, 5]),
    item('ice-cream', 'Ice Cream', 'held', 45, 'pawR', Z.held, [ICE_CREAM], [2, 5]),
    item('umbrella', 'Parasol', 'held', 180, 'pawR', Z.heldBack, [umbrella(false), umbrella(true)], [1, 30], 1.4),

    item('duckling', 'Duckling', 'pet', 150, 'belly', 0, [DUCKLING], [4, 4], 0.6, 'follow'),
    item('butterfly', 'Butterfly', 'pet', 200, 'headTop', 0, [BUTTERFLY_A, BUTTERFLY_B], [3, 2], 0.18, 'fly'),
    item('crab', 'Crab Buddy', 'pet', 260, 'belly', Z.ride, [CRAB_A, CRAB_B], [5, 4], 0.7, 'ride'),
    item('baby-otter', 'Baby Otter', 'pet', 350, 'belly', 0, [BABY_OTTER], [5, 6], 0.6, 'follow'),
  ];
  return catalog;
}

export function itemById(id: string | undefined): ItemDef | undefined {
  return id ? items().find((i) => i.id === id) : undefined;
}
