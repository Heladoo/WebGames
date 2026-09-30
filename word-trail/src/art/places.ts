import { C, ell, flat, line, piece, shade } from './paper';

// Paper scenery. Each place draws three 800-wide tiles that repeat seamlessly
// (far, middle and ground) on a 450-high stage whose ground starts at y=370.
// Layers are paper pieces with crisp cast shadows (no filters, so scrolling
// stays smooth).

export const TILE = 800;
export const GROUND = 370;

export type PlaceId = 'park' | 'farm' | 'woods' | 'snow' | 'sand' | 'sea' | 'hill' | 'pond';
export type SkyId = 'sun' | 'cloud' | 'rain' | 'rainbow' | 'moon';

interface Place {
  far1: string;
  far2: string;
  ground: string;
  trail: string;
  far: () => string;
  mid: () => string;
  near?: () => string;
}

/** Draw at x, and again one tile over when the shape crosses a tile edge. */
export function wrap(x: number, half: number, draw: (x: number) => string): string {
  let s = draw(x);
  if (x + half > TILE) s += draw(x - TILE);
  if (x - half < 0) s += draw(x + TILE);
  return s;
}

/** A band of rolling hills (seamless: starts and ends at the same height). */
function hills(y: number, amp: number, fill: string, n = 4, phase = 0, lift = 2.5) {
  const step = TILE / n;
  let d = `M-40 ${y} L0 ${y}`;
  for (let i = 0; i < n; i++) {
    const x0 = i * step;
    const k = (i + phase) % 2 === 0 ? 1 : 0.45;
    d += ` C${x0 + step * 0.3} ${y - amp * k} ${x0 + step * 0.7} ${y - amp * k} ${x0 + step} ${y}`;
  }
  return piece(`${d} L${TILE + 40} ${y} L${TILE + 40} ${GROUND + 30} L-40 ${GROUND + 30} Z`, fill, { lift });
}

function canopy(x: number, base: number, s: number, dx = 0, dy = 0, k = 1) {
  const X = (v: number) => (x + dx + v * s * k).toFixed(1);
  const Y = (v: number) => (base + dy - v * s).toFixed(1);
  return `M${X(-56)} ${Y(118)} C${X(-74)} ${Y(150)} ${X(-50)} ${Y(186)} ${X(-24)} ${Y(178)} C${X(-18)} ${Y(214)} ${X(22)} ${Y(222)} ${X(32)} ${Y(186)} C${X(60)} ${Y(192)} ${X(76)} ${Y(154)} ${X(58)} ${Y(124)} C${X(62)} ${Y(94)} ${X(26)} ${Y(82)} ${X(4)} ${Y(96)} C${X(-20)} ${Y(80)} ${X(-60)} ${Y(92)} ${X(-56)} ${Y(118)} Z`;
}

/** A round paper tree: trunk plus three stacked canopy layers. */
export const tree = (x: number, s = 1, leaf = C.leaf, base = GROUND + 4) => wrap(x, 60 * s, (x) => `<g data-word="tree">
  ${piece(`M${x - 7 * s} ${base} C${x - 5 * s} ${base - 40 * s} ${x - 4 * s} ${base - 70 * s} ${x - 9 * s} ${base - 100 * s} L${x + 9 * s} ${base - 100 * s} C${x + 4 * s} ${base - 70 * s} ${x + 5 * s} ${base - 40 * s} ${x + 8 * s} ${base} Z`, C.bark, { lift: 1.6 })}
  ${piece(canopy(x, base, s), shade(leaf, -0.16), { lift: 2.4 })}
  ${piece(canopy(x, base, s, -5 * s, 12 * s, 0.78), leaf, { lift: 1.6 })}
  ${piece(canopy(x, base, s, -9 * s, 26 * s, 0.5), shade(leaf, 0.2), { lift: 1.2 })}</g>`);

/** A paper pine: three stacked tiers. */
export const pine = (x: number, s = 1, leaf = C.leaf, snow = false, base = GROUND + 4) => wrap(x, 44 * s, (x) => {
  const tier = (top: number, bot: number, w: number) =>
    `M${x} ${base - top * s} L${x + w * s} ${base - bot * s} C${x + w * 0.4 * s} ${base - (bot - 6) * s} ${x - w * 0.4 * s} ${base - (bot - 6) * s} ${x - w * s} ${base - bot * s} Z`;
  const cap = (top: number, bot: number, w: number) =>
    `M${x} ${base - top * s} L${x + w * 0.45 * s} ${base - (top - (top - bot) * 0.45) * s} C${x + 4 * s} ${base - (top - (top - bot) * 0.35) * s} ${x - 4 * s} ${base - (top - (top - bot) * 0.5) * s} ${x - w * 0.45 * s} ${base - (top - (top - bot) * 0.45) * s} Z`;
  return `<g data-word="tree">
    ${piece(`M${x - 6 * s} ${base} L${x + 6 * s} ${base} L${x + 5 * s} ${base - 24 * s} L${x - 5 * s} ${base - 24 * s} Z`, C.bark, { lift: 1.2 })}
    ${[[70, 20, 40], [110, 52, 32], [150, 86, 24]].map(([t, b, w], i) => piece(tier(t, b, w), shade(leaf, i * 0.1 - 0.08), { lift: 2 }) + (snow ? piece(cap(t, b, w), C.white, { lift: 0.6 }) : '')).join('')}</g>`;
});

const flower = (x: number, y: number, col: string, k = 1) => wrap(x, 10 * k, (x) => `
  ${line(`M${x} ${y + 4} C${x - 1} ${y + 12 * k} ${x + 1} ${y + 16 * k} ${x} ${y + 22 * k}`, shade(C.grass, -0.3), 2.2 * k)}
  ${piece([0, 72, 144, 216, 288].map((a) => {
    const r = (a * Math.PI) / 180;
    const cx = x + Math.sin(r) * 5.5 * k, cy = y - Math.cos(r) * 5.5 * k;
    return ell(cx, cy, 4 * k, 4 * k);
  }).join(' '), col, { lift: 0.8 })}
  ${flat(ell(x, y, 3.2 * k, 3.2 * k), C.mustard)}`);

const FLOWER_COLS = [C.white, C.butter, C.rose, C.coral, '#c9b8ec'];
function flowers(n: number, seed: number, y0 = GROUND + 6, y1 = GROUND + 18) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = ((i * 157 + seed * 61) % 800);
    const y = y0 + ((i * 37 + seed) % 10) / 10 * (y1 - y0);
    s += flower(x, y, FLOWER_COLS[(i + seed) % FLOWER_COLS.length], 0.8);
  }
  return s;
}

const tuft = (x: number, y: number, k: number, col: string) => wrap(x, 16 * k, (x) =>
  piece(`M${x - 14 * k} ${y} C${x - 12 * k} ${y - 12 * k} ${x - 8 * k} ${y - 20 * k} ${x - 5 * k} ${y - 24 * k} C${x - 4 * k} ${y - 12 * k} ${x - 1 * k} ${y - 7 * k} ${x} ${y - 3 * k} C${x + 2 * k} ${y - 14 * k} ${x + 7 * k} ${y - 24 * k} ${x + 11 * k} ${y - 27 * k} C${x + 11 * k} ${y - 14 * k} ${x + 12 * k} ${y - 5 * k} ${x + 16 * k} ${y} Z`, col, { lift: 0.8 }));

const farTrees = (y: number, fill: string, xs: number[]) => xs.map((x, i) => wrap(x, 14, (x) =>
  piece(`M${x} ${y - 34 - (i % 3) * 8} C${x + 12} ${y - 30} ${x + 14} ${y - 6} ${x + 12} ${y} L${x - 12} ${y} C${x - 14} ${y - 6} ${x - 12} ${y - 30} ${x} ${y - 34 - (i % 3) * 8} Z`, fill, { lift: 1 }))).join('');

const bush = (x: number, s: number, fill: string, base = GROUND + 6) => wrap(x, 70 * s, (x) => piece(
  `M${x - 60 * s} ${base} C${x - 70 * s} ${base - 30 * s} ${x - 40 * s} ${base - 50 * s} ${x - 18 * s} ${base - 40 * s} C${x - 8 * s} ${base - 66 * s} ${x + 30 * s} ${base - 64 * s} ${x + 36 * s} ${base - 38 * s} C${x + 60 * s} ${base - 44 * s} ${x + 74 * s} ${base - 14 * s} ${x + 60 * s} ${base} Z`, fill, { lift: 2 }));

const PLACES: Record<PlaceId, Place> = {
  park: {
    far1: '#c7dfb9', far2: '#a9cf98', ground: C.grass, trail: C.trail,
    far: () => hills(318, 40, '#c7dfb9', 3, 1) + farTrees(318, '#a9c99a', [60, 90, 380, 610, 640, 670]) + hills(344, 26, '#a9cf98', 4),
    mid: () => tree(90, 1.05) + bush(250, 0.7, shade(C.leaf, 0.15)) + tree(420, 0.85, C.leafLight) + tree(620, 1.15, shade(C.leaf, -0.05)) +
      wrap(740, 34, (x) => `<g data-word="bench">${piece(`M${x - 32} ${GROUND - 30} L${x + 32} ${GROUND - 30} L${x + 32} ${GROUND - 22} L${x - 32} ${GROUND - 22} Z M${x - 32} ${GROUND - 16} L${x + 32} ${GROUND - 16} L${x + 32} ${GROUND - 8} L${x - 32} ${GROUND - 8} Z`, '#c98d5e', { lift: 1.4 })}
        ${piece(`M${x - 26} ${GROUND - 8} L${x - 22} ${GROUND - 8} L${x - 22} ${GROUND + 6} L${x - 26} ${GROUND + 6} Z M${x + 22} ${GROUND - 8} L${x + 26} ${GROUND - 8} L${x + 26} ${GROUND + 6} L${x + 22} ${GROUND + 6} Z`, '#6b4a3a', { lift: 0.6 })}</g>`) +
      flowers(12, 1),
  },
  farm: {
    far1: '#dde8bc', far2: '#c2dc9c', ground: '#9fca78', trail: '#ecd0a2',
    far: () => hills(316, 34, '#dde8bc', 3) + hills(342, 24, '#c2dc9c', 4, 1) +
      `<g data-word="barn">${piece('M460 334 L460 292 L500 262 L540 292 L540 334 Z', C.coral, { lift: 1.6 })}
       ${piece('M456 294 L500 258 L544 294 L540 298 L500 266 L460 298 Z', '#7a4a45', { lift: 0.8 })}
       ${piece('M488 306 L512 306 L512 334 L488 334 Z', C.white, { lift: 0.6 })}${line('M488 306 L512 334 M512 306 L488 334', C.coral, 2)}
       ${piece('M550 278 L572 278 L572 334 L550 334 Z', '#d9d2c6', { lift: 1.4 })}${piece('M550 280 C550 262 572 262 572 280 Z', C.coral, { lift: 0.8 })}</g>`,
    mid: () => {
      let s = '';
      for (let x = 0; x < TILE; x += 40) s += piece(`M${x + 16} ${GROUND - 44} L${x + 20} ${GROUND - 50} L${x + 24} ${GROUND - 44} L${x + 24} ${GROUND + 4} L${x + 16} ${GROUND + 4} Z`, '#fff3e0', { lift: 1.2 });
      s += piece(`M-20 ${GROUND - 38} L${TILE + 20} ${GROUND - 38} L${TILE + 20} ${GROUND - 31} L-20 ${GROUND - 31} Z M-20 ${GROUND - 20} L${TILE + 20} ${GROUND - 20} L${TILE + 20} ${GROUND - 13} L-20 ${GROUND - 13} Z`, '#fff3e0', { lift: 1.2 });
      s += wrap(200, 34, (x) => `<g data-word="hay">${piece(`M${x - 32} ${GROUND + 4} L${x - 32} ${GROUND - 26} C${x - 32} ${GROUND - 38} ${x + 32} ${GROUND - 38} ${x + 32} ${GROUND - 26} L${x + 32} ${GROUND + 4} Z`, '#efcb7a', { lift: 2 })}
        ${line(`M${x - 24} ${GROUND - 20} L${x + 24} ${GROUND - 20} M${x - 24} ${GROUND - 6} L${x + 24} ${GROUND - 6}`, '#d4a54e', 2.4)}</g>`);
      for (const x of [420, 456, 650]) s += wrap(x, 20, (x) => `<g data-word="sunflower">${line(`M${x} ${GROUND + 4} L${x} ${GROUND - 70}`, '#5d9a52', 4)}
        ${piece(Array.from({ length: 10 }, (_, i) => ell(x + Math.cos(i * 0.628) * 13, GROUND - 76 + Math.sin(i * 0.628) * 13, 6, 6)).join(' '), C.butter, { lift: 1 })}
        ${piece(ell(x, GROUND - 76, 9, 9), '#8a5a3c', { lift: 0.6 })}</g>`);
      return s + flowers(5, 2);
    },
  },
  woods: {
    far1: '#b9d6ae', far2: '#98c28f', ground: '#86bd7a', trail: '#e4cda4',
    far: () => {
      let s = hills(330, 22, '#b9d6ae', 4);
      for (let x = 10; x < TILE; x += 44) s += wrap(x, 24, (x) => piece(`M${x} ${262 + (x % 3) * 10} L${x + 22} 334 L${x - 22} 334 Z`, '#98c28f', { lift: 1.2 }));
      return s;
    },
    mid: () => pine(60, 1.1) + pine(150, 0.8, C.leafLight) + tree(300, 1, '#5d9a66') + pine(440, 1.25) + pine(530, 0.9, C.leafLight) + tree(690, 0.9, C.leafLight) +
      [250, 600, 770].map((x) => wrap(x, 16, (x) => `<g data-word="mushroom">${piece(`M${x - 5} ${GROUND + 4} L${x - 4} ${GROUND - 12} L${x + 4} ${GROUND - 12} L${x + 5} ${GROUND + 4} Z`, '#fff3e0', { lift: 0.8 })}
        ${piece(`M${x - 16} ${GROUND - 10} C${x - 14} ${GROUND - 32} ${x + 14} ${GROUND - 32} ${x + 16} ${GROUND - 10} Z`, C.coral, { lift: 1.2 })}
        ${flat(ell(x - 6, GROUND - 20, 2.6, 2.6), C.white)}${flat(ell(x + 6, GROUND - 17, 2, 2), C.white)}</g>`)).join('') + flowers(4, 3),
  },
  snow: {
    far1: '#c8d6ea', far2: '#e6eef8', ground: '#f4f7fb', trail: '#dde6f2',
    far: () => {
      let s = '';
      for (const [x, h] of [[120, 170], [340, 214], [560, 160], [730, 190]] as const)
        s += wrap(x, 150, (x) => piece(`M${x - 150} 360 L${x} ${360 - h} L${x + 150} 360 Z`, '#b3c5e0', { lift: 2 }) +
          piece(`M${x - 46} ${360 - h * 0.7} L${x} ${360 - h} L${x + 46} ${360 - h * 0.7} L${x + 24} ${360 - h * 0.64} L${x + 8} ${360 - h * 0.72} L${x - 10} ${360 - h * 0.62} L${x - 26} ${360 - h * 0.7} Z`, C.white, { lift: 0.8 }));
      return s + hills(350, 16, '#e6eef8', 4);
    },
    mid: () => pine(80, 1, '#5f9e7e', true) + pine(170, 0.75, '#78b08e', true) + pine(480, 1.15, '#5f9e7e', true) + pine(760, 0.8, '#78b08e', true) +
      wrap(320, 32, (x) => `<g data-word="snowman">${piece(ell(x, GROUND - 22, 26, 26), C.white, { lift: 2 })}${piece(ell(x, GROUND - 62, 18, 18), C.white, { lift: 1.6 })}
        ${flat(ell(x - 2, GROUND - 66, 2.4, 2.4), C.ink)}${flat(ell(x + 8, GROUND - 66, 2.4, 2.4), C.ink)}
        ${piece(`M${x + 4} ${GROUND - 61} L${x + 20} ${GROUND - 58} L${x + 4} ${GROUND - 55} Z`, C.mustard, { lift: 0.5 })}
        ${piece(`M${x - 18} ${GROUND - 48} C${x - 6} ${GROUND - 40} ${x + 8} ${GROUND - 40} ${x + 18} ${GROUND - 48} L${x + 18} ${GROUND - 40} C${x + 6} ${GROUND - 34} ${x - 6} ${GROUND - 34} ${x - 18} ${GROUND - 40} Z`, C.teal, { lift: 0.8 })}
        ${flat(ell(x, GROUND - 26, 2.4, 2.4), C.ink)}${flat(ell(x, GROUND - 14, 2.4, 2.4), C.ink)}</g>`),
  },
  sand: {
    far1: '#f6e1b7', far2: '#efcf93', ground: '#f3d9a4', trail: '#f9e8c7',
    far: () => hills(316, 40, '#f6e1b7', 3, 1) + hills(342, 26, '#efcf93', 4),
    mid: () => {
      const cactus = (x: number, s: number) => wrap(x, 34 * s, (x) => `<g data-word="cactus">
        ${piece(`M${x - 26 * s} ${GROUND - 44 * s} C${x - 26 * s} ${GROUND - 36 * s} ${x - 20 * s} ${GROUND - 32 * s} ${x - 8} ${GROUND - 32 * s} L${x - 8} ${GROUND - 44 * s} C${x - 14 * s} ${GROUND - 44 * s} ${x - 14 * s} ${GROUND - 48 * s} ${x - 14 * s} ${GROUND - 52 * s} L${x - 14 * s} ${GROUND - 76 * s} C${x - 14 * s} ${GROUND - 86 * s} ${x - 26 * s} ${GROUND - 86 * s} ${x - 26 * s} ${GROUND - 76 * s} Z`, '#6fae7c', { lift: 1.4 })}
        ${piece(`M${x + 26 * s} ${GROUND - 60 * s} C${x + 26 * s} ${GROUND - 50 * s} ${x + 20 * s} ${GROUND - 46 * s} ${x + 8} ${GROUND - 46 * s} L${x + 8} ${GROUND - 58 * s} C${x + 14 * s} ${GROUND - 58 * s} ${x + 14 * s} ${GROUND - 62 * s} ${x + 14 * s} ${GROUND - 66 * s} L${x + 14 * s} ${GROUND - 88 * s} C${x + 14 * s} ${GROUND - 98 * s} ${x + 26 * s} ${GROUND - 98 * s} ${x + 26 * s} ${GROUND - 88 * s} Z`, '#6fae7c', { lift: 1.4 })}
        ${piece(`M${x - 13 * s} ${GROUND + 4} L${x - 13 * s} ${GROUND - 104 * s} C${x - 13 * s} ${GROUND - 124 * s} ${x + 13 * s} ${GROUND - 124 * s} ${x + 13 * s} ${GROUND - 104 * s} L${x + 13 * s} ${GROUND + 4} Z`, '#7cba88', { lift: 2 })}
        ${line(`M${x} ${GROUND - 108 * s} L${x} ${GROUND - 4}`, '#5f9e6e', 2)}
        ${piece(ell(x, GROUND - 120 * s, 6 * s, 5 * s), C.rose, { lift: 0.6 })}</g>`);
      const rock = (x: number) => wrap(x, 32, (x) => piece(`M${x - 30} ${GROUND + 4} C${x - 26} ${GROUND - 24} ${x} ${GROUND - 28} ${x + 6} ${GROUND - 26} C${x + 26} ${GROUND - 22} ${x + 32} ${GROUND - 8} ${x + 30} ${GROUND + 4} Z`, '#dcae82', { lift: 1.6 }));
      return cactus(120, 1) + rock(260) + cactus(450, 0.8) + cactus(640, 1.1) + rock(750);
    },
  },
  sea: {
    far1: '#8ecfd6', far2: '#f5e1b5', ground: '#f5e1b5', trail: '#fbeed4',
    far: () => piece(`M-40 298 L${TILE + 40} 298 L${TILE + 40} ${GROUND + 20} L-40 ${GROUND + 20} Z`, '#8ecfd6', { lift: 0 }) +
      piece(`M-40 330 C100 322 200 334 400 328 C600 322 700 334 ${TILE + 40} 328 L${TILE + 40} ${GROUND + 20} L-40 ${GROUND + 20} Z`, '#76c1c9', { lift: 1.4 }) +
      line('M40 312 q14 -6 28 0 M300 316 q14 -6 28 0 M520 310 q14 -6 28 0 M690 318 q14 -6 28 0', C.white, 2.4) +
      `<g data-word="boat">${piece('M600 296 L600 250 L632 292 Z', C.white, { lift: 1 })}${piece('M582 298 L638 298 L630 310 L590 310 Z', C.coral, { lift: 1 })}</g>`,
    mid: () => {
      const palm = (x: number, s: number) => wrap(x, 60 * s, (x) => `<g data-word="tree">
        ${piece(`M${x - 7 * s} ${GROUND + 4} C${x - 12 * s} ${GROUND - 60 * s} ${x - 2 * s} ${GROUND - 100 * s} ${x + 6 * s} ${GROUND - 128 * s} L${x + 16 * s} ${GROUND - 126 * s} C${x + 8 * s} ${GROUND - 96 * s} ${x - 2 * s} ${GROUND - 60 * s} ${x + 7 * s} ${GROUND + 4} Z`, '#c99b6c', { lift: 1.4 })}
        ${[-160, -110, -50, 0, 50].map((a) => {
          const r = (a * Math.PI) / 180;
          const ex = x + 11 * s + Math.cos(r) * 62 * s, ey = GROUND - 128 * s + Math.sin(r) * 28 * s + 26 * s;
          return piece(`M${x + 11 * s} ${GROUND - 128 * s} Q${(x + 11 * s + ex) / 2} ${GROUND - 150 * s} ${ex} ${ey} Q${(x + 11 * s + ex) / 2} ${GROUND - 132 * s} ${x + 11 * s} ${GROUND - 122 * s} Z`, a % 100 === 0 ? C.leaf : C.leafLight, { lift: 1.4 });
        }).join('')}
        ${piece(ell(x + 8 * s, GROUND - 120 * s, 5 * s, 5 * s), '#8a5a3c', { lift: 0.5 })}</g>`);
      const umbrella = wrap(420, 54, (x) => `<g data-word="umbrella">${line(`M${x} ${GROUND + 4} L${x} ${GROUND - 70}`, C.ink, 3)}
        ${piece(`M${x - 52} ${GROUND - 64} C${x - 40} ${GROUND - 108} ${x + 40} ${GROUND - 108} ${x + 52} ${GROUND - 64} Z`, C.coral, { lift: 2 })}
        ${piece(`M${x - 17} ${GROUND - 64} C${x - 14} ${GROUND - 100} ${x + 14} ${GROUND - 100} ${x + 17} ${GROUND - 64} Z`, C.white, { lift: 0.6 })}</g>`);
      const castle = wrap(640, 36, (x) => `<g data-word="castle">${piece(`M${x - 34} ${GROUND + 4} L${x - 34} ${GROUND - 46} L${x - 16} ${GROUND - 46} L${x - 16} ${GROUND - 28} L${x + 16} ${GROUND - 28} L${x + 16} ${GROUND - 46} L${x + 34} ${GROUND - 46} L${x + 34} ${GROUND + 4} Z`, '#ecc98a', { lift: 1.8 })}
        ${line(`M${x + 25} ${GROUND - 46} L${x + 25} ${GROUND - 64}`, C.ink, 1.6)}${piece(`M${x + 26} ${GROUND - 64} L${x + 40} ${GROUND - 58} L${x + 26} ${GROUND - 53} Z`, C.coral, { lift: 0.6 })}</g>`);
      return palm(120, 1) + umbrella + castle + palm(760, 0.8);
    },
    near: () => [60, 230, 470, 610, 720].map((x, i) => wrap(x, 10, (x) => piece(`M${x - 8} ${GROUND + 62 + (i % 3) * 5} C${x - 6} ${GROUND + 50 + (i % 3) * 5} ${x + 6} ${GROUND + 50 + (i % 3) * 5} ${x + 8} ${GROUND + 62 + (i % 3) * 5} Z`, C.rose, { lift: 0.8 }))).join(''),
  },
  hill: {
    far1: '#d6cdea', far2: '#bfdca8', ground: '#a7d38c', trail: '#f0dcb4',
    far: () => hills(290, 60, '#d6cdea', 2, 1) + hills(318, 36, '#c6e2b0', 3) + hills(342, 22, '#b3d99a', 4, 1),
    mid: () => wrap(560, 70, (x) => `<g data-word="windmill">${piece(`M${x - 22} ${GROUND + 4} L${x - 12} ${GROUND - 110} L${x + 12} ${GROUND - 110} L${x + 22} ${GROUND + 4} Z`, '#fff3e0', { lift: 2 })}
        ${piece(`M${x - 18} ${GROUND - 108} C${x - 14} ${GROUND - 134} ${x + 14} ${GROUND - 134} ${x + 18} ${GROUND - 108} Z`, C.coral, { lift: 1.2 })}
        ${piece(`M${x - 7} ${GROUND + 4} L${x - 7} ${GROUND - 20} C${x - 7} ${GROUND - 28} ${x + 7} ${GROUND - 28} ${x + 7} ${GROUND - 20} L${x + 7} ${GROUND + 4} Z`, '#a8744f', { lift: 0.6 })}
        <g class="spin" style="transform-origin:${x}px ${GROUND - 114}px">
          ${[0, 90, 180, 270].map((a) => piece(`M${x - 8} ${GROUND - 176} L${x + 8} ${GROUND - 176} L${x + 5} ${GROUND - 116} L${x - 5} ${GROUND - 116} Z`, C.white, { lift: 1.2, t: `rotate(${a} ${x} ${GROUND - 114})` })).join('')}
          ${piece(ell(x, GROUND - 114, 7, 7), C.bark, { lift: 0.6 })}</g></g>`) +
      tree(180, 0.9, C.leafLight) + flowers(16, 5),
  },
  pond: {
    far1: '#c6e2b8', far2: '#acd29a', ground: C.grass, trail: '#eed9ae',
    far: () => hills(320, 28, '#c6e2b8', 3) + farTrees(320, '#a7c99a', [120, 150, 520, 720]) + hills(344, 18, '#acd29a', 4, 1),
    mid: () => wrap(420, 176, (x) => `<g data-word="pond">
        ${piece(ell(x, GROUND + 10, 172, 24), '#7cc4cc', { lift: 0 })}${piece(ell(x - 14, GROUND + 6, 120, 12), '#a4d9de', { lift: 0 })}
        ${piece(`M${x - 96} ${GROUND + 10} a14 7 0 1 1 1 0 Z M${x + 60} ${GROUND + 14} a12 6 0 1 1 1 0 Z`, C.leafLight, { lift: 0.8 })}
        ${piece(ell(x - 92, GROUND + 3, 4, 4), C.rose, { lift: 0.4 })}
        ${[-164, -152, 152, 164].map((d) => line(`M${x + d} ${GROUND + 8} L${x + d + 2} ${GROUND - 56}`, '#5d9a52', 3.4) +
          piece(`M${x + d - 3} ${GROUND - 38} L${x + d - 3} ${GROUND - 58} C${x + d - 3} ${GROUND - 64} ${x + d + 6} ${GROUND - 64} ${x + d + 6} ${GROUND - 58} L${x + d + 6} ${GROUND - 38} Z`, '#8a5a3c', { lift: 0.8 })).join('')}</g>`) +
      tree(80, 0.8, C.leafLight) + tree(730, 1),
  },
};

export const PLACE_IDS = Object.keys(PLACES) as PlaceId[];

/** Far, middle and ground tiles for a place (each 800 wide, repeatable). */
export function placeLayers(id: PlaceId) {
  const p = PLACES[id];
  const i = PLACE_IDS.indexOf(id);
  const pebbles = [[40, 34, 6], [150, 44, 4], [290, 38, 5], [430, 46, 4], [560, 36, 6], [700, 44, 4]]
    .map(([x, y, r]) => wrap(x, 12, (x) => piece(ell(x, GROUND + y, r * 1.6, r), shade(p.trail, -0.14), { lift: 0.6 }))).join('');
  const ground = piece(`M-40 ${GROUND} C200 ${GROUND - 6} 600 ${GROUND + 6} ${TILE + 40} ${GROUND} L${TILE + 40} ${GROUND + 1200} L-40 ${GROUND + 1200} Z`, p.ground, { lift: 2.4 }) +
    piece(`M-40 ${GROUND + 28} C200 ${GROUND + 22} 600 ${GROUND + 32} ${TILE + 40} ${GROUND + 28} L${TILE + 40} ${GROUND + 58} C600 ${GROUND + 62} 200 ${GROUND + 54} -40 ${GROUND + 58} Z`, p.trail, { lift: 1.6 }) +
    pebbles +
    [30, 210, 380, 520, 690].map((x, k) => tuft(x, GROUND + 76 + (k % 2) * 6, 0.9, shade(p.ground, -0.12))).join('') +
    (p.near ? p.near() : '');
  void i;
  return { far: p.far(), mid: p.mid(), ground };
}

// ---------- skies ----------

const SKY: Record<SkyId, [string, string]> = {
  sun: ['#9fd0d6', '#f6ecd9'],
  cloud: ['#b8cdd6', '#eef1ee'],
  rain: ['#9fb1c0', '#dfe5e6'],
  rainbow: ['#a6d6dc', '#fbeee0'],
  moon: ['#2f3a6a', '#5d5f98'],
};

export const skyColors = (id: SkyId) => SKY[id];

/** Paper sky bands, lighter toward the horizon. */
export function skyBands(id: SkyId, x0: number, y0: number, w: number) {
  const [top, bottom] = SKY[id];
  const band = (y: number, fill: string) =>
    piece(`M${x0 - 20} ${y} C${x0 + w * 0.25} ${y - 18} ${x0 + w * 0.5} ${y + 14} ${x0 + w * 0.75} ${y - 6} C${x0 + w * 0.88} ${y - 14} ${x0 + w} ${y - 4} ${x0 + w + 20} ${y - 10} L${x0 + w + 20} ${GROUND + 40} L${x0 - 20} ${GROUND + 40} Z`, fill, { lift: 2 });
  const mix = (k: number) => {
    const a = parseInt(top.slice(1), 16), b = parseInt(bottom.slice(1), 16);
    const ch = (sh: number) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
    return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
  };
  return `<rect x="${x0 - 20}" y="${y0 - 20}" width="${w + 40}" height="${GROUND - y0 + 60}" fill="${top}"/>` +
    band(120, mix(0.3)) + band(200, mix(0.6)) + band(270, mix(0.9));
}

export const sunArt = (x: number, y: number, r = 34) => `<g data-word="sun" class="sun">
  <g class="rays" style="transform-origin:${x}px ${y}px">${piece(Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `M${x + Math.cos(a - 0.12) * (r + 6)} ${y + Math.sin(a - 0.12) * (r + 6)} L${x + Math.cos(a) * (r + 26)} ${y + Math.sin(a) * (r + 26)} L${x + Math.cos(a + 0.12) * (r + 6)} ${y + Math.sin(a + 0.12) * (r + 6)} Z`;
  }).join(' '), shade(C.butter, 0.2), { lift: 1.2 })}</g>
  ${piece(ell(x, y, r, r), '#f7c85e', { lift: 2 })}${piece(ell(x - 3, y - 3, r * 0.72, r * 0.72), '#f9d77e', { lift: 0.6 })}
  ${flat(ell(x - 10, y - 2, 3, 3.6), C.ink)}${flat(ell(x + 10, y - 2, 3, 3.6), C.ink)}
  ${line(`M${x - 7} ${y + 9} C${x - 3} ${y + 13} ${x + 3} ${y + 13} ${x + 7} ${y + 9}`, C.ink, 2)}
  ${flat(ell(x - 18, y + 8, 5, 3), C.blush, 'opacity="0.8"')}${flat(ell(x + 18, y + 8, 5, 3), C.blush, 'opacity="0.8"')}</g>`;

export const moonArt = (x: number, y: number, r = 32) => `<g data-word="moon">
  ${piece(`M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.55} ${r} 0 1 1 ${x} ${y - r} Z`, '#f8e7a8', { lift: 2 })}
  ${flat(ell(x - r * 0.62, y - r * 0.12, r * 0.09, r * 0.11), C.ink)}
  ${line(`M${x - r * 0.8} ${y + r * 0.22} Q${x - r * 0.66} ${y + r * 0.34} ${x - r * 0.5} ${y + r * 0.24}`, C.ink, 1.8)}</g>`;

export const cloudArt = (x: number, y: number, s = 1, fill = C.white) => `<g data-word="cloud">${piece(
  `M${x - 70 * s} ${y + 18 * s} C${x - 92 * s} ${y + 18 * s} ${x - 90 * s} ${y - 12 * s} ${x - 60 * s} ${y - 8 * s} C${x - 52 * s} ${y - 42 * s} ${x - 6 * s} ${y - 46 * s} ${x + 8 * s} ${y - 18 * s} C${x + 32 * s} ${y - 40 * s} ${x + 74 * s} ${y - 24 * s} ${x + 66 * s} ${y + 2 * s} C${x + 92 * s} ${y + 4 * s} ${x + 90 * s} ${y + 18 * s} ${x + 70 * s} ${y + 18 * s} Z`, fill, { lift: 2.4 })}</g>`;

export const rainbowArt = (x: number, y: number, r = 150) => `<g data-word="rainbow">
  ${[C.coral, '#f0a560', C.butter, '#9fcf8a', '#8ecfd6', '#a99ad8'].map((c, i) => {
    const R = r - i * 12;
    return piece(`M${x - R} ${y} A${R} ${R} 0 0 1 ${x + R} ${y} L${x + R - 12} ${y} A${R - 12} ${R - 12} 0 0 0 ${x - R + 12} ${y} Z`, c, { lift: 1.2 });
  }).join('')}</g>`;

/** Card picture (200×200) for a sky choice. */
export function skyIcon(id: SkyId): string {
  const bg = piece(ell(100, 100, 92, 92), id === 'moon' ? '#3f4a7a' : '#d6ecee', { lift: 2 });
  switch (id) {
    case 'sun': return bg + sunArt(100, 100, 40);
    case 'moon': return bg + moonArt(110, 100, 50) + piece('M150 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z M158 146 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z', C.butter, { lift: 0.6 });
    case 'cloud': return bg + cloudArt(100, 110, 1.15);
    case 'rain': return bg + cloudArt(100, 82, 1.05, '#eef1f2') + piece([60, 88, 116, 144, 74, 130].map((x, i) => `M${x} ${118 + (i > 3 ? 32 : 0)} C${x - 5} ${130 + (i > 3 ? 32 : 0)} ${x + 5} ${130 + (i > 3 ? 32 : 0)} ${x} ${118 + (i > 3 ? 32 : 0)} Z`).join(' '), '#6fb6d6', { lift: 0.8 });
    case 'rainbow': return bg + rainbowArt(100, 150, 84) + cloudArt(36, 150, 0.5) + cloudArt(164, 150, 0.5);
  }
}

/** Card picture (200×200) for a place: a little paper window into the scenery. */
export function placeIcon(id: PlaceId): string {
  const l = placeLayers(id);
  const x0 = { park: 20, farm: 400, woods: 20, snow: 220, sand: 20, sea: 330, hill: 460, pond: 300 }[id];
  return `<defs><clipPath id="pc-${id}"><rect x="0" y="0" width="200" height="200" rx="26"/></clipPath></defs>
    <g filter="url(#ps)"><rect x="0" y="0" width="200" height="200" rx="26" fill="${SKY.sun[0]}"/></g>
    <g clip-path="url(#pc-${id})"><g transform="scale(0.8) translate(${-x0} -215)">${skyBands('sun', x0 - 20, 215, 290)}${l.far}${l.mid}${l.ground}</g></g>`;
}
