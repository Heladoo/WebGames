// What the game teaches and offers: places, bead shapes, colors/designs, and the English words for them.
// Pure data and tiny helpers, so tests and the debug pages can use it without a browser.

export const SLOTS = 12; // beads on one bracelet

export type ShapeId =
  | 'round' | 'flower' | 'shell' | 'star' | 'heart' | 'leaf' | 'acorn' | 'mushroom'
  | 'butterfly' | 'moon' | 'diamond' | 'bow' | 'car' | 'cloud' | 'snowflake';

export type ColorId = 'blue' | 'pink' | 'yellow' | 'purple' | 'green' | 'white' | 'red' | 'orange' | 'brown' | 'black';
export type PatternId = 'stripes' | 'dots' | 'gold' | 'glitter';
export type DesignId = ColorId | PatternId;

export const SHAPE_WORD: Record<ShapeId, string> = {
  round: 'round', flower: 'flower', shell: 'shell', star: 'star', heart: 'heart', leaf: 'leaf', acorn: 'acorn',
  mushroom: 'mushroom', butterfly: 'butterfly', moon: 'moon', diamond: 'diamond', bow: 'bow', car: 'car',
  cloud: 'cloud', snowflake: 'snowflake',
};

export const COLOR_IDS: ColorId[] = ['blue', 'pink', 'yellow', 'purple', 'green', 'white', 'red', 'orange', 'brown', 'black'];
export const PATTERN_IDS: PatternId[] = ['stripes', 'dots', 'gold', 'glitter'];
export const DESIGN_WORD: Record<DesignId, string> = {
  blue: 'blue', pink: 'pink', yellow: 'yellow', purple: 'purple', green: 'green', white: 'white', red: 'red',
  orange: 'orange', brown: 'brown', black: 'black', stripes: 'stripes', dots: 'dots', gold: 'gold', glitter: 'glitter',
};

export interface Place {
  id: string;
  name: string; // shown and spoken
  shapes: ShapeId[]; // tabs, in order (the first is always the plain round bead)
  colors: ColorId[]; // 8 plain colors offered here
  patterns: PatternId[];
  cheer: string; // said when a bracelet is finished
}

export const PLACES: Place[] = [
  { id: 'beach', name: 'Hawaii Beach', shapes: ['round', 'flower', 'shell', 'star', 'heart'], colors: ['blue', 'pink', 'yellow', 'purple', 'green', 'white', 'orange', 'red'], patterns: ['stripes', 'dots', 'gold', 'glitter'], cheer: 'A beach bracelet! So pretty.' },
  { id: 'woods', name: 'The Woods', shapes: ['round', 'leaf', 'acorn', 'mushroom', 'butterfly'], colors: ['green', 'brown', 'orange', 'yellow', 'red', 'white', 'purple', 'blue'], patterns: ['stripes', 'dots', 'gold', 'glitter'], cheer: 'A woodland bracelet! Lovely.' },
  { id: 'ball', name: 'Night Ball', shapes: ['round', 'star', 'moon', 'diamond', 'bow'], colors: ['purple', 'blue', 'pink', 'white', 'black', 'red', 'yellow', 'green'], patterns: ['stripes', 'dots', 'gold', 'glitter'], cheer: 'A ball bracelet! You shine.' },
  { id: 'city', name: 'Big City', shapes: ['round', 'car', 'cloud', 'diamond', 'heart'], colors: ['red', 'yellow', 'blue', 'black', 'white', 'orange', 'green', 'pink'], patterns: ['stripes', 'dots', 'gold', 'glitter'], cheer: 'A city bracelet! Wonderful.' },
  { id: 'snow', name: 'Snowy Mountain', shapes: ['round', 'snowflake', 'star', 'cloud', 'heart'], colors: ['white', 'blue', 'purple', 'pink', 'red', 'green', 'black', 'yellow'], patterns: ['stripes', 'dots', 'gold', 'glitter'], cheer: 'A snowy bracelet! So cool.' },
  { id: 'garden', name: 'Flower Garden', shapes: ['round', 'flower', 'butterfly', 'leaf', 'heart'], colors: ['pink', 'yellow', 'purple', 'orange', 'green', 'white', 'blue', 'red'], patterns: ['stripes', 'dots', 'gold', 'glitter'], cheer: 'A garden bracelet! Beautiful.' },
];

export const PLACE_IDS = PLACES.map((p) => p.id);
export const placeById = (id: string): Place => PLACES.find((p) => p.id === id) ?? PLACES[0];
export const START_OPEN = ['beach', 'woods'];

/** Everything on offer in a place's colour grid: 8 colours then 4 patterns (12 = two rows of six). */
export const designsOf = (p: Place): DesignId[] => [...p.colors, ...p.patterns];

export interface Bead {
  shape: ShapeId;
  design: DesignId;
}

/** "blue star", "gold bead": the English phrase spoken when a bead is placed. */
export function phrase(b: Bead): string {
  return `${DESIGN_WORD[b.design]} ${b.shape === 'round' ? 'bead' : SHAPE_WORD[b.shape]}`;
}

/** Every distinct word the game can teach (what "words learned" counts). */
export const ALL_WORDS: string[] = [
  ...new Set([
    ...Object.values(SHAPE_WORD),
    ...Object.values(DESIGN_WORD),
    'bead', 'bracelet',
    ...PLACES.flatMap((p) => p.name.toLowerCase().split(' ').filter((w) => w !== 'the')),
  ]),
];

/** The words contained in a bead's phrase, for the learned list. */
export const wordsOf = (b: Bead): string[] => [DESIGN_WORD[b.design], b.shape === 'round' ? 'bead' : SHAPE_WORD[b.shape]];

export const isShape = (s: unknown): s is ShapeId => typeof s === 'string' && s in SHAPE_WORD;
export const isDesign = (s: unknown): s is DesignId => typeof s === 'string' && s in DESIGN_WORD;
