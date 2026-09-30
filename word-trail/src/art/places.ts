import { INK, OUT, THIN, rng } from './palette';

// Scenery for the walk. Each place draws three 800-wide tiles that repeat
// seamlessly (far, middle and ground), on a 450-high stage whose ground
// starts at y=370. Skies extend far above so tall phone screens still work.

export const TILE = 800;
export const GROUND = 370;

export type PlaceId = 'park' | 'farm' | 'woods' | 'snow' | 'sand' | 'sea' | 'hill' | 'pond';
export type SkyId = 'sun' | 'cloud' | 'rain' | 'rainbow' | 'moon';

interface Place {
  ground: string;
  trail: string;
  far: (r: () => number) => string;
  mid: (r: () => number) => string;
  near?: (r: () => number) => string;
}

/** Draw at x, and again one tile over when the shape crosses a tile edge. */
function wrap(x: number, half: number, draw: (x: number) => string): string {
  let s = draw(x);
  if (x + half > TILE) s += draw(x - TILE);
  if (x - half < 0) s += draw(x + TILE);
  return s;
}

const hills = (y: number, amp: number, fill: string, n = 4, phase = 0) => {
  const step = TILE / n;
  let d = `M0 ${y}`;
  for (let i = 0; i < n; i++) {
    const x0 = i * step;
    const up = (i + phase) % 2 === 0 ? -amp : -amp * 0.4;
    d += ` Q${x0 + step / 2} ${y + up * 2} ${x0 + step} ${y}`;
  }
  return `<path d="${d} L${TILE} ${GROUND + 10} L0 ${GROUND + 10} Z" fill="${fill}"/>`;
};

const roundTree = (x: number, s = 1, leaf = '#8fd18a', leaf2 = '#a8e09c') => wrap(x, 50 * s, (x) => `
  <g data-word="tree"><rect x="${x - 7 * s}" y="${GROUND - 60 * s}" width="${14 * s}" height="${62 * s}" rx="${5 * s}" fill="#b88462" ${THIN}/>
  <circle cx="${x - 22 * s}" cy="${GROUND - 70 * s}" r="${26 * s}" fill="${leaf}" ${OUT}/>
  <circle cx="${x + 22 * s}" cy="${GROUND - 72 * s}" r="${26 * s}" fill="${leaf}" ${OUT}/>
  <circle cx="${x}" cy="${GROUND - 96 * s}" r="${30 * s}" fill="${leaf}" ${OUT}/>
  <circle cx="${x - 8 * s}" cy="${GROUND - 104 * s}" r="${10 * s}" fill="${leaf2}"/></g>`);

const pine = (x: number, s = 1, fill = '#6fb58a', snow = false) => wrap(x, 40 * s, (x) => `
  <g data-word="tree"><rect x="${x - 6 * s}" y="${GROUND - 26 * s}" width="${12 * s}" height="${28 * s}" rx="3" fill="#a8744f" ${THIN}/>
  <path d="M${x} ${GROUND - 150 * s} L${x + 36 * s} ${GROUND - 24 * s} Q${x} ${GROUND - 14 * s} ${x - 36 * s} ${GROUND - 24 * s} Z" fill="${fill}" ${OUT}/>
  ${snow ? `<path d="M${x} ${GROUND - 150 * s} L${x + 16 * s} ${GROUND - 94 * s} Q${x} ${GROUND - 104 * s} ${x - 16 * s} ${GROUND - 94 * s} Z" fill="#fff"/>
  <path d="M${x - 26 * s} ${GROUND - 56 * s} Q${x} ${GROUND - 66 * s} ${x + 26 * s} ${GROUND - 56 * s}" stroke="#fff" stroke-width="${6 * s}" stroke-linecap="round" fill="none"/>` : ''}</g>`);

const flower = (x: number, y: number, c: string) => wrap(x, 8, (x) => `
  <path d="M${x} ${y} L${x} ${y + 12}" stroke="#6fb566" stroke-width="2.5"/>
  <circle cx="${x - 4}" cy="${y}" r="4" fill="${c}"/><circle cx="${x + 4}" cy="${y}" r="4" fill="${c}"/>
  <circle cx="${x}" cy="${y - 4}" r="4" fill="${c}"/><circle cx="${x}" cy="${y + 4}" r="4" fill="${c}"/>
  <circle cx="${x}" cy="${y}" r="3" fill="#ffe28a"/>`);

const FLOWERS = ['#ff9fb2', '#ffd45c', '#b8a3f0', '#fff', '#ff9f7a'];
const flowers = (r: () => number, n: number, y0 = GROUND + 4, y1 = GROUND + 16) =>
  Array.from({ length: n }, () => flower(r() * TILE, y0 + r() * (y1 - y0), FLOWERS[Math.floor(r() * FLOWERS.length)])).join('');

const tufts = (r: () => number, n: number, c: string) =>
  Array.from({ length: n }, () => {
    const x = r() * TILE;
    const y = GROUND + 58 + r() * 20;
    return wrap(x, 10, (x) => `<path d="M${x - 8} ${y} Q${x - 6} ${y - 12} ${x - 2} ${y} Q${x} ${y - 16} ${x + 3} ${y} Q${x + 6} ${y - 11} ${x + 8} ${y}" fill="${c}"/>`);
  }).join('');

const PLACES: Record<PlaceId, Place> = {
  park: {
    ground: '#a6db8f',
    trail: '#f3dfb4',
    far: () => hills(320, 30, '#cdebb8', 3, 1) + hills(342, 22, '#b5e0a0', 4),
    mid: (r) => roundTree(90) + roundTree(330, 0.8) + roundTree(560, 1.1, '#9ed98b') +
      wrap(720, 30, (x) => `<g data-word="bench"><rect x="${x - 30}" y="${GROUND - 26}" width="60" height="8" rx="3" fill="#c98d5e" ${THIN}/>
        <rect x="${x - 30}" y="${GROUND - 40}" width="60" height="8" rx="3" fill="#c98d5e" ${THIN}/>
        <path d="M${x - 24} ${GROUND - 18} L${x - 24} ${GROUND + 2} M${x + 24} ${GROUND - 18} L${x + 24} ${GROUND + 2}" ${OUT}/></g>`) + flowers(r, 14),
  },
  farm: {
    ground: '#b7de8c',
    trail: '#e9c99a',
    far: () => hills(318, 26, '#d7eeb0', 3) + hills(340, 20, '#c2e59c', 4, 1) +
      `<g data-word="barn"><path d="M470 330 L470 290 L505 262 L540 290 L540 330 Z" fill="#ff8a7a" ${THIN}/>
       <rect x="494" y="304" width="22" height="26" fill="#fff" ${THIN}/><path d="M494 304 L516 330 M516 304 L494 330" stroke="#ff8a7a" stroke-width="2"/>
       <rect x="548" y="276" width="20" height="54" rx="4" fill="#dcd6e8" ${THIN}/><path d="M548 280 Q558 262 568 280" fill="#ff8a7a" ${THIN}/></g>`,
    mid: (r) => {
      let s = '';
      for (let x = 0; x < TILE; x += 40) s += `<rect x="${x + 16}" y="${GROUND - 44}" width="8" height="46" rx="3" fill="#fff4e4" ${THIN}/>`;
      s += `<path d="M0 ${GROUND - 34} L${TILE} ${GROUND - 34} M0 ${GROUND - 16} L${TILE} ${GROUND - 16}" stroke="${INK}" stroke-width="8"/>
        <path d="M0 ${GROUND - 34} L${TILE} ${GROUND - 34} M0 ${GROUND - 16} L${TILE} ${GROUND - 16}" stroke="#fff4e4" stroke-width="4"/>`;
      s += wrap(200, 30, (x) => `<g data-word="hay"><rect x="${x - 30}" y="${GROUND - 36}" width="60" height="40" rx="12" fill="#f7d98e" ${OUT}/>
        <path d="M${x - 22} ${GROUND - 24} L${x + 22} ${GROUND - 24} M${x - 22} ${GROUND - 10} L${x + 22} ${GROUND - 10}" stroke="#e0b860" stroke-width="3"/></g>`);
      for (const x of [420, 460, 640]) s += wrap(x, 20, (x) => `<g data-word="sunflower"><path d="M${x} ${GROUND + 2} L${x} ${GROUND - 70}" stroke="#6fb566" stroke-width="5"/>
        <circle cx="${x}" cy="${GROUND - 76}" r="16" fill="#ffd45c" ${THIN}/><circle cx="${x}" cy="${GROUND - 76}" r="8" fill="#a8744f"/></g>`);
      return s + flowers(r, 6);
    },
  },
  woods: {
    ground: '#8fcf8f',
    trail: '#dcc4a0',
    far: () => {
      let s = hills(330, 20, '#a7d7a8', 4);
      for (let x = 20; x < TILE; x += 46) s += wrap(x, 24, (x) => `<path d="M${x} 250 L${x + 24} 334 L${x - 24} 334 Z" fill="#86c29a"/>`);
      return s;
    },
    mid: (r) => pine(60, 1.1) + pine(150, 0.8, '#7fbf94') + roundTree(290, 1, '#7cc98a') + pine(430, 1.2) + pine(520, 0.9, '#7fbf94') + roundTree(680, 0.9, '#8fd18a') +
      [250, 610, 760].map((x) => wrap(x, 14, (x) => `<g data-word="mushroom"><rect x="${x - 5}" y="${GROUND - 14}" width="10" height="16" rx="4" fill="#fff4e4" ${THIN}/>
        <path d="M${x - 16} ${GROUND - 12} Q${x} ${GROUND - 34} ${x + 16} ${GROUND - 12} Z" fill="#ff7a7a" ${THIN}/>
        <circle cx="${x - 5}" cy="${GROUND - 20}" r="2.5" fill="#fff"/><circle cx="${x + 6}" cy="${GROUND - 18}" r="2" fill="#fff"/></g>`)).join('') + flowers(r, 6),
  },
  snow: {
    ground: '#f4f8ff',
    trail: '#dbe7f7',
    far: () => {
      let s = '';
      for (const [x, h] of [[120, 170], [330, 210], [560, 160], [720, 190]] as const)
        s += wrap(x, 150, (x) => `<path d="M${x - 150} 360 L${x} ${360 - h} L${x + 150} 360 Z" fill="#b6c8e6"/>
          <path d="M${x - 45} ${360 - h * 0.7} L${x} ${360 - h} L${x + 45} ${360 - h * 0.7} Q${x + 22} ${360 - h * 0.62} ${x} ${360 - h * 0.72} Q${x - 22} ${360 - h * 0.62} ${x - 45} ${360 - h * 0.7} Z" fill="#fff"/>`);
      return s + hills(350, 16, '#e3ecf9', 4);
    },
    mid: () => pine(80, 1, '#7fbf9f', true) + pine(170, 0.75, '#8fc9aa', true) + pine(470, 1.1, '#7fbf9f', true) + pine(760, 0.8, '#8fc9aa', true) +
      wrap(320, 30, (x) => `<g data-word="snowman"><circle cx="${x}" cy="${GROUND - 24}" r="26" fill="#fff" ${OUT}/>
        <circle cx="${x}" cy="${GROUND - 64}" r="18" fill="#fff" ${OUT}/>
        <circle cx="${x - 6}" cy="${GROUND - 68}" r="2.6" fill="${INK}"/><circle cx="${x + 6}" cy="${GROUND - 68}" r="2.6" fill="${INK}"/>
        <path d="M${x} ${GROUND - 62} L${x + 14} ${GROUND - 59} L${x} ${GROUND - 57} Z" fill="#ff9f45"/>
        <path d="M${x - 16} ${GROUND - 48} Q${x} ${GROUND - 42} ${x + 16} ${GROUND - 48}" stroke="#ff8a7a" stroke-width="7" fill="none" stroke-linecap="round"/>
        <circle cx="${x}" cy="${GROUND - 28}" r="2.6" fill="${INK}"/><circle cx="${x}" cy="${GROUND - 16}" r="2.6" fill="${INK}"/></g>`),
  },
  sand: {
    ground: '#f7dca6',
    trail: '#fbe9c6',
    far: () => hills(318, 34, '#f9e3b8', 3, 1) + hills(340, 24, '#f3cf94', 4),
    mid: () => {
      const cactus = (x: number, s: number) => wrap(x, 30 * s, (x) => `<g data-word="cactus">
        <path d="M${x - 24 * s} ${GROUND - 60 * s} L${x - 24 * s} ${GROUND - 80 * s}" stroke="${INK}" stroke-width="${16 * s + 5}" stroke-linecap="round"/>
        <path d="M${x - 24 * s} ${GROUND - 50 * s} Q${x - 24 * s} ${GROUND - 40 * s} ${x - 8} ${GROUND - 40 * s}" stroke="${INK}" stroke-width="${16 * s + 5}" stroke-linecap="round" fill="none"/>
        <path d="M${x + 24 * s} ${GROUND - 70 * s} Q${x + 24 * s} ${GROUND - 56 * s} ${x + 8} ${GROUND - 56 * s}" stroke="${INK}" stroke-width="${16 * s + 5}" stroke-linecap="round" fill="none"/>
        <path d="M${x} ${GROUND} L${x} ${GROUND - 110 * s}" stroke="${INK}" stroke-width="${26 * s + 5}" stroke-linecap="round"/>
        <path d="M${x - 24 * s} ${GROUND - 50 * s} L${x - 24 * s} ${GROUND - 80 * s} M${x - 24 * s} ${GROUND - 50 * s} Q${x - 24 * s} ${GROUND - 40 * s} ${x - 8} ${GROUND - 40 * s}" stroke="#86c99a" stroke-width="${16 * s}" stroke-linecap="round" fill="none"/>
        <path d="M${x + 24 * s} ${GROUND - 70 * s} L${x + 24 * s} ${GROUND - 88 * s} M${x + 24 * s} ${GROUND - 70 * s} Q${x + 24 * s} ${GROUND - 56 * s} ${x + 8} ${GROUND - 56 * s}" stroke="#86c99a" stroke-width="${16 * s}" stroke-linecap="round" fill="none"/>
        <path d="M${x} ${GROUND} L${x} ${GROUND - 110 * s}" stroke="#86c99a" stroke-width="${26 * s}" stroke-linecap="round"/>
        <circle cx="${x}" cy="${GROUND - 122 * s}" r="${6 * s}" fill="#ff8fb0"/></g>`);
      const rock = (x: number) => wrap(x, 30, (x) => `<path d="M${x - 30} ${GROUND + 2} Q${x - 26} ${GROUND - 26} ${x} ${GROUND - 28} Q${x + 28} ${GROUND - 24} ${x + 30} ${GROUND + 2} Z" fill="#e3b88a" ${OUT}/>`);
      return cactus(120, 1) + rock(260) + cactus(450, 0.8) + cactus(640, 1.1) + rock(740);
    },
  },
  sea: {
    ground: '#fbe3b0',
    trail: '#fdf0d2',
    far: () => `<rect x="0" y="300" width="${TILE}" height="80" fill="#8fd3ee"/>
      <path d="M0 300 L${TILE} 300" stroke="#b9e6f7" stroke-width="4"/>
      <path d="M40 330 q14 -6 28 0 M300 318 q14 -6 28 0 M520 340 q14 -6 28 0 M680 322 q14 -6 28 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g data-word="boat"><path d="M600 300 L600 250 L630 294 Z" fill="#fff"/><path d="M584 300 L636 300 L628 310 L592 310 Z" fill="#ff8a7a"/></g>`,
    mid: () => {
      const palm = (x: number, s: number) => wrap(x, 50 * s, (x) => `<g data-word="tree">
        <path d="M${x} ${GROUND + 2} Q${x - 6 * s} ${GROUND - 60 * s} ${x + 10 * s} ${GROUND - 130 * s}" stroke="${INK}" stroke-width="${14 * s + 5}" fill="none" stroke-linecap="round"/>
        <path d="M${x} ${GROUND + 2} Q${x - 6 * s} ${GROUND - 60 * s} ${x + 10 * s} ${GROUND - 130 * s}" stroke="#d9a574" stroke-width="${14 * s}" fill="none" stroke-linecap="round"/>
        ${[-150, -100, -40, 10, 60].map((a) => `<path d="M${x + 10 * s} ${GROUND - 130 * s} q${Math.cos((a * Math.PI) / 180) * 30 * s} ${Math.sin((a * Math.PI) / 180) * 20 * s - 10 * s} ${Math.cos((a * Math.PI) / 180) * 56 * s} ${Math.sin((a * Math.PI) / 180) * 40 * s + 14 * s}" stroke="#6fbf7a" stroke-width="${12 * s}" fill="none" stroke-linecap="round"/>`).join('')}
        <circle cx="${x + 6 * s}" cy="${GROUND - 124 * s}" r="${6 * s}" fill="#a8744f"/></g>`);
      const umbrella = wrap(420, 50, (x) => `<g data-word="umbrella"><path d="M${x} ${GROUND + 4} L${x} ${GROUND - 70}" stroke="${INK}" stroke-width="4"/>
        <path d="M${x - 50} ${GROUND - 66} Q${x} ${GROUND - 110} ${x + 50} ${GROUND - 66} Z" fill="#ff8fb0" ${OUT}/>
        <path d="M${x - 16} ${GROUND - 72} Q${x} ${GROUND - 110} ${x + 16} ${GROUND - 72} Z" fill="#fff"/></g>`);
      const castle = wrap(640, 30, (x) => `<g data-word="castle"><rect x="${x - 26}" y="${GROUND - 30}" width="52" height="32" fill="#f3cf94" ${THIN}/>
        <rect x="${x - 34}" y="${GROUND - 46}" width="18" height="48" fill="#f3cf94" ${THIN}/><rect x="${x + 16}" y="${GROUND - 46}" width="18" height="48" fill="#f3cf94" ${THIN}/>
        <path d="M${x + 25} ${GROUND - 46} L${x + 25} ${GROUND - 62} L${x + 38} ${GROUND - 56} L${x + 25} ${GROUND - 52}" fill="#ff8a7a" stroke="${INK}" stroke-width="1.5"/></g>`);
      return palm(120, 1) + umbrella + castle + palm(760, 0.8);
    },
    near: (r) => Array.from({ length: 5 }, () => {
      const x = r() * TILE;
      const y = GROUND + 60 + r() * 14;
      return wrap(x, 10, (x) => `<path d="M${x - 8} ${y} Q${x} ${y - 14} ${x + 8} ${y} Z" fill="#ffc2d1" ${THIN}/>`);
    }).join(''),
  },
  hill: {
    ground: '#b3e09a',
    trail: '#f0dcb4',
    far: () => hills(290, 50, '#d8cdf0', 2, 1) + hills(318, 34, '#c6e8b0', 3) + hills(342, 20, '#b3e09a', 4, 1),
    mid: (r) => wrap(560, 70, (x) => `<g data-word="windmill"><path d="M${x - 20} ${GROUND + 2} L${x - 12} ${GROUND - 110} L${x + 12} ${GROUND - 110} L${x + 20} ${GROUND + 2} Z" fill="#fff4e4" ${OUT}/>
        <path d="M${x - 16} ${GROUND - 110} Q${x} ${GROUND - 134} ${x + 16} ${GROUND - 110} Z" fill="#ff8a7a" ${OUT}/>
        <rect x="${x - 7}" y="${GROUND - 26}" width="14" height="28" rx="6" fill="#c98d5e" ${THIN}/>
        <g class="spin" style="transform-origin:${x}px ${GROUND - 112}px">
          ${[0, 90, 180, 270].map((a) => `<rect x="${x - 7}" y="${GROUND - 176}" width="14" height="62" rx="4" fill="#fff" ${THIN} transform="rotate(${a} ${x} ${GROUND - 112})"/>`).join('')}
          <circle cx="${x}" cy="${GROUND - 112}" r="7" fill="#b88462" ${THIN}/></g></g>`) +
      roundTree(180, 0.9, '#9ed98b') + flowers(r, 18),
  },
  pond: {
    ground: '#a6db8f',
    trail: '#eed9ae',
    far: () => hills(320, 24, '#c8e8c0', 3) + hills(344, 16, '#b5e0a0', 4, 1),
    mid: () => wrap(420, 170, (x) => `<g data-word="pond">
        <ellipse cx="${x}" cy="${GROUND + 8}" rx="170" ry="24" fill="#8fd3ee" ${OUT}/>
        <ellipse cx="${x - 20}" cy="${GROUND + 4}" rx="110" ry="10" fill="#b9e6f7"/>
        <path d="M${x - 90} ${GROUND + 10} a14 7 0 1 1 1 0 Z M${x + 60} ${GROUND + 14} a12 6 0 1 1 1 0 Z" fill="#7cc98a" ${THIN}/>
        <circle cx="${x - 86}" cy="${GROUND + 2}" r="5" fill="#ff9fc0"/>
        ${[-160, -150, 150, 162].map((d) => `<path d="M${x + d} ${GROUND + 6} L${x + d + 2} ${GROUND - 56}" stroke="#6fb566" stroke-width="4" stroke-linecap="round"/>
          <rect x="${x + d - 3}" y="${GROUND - 60}" width="9" height="22" rx="4.5" fill="#a8744f"/>`).join('')}</g>`) +
      roundTree(90, 0.8) + roundTree(740, 1),
  },
};

export const PLACE_IDS = Object.keys(PLACES) as PlaceId[];

/** Far, middle and ground tiles for a place (each 800 wide, repeatable). */
export function placeLayers(id: PlaceId) {
  const p = PLACES[id];
  const seed = PLACE_IDS.indexOf(id) * 97 + 13;
  const trail = `<path d="M0 ${GROUND + 26} L${TILE} ${GROUND + 26} L${TILE} ${GROUND + 58} L0 ${GROUND + 58} Z" fill="${p.trail}"/>
    ${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${i * 80 + 30}" cy="${GROUND + 42 + (i % 3) * 5 - 5}" rx="6" ry="3.5" fill="${INK}" opacity="0.12"/>`).join('')}`;
  return {
    far: p.far(rng(seed)),
    mid: p.mid(rng(seed + 1)),
    ground: `<rect x="0" y="${GROUND}" width="${TILE}" height="${1200}" fill="${p.ground}"/>${trail}${tufts(rng(seed + 2), 10, '#00000014')}${p.near ? p.near(rng(seed + 3)) : ''}`,
  };
}

// ---------- skies ----------

const SKY: Record<SkyId, [string, string]> = {
  sun: ['#8fd4f5', '#e6f7ff'],
  cloud: ['#b9d3e6', '#eef4f8'],
  rain: ['#9fb2c9', '#dde6ee'],
  rainbow: ['#9ad8f2', '#fff0f4'],
  moon: ['#2f3a74', '#6c6aa6'],
};

export const skyColors = (id: SkyId) => SKY[id];

export const sunArt = (x: number, y: number, r = 34) => `<g data-word="sun" class="sun">
  <g class="rays" style="transform-origin:${x}px ${y}px">${Array.from({ length: 12 }, (_, i) => `<rect x="${x - 4}" y="${y - r - 22}" width="8" height="16" rx="4" fill="#ffd45c" transform="rotate(${i * 30} ${x} ${y})"/>`).join('')}</g>
  <circle cx="${x}" cy="${y}" r="${r}" fill="#ffe27a" ${OUT}/>
  <circle cx="${x - 11}" cy="${y - 4}" r="3.5" fill="${INK}"/><circle cx="${x + 11}" cy="${y - 4}" r="3.5" fill="${INK}"/>
  <path d="M${x - 8} ${y + 8} Q${x} ${y + 14} ${x + 8} ${y + 8}" fill="none" ${THIN}/>
  <ellipse cx="${x - 20}" cy="${y + 6}" rx="5" ry="3" fill="#ff9fb2" opacity="0.7"/><ellipse cx="${x + 20}" cy="${y + 6}" rx="5" ry="3" fill="#ff9fb2" opacity="0.7"/></g>`;

export const moonArt = (x: number, y: number, r = 32) => `<g data-word="moon">
  <circle cx="${x - r * 0.3}" cy="${y}" r="${r + 8}" fill="#fff8d0" opacity="0.14"/>
  <path d="M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.55} ${r} 0 1 1 ${x} ${y - r} Z" fill="#fff3b0" ${OUT}/>
  <circle cx="${x - r * 0.62}" cy="${y - r * 0.12}" r="${r * 0.09}" fill="${INK}"/>
  <path d="M${x - r * 0.8} ${y + r * 0.22} Q${x - r * 0.66} ${y + r * 0.34} ${x - r * 0.5} ${y + r * 0.24}" fill="none" ${THIN}/></g>`;

export const cloudArt = (x: number, y: number, s = 1, fill = '#fff') => `<g data-word="cloud">
  <path d="M${x - 50 * s} ${y + 14 * s} Q${x - 64 * s} ${y - 8 * s} ${x - 34 * s} ${y - 12 * s} Q${x - 26 * s} ${y - 40 * s} ${x} ${y - 30 * s} Q${x + 22 * s} ${y - 48 * s} ${x + 38 * s} ${y - 16 * s} Q${x + 64 * s} ${y - 12 * s} ${x + 52 * s} ${y + 14 * s} Z" fill="${fill}" ${OUT}/></g>`;

export const rainbowArt = (x: number, y: number, r = 150) => `<g data-word="rainbow" opacity="0.9">
  ${['#ff9f9f', '#ffc98a', '#fff09a', '#aee6a2', '#9fd4f5', '#c4aef0'].map((c, i) => `<path d="M${x - r + i * 12} ${y} A${r - i * 12} ${r - i * 12} 0 0 1 ${x + r - i * 12} ${y}" fill="none" stroke="${c}" stroke-width="12"/>`).join('')}</g>`;

/** Card picture (200×200) for a sky choice. */
export function skyIcon(id: SkyId): string {
  const bg = `<circle cx="100" cy="100" r="92" fill="${id === 'moon' ? '#3f4a8a' : '#d9f0fb'}"/>`;
  return bg + skyInner(id);
}

function skyInner(id: SkyId): string {
  switch (id) {
    case 'sun': return sunArt(100, 100, 44);
    case 'moon': return `${moonArt(110, 100, 52)}<path d="M150 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z M160 150 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill="#ffd45c"/>`;
    case 'cloud': return cloudArt(100, 110, 1.4);
    case 'rain': return `${cloudArt(100, 80, 1.3, '#e9eef5')}${[60, 90, 120, 150, 75, 135].map((x, i) => `<path d="M${x} ${120 + (i > 3 ? 36 : 0)} q-4 10 0 14 q4 -4 0 -14 Z" fill="#7fc8f0" ${THIN}/>`).join('')}`;
    case 'rainbow': return `${rainbowArt(100, 150, 90)}${cloudArt(30, 150, 0.6)}${cloudArt(170, 150, 0.6)}`;
  }
}

/** Card picture (200×200) for a place: a little window into the scenery. */
export function placeIcon(id: PlaceId): string {
  const l = placeLayers(id);
  const [top, bottom] = SKY.sun;
  const x0 = { park: 20, farm: 400, woods: 20, snow: 220, sand: 20, sea: 330, hill: 460, pond: 300 }[id];
  return `<defs><linearGradient id="pi-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <clipPath id="pc-${id}"><rect x="0" y="0" width="200" height="200" rx="26"/></clipPath></defs>
    <g clip-path="url(#pc-${id})"><rect width="200" height="200" fill="url(#pi-${id})"/>
    <g transform="scale(0.8) translate(${-x0} -215)">${l.far}${l.mid}${l.ground}</g></g>
    <rect x="1.5" y="1.5" width="197" height="197" rx="25" fill="none" ${OUT}/>`;
}
