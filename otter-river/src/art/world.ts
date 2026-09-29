import { bake, outline, Sprite } from './sprite';

const SHELL = [
  '.OOOOO.',
  'OSWSKSO',
  'OSKSKSO',
  '.OSKSO.',
  '.OSSSO.',
  '..OOO..',
];

const FISH = [
  '..OOOO.OO',
  '.OUWUUOUO',
  'OEUUUUUO.',
  '.OUUUUOUO',
  '..OOOO.OO',
];

const PEARL = [
  '.OOO.',
  'OWWCO',
  'OWCCO',
  'OCCVO',
  '.OOO.',
];

const LOG = [
  '.OOOOOOOOOOOOOOOOOO.',
  'OBBDBBgGBBBDBBBBOYYO',
  'ODBBBBBBDBBBBBDBOYyO',
  'OBBBDBBBBBBDBBBBOYYO',
  'ODDDDDDDDDDDDDDDOOOO',
  '.OOOOOOOOOOOOOOOOOO.',
];

const LILY_PAD = [
  '...OOOOO...',
  '.OOGGGGGOO.',
  'OGGGGGGGGGO',
  'OGGgGGGGGGO',
  'OGGGgG.OGGO',
  '.OOGGgO.OO.',
  '...OOO.....',
];

const LILY_FLOWER = [
  '.K.K.',
  'KKWKK',
  '.KYK.',
];

const FROG = [
  '.OO.OO.',
  'OWEOEWO',
  'OGGGGGO',
  'OGPGGPO',
  '.OGGGO.',
  'OGO.OGO',
];

const LEAF = [
  '..OO',
  '.OGO',
  'OGgO',
  'OgO.',
  '.O..',
];

const REEDS = [
  '..O....',
  '.ODO.O.',
  '.ODOODO',
  '.ODOODO',
  '.OgGODO',
  '..gG.g.',
  '.Gg.gG.',
  '..ggg..',
  '..gg...',
];

const FLOWER = [
  '.X.',
  'XYX',
  '.X.',
];

const TUFT = [
  'g.g.g',
  '.ggg.',
];

const ROCK = [
  '..OOOO..',
  '.OMMMMO.',
  'OMWMMMmO',
  'OMMMMmmO',
  '.OOOOOO.',
];

const BUSH = [
  '...OOOO....',
  '..OGGGGOOO.',
  '.OGGGKGGGGO',
  'OGGGGGGGgGO',
  'OGKGGGgGGGO',
  'OgGGGGGGKgO',
  '.OggggggggO',
  '..OOOOOOOO.',
];

const TREE = [
  '.....OOOOOO.....',
  '...OOGGGGGGOO...',
  '..OGGGGGGGGGGO..',
  '.OGGCGGGGGGGGGO.',
  '.OGGGGGGGGGKGGO.',
  'OGGGGGGGGGGGGgGO',
  'OGGGKGGGGGGGGgGO',
  'OGGGGGGGGGGGgGGO',
  'OgGGGGGGGgGGgGgO',
  '.OgGGGGgGGGGggO.',
  '.OggggggggggggO.',
  '..OOgggOOgggOO..',
  '....OOOBDOOO....',
  '.......BDO......',
  '.......BDO......',
  '......OBDDO.....',
  '.....OOOOOOO....',
];

const MUSHROOM = [
  '.OOO.',
  'ORWRO',
  'ORRWO',
  '.OLO.',
  '.OLO.',
];

const SPARKLE = [
  ['.W.', 'WWW', '.W.'],
  ['...', '.W.', '...'],
];

const DIGITS: Record<string, string[]> = {
  '0': ['WWW', 'W.W', 'W.W', 'W.W', 'WWW'],
  '1': ['.W.', 'WW.', '.W.', '.W.', 'WWW'],
  '2': ['WWW', '..W', 'WWW', 'W..', 'WWW'],
  '3': ['WWW', '..W', '.WW', '..W', 'WWW'],
  '4': ['W.W', 'W.W', 'WWW', '..W', '..W'],
  '5': ['WWW', 'W..', 'WWW', '..W', 'WWW'],
  '6': ['WWW', 'W..', 'WWW', 'W.W', 'WWW'],
  '7': ['WWW', '..W', '.W.', '.W.', '.W.'],
  '8': ['WWW', 'W.W', 'WWW', 'W.W', 'WWW'],
  '9': ['WWW', 'W.W', 'WWW', '..W', 'WWW'],
  '+': ['...', '.W.', 'WWW', '.W.', '...'],
};

// ---------- UI icons ----------
const ICON_BAG = [
  '...OOO...',
  '..O...O..',
  '.OOOOOOO.',
  'OKKKKKKKO',
  'OKKWKKKKO',
  'OKKKKKKKO',
  'OkKKKKKkO',
  '.OOOOOOO.',
];

const ICON_SOUND = [
  '....O....',
  '...OO..O.',
  'OOOTO.O.O',
  'OTTTO..O.',
  'OTTTO.O.O',
  'OOOTO..O.',
  '...OO....',
  '....O....',
];

const ICON_MUTE = [
  '....O....',
  '...OO....',
  'OOOTO.O.O',
  'OTTTO..O.',
  'OTTTO.O.O',
  'OOOTO....',
  '...OO....',
  '....O....',
];

const ICON_PAUSE = [
  'OOO.OOO',
  'OUO.OUO',
  'OUO.OUO',
  'OUO.OUO',
  'OUO.OUO',
  'OOO.OOO',
];

export interface WorldArt {
  shell: Sprite;
  goldShell: Sprite;
  fish: Sprite;
  pearl: Sprite;
  log: Sprite;
  lilyPad: Sprite;
  lilyFlower: Sprite;
  frog: Sprite;
  leaf: Sprite;
  reeds: Sprite;
  flowers: Sprite[];
  tuft: Sprite;
  rock: Sprite;
  bush: Sprite;
  tree: Sprite;
  mushroom: Sprite;
  sparkle: Sprite[];
  digits: Record<string, Sprite>;
  icons: { bag: Sprite; sound: Sprite; mute: Sprite; pause: Sprite };
}

let cache: WorldArt | null = null;
export function worldArt(): WorldArt {
  if (cache) return cache;
  const digits: Record<string, Sprite> = {};
  for (const [k, g] of Object.entries(DIGITS)) digits[k] = bake(`digit.${k}`, outline(g), [0, 0]);
  cache = {
    shell: bake('shell', SHELL, [3, 3]),
    goldShell: bake('goldShell', SHELL, [3, 3], { S: 'Y', K: 'y' }),
    fish: bake('fish', FISH, [4, 2]),
    pearl: bake('pearl', PEARL, [2, 2]),
    log: bake('log', LOG, [10, 3]),
    lilyPad: bake('lilyPad', LILY_PAD, [5, 3]),
    lilyFlower: bake('lilyFlower', LILY_FLOWER, [2, 1]),
    frog: bake('frog', FROG, [3, 3]),
    leaf: bake('leaf', LEAF, [2, 2]),
    reeds: bake('reeds', REEDS, [3, 8]),
    flowers: [
      bake('flower.pink', FLOWER, [1, 1], { X: 'K' }),
      bake('flower.white', FLOWER, [1, 1], { X: 'W' }),
      bake('flower.violet', FLOWER, [1, 1], { X: 'V' }),
      bake('flower.yellow', FLOWER, [1, 1], { X: 'Y', Y: 'F' }),
    ],
    tuft: bake('tuft', TUFT, [2, 1]),
    rock: bake('rock', ROCK, [4, 3]),
    bush: bake('bush', BUSH, [5, 6]),
    tree: bake('tree', TREE, [8, 15]),
    mushroom: bake('mushroom', MUSHROOM, [2, 4]),
    sparkle: SPARKLE.map((g, i) => bake(`sparkle.${i}`, g, [1, 1])),
    digits,
    icons: {
      bag: bake('icon.bag', ICON_BAG),
      sound: bake('icon.sound', ICON_SOUND),
      mute: bake('icon.mute', ICON_MUTE),
      pause: bake('icon.pause', ICON_PAUSE),
    },
  };
  return cache;
}
