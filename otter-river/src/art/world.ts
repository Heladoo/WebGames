import { bake, Grid, outline, Sprite } from './sprite';
import { done, ellipse, grid, put, rect, recolor, shape, stampRows, Pix } from './shapes';

// ---------- Collectibles ----------
function shell(): Grid {
  const g = grid(13, 11);
  shape(g, 0, 0, 13, 9, (x, y) => ((x + 0.5 - 6.5) / 6.5) ** 2 + ((y + 0.5 - 8) / 8) ** 2 <= 1 && y < 9, { fill: 'S', shade: 'K', light: 's' });
  for (const x of [3, 6, 9]) for (let y = 2; y < 8; y++) if (g[y][x] !== 'O') put(g, x + (y < 4 ? (x - 6) / 3 : 0), y, 'K');
  ellipse(g, 3, 7, 7, 4, { fill: 'S', shade: 'K' });
  put(g, 3, 2, 'W'); put(g, 2, 3, 's');
  return done(g);
}

function fish(): Grid {
  const g = grid(17, 10);
  shape(g, 11, 1, 6, 8, (x, y) => Math.abs(y - 3.5) <= 0.5 + x * 0.6, { fill: 'U', shade: 'u' });
  ellipse(g, 0, 0, 13, 10, { fill: 'U', shade: 'u', light: 'q' });
  for (let x = 4; x < 10; x += 2) put(g, x, 6, 'q');
  put(g, 3, 3, 'W'); put(g, 3, 4, 'E'); put(g, 4, 4, 'E');
  put(g, 1, 6, 'o');
  put(g, 7, 1, 'u'); put(g, 8, 0, 'O');
  return done(g);
}

function pearl(): Grid {
  const g = grid(9, 9);
  ellipse(g, 0, 0, 9, 9, { fill: 'C', shade: 'i', light: 'W' });
  put(g, 2, 2, 'W'); put(g, 3, 2, 'W'); put(g, 2, 3, 'W');
  put(g, 6, 6, 'V');
  return done(g);
}

function bubble(): Grid {
  const g = grid(7, 7);
  ellipse(g, 0, 0, 7, 7, { fill: '.', outline: 'q' });
  put(g, 2, 2, 'W');
  return done(g);
}

// ---------- River things ----------
function log(): Grid {
  const g = grid(40, 13);
  rect(g, 4, 1, 32, 11, 'B');
  for (let x = 4; x < 36; x++) {
    put(g, x, 0, 'O'); put(g, x, 12, 'O'); put(g, x, 1, 'h'); put(g, x, 10, 'b'); put(g, x, 11, 'b');
    if (x % 5 === 0) for (let y = 3; y < 9; y++) if ((x + y) % 3) put(g, x, y, 'D');
  }
  ellipse(g, 0, 0, 9, 13, { fill: 'B', shade: 'b' });
  ellipse(g, 31, 0, 9, 13, { fill: 'Y', shade: 'y', light: 'j' });
  ellipse(g, 33, 3, 5, 7, { fill: 'y', outline: 'y' });
  put(g, 35, 6, 'Y');
  // moss + a tiny sprout
  for (const x of [10, 11, 12, 20, 21]) put(g, x, 1, 'G');
  put(g, 16, 0, 'G'); put(g, 17, 0, 'g'); put(g, 16, 1, 'g');
  return done(g);
}

function rock(w: number, h: number): Grid {
  const g = grid(w, h);
  ellipse(g, 0, 0, w, h, { fill: 'M', shade: 'n', light: 'W', power: 2.3, lightAt: 0.45 });
  // moss cap
  for (let x = 2; x < w - 2; x++) for (let y = 1; y < Math.ceil(h / 3); y++) {
    if (g[y][x] !== 'O' && g[y][x] !== '.' && (x * 7 + y * 3) % 5 < 3 && x < w * 0.7) g[y][x] = y === 1 ? 'z' : 'G';
  }
  put(g, Math.floor(w * 0.6), Math.floor(h * 0.6), 'n');
  put(g, Math.floor(w * 0.35), Math.floor(h * 0.7), 'n');
  return done(g);
}

function lilyPad(): Grid {
  const g = grid(19, 14);
  ellipse(g, 0, 0, 19, 14, { fill: 'G', shade: 'g', light: 'z' });
  shape(g, 9, 0, 5, 7, (x, y) => x <= y * 0.6, { fill: '.', outline: null });
  put(g, 9, 7, 'O'); put(g, 10, 6, 'O');
  for (const [x, y] of [[5, 7], [4, 9], [14, 8], [12, 11]]) put(g, x, y, 'g');
  return done(g);
}

function lilyFlower(): Grid {
  const g = grid(9, 7);
  ellipse(g, 0, 2, 9, 5, { fill: 'K', shade: 'k', light: 'e' });
  ellipse(g, 2, 0, 5, 5, { fill: 'e', shade: 'K' });
  put(g, 4, 3, 'Y'); put(g, 3, 3, 'Y'); put(g, 5, 3, 'Y');
  return done(g);
}

function frogSit(): Grid {
  const g = grid(12, 10);
  ellipse(g, 0, 4, 12, 6, { fill: 'G', shade: 'g', light: 'z' });
  ellipse(g, 1, 0, 4, 4, { fill: 'W' });
  ellipse(g, 7, 0, 4, 4, { fill: 'W' });
  put(g, 2, 1, 'E'); put(g, 8, 1, 'E');
  put(g, 2, 6, 'P'); put(g, 9, 6, 'P');
  for (let x = 4; x < 8; x++) put(g, x, 7, 'o');
  return done(g);
}

function leaf(tint: string, shade: string): Grid {
  const g = grid(8, 7);
  shape(g, 0, 0, 8, 7, (x, y) => Math.abs(y - 3 + (x - 4) * 0.4) < 2.6 - Math.abs(x - 3.5) * 0.45, { fill: tint, shade });
  for (let x = 1; x < 7; x++) put(g, x, Math.round(3 - (x - 4) * 0.4), shade);
  return done(g);
}

function petal(): Grid {
  return ['.ee', 'eKe', 'Ke.'];
}

// ---------- Banks ----------
function reeds(): Grid {
  const g = grid(11, 22);
  for (const [x, top] of [[2, 3], [5, 0], [8, 5]]) {
    for (let y = top + 7; y < 22; y++) put(g, x, y, y % 4 ? 'g' : 'G');
    ellipse(g, x - 1, top, 3, 8, { fill: 'D', shade: 'd' });
    put(g, x, top - 1 < 0 ? 0 : top - 1, 'g');
  }
  // blades
  for (let i = 0; i < 7; i++) { put(g, 1 - Math.floor(i / 3), 14 + i, 'G'); put(g, 9 + Math.floor(i / 3), 15 + i, 'G'); }
  put(g, 4, 21, 'g'); put(g, 6, 21, 'g');
  return done(g);
}

function flowerTiny(c: string, centre = 'Y'): Grid {
  const g = grid(7, 9);
  put(g, 3, 5, 'g'); put(g, 3, 6, 'g'); put(g, 3, 7, 'g'); put(g, 2, 7, 'G'); put(g, 4, 8, 'G');
  stampRows(g, recolor(['.X.X.', 'XXcXX', '.XXX.', '..X..'], { X: c, c: centre }), 1, 1);
  put(g, 3, 0, c);
  return done(g);
}

function tuft(): Grid {
  return ['..g...g.', '.g.g.gg.', 'gGgGgGgg', '.gGgGgg.'];
}

function bush(berry: string): Grid {
  const g = grid(20, 15);
  ellipse(g, 0, 4, 11, 11, { fill: 'G', shade: 'g', light: 'z' });
  ellipse(g, 8, 3, 12, 12, { fill: 'G', shade: 'g', light: 'z' });
  ellipse(g, 4, 0, 11, 10, { fill: 'G', shade: 'g', light: 'z' });
  for (const [x, y] of [[5, 6], [12, 8], [8, 11], [15, 5], [3, 10]]) put(g, x, y, berry);
  return done(g);
}

function roundTree(canopy: [string, string, string], dots: string): Grid {
  const g = grid(28, 34);
  rect(g, 12, 20, 4, 12, 'D');
  for (let y = 20; y < 32; y++) { put(g, 11, y, 'O'); put(g, 16, y, 'O'); put(g, 13, y, 'd'); }
  rect(g, 9, 31, 10, 3, 'D'); for (let x = 9; x < 19; x++) put(g, x, 33, 'O'); put(g, 8, 32, 'O'); put(g, 19, 32, 'O');
  const [f, s, l] = canopy;
  ellipse(g, 0, 6, 16, 16, { fill: f, shade: s, light: l });
  ellipse(g, 12, 6, 16, 16, { fill: f, shade: s, light: l });
  ellipse(g, 4, 0, 20, 20, { fill: f, shade: s, light: l });
  for (let i = 0; i < 9; i++) put(g, 5 + ((i * 7) % 18), 4 + ((i * 5) % 14), dots);
  return done(g);
}

function pineTree(): Grid {
  const g = grid(22, 38);
  rect(g, 9, 30, 4, 7, 'D'); for (let y = 30; y < 37; y++) { put(g, 8, y, 'O'); put(g, 13, y, 'O'); }
  for (let x = 8; x < 14; x++) put(g, x, 37, 'O');
  for (const [top, w] of [[18, 22], [10, 18], [2, 14]] as const) {
    const x0 = (22 - w) / 2;
    shape(g, x0, top, w, 13, (x, y) => Math.abs(x + 0.5 - w / 2) <= (y + 1) * (w / 26), { fill: 'g', shade: 'x', light: 'G', lightAt: 0.2 });
  }
  put(g, 11, 1, 'O'); put(g, 10, 1, 'O');
  return done(g);
}

function mushroom(): Grid {
  const g = grid(9, 9);
  rect(g, 3, 5, 3, 4, 'C'); for (let y = 5; y < 9; y++) { put(g, 2, y, 'O'); put(g, 6, y, 'O'); }
  for (let x = 2; x < 7; x++) put(g, x, 8, 'O');
  shape(g, 0, 0, 9, 6, (x, y) => ((x + 0.5 - 4.5) / 4.5) ** 2 + ((y + 0.5 - 6) / 6) ** 2 <= 1 && y < 6, { fill: 'R', shade: 'r' });
  put(g, 2, 2, 'W'); put(g, 5, 1, 'W'); put(g, 6, 3, 'W');
  return done(g);
}

function bench(): Grid {
  const g = grid(22, 12);
  rect(g, 0, 0, 22, 3, 'B'); rect(g, 0, 5, 22, 3, 'B');
  for (let x = 0; x < 22; x++) { put(g, x, 0, 'O'); put(g, x, 2, 'b'); put(g, x, 5, 'O'); put(g, x, 7, 'b'); }
  for (const x of [2, 18]) for (let y = 3; y < 12; y++) { put(g, x, y, 'D'); put(g, x + 1, y, 'd'); }
  return done(g);
}

function lantern(): Grid {
  const g = grid(7, 20);
  for (let y = 7; y < 19; y++) { put(g, 3, y, 'd'); }
  rect(g, 1, 18, 5, 2, 'd');
  ellipse(g, 0, 1, 7, 7, { fill: 'Y', shade: 'y', light: 'j', power: 3 });
  put(g, 2, 0, 'O'); put(g, 3, 0, 'O'); put(g, 4, 0, 'O');
  return done(g);
}

function fence(): Grid {
  const g = grid(22, 12);
  for (const x of [1, 10, 19]) {
    rect(g, x, 1, 3, 11, 'C');
    for (let y = 1; y < 12; y++) { put(g, x - 1, y, 'O'); put(g, x + 3, y, 'O'); put(g, x + 2, y, 'l'); }
    put(g, x, 0, 'O'); put(g, x + 1, 0, 'O'); put(g, x + 2, 0, 'O');
    for (let i = x - 1; i <= x + 3; i++) put(g, i, 11, 'O');
  }
  for (const y of [3, 7]) for (let x = 0; x < 22; x++) {
    if (g[y][x] === '.' || g[y][x] === 'O' && (x === 0 || x === 21)) { put(g, x, y, 'C'); put(g, x, y - 1, 'O'); put(g, x, y + 1, 'O'); }
  }
  return done(g);
}

function dock(): Grid {
  const g = grid(26, 16);
  for (let i = 0; i < 5; i++) {
    rect(g, 0, i * 3, 26, 3, i % 2 ? 'B' : 'h');
    for (let x = 0; x < 26; x++) put(g, x, i * 3 + 2, 'b');
  }
  for (const x of [1, 24]) for (let y = 0; y < 16; y++) put(g, x, y, 'D');
  outlineRect(g);
  return done(g);
}

function outlineRect(g: Pix) {
  const h = g.length;
  const w = g[0].length;
  for (let x = 0; x < w; x++) { g[0][x] = 'O'; g[h - 1][x] = 'O'; }
  for (let y = 0; y < h; y++) { g[y][0] = 'O'; g[y][w - 1] = 'O'; }
}

function sparkle(big: boolean): Grid {
  return big ? ['..W..', '..W..', 'WWWWW', '..W..', '..W..'] : ['.....', '..W..', '.WWW.', '..W..', '.....'];
}

function star(): Grid {
  return ['.j.', 'jWj', '.j.'];
}

// ---------- Readable digits (bold 5×7, outlined, soft shadow) ----------
const DIGITS: Record<string, string[]> = {
  '0': ['.WWW.', 'WW.WW', 'WW.WW', 'WW.WW', 'WW.WW', 'WW.WW', '.WWW.'],
  '1': ['.WW..', 'WWW..', '.WW..', '.WW..', '.WW..', '.WW..', 'WWWW.'],
  '2': ['.WWW.', 'WW.WW', '...WW', '..WW.', '.WW..', 'WW...', 'WWWWW'],
  '3': ['WWWW.', '...WW', '...WW', '.WWW.', '...WW', '...WW', 'WWWW.'],
  '4': ['...WW', '..WWW', '.W.WW', 'WW.WW', 'WWWWW', '...WW', '...WW'],
  '5': ['WWWWW', 'WW...', 'WWWW.', '...WW', '...WW', 'WW.WW', '.WWW.'],
  '6': ['.WWW.', 'WW...', 'WWWW.', 'WW.WW', 'WW.WW', 'WW.WW', '.WWW.'],
  '7': ['WWWWW', '...WW', '..WW.', '..WW.', '.WW..', '.WW..', '.WW..'],
  '8': ['.WWW.', 'WW.WW', 'WW.WW', '.WWW.', 'WW.WW', 'WW.WW', '.WWW.'],
  '9': ['.WWW.', 'WW.WW', 'WW.WW', '.WWWW', '...WW', '..WW.', '.WW..'],
  '+': ['......', '..WW..', '..WW..', 'WWWWWW', 'WWWWWW', '..WW..', '..WW..'],
};

function digitSprite(rows: Grid, fill: string): Grid {
  const o = outline(recolor(rows, { W: fill }));
  const g = grid(o[0].length + 1, o.length + 1);
  stampRows(g, recolor(o, Object.fromEntries([...'WYOK'].map((c) => [c, 'o']))), 1, 1);
  stampRows(g, o, 0, 0);
  return done(g);
}

// ---------- UI icons (13×13) ----------
function icon(draw: (g: Pix) => void, w = 13, h = 13): Grid {
  const g = grid(w, h);
  draw(g);
  return done(g);
}

const ICONS = {
  bag: () => icon((g) => {
    ellipse(g, 3, 0, 7, 6, { fill: '.', outline: 'O' });
    rect(g, 0, 4, 13, 9, 'O');
    ellipse(g, 1, 5, 11, 7, { fill: 'K', shade: 'k', light: 'e', outline: null, power: 4 });
    put(g, 6, 7, 'Y');
  }),
  sound: () => icon((g) => {
    stampRows(g, ['....O', '...OO', 'OOOTO', 'OTTTO', 'OTTTO', 'OTTTO', 'OOOTO', '...OO', '....O'], 0, 2);
    for (const [x, y] of [[7, 4], [8, 5], [8, 6], [8, 7], [7, 8], [10, 2], [11, 3], [11, 4], [12, 5], [12, 6], [12, 7], [11, 8], [11, 9], [10, 10]]) put(g, x, y, 'O');
  }),
  mute: () => icon((g) => {
    stampRows(g, ['....O', '...OO', 'OOOTO', 'OTTTO', 'OTTTO', 'OTTTO', 'OOOTO', '...OO', '....O'], 0, 2);
    for (let i = 0; i < 5; i++) { put(g, 7 + i, 4 + i, 'r'); put(g, 11 - i, 4 + i, 'r'); }
  }),
  pause: () => icon((g) => {
    rect(g, 2, 1, 4, 11, 'O'); rect(g, 7, 1, 4, 11, 'O');
    rect(g, 3, 2, 2, 9, 'U'); rect(g, 8, 2, 2, 9, 'U');
  }),
  hat: () => icon((g) => {
    ellipse(g, 0, 6, 13, 5, { fill: 'Y', shade: 'y' });
    ellipse(g, 3, 1, 7, 8, { fill: 'Y', shade: 'y' });
    for (let x = 4; x < 9; x++) put(g, x, 6, 'R');
  }),
  eyes: () => icon((g) => {
    ellipse(g, 0, 3, 6, 6, { fill: 'H', power: 3 });
    ellipse(g, 7, 3, 6, 6, { fill: 'H', power: 3 });
    put(g, 6, 4, 'O'); put(g, 1, 4, 'I'); put(g, 8, 4, 'I');
  }),
  ears: () => icon((g) => {
    for (let x = 2; x < 11; x++) put(g, x, Math.round(((x - 6) / 5) ** 2 * 3) + 1, 'O');
    ellipse(g, 0, 5, 4, 7, { fill: 'K', shade: 'k' });
    ellipse(g, 9, 5, 4, 7, { fill: 'K', shade: 'k' });
  }),
  neck: () => icon((g) => {
    shape(g, 0, 2, 6, 9, (x, y) => Math.abs(y - 4) <= 1 + x * 0.6, { fill: 'R', shade: 'r' });
    shape(g, 7, 2, 6, 9, (x, y) => Math.abs(y - 4) <= 1 + (5 - x) * 0.6, { fill: 'R', shade: 'r' });
    ellipse(g, 4, 4, 5, 5, { fill: 'R', shade: 'r' });
  }),
  suit: () => icon((g) => {
    shape(g, 0, 2, 13, 9, (x, y) => y < 4 || Math.abs(x - 6) >= y - 3, { fill: 'U', shade: 'u' });
    for (let x = 1; x < 12; x++) put(g, x, 5, 'W');
  }),
  held: () => icon((g) => {
    shape(g, 3, 6, 7, 7, (x, y) => Math.abs(x - 3) <= 3 - y * 0.5, { fill: 'Y', shade: 'y' });
    ellipse(g, 1, 0, 11, 8, { fill: 'K', shade: 'k', light: 'e' });
  }),
  float: () => icon((g) => {
    ellipse(g, 0, 1, 13, 11, { fill: 'K', shade: 'k', light: 'e' });
    ellipse(g, 4, 4, 5, 5, { fill: '.', outline: 'O' });
    put(g, 2, 3, 'Y'); put(g, 10, 5, 'T'); put(g, 7, 9, 'W');
  }),
  pet: () => icon((g) => {
    ellipse(g, 3, 5, 7, 7, { fill: 'B', shade: 'b', light: 'h' });
    for (const [x, y] of [[0, 2], [4, 0], [9, 2]]) ellipse(g, x, y, 4, 4, { fill: 'B', shade: 'b' });
  }),
  lock: () => icon((g) => {
    ellipse(g, 3, 0, 7, 8, { fill: '.', outline: 'O' });
    rect(g, 1, 5, 11, 8, 'O');
    rect(g, 2, 6, 9, 6, 'Y');
    put(g, 6, 8, 'O'); put(g, 6, 9, 'O');
  }),
};

// ---------- Passing animals ----------
function duckMom(paddle: boolean): Grid {
  const g = grid(20, 14);
  ellipse(g, 0, 5, 17, 9, { fill: 'W', shade: 'M', light: 'W' });
  ellipse(g, 2, 7, 9, 5, { fill: 'M', shade: 'n', outline: null });
  ellipse(g, 11, 0, 8, 8, { fill: 'g', shade: 'x', light: 'G' });
  put(g, 16, 3, 'E'); put(g, 16, 2, 'W');
  rect(g, 18, 4, 2, 2, 'F'); put(g, 19, 5, 'f');
  put(g, 0, 6, paddle ? 'O' : 'M'); put(g, 1, 5, 'O');
  return done(g);
}

function tinyDuck(paddle: boolean): Grid {
  const g = grid(10, 9);
  ellipse(g, 0, 3, 8, 6, { fill: 'Y', shade: 'y' });
  ellipse(g, 4, 0, 5, 5, { fill: 'Y', shade: 'y' });
  put(g, 7, 2, 'E'); put(g, 9, 3, 'F'); put(g, 8, 3, 'F');
  put(g, 0, paddle ? 3 : 4, 'O');
  return done(g);
}

function heron(up: boolean): Grid {
  const g = grid(34, 16);
  // wings
  if (up) {
    shape(g, 0, 0, 16, 9, (x, y) => y >= 8 - x * 0.5 && y <= 8 - x * 0.15, { fill: 'M', shade: 'n' });
    shape(g, 18, 0, 16, 9, (x, y) => y >= 8 - (15 - x) * 0.5 && y <= 8 - (15 - x) * 0.15, { fill: 'M', shade: 'n' });
  } else {
    shape(g, 0, 6, 16, 9, (x, y) => y >= x * 0.15 && y <= x * 0.5 + 1, { fill: 'M', shade: 'n' });
    shape(g, 18, 6, 16, 9, (x, y) => y >= (15 - x) * 0.15 && y <= (15 - x) * 0.5 + 1, { fill: 'M', shade: 'n' });
  }
  ellipse(g, 11, 5, 12, 7, { fill: 'W', shade: 'M' });
  ellipse(g, 21, 4, 6, 5, { fill: 'W', shade: 'M' });
  put(g, 24, 5, 'E');
  rect(g, 27, 6, 5, 1, 'y'); put(g, 32, 6, 'y');
  put(g, 22, 3, 'm'); put(g, 21, 3, 'm');
  rect(g, 6, 8, 5, 1, 'y');
  return done(g);
}

function kingfisher(up: boolean): Grid {
  const g = grid(18, 10);
  ellipse(g, 3, 2, 11, 7, { fill: 'T', shade: 't', light: 'q' });
  ellipse(g, 5, 5, 7, 4, { fill: 'F', shade: 'f', outline: null });
  ellipse(g, 11, 1, 6, 6, { fill: 'T', shade: 't' });
  put(g, 14, 3, 'E'); put(g, 13, 4, 'W');
  rect(g, 16, 4, 2, 1, 'O');
  if (up) shape(g, 4, 0, 7, 4, (x, y) => y >= 3 - x * 0.5, { fill: 'u', shade: 'u' });
  else shape(g, 4, 6, 7, 4, (x, y) => y <= x * 0.5, { fill: 'u', shade: 'u' });
  put(g, 1, 4, 'u'); put(g, 0, 4, 'u'); put(g, 2, 5, 'u');
  return done(g);
}

function bunny(stretch: boolean): Grid {
  const g = grid(18, 14);
  if (stretch) {
    ellipse(g, 1, 5, 13, 7, { fill: 'C', shade: 'l', light: 'W' });
    put(g, 0, 10, 'O'); put(g, 1, 11, 'O'); put(g, 14, 11, 'O'); put(g, 15, 12, 'O');
  } else {
    ellipse(g, 3, 4, 10, 9, { fill: 'C', shade: 'l', light: 'W' });
    put(g, 5, 13, 'O'); put(g, 10, 13, 'O');
  }
  ellipse(g, 10, 2, 7, 6, { fill: 'C', shade: 'l', light: 'W' });
  ellipse(g, 10, 0, 3, 5, { fill: 'C', shade: 'l' });
  ellipse(g, 12, 0, 3, 5, { fill: 'C', shade: 'l' });
  put(g, 14, 4, 'E'); put(g, 16, 5, 'P');
  ellipse(g, 0, 5, 4, 4, { fill: 'W' });
  return done(g);
}

function deer(step: boolean): Grid {
  const g = grid(26, 24);
  for (const [x, dx] of step ? [[6, -1], [9, 1], [17, -1], [20, 1]] : [[6, 0], [9, 0], [17, 0], [20, 0]]) {
    for (let y = 14; y < 23; y++) put(g, x + (y > 18 ? dx : 0), y, 'D');
    put(g, x + dx, 23, 'O');
  }
  ellipse(g, 3, 8, 20, 10, { fill: 'F', shade: 'f', light: 'j' });
  for (const [x, y] of [[8, 10], [12, 11], [15, 10], [10, 13]]) put(g, x, y, 'C');
  rect(g, 18, 3, 3, 8, 'F');
  ellipse(g, 17, 0, 9, 7, { fill: 'F', shade: 'f', light: 'j' });
  put(g, 23, 2, 'E'); put(g, 25, 4, 'N'); put(g, 18, 0, 'D'); put(g, 17, 1, 'D');
  ellipse(g, 1, 8, 4, 4, { fill: 'C' });
  return done(g);
}

function dragonfly(up: boolean): Grid {
  const g = grid(13, 9);
  for (let x = 0; x < 13; x++) put(g, x, 4, x < 9 ? 'T' : 't');
  put(g, 12, 3, 'E'); put(g, 12, 5, 'E');
  const wy = up ? [1, 2] : [6, 7];
  for (const y of wy) for (let x = 5; x < 11; x++) put(g, x, y, 'q');
  return done(g);
}

function splash(big: boolean): Grid {
  return big
    ? ['..W...W..', '.W.W.W.W.', 'W..A.A..W', '.AAAAAAA.']
    : ['.........', '...W.W...', '..W.A.W..', '.AAAAAAA.'];
}

export interface WorldArt {
  shell: Sprite;
  goldShell: Sprite;
  fish: Sprite;
  pearl: Sprite;
  bubble: Sprite;
  log: Sprite;
  rocks: Sprite[];
  lilyPad: Sprite;
  lilyFlower: Sprite;
  frog: Sprite;
  leaves: Sprite[];
  petal: Sprite;
  reeds: Sprite;
  flowers: Sprite[];
  tuft: Sprite;
  bush: Sprite;
  berryBush: Sprite;
  trees: { round: Sprite; pine: Sprite; cherry: Sprite };
  mushroom: Sprite;
  bench: Sprite;
  lantern: Sprite;
  fence: Sprite;
  dock: Sprite;
  sparkle: Sprite[];
  star: Sprite;
  splash: Sprite[];
  digits: Record<string, Sprite>;
  digitsDark: Record<string, Sprite>;
  icons: Record<keyof typeof ICONS, Sprite>;
  animals: Record<'duck' | 'duckling' | 'heron' | 'kingfisher' | 'bunny' | 'deer' | 'dragonfly', Sprite[]>;
}

let cache: WorldArt | null = null;
export function worldArt(): WorldArt {
  if (cache) return cache;
  const digits: Record<string, Sprite> = {};
  const digitsDark: Record<string, Sprite> = {};
  for (const [k, g] of Object.entries(DIGITS)) {
    digits[k] = bake(`digit.${k}`, digitSprite(g, 'W'));
    digitsDark[k] = bake(`digitDark.${k}`, recolor(g, { W: 'O' }));
  }
  const icons = Object.fromEntries(Object.entries(ICONS).map(([k, f]) => [k, bake(`icon.${k}`, f())])) as WorldArt['icons'];
  const two = (name: string, f: (b: boolean) => Grid, px: [number, number]) => [bake(`${name}.0`, f(false), px), bake(`${name}.1`, f(true), px)];
  cache = {
    shell: bake('shell', shell(), [6, 5]),
    goldShell: bake('goldShell', recolor(shell(), { S: 'Y', K: 'y', s: 'j' }), [6, 5]),
    fish: bake('fish', fish(), [8, 5]),
    pearl: bake('pearl', pearl(), [4, 4]),
    bubble: bake('bubble', bubble(), [3, 3]),
    log: bake('log', log(), [20, 6]),
    rocks: [bake('rock.s', rock(14, 10), [7, 5]), bake('rock.m', rock(20, 14), [10, 7]), bake('rock.l', rock(28, 18), [14, 9])],
    lilyPad: bake('lilyPad', lilyPad(), [9, 7]),
    lilyFlower: bake('lilyFlower', lilyFlower(), [4, 3]),
    frog: bake('frog', frogSit(), [6, 5]),
    leaves: [bake('leaf.g', leaf('G', 'g'), [4, 3]), bake('leaf.o', leaf('F', 'f'), [4, 3]), bake('leaf.y', leaf('Y', 'y'), [4, 3])],
    petal: bake('petal', petal(), [1, 1]),
    reeds: bake('reeds', reeds(), [5, 21]),
    flowers: [
      bake('flower.pink', flowerTiny('K'), [3, 8]),
      bake('flower.white', flowerTiny('W'), [3, 8]),
      bake('flower.violet', flowerTiny('V'), [3, 8]),
      bake('flower.yellow', flowerTiny('Y', 'F'), [3, 8]),
      bake('flower.blue', flowerTiny('U', 'W'), [3, 8]),
    ],
    tuft: bake('tuft', tuft(), [4, 3]),
    bush: bake('bush', bush('z'), [10, 14]),
    berryBush: bake('berryBush', bush('R'), [10, 14]),
    trees: {
      round: bake('tree.round', roundTree(['G', 'g', 'z'], 'K'), [14, 33]),
      pine: bake('tree.pine', pineTree(), [11, 37]),
      cherry: bake('tree.cherry', roundTree(['K', 'k', 'e'], 'W'), [14, 33]),
    },
    mushroom: bake('mushroom', mushroom(), [4, 8]),
    bench: bake('bench', bench(), [11, 11]),
    lantern: bake('lantern', lantern(), [3, 19]),
    fence: bake('fence', fence(), [11, 11]),
    dock: bake('dock', dock(), [0, 8]),
    sparkle: [bake('sparkle.0', sparkle(true), [2, 2]), bake('sparkle.1', sparkle(false), [2, 2])],
    star: bake('star', star(), [1, 1]),
    splash: two('splash', splash, [4, 3]),
    digits,
    digitsDark,
    icons,
    animals: {
      duck: two('duck', duckMom, [10, 7]),
      duckling: two('tinyDuck', tinyDuck, [5, 4]),
      heron: two('heron', heron, [17, 8]),
      kingfisher: two('kingfisher', kingfisher, [9, 5]),
      bunny: two('bunny', bunny, [9, 7]),
      deer: two('deer', deer, [13, 23]),
      dragonfly: two('dragonfly', dragonfly, [6, 4]),
    },
  };
  return cache;
}
