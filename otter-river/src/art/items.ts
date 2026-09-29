import { bake, Grid, line, Sprite } from './sprite';
import { done, ellipse, grid, put, rect, shape, stampRows, Pix, recolor } from './shapes';
import { babyOtter, OTTER_BODY_GRID } from './otter';

export type Slot = 'hat' | 'eyes' | 'ears' | 'neck' | 'suit' | 'held' | 'float' | 'pet';
export type AnchorName = 'headTop' | 'eyes' | 'ears' | 'neck' | 'body' | 'pawR' | 'belly' | 'lap' | 'perch' | 'float';
export type PetMode = 'follow' | 'ride' | 'fly';

export interface ItemDef {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  unlockAt: number; // total shells ever collected before it appears
  anchor: AnchorName;
  z: number;
  frames: Sprite[];
  frameTime: number;
  pet?: PetMode;
  special?: 'balloon' | 'bubbles' | 'lantern';
}

export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'hat', label: 'Hats' },
  { id: 'eyes', label: 'Glasses' },
  { id: 'ears', label: 'Ears' },
  { id: 'neck', label: 'Neck' },
  { id: 'suit', label: 'Swimwear' },
  { id: 'held', label: 'Hold' },
  { id: 'float', label: 'Floats' },
  { id: 'pet', label: 'Friends' },
];

export const Z = {
  float: -5,
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
  perch: 65,
};

// ---------- small reusable motifs ----------
const FLOWER5 = ['..X..', '.XXX.', 'XXcXX', '.XXX.', '..X..'];
function flower(g: Pix, x: number, y: number, petal: string, centre = 'Y') {
  stampRows(g, recolor(FLOWER5, { X: petal, c: centre }), x, y);
}
const FLOWER_COLORS = ['K', 'Y', 'V', 'W', 'F', 'e'];

// ---------- Headwear ----------
function flowerCrown(): Grid {
  const g = grid(34, 9);
  for (let x = 1; x < 33; x++) {
    const y = 4 + Math.round(((x - 16.5) / 16) ** 2 * 3);
    put(g, x, y, 'g');
    put(g, x, y + 1, x % 3 === 0 ? 'G' : 'g');
  }
  [2, 8, 14, 20, 26].forEach((x, i) => {
    const y = 1 + Math.round(((x + 2 - 16.5) / 16) ** 2 * 3);
    flower(g, x, y, FLOWER_COLORS[i], i % 2 ? 'F' : 'Y');
  });
  put(g, 11, 4, 'G'); put(g, 23, 4, 'G');
  return done(g);
}

function strawHat(): Grid {
  const g = grid(42, 17);
  ellipse(g, 0, 8, 42, 9, { fill: 'Y', shade: 'y', light: 'j' });
  ellipse(g, 11, 0, 20, 14, { fill: 'Y', shade: 'y', light: 'j', power: 2.2 });
  for (let y = 1; y < 16; y++) for (let x = 1; x < 41; x++) {
    if (g[y][x] === 'Y' && (x + y * 2) % 5 === 0) g[y][x] = 'j';
  }
  for (let x = 12; x < 30; x++) { if (g[9][x] !== 'O') g[9][x] = 'R'; if (g[10][x] !== 'O') g[10][x] = 'r'; }
  // little bow
  stampRows(g, ['OO.OO', 'ORORO', 'OO.OO'], 25, 8);
  return done(g);
}

function bucketHat(): Grid {
  const g = grid(36, 15);
  ellipse(g, 0, 8, 36, 7, { fill: 'U', shade: 'u', light: 'q' });
  shape(g, 7, 0, 22, 12, (x, y) => {
    const half = 7 + y * 0.35;
    return Math.abs(x + 0.5 - 11) <= half && y >= 0 && y < 12;
  }, { fill: 'U', shade: 'u', light: 'q' });
  for (let x = 8; x < 28; x++) if (g[9][x] === 'U' || g[9][x] === 'u' || g[9][x] === 'q') g[9][x] = 'u';
  flower(g, 22, 3, 'K');
  return done(g);
}

function crown(): Grid {
  const g = grid(21, 13);
  shape(g, 0, 0, 21, 13, (x, y) => {
    if (y >= 6) return x >= 1 && x <= 19;
    return [3, 10, 17].some((c) => Math.abs(x - c) <= (y + 1) * 0.55);
  }, { fill: 'Y', shade: 'y', light: 'j', shadeAt: 0.6 });
  for (const c of [3, 10, 17]) put(g, c, 0, 'W');
  put(g, 5, 9, 'R'); put(g, 10, 9, 'K'); put(g, 11, 9, 'K'); put(g, 10, 8, 'K'); put(g, 15, 9, 'U');
  for (let x = 2; x < 19; x++) put(g, x, 11, 'y');
  return done(g);
}

function beanie(): Grid {
  const g = grid(34, 20);
  ellipse(g, 12, 0, 10, 8, { fill: 'W', shade: 'M', light: 'W' });
  shape(g, 1, 4, 32, 16, (x, y) => ((x + 0.5 - 16) / 16) ** 2 + ((y + 0.5 - 16) / 15.5) ** 2 <= 1, { fill: 'R', shade: 'r' });
  for (let y = 5; y < 16; y++) for (let x = 2; x < 32; x++) {
    if (g[y][x] === 'R' && Math.floor((y - 5) / 2) % 2 === 1) g[y][x] = 'W';
    if (g[y][x] === 'r' && Math.floor((y - 5) / 2) % 2 === 1) g[y][x] = 'M';
  }
  rect(g, 1, 15, 32, 5, 'r');
  for (let x = 1; x < 33; x++) { put(g, x, 15, 'O'); put(g, x, 19, 'O'); if (x % 2 === 0) for (let y = 16; y < 19; y++) put(g, x, y, 'R'); }
  put(g, 0, 16, 'O'); put(g, 0, 17, 'O'); put(g, 0, 18, 'O'); put(g, 33, 16, 'O'); put(g, 33, 17, 'O'); put(g, 33, 18, 'O');
  return done(g);
}

function bunnyEars(): Grid {
  const g = grid(30, 20);
  ellipse(g, 4, 0, 7, 17, { fill: 'W', shade: 'M' });
  ellipse(g, 19, 0, 7, 17, { fill: 'W', shade: 'M' });
  ellipse(g, 6, 3, 3, 11, { fill: 'e', outline: null });
  ellipse(g, 21, 3, 3, 11, { fill: 'e', outline: null });
  for (let x = 2; x < 28; x++) {
    const y = 15 + Math.round(((x - 14.5) / 14) ** 2 * 3);
    put(g, x, y, 'K'); put(g, x, y + 1, 'k');
  }
  return done(g);
}

function pirateHat(): Grid {
  const g = grid(40, 16);
  shape(g, 0, 0, 40, 16, (x, y) => {
    const nx = Math.abs((x + 0.5 - 20) / 20);
    const top = 1 + 9 * nx - 6 * nx * nx;
    return y >= top && y <= 15 - 3 * nx;
  }, { fill: 'H', shade: 'E', light: 'I' });
  for (let x = 0; x < 40; x++) for (let y = 15; y >= 0; y--) {
    if (g[y][x] === 'O') { if (y > 0 && g[y - 1][x] !== '.' && g[y - 1][x] !== 'O') g[y - 1][x] = 'Y'; break; }
  }
  // emblem: a little white shell
  stampRows(g, ['.WWW.', 'WsWsW', 'WsWsW', '.WWW.'], 18, 5);
  return done(g);
}

// ---------- Eyewear ----------
function sunglasses(): Grid {
  const g = grid(30, 8);
  for (const x0 of [1, 19]) ellipse(g, x0, 0, 10, 8, { fill: 'Q', power: 3 });
  for (const x0 of [3, 21]) { put(g, x0, 2, 'W'); put(g, x0 + 1, 2, 'W'); put(g, x0, 3, 'W'); }
  for (let x = 10; x < 20; x++) put(g, x, 2, 'O');
  put(g, 0, 2, 'O'); put(g, 29, 2, 'O');
  return done(g);
}

function roundSpecs(): Grid {
  const g = grid(30, 9);
  for (const x0 of [1, 19]) {
    ellipse(g, x0, 0, 10, 9, { fill: '.', outline: 'O' });
    put(g, x0 + 2, 2, 'W'); put(g, x0 + 3, 2, 'W');
  }
  for (let x = 11; x < 19; x++) put(g, x, 3, 'O');
  put(g, 0, 3, 'O'); put(g, 29, 3, 'O');
  return done(g);
}

function heartShape(g: Pix, x0: number, y0: number, w: number, h: number, fill: string, outline: string) {
  shape(g, x0, y0, w, h, (x, y) => {
    const nx = (x + 0.5 - w / 2) / (w / 2) * 1.25;
    const ny = -((y + 0.5) / h * 2.4 - 1.3);
    return (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny ** 3 <= 0;
  }, { fill, outline });
}

function heartShades(): Grid {
  const g = grid(32, 10);
  heartShape(g, 0, 0, 12, 10, 'J', 'k');
  heartShape(g, 20, 0, 12, 10, 'J', 'k');
  put(g, 3, 2, 'W'); put(g, 23, 2, 'W');
  for (let x = 11; x < 21; x++) put(g, x, 3, 'k');
  return done(g);
}

function starShape(g: Pix, x0: number, y0: number, s: number, fill: string, outline: string) {
  shape(g, x0, y0, s, s, (x, y) => {
    const dx = x + 0.5 - s / 2;
    const dy = y + 0.5 - s / 2 - 0.4;
    const a = Math.atan2(dy, dx) + Math.PI / 2;
    const r = Math.hypot(dx, dy) / (s / 2);
    const k = Math.cos((a * 5) % (Math.PI * 2) / 1) ;
    return r <= 0.55 + 0.45 * ((k + 1) / 2) ** 2;
  }, { fill, outline });
}

function starGlasses(): Grid {
  const g = grid(32, 12);
  starShape(g, 0, 0, 12, 'X', 'y');
  starShape(g, 20, 0, 12, 'X', 'y');
  put(g, 5, 4, 'W'); put(g, 25, 4, 'W');
  for (let x = 11; x < 21; x++) put(g, x, 5, 'O');
  return done(g);
}

function snorkel(): Grid {
  const g = grid(36, 26);
  // tube up the right side
  rect(g, 31, 0, 3, 20, 'Y');
  for (let y = 0; y < 20; y++) { put(g, 30, y, 'O'); put(g, 34, y, 'O'); if (y % 4 === 0) put(g, 32, y, 'y'); }
  rect(g, 30, 0, 5, 2, 'F'); put(g, 30, 0, 'O'); put(g, 34, 0, 'O');
  // mask
  ellipse(g, 3, 16, 28, 10, { fill: 'Z', outline: 'u', power: 3.2 });
  put(g, 7, 18, 'W'); put(g, 8, 18, 'W'); put(g, 7, 19, 'W');
  rect(g, 0, 20, 3, 2, 'T'); rect(g, 31, 20, 5, 2, 'T');
  return done(g);
}

// ---------- Ears ----------
function earphones(): Grid {
  const g = grid(36, 16);
  for (let x = 3; x < 33; x++) {
    const y = Math.round(((x - 17.5) / 16) ** 2 * 6);
    put(g, x, y, 'O'); put(g, x, y + 1, 'K'); put(g, x, y + 2, 'O');
  }
  ellipse(g, 0, 5, 8, 11, { fill: 'K', shade: 'k', light: 'e' });
  ellipse(g, 28, 5, 8, 11, { fill: 'K', shade: 'k', light: 'e' });
  put(g, 3, 9, 'W'); put(g, 31, 9, 'W');
  return done(g);
}

function earFlower(): Grid {
  const g = grid(9, 9);
  ellipse(g, 0, 0, 9, 8, { fill: 'K', shade: 'k' });
  for (const [x, y] of [[4, 0], [0, 4], [8, 4]]) put(g, x, y, '.');
  ellipse(g, 3, 3, 3, 3, { fill: 'Y', outline: null });
  put(g, 6, 8, 'g'); put(g, 7, 8, 'G');
  return done(g);
}

// ---------- Neck ----------
function bowtie(): Grid {
  const g = grid(15, 9);
  shape(g, 0, 0, 7, 9, (x, y) => Math.abs(y - 4) <= 1 + x * 0.55, { fill: 'R', shade: 'r' });
  shape(g, 8, 0, 7, 9, (x, y) => Math.abs(y - 4) <= 1 + (6 - x) * 0.55, { fill: 'R', shade: 'r' });
  ellipse(g, 5, 2, 5, 5, { fill: 'R', shade: 'r' });
  put(g, 2, 3, 'W'); put(g, 11, 3, 'W');
  return done(g);
}

function lei(): Grid {
  const g = grid(34, 12);
  let i = 0;
  for (let x = 1; x < 31; x += 4) {
    const y = Math.round(6 * (1 - ((x + 2 - 17) / 17) ** 2));
    flower(g, x, y, FLOWER_COLORS[i++ % FLOWER_COLORS.length], 'Y');
  }
  return done(g);
}

function scarf(): Grid {
  const g = grid(34, 18);
  shape(g, 0, 0, 34, 7, (x, y) => y >= 0 && y < 7 && Math.abs(x + 0.5 - 17) < 17 - Math.abs(y - 3) * 0.5, { fill: 'T', shade: 't' });
  shape(g, 22, 4, 8, 14, (x, y) => x >= 0 && x < 8 && y >= 0 && y < 14, { fill: 'T', shade: 't' });
  for (let y = 0; y < 18; y++) for (let x = 0; x < 34; x++) {
    if ((g[y][x] === 'T' || g[y][x] === 't') && (x + y) % 6 < 2) g[y][x] = 'W';
  }
  for (let x = 23; x < 29; x += 2) put(g, x, 17, 'T');
  return done(g);
}

function shellNecklace(): Grid {
  const g = grid(30, 12);
  for (let x = 1; x < 29; x++) put(g, x, Math.round(5 * (1 - ((x - 14.5) / 14) ** 2)), 'w');
  const shell = ['.OOO.', 'OSsSO', 'OsSsO', '.OSO.', '..O..'];
  stampRows(g, shell, 6, 4);
  stampRows(g, recolor(shell, { S: 'e', s: 'W' }), 12, 6);
  stampRows(g, shell, 18, 4);
  return done(g);
}

// ---------- Swimwear: generated from the otter body so it always fits ----------
type Pat = (x: number, y: number) => [string, string]; // [base, shade]

function suit(from: number, to: number, pat: Pat, band: string, straps = false): Grid {
  return OTTER_BODY_GRID.map((row, y) =>
    row.split('').map((ch, x) => {
      if (y < from || y > to) return '.';
      if (!'BbhLlC'.includes(ch)) return '.';
      if (y >= 26 && (x < 7 || x > 26)) return '.';
      if (straps && y < from + 5 && !(x >= 8 && x <= 10) && !(x >= 23 && x <= 25)) return '.';
      if (y === (straps ? from + 5 : from)) return band;
      const [base, shade] = pat(x, y);
      return 'bl'.includes(ch) ? shade : base;
    }).join(''),
  );
}

const TRUNKS: [number, number] = [18, 29];
const STRIPES = () => suit(...TRUNKS, (_x, y) => (Math.floor(y / 2) % 2 ? ['W', 'q'] : ['U', 'u']), 'u');
const POLKA = () => suit(...TRUNKS, (x, y) => ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0 && y % 3 === 1 ? ['W', 'e'] : ['K', 'k']), 'k');
const FLORAL = () => suit(...TRUNKS, (x, y) => {
  const m = (x + y * 3) % 7;
  return m === 0 ? ['Y', 'y'] : m === 4 ? ['K', 'k'] : ['T', 't'];
}, 't');
const RAINBOW = () => suit(4, 29, (_x, y) => {
  const c = [['R', 'r'], ['F', 'f'], ['Y', 'y'], ['G', 'g'], ['T', 't'], ['U', 'u'], ['V', 'v']][(((Math.floor((y - 4) / 4)) % 7) + 7) % 7] as [string, string];
  return c;
}, 'r', true);

// ---------- Held ----------
function lily(): Grid {
  const g = grid(11, 15);
  for (let y = 7; y < 15; y++) put(g, 5, y, 'g');
  put(g, 6, 10, 'G'); put(g, 7, 9, 'G');
  ellipse(g, 0, 2, 11, 7, { fill: 'K', shade: 'k', light: 'e' });
  ellipse(g, 3, 0, 5, 6, { fill: 'K', shade: 'k', light: 'e' });
  put(g, 4, 4, 'Y'); put(g, 5, 4, 'Y'); put(g, 6, 4, 'Y'); put(g, 5, 3, 'Y');
  return done(g);
}

function iceCream(): Grid {
  const g = grid(11, 17);
  shape(g, 2, 7, 7, 10, (x, y) => Math.abs(x - 3) <= 3 - y * 0.32, { fill: 'Y', shade: 'y' });
  for (let y = 8; y < 16; y++) for (let x = 2; x < 9; x++) if (g[y][x] === 'Y' && (x + y) % 3 === 0) g[y][x] = 'y';
  ellipse(g, 0, 0, 11, 9, { fill: 'K', shade: 'k', light: 'e' });
  put(g, 5, 0, 'R'); put(g, 5, 1, 'r');
  put(g, 3, 5, 'W'); put(g, 7, 4, 'Y'); put(g, 6, 6, 'T');
  return done(g);
}

function parasol(swap: boolean): Grid {
  const g = grid(38, 46);
  line(g, 2, 44, 23, 14, 'y');
  line(g, 3, 44, 24, 14, 'd');
  const cx = 23;
  const cy = 15;
  shape(g, 7, 1, 32, 15, (x, y) => ((x + 0.5 - 16) / 16) ** 2 + ((y + 0.5 - 15) / 14) ** 2 <= 1, { fill: 'R', shade: 'r' });
  for (let y = 1; y < 16; y++) for (let x = 7; x < 39; x++) {
    const c = g[y][x];
    if (c !== 'R' && c !== 'r') continue;
    const a = Math.atan2(cy - y, x - cx);
    const band = Math.floor((a / Math.PI) * 8) % 2 === (swap ? 1 : 0);
    if (band) g[y][x] = c === 'R' ? 'W' : 'M';
  }
  // scalloped rim
  for (let x = 8; x < 38; x++) if ((x - 8) % 5 === 2) put(g, x, 15, '.');
  put(g, 23, 0, 'O'); put(g, 23, 1, 'Y');
  put(g, 1, 45, 'y'); put(g, 0, 44, 'y'); put(g, 0, 43, 'y');
  return done(g);
}

function bubbleWand(): Grid {
  const g = grid(11, 20);
  for (let y = 9; y < 20; y++) put(g, 5, y, 'y');
  ellipse(g, 0, 0, 11, 10, { fill: 'i', outline: 'V' });
  ellipse(g, 2, 2, 7, 6, { fill: 'i', outline: 'v' });
  put(g, 3, 3, 'W');
  return done(g);
}

function balloon(): Grid {
  const g = grid(13, 17);
  ellipse(g, 0, 0, 13, 15, { fill: 'K', shade: 'k', light: 'e' });
  put(g, 3, 3, 'W'); put(g, 3, 4, 'W'); put(g, 4, 3, 'W');
  stampRows(g, ['.O.', 'OkO'], 5, 14);
  return done(g);
}

// ---------- Floats (drawn under the otter) ----------
function donut(): Grid {
  const w = 52;
  const h = 40;
  const g = grid(w, h);
  ellipse(g, 0, 0, w, h, { fill: 'K', shade: 'k', light: 'e', lightAt: 0.4 });
  // hole
  shape(g, 11, 8, 30, 24, (x, y) => ((x + 0.5 - 15) / 15) ** 2 + ((y + 0.5 - 12) / 12) ** 2 <= 1, { fill: '.', outline: 'O' });
  for (let y = 9; y < 31; y++) for (let x = 12; x < 40; x++) if (g[y][x] === '.') { /* keep hole clear */ }
  // sprinkles
  const cols = ['Y', 'T', 'W', 'V', 'U'];
  let i = 0;
  for (let y = 2; y < h - 2; y += 3) for (let x = 2 + (y % 2) * 2; x < w - 2; x += 5) {
    if (g[y][x] === 'K' || g[y][x] === 'e') { put(g, x, y, cols[i++ % cols.length]); }
  }
  return done(g);
}

function duckFloaty(): Grid {
  const g = grid(52, 48);
  ellipse(g, 0, 0, 52, 40, { fill: 'Y', shade: 'y', light: 'j', lightAt: 0.4 });
  shape(g, 11, 8, 30, 24, (x, y) => ((x + 0.5 - 15) / 15) ** 2 + ((y + 0.5 - 12) / 12) ** 2 <= 1, { fill: '.', outline: 'O' });
  // duck head at the foot end
  ellipse(g, 19, 32, 14, 13, { fill: 'Y', shade: 'y', light: 'j' });
  ellipse(g, 22, 42, 8, 6, { fill: 'F', shade: 'f' });
  put(g, 22, 37, 'E'); put(g, 29, 37, 'E'); put(g, 21, 36, 'W'); put(g, 28, 36, 'W');
  put(g, 21, 39, 'P'); put(g, 30, 39, 'P');
  return done(g);
}

function lilyRaft(): Grid {
  const g = grid(56, 46);
  ellipse(g, 0, 0, 56, 46, { fill: 'G', shade: 'g', light: 'z', lightAt: 0.45 });
  // notch
  shape(g, 28, 0, 6, 23, (x, y) => Math.abs(x - 0) <= y * 0.15, { fill: '.', outline: null });
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    for (let r = 6; r < 22; r += 1) {
      const x = Math.round(28 + Math.cos(ang) * r * 1.1);
      const y = Math.round(23 + Math.sin(ang) * r * 0.9);
      if (g[y]?.[x] === 'G') put(g, x, y, 'g');
    }
  }
  flower(g, 6, 30, 'K');
  flower(g, 44, 10, 'W');
  return done(g);
}

// ---------- Pets ----------
const DUCKLING = [
  '.....OOOO....',
  '....OYYYYO...',
  '....OYYYEYO..',
  '....OYYYYYFFO',
  '.OO..OYYYO...',
  'OYYOOYYYYYOO.',
  'OYYYYYYYYYYYO',
  'OyYYYYYyYYYYO',
  '.OyYYYYYYYYyO',
  '..OOyyyyyyOO.',
  '....OOOOOO...',
];

function crab(raised: boolean): Grid {
  const g = grid(17, 13);
  const cy = raised ? 0 : 2;
  ellipse(g, 0, cy, 6, 6, { fill: 'R', shade: 'r' });
  ellipse(g, 11, cy, 6, 6, { fill: 'R', shade: 'r' });
  put(g, 3, cy, '.'); put(g, 3, cy + 1, 'O'); put(g, 13, cy, '.'); put(g, 13, cy + 1, 'O');
  for (const x of [2, 4, 12, 14]) put(g, x, 11, 'O');
  put(g, 1, 10, 'O'); put(g, 15, 10, 'O');
  ellipse(g, 2, 4, 13, 8, { fill: 'R', shade: 'r', light: 'K' });
  put(g, 6, 6, 'E'); put(g, 10, 6, 'E'); put(g, 6, 5, 'W'); put(g, 10, 5, 'W');
  put(g, 5, 8, 'P'); put(g, 11, 8, 'P');
  put(g, 8, 8, 'o');
  return done(g);
}

function butterfly(open: boolean): Grid {
  const g = grid(13, 10);
  if (open) {
    ellipse(g, 0, 0, 6, 6, { fill: 'V', shade: 'v', light: 'i' });
    ellipse(g, 7, 0, 6, 6, { fill: 'V', shade: 'v', light: 'i' });
    ellipse(g, 1, 5, 5, 5, { fill: 'K', shade: 'k' });
    ellipse(g, 7, 5, 5, 5, { fill: 'K', shade: 'k' });
  } else {
    ellipse(g, 3, 1, 3, 7, { fill: 'V', shade: 'v' });
    ellipse(g, 7, 1, 3, 7, { fill: 'V', shade: 'v' });
  }
  for (let y = 2; y < 9; y++) put(g, 6, y, 'O');
  put(g, 5, 0, 'O'); put(g, 7, 0, 'O');
  return done(g);
}

function frog(): Grid {
  const g = grid(14, 12);
  ellipse(g, 0, 6, 5, 5, { fill: 'G', shade: 'g' });
  ellipse(g, 9, 6, 5, 5, { fill: 'G', shade: 'g' });
  ellipse(g, 1, 2, 12, 9, { fill: 'G', shade: 'g', light: 'z' });
  ellipse(g, 1, 0, 5, 5, { fill: 'W', shade: 'M' });
  ellipse(g, 8, 0, 5, 5, { fill: 'W', shade: 'M' });
  put(g, 3, 2, 'E'); put(g, 10, 2, 'E');
  put(g, 3, 6, 'P'); put(g, 10, 6, 'P');
  for (let x = 5; x < 9; x++) put(g, x, 7, 'o');
  ellipse(g, 4, 8, 6, 3, { fill: 'j', outline: null });
  return done(g);
}

function bird(hop: boolean): Grid {
  const g = grid(13, 12);
  const dy = hop ? 0 : 1;
  ellipse(g, 1, 2 + dy, 11, 9, { fill: 'U', shade: 'u', light: 'q' });
  ellipse(g, 3, 6 + dy, 7, 4, { fill: 'j', outline: null });
  ellipse(g, 0, 5 + dy, 5, 4, { fill: 'u', shade: 'u' });
  put(g, 8, 4 + dy, 'E'); put(g, 8, 3 + dy, 'W');
  put(g, 12, 5 + dy, 'F'); put(g, 11, 5 + dy, 'F'); put(g, 12, 6 + dy, 'f');
  put(g, 9, 6 + dy, 'P');
  put(g, 5, 11, 'F'); put(g, 8, 11, 'F');
  put(g, 6, 1 + dy, 'u'); put(g, 7, 0 + dy, 'u');
  return done(g);
}

function snail(): Grid {
  const g = grid(16, 12);
  ellipse(g, 0, 8, 16, 4, { fill: 'j', shade: 'Y' });
  ellipse(g, 1, 0, 11, 10, { fill: 'F', shade: 'f', light: 'Y' });
  for (const [x, y] of [[6, 3], [7, 3], [8, 4], [8, 5], [7, 6], [6, 6], [5, 5], [5, 4], [6, 4]]) put(g, x, y, 'f');
  ellipse(g, 11, 4, 5, 6, { fill: 'j', shade: 'Y' });
  put(g, 12, 1, 'O'); put(g, 14, 1, 'O'); put(g, 12, 2, 'O'); put(g, 14, 2, 'O');
  put(g, 13, 6, 'E'); put(g, 14, 8, 'P');
  return done(g);
}

function bee(up: boolean): Grid {
  const g = grid(12, 10);
  ellipse(g, up ? 2 : 3, 0, 5, 4, { fill: 'w', outline: 'q' });
  ellipse(g, up ? 6 : 5, 0, 5, 4, { fill: 'w', outline: 'q' });
  ellipse(g, 0, 3, 12, 7, { fill: 'Y', shade: 'y' });
  for (const x of [4, 7]) for (let y = 4; y < 9; y++) if (g[y][x] !== 'O') g[y][x] = 'H';
  put(g, 9, 5, 'E'); put(g, 10, 7, 'P');
  return done(g);
}

// ---------- Premium items (v3) ----------
function sailorCap(): Grid {
  const g = grid(30, 14);
  ellipse(g, 3, 0, 24, 10, { fill: 'W', shade: 'M', light: 'W', power: 2.4 });
  rect(g, 4, 8, 22, 4, 'u');
  for (let x = 4; x < 26; x++) { put(g, x, 8, 'O'); put(g, x, 12, 'O'); if (x % 4 === 0) put(g, x, 10, 'U'); }
  put(g, 3, 9, 'O'); put(g, 3, 10, 'O'); put(g, 3, 11, 'O'); put(g, 26, 9, 'O'); put(g, 26, 10, 'O'); put(g, 26, 11, 'O');
  // little golden anchor
  stampRows(g, ['.Y.', 'YYY', '.Y.', 'YYY'], 13, 2);
  put(g, 12, 5, 'Y'); put(g, 16, 5, 'Y');
  // ribbons
  stampRows(g, ['uu', 'u.', 'uu'], 26, 11);
  return done(g);
}

function tiara(): Grid {
  const g = grid(26, 12);
  for (let x = 1; x < 25; x++) {
    const y = 8 + Math.round(((x - 12.5) / 12) ** 2 * 3);
    put(g, x, y, 'M'); put(g, x, y + 1, 'm');
  }
  shape(g, 5, 0, 16, 9, (x, y) => {
    const peaks = [[2, 4], [8, 0], [14, 4]];
    return peaks.some(([cx, top]) => y >= top && Math.abs(x - cx) <= (y - top) * 0.7 + 0.5);
  }, { fill: 'M', shade: 'n', light: 'W' });
  ellipse(g, 11, 3, 5, 5, { fill: 'K', shade: 'k', light: 'e' });
  put(g, 7, 6, 'U'); put(g, 19, 6, 'U');
  put(g, 13, 0, 'W'); put(g, 12, 1, 'W'); put(g, 14, 1, 'W');
  return done(g);
}

function paperLantern(): Grid {
  const g = grid(13, 26);
  line(g, 6, 25, 6, 13, 'y');
  ellipse(g, 0, 2, 13, 12, { fill: 'R', shade: 'r', light: 'F' });
  for (const y of [5, 8, 11]) for (let x = 1; x < 12; x++) if (g[y][x] !== 'O' && g[y][x] !== '.') put(g, x, y, 'r');
  rect(g, 3, 0, 7, 2, 'd'); rect(g, 3, 13, 7, 2, 'd');
  put(g, 6, 15, 'Y'); put(g, 6, 16, 'Y');
  put(g, 3, 5, 'j'); put(g, 3, 6, 'j');
  return done(g);
}

const GOLDEN = () => suit(18, 29, (x, y) => {
  const m = (x + (Math.floor(y / 2) % 2) * 2) % 4;
  return m === 0 ? ['y', 'f'] : m === 1 ? ['j', 'Y'] : ['Y', 'y'];
}, 'y');

function swanFloat(): Grid {
  const g = grid(52, 56);
  ellipse(g, 0, 4, 52, 40, { fill: 'W', shade: 'M', light: 'W', lightAt: 0.4 });
  shape(g, 11, 12, 30, 24, (x, y) => ((x + 0.5 - 15) / 15) ** 2 + ((y + 0.5 - 12) / 12) ** 2 <= 1, { fill: '.', outline: 'O' });
  // wing feathers along the sides
  for (const side of [0, 1]) for (let i = 0; i < 4; i++) {
    const x = side ? 44 - i : 3 + i;
    for (let y = 16 + i * 3; y < 20 + i * 3; y++) put(g, x, y, 'M');
  }
  // neck + head rising at the foot end
  ellipse(g, 21, 38, 10, 14, { fill: 'W', shade: 'M' });
  ellipse(g, 19, 44, 14, 11, { fill: 'W', shade: 'M', light: 'W' });
  stampRows(g, ['OFFO', 'OfFO', '.OO.'], 24, 51);
  put(g, 21, 47, 'E'); put(g, 30, 47, 'E'); put(g, 21, 46, 'W'); put(g, 30, 46, 'W');
  put(g, 20, 49, 'P'); put(g, 31, 49, 'P');
  ellipse(g, 22, 0, 8, 7, { fill: 'K', shade: 'k' });
  return done(g);
}

function kittenCup(): Grid {
  const g = grid(20, 20);
  // teacup
  shape(g, 1, 9, 17, 10, (x, y) => ((x + 0.5 - 8.5) / 8.5) ** 2 + ((y + 0.5) / 10) ** 2 <= 1, { fill: 'W', shade: 'q', light: 'W' });
  ellipse(g, 15, 11, 5, 6, { fill: '.', outline: 'O' });
  for (let x = 3; x < 16; x += 3) put(g, x, 13, 'K');
  // kitten peeking out
  ellipse(g, 3, 1, 13, 10, { fill: 'F', shade: 'f', light: 'j' });
  shape(g, 3, 0, 4, 4, (x, y) => x <= y, { fill: 'F', shade: 'f' });
  shape(g, 12, 0, 4, 4, (x, y) => 3 - x <= y, { fill: 'F', shade: 'f' });
  put(g, 6, 5, 'E'); put(g, 12, 5, 'E'); put(g, 6, 4, 'W'); put(g, 12, 4, 'W');
  put(g, 9, 6, 'N'); put(g, 5, 7, 'P'); put(g, 13, 7, 'P');
  for (let x = 2; x < 17; x++) put(g, x, 9, 'O');
  return done(g);
}

function item(
  id: string, name: string, slot: Slot, price: number, unlockAt: number,
  anchor: AnchorName, z: number, grids: Grid[], pivot: [number, number],
  extra: Partial<Pick<ItemDef, 'frameTime' | 'pet' | 'special'>> = {},
): ItemDef {
  return {
    id, name, slot, price, unlockAt, anchor, z,
    frames: grids.map((g, i) => bake(`${id}.${i}`, g, pivot)),
    frameTime: extra.frameTime ?? 0.6,
    pet: extra.pet,
    special: extra.special,
  };
}

let catalog: ItemDef[] | null = null;

export function items(): ItemDef[] {
  if (catalog) return catalog;
  catalog = [
    // hats — pivot row sits on the head top
    item('flower-crown', 'Flower Crown', 'hat', 40, 0, 'headTop', Z.hat, [flowerCrown()], [17, 6]),
    item('sun-hat', 'Straw Sun Hat', 'hat', 90, 0, 'headTop', Z.hat, [strawHat()], [21, 11]),
    item('bucket-hat', 'Bucket Hat', 'hat', 120, 0, 'headTop', Z.hat, [bucketHat()], [18, 10]),
    item('beanie', 'Cozy Beanie', 'hat', 110, 150, 'headTop', Z.hat, [beanie()], [17, 14]),
    item('bunny-ears', 'Bunny Ears', 'hat', 160, 400, 'headTop', Z.hat, [bunnyEars()], [15, 17]),
    item('pirate-hat', 'Pirate Hat', 'hat', 260, 800, 'headTop', Z.hat, [pirateHat()], [20, 12]),
    item('crown', 'Little Crown', 'hat', 400, 0, 'headTop', Z.hat, [crown()], [10, 10]),

    // eyes — pivot sits on the eye line
    item('sunglasses', 'Cool Shades', 'eyes', 30, 0, 'eyes', Z.eyes, [sunglasses()], [15, 3]),
    item('round-specs', 'Round Specs', 'eyes', 60, 0, 'eyes', Z.eyes, [roundSpecs()], [15, 3]),
    item('heart-shades', 'Heart Shades', 'eyes', 110, 0, 'eyes', Z.eyes, [heartShades()], [16, 4]),
    item('star-glasses', 'Star Glasses', 'eyes', 140, 150, 'eyes', Z.eyes, [starGlasses()], [16, 5]),
    item('snorkel', 'Snorkel Mask', 'eyes', 200, 400, 'eyes', Z.eyes, [snorkel()], [17, 20]),

    // ears
    item('ear-flower', 'Ear Flower', 'ears', 25, 0, 'ears', Z.ears, [earFlower()], [19, 4]),
    item('earphones', 'Earphones', 'ears', 150, 0, 'ears', Z.ears, [earphones()], [18, 9]),

    // neck
    item('bowtie', 'Bow Tie', 'neck', 35, 0, 'neck', Z.neck, [bowtie()], [7, 3]),
    item('lei', 'Flower Lei', 'neck', 80, 0, 'neck', Z.neck, [lei()], [17, 3]),
    item('scarf', 'Cozy Scarf', 'neck', 100, 0, 'neck', Z.neck, [scarf()], [17, 2]),
    item('shell-necklace', 'Shell Necklace', 'neck', 120, 150, 'neck', Z.neck, [shellNecklace()], [15, 1]),

    // swimwear
    item('suit-stripes', 'Sailor Stripes', 'suit', 50, 0, 'body', Z.suit, [STRIPES()], [0, 0]),
    item('suit-polka', 'Pink Polka', 'suit', 70, 0, 'body', Z.suit, [POLKA()], [0, 0]),
    item('suit-floral', 'Tropical Trunks', 'suit', 100, 0, 'body', Z.suit, [FLORAL()], [0, 0]),
    item('suit-rainbow', 'Rainbow Suit', 'suit', 220, 0, 'body', Z.suit, [RAINBOW()], [0, 0]),

    // held
    item('lily', 'Water Lily', 'held', 20, 0, 'pawR', Z.held, [lily()], [5, 13]),
    item('ice-cream', 'Ice Cream', 'held', 45, 0, 'pawR', Z.held, [iceCream()], [5, 14]),
    item('bubble-wand', 'Bubble Wand', 'held', 130, 400, 'pawR', Z.held, [bubbleWand()], [5, 17], { special: 'bubbles' }),
    item('umbrella', 'Parasol', 'held', 180, 0, 'pawR', Z.heldBack, [parasol(false), parasol(true)], [2, 43], { frameTime: 1.4 }),
    item('balloon', 'Balloon', 'held', 220, 800, 'pawR', Z.held, [balloon()], [6, 16], { special: 'balloon' }),

    // floats
    item('float-donut', 'Donut Float', 'float', 150, 150, 'float', Z.float, [donut()], [26, 22]),
    item('float-duck', 'Duck Floaty', 'float', 240, 400, 'float', Z.float, [duckFloaty()], [26, 22]),
    item('float-lily', 'Lily Pad Raft', 'float', 320, 800, 'float', Z.float, [lilyRaft()], [28, 24]),

    // friends — several can come along at once
    item('duckling', 'Duckling', 'pet', 150, 0, 'belly', 0, [DUCKLING], [6, 6], { pet: 'follow' }),
    item('butterfly', 'Butterfly', 'pet', 200, 0, 'headTop', 0, [butterfly(true), butterfly(false)], [6, 5], { pet: 'fly', frameTime: 0.18 }),
    item('crab', 'Crab Buddy', 'pet', 260, 0, 'belly', Z.ride, [crab(false), crab(true)], [8, 7], { pet: 'ride', frameTime: 0.7 }),
    item('frog', 'Frog Pal', 'pet', 180, 150, 'lap', Z.ride, [frog()], [7, 8], { pet: 'ride' }),
    item('bird', 'Bluebird', 'pet', 240, 400, 'perch', Z.perch, [bird(false), bird(true)], [6, 11], { pet: 'ride', frameTime: 0.9 }),
    item('snail', 'Snail', 'pet', 200, 800, 'belly', 0, [snail()], [8, 7], { pet: 'follow' }),
    item('bee', 'Bumblebee', 'pet', 260, 800, 'headTop', 0, [bee(true), bee(false)], [6, 5], { pet: 'fly', frameTime: 0.12 }),
    item('baby-otter', 'Baby Otter', 'pet', 350, 0, 'belly', 0, [babyOtter()], [9, 12], { pet: 'follow' }),

    // premium (v3)
    item('sailor-cap', 'Sailor Cap', 'hat', 480, 1500, 'headTop', Z.hat, [sailorCap()], [15, 11]),
    item('tiara', 'Sparkle Tiara', 'hat', 560, 1500, 'headTop', Z.hat, [tiara()], [13, 9]),
    item('paper-lantern', 'Paper Lantern', 'held', 620, 3000, 'pawR', Z.held, [paperLantern()], [6, 23], { special: 'lantern' }),
    item('suit-golden', 'Golden Scales', 'suit', 680, 3000, 'body', Z.suit, [GOLDEN()], [0, 0]),
    item('float-swan', 'Swan Float', 'float', 750, 3000, 'float', Z.float, [swanFloat()], [26, 26]),
    item('kitten', 'Teacup Kitten', 'pet', 800, 3000, 'belly', 0, [kittenCup()], [10, 10], { pet: 'follow' }),
  ];
  return catalog;
}

export function itemById(id: string | undefined): ItemDef | undefined {
  return id ? items().find((i) => i.id === id) : undefined;
}
