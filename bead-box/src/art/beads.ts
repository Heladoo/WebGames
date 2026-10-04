// Beads are drawn in code: a shape path, a glossy gradient from the colour, a pattern clipped to the shape,
// a highlight and a string hole. Every bead lives in a 0..100 box so it scales to any size.

import type { DesignId, ShapeId } from '../content';

interface Tone { base: string; light: string; dark: string }

export const TONES: Record<string, Tone> = {
  blue: { base: '#28b8e6', light: '#9aeafc', dark: '#0f7fb0' },
  pink: { base: '#f47aa0', light: '#ffc6d8', dark: '#c2406a' },
  yellow: { base: '#f8c63a', light: '#ffeb8f', dark: '#c9921a' },
  purple: { base: '#9a6bdc', light: '#d3b6f7', dark: '#6a3fae' },
  green: { base: '#4cb05e', light: '#aae6ae', dark: '#2a7a3c' },
  white: { base: '#f3eee4', light: '#ffffff', dark: '#bdb3a2' },
  red: { base: '#e8473f', light: '#ffa093', dark: '#a8221f' },
  orange: { base: '#f59238', light: '#ffcd8f', dark: '#c2600f' },
  brown: { base: '#8d5a3b', light: '#c9916d', dark: '#5a331c' },
  black: { base: '#3d3d4d', light: '#85859b', dark: '#1b1b26' },
  gold: { base: '#f2c230', light: '#fff3b0', dark: '#a8730e' },
};

/** The plain colour a design is built on (patterns sit on a colour). */
const BASE_OF: Record<string, string> = { stripes: 'blue', dots: 'pink', gold: 'gold', glitter: 'purple' };

export const toneOf = (d: DesignId): Tone => TONES[BASE_OF[d] ?? d];

const petals = (n: number, dist: number, r: number, f: string, cx = 50, cy = 50) =>
  Array.from({ length: n }, (_, i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return `<circle cx="${(cx + Math.cos(a) * dist).toFixed(1)}" cy="${(cy + Math.sin(a) * dist).toFixed(1)}" r="${r}" fill="${f}"/>`;
  }).join('');

const starPoints = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 38 : 17;
    const a = (-90 + 36 * i) * (Math.PI / 180);
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(52 + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
})();

interface ShapeArt {
  /** elements painted with `f` (a fill, or a stroke for line shapes) */
  body: (f: string) => string;
  detail?: string; // thin darker lines drawn over the body
  hole: [number, number];
  gloss: [number, number];
  stroked?: boolean; // built from strokes, so patterns cannot be clipped to it
  accent?: string; // extra marks in fixed colours (eyes, wheels...)
}

const SHAPES: Record<ShapeId, ShapeArt> = {
  round: { body: (f) => `<circle cx="50" cy="50" r="40" fill="${f}"/>`, hole: [46, 34], gloss: [33, 30] },
  flower: { body: (f) => `${petals(5, 24, 19, f)}<circle cx="50" cy="50" r="14" fill="${f}"/>`, hole: [50, 50], gloss: [34, 28],
    accent: '<circle cx="50" cy="50" r="9" fill="#fff6c8" stroke="#e3a82c" stroke-width="2"/>' },
  shell: { body: (f) => `<path d="M50 90 C20 86 6 58 12 38 C18 20 36 12 50 12 C64 12 82 20 88 38 C94 58 80 86 50 90Z" fill="${f}"/>`,
    detail: '<path d="M50 88 L50 18 M50 88 L28 24 M50 88 L72 24 M50 88 L14 44 M50 88 L86 44" stroke="rgba(0,0,0,.18)" stroke-width="2.4" fill="none" stroke-linecap="round"/>', hole: [50, 80], gloss: [34, 28] },
  star: { body: (f) => `<polygon points="${starPoints}" fill="${f}" stroke="${f}" stroke-width="9" stroke-linejoin="round"/>`, hole: [50, 52], gloss: [38, 36] },
  heart: { body: (f) => `<path d="M50 88 C14 62 8 38 20 24 C32 12 46 18 50 30 C54 18 68 12 80 24 C92 38 86 62 50 88Z" fill="${f}"/>`, hole: [50, 34], gloss: [30, 28] },
  leaf: { body: (f) => `<path d="M14 86 C10 40 40 10 88 12 C90 60 62 88 14 86Z" fill="${f}"/>`,
    detail: '<path d="M18 82 C38 58 60 38 82 18" stroke="rgba(0,0,0,.22)" stroke-width="3" fill="none" stroke-linecap="round"/>', hole: [30, 66], gloss: [40, 30] },
  acorn: { body: (f) => `<path d="M24 46 C24 80 40 92 50 92 C60 92 76 80 76 46Z" fill="${f}"/><path d="M16 50 C14 26 32 16 50 16 C68 16 86 26 84 50Z" fill="${f}"/>`,
    detail: '<path d="M16 50 C14 26 32 16 50 16 C68 16 86 26 84 50Z" fill="rgba(60,30,10,.28)"/><path d="M50 16 L50 6" stroke="rgba(60,30,10,.7)" stroke-width="5" stroke-linecap="round"/>', hole: [50, 30], gloss: [34, 26] },
  mushroom: { body: (f) => `<path d="M38 52 L38 80 C38 92 62 92 62 80 L62 52Z" fill="${f}"/><path d="M10 56 C10 28 30 10 50 10 C70 10 90 28 90 56Z" fill="${f}"/>`,
    detail: '<path d="M38 52 L38 80 C38 92 62 92 62 80 L62 52Z" fill="rgba(255,255,255,.55)"/>', hole: [50, 24], gloss: [34, 24],
    accent: '<circle cx="30" cy="38" r="6" fill="#fff" opacity=".85"/><circle cx="56" cy="26" r="5" fill="#fff" opacity=".85"/><circle cx="72" cy="44" r="6" fill="#fff" opacity=".85"/>' },
  butterfly: { body: (f) => `<path d="M50 48 C30 8 6 14 10 40 C12 56 32 58 50 48Z" fill="${f}"/><path d="M50 48 C70 8 94 14 90 40 C88 56 68 58 50 48Z" fill="${f}"/><path d="M50 52 C30 56 14 66 24 82 C34 92 48 74 50 52Z" fill="${f}"/><path d="M50 52 C70 56 86 66 76 82 C66 92 52 74 50 52Z" fill="${f}"/>`,
    hole: [50, 56], gloss: [30, 26],
    accent: '<rect x="46" y="30" width="8" height="46" rx="4" fill="#4a3a52"/><path d="M48 32 C44 20 38 16 34 14 M52 32 C56 20 62 16 66 14" stroke="#4a3a52" stroke-width="2.4" fill="none" stroke-linecap="round"/>' },
  moon: { body: (f) => `<path d="M64 10 C36 12 14 34 16 58 C18 80 40 92 62 88 C44 76 38 54 46 36 C50 26 56 16 64 10Z" fill="${f}"/>`, hole: [42, 62], gloss: [28, 40] },
  diamond: { body: (f) => `<path d="M50 8 L86 40 L50 92 L14 40Z" fill="${f}" stroke="${f}" stroke-width="6" stroke-linejoin="round"/>`,
    detail: '<path d="M14 40 L86 40 M50 8 L34 40 L50 92 L66 40 L50 8" stroke="rgba(255,255,255,.55)" stroke-width="2.2" fill="none" stroke-linejoin="round"/>', hole: [50, 24], gloss: [36, 28] },
  bow: { body: (f) => `<path d="M50 50 C30 20 8 22 8 50 C8 78 30 80 50 50Z" fill="${f}"/><path d="M50 50 C70 20 92 22 92 50 C92 78 70 80 50 50Z" fill="${f}"/><circle cx="50" cy="50" r="12" fill="${f}"/>`,
    detail: '<circle cx="50" cy="50" r="12" fill="rgba(0,0,0,.12)"/>', hole: [50, 50], gloss: [26, 40] },
  car: { body: (f) => `<rect x="6" y="46" width="88" height="28" rx="10" fill="${f}"/><path d="M22 48 L32 26 C33 24 35 24 36 24 L64 24 C66 24 67 25 68 26 L80 48Z" fill="${f}"/>`,
    hole: [50, 60], gloss: [30, 34],
    accent: '<path d="M30 46 L37 30 L48 30 L48 46Z M52 46 L52 30 L63 30 L72 46Z" fill="#cfeefa" opacity=".95"/><circle cx="28" cy="76" r="11" fill="#33333f"/><circle cx="72" cy="76" r="11" fill="#33333f"/><circle cx="28" cy="76" r="4.5" fill="#c9c9d4"/><circle cx="72" cy="76" r="4.5" fill="#c9c9d4"/>' },
  cloud: { body: (f) => `<circle cx="30" cy="58" r="20" fill="${f}"/><circle cx="52" cy="42" r="26" fill="${f}"/><circle cx="74" cy="58" r="19" fill="${f}"/><rect x="30" y="56" width="44" height="22" fill="${f}"/>`, hole: [52, 50], gloss: [42, 30] },
  snowflake: { stroked: true, body: (f) => ['0', '60', '120'].map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 10 L50 90 M50 24 L40 14 M50 24 L60 14 M50 76 L40 86 M50 76 L60 86" stroke="${f}" stroke-width="9" stroke-linecap="round" fill="none"/></g>`).join('') + `<circle cx="50" cy="50" r="12" fill="${f}"/>`,
    hole: [50, 50], gloss: [42, 38] },
};

let uid = 0;

function pattern(design: DesignId, clip: string): string {
  switch (design) {
    case 'stripes':
      return `<g mask="url(#${clip})" fill="#fff" opacity=".92"><rect x="-10" y="18" width="120" height="11"/><rect x="-10" y="42" width="120" height="11"/><rect x="-10" y="66" width="120" height="11"/></g>`;
    case 'dots':
      return `<g mask="url(#${clip})" fill="#fff" opacity=".92">${[[28, 30], [60, 26], [44, 52], [74, 50], [30, 72], [60, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5"/>`).join('')}</g>`;
    case 'glitter':
      return `<g mask="url(#${clip})" fill="#fff">${[[30, 34, 3], [58, 28, 2.4], [44, 56, 3.2], [72, 52, 2.4], [28, 72, 2.4], [58, 74, 3]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2} L${x + r * 0.6} ${y - r * 0.6} L${x + r * 2} ${y} L${x + r * 0.6} ${y + r * 0.6} L${x} ${y + r * 2} L${x - r * 0.6} ${y + r * 0.6} L${x - r * 2} ${y} L${x - r * 0.6} ${y - r * 0.6}Z" opacity=".95"/>`).join('')}</g>`;
    default:
      return '';
  }
}

/** The inside of a bead's svg (defs + drawing). `shadow` adds a soft ellipse under it. */
export function beadInner(shape: ShapeId, design: DesignId, shadow = true): string {
  const id = `b${++uid}`;
  const art = SHAPES[shape];
  const t = toneOf(design);
  const metallic = design === 'gold';
  const grad =
    `<radialGradient id="${id}g" gradientUnits="userSpaceOnUse" cx="36" cy="32" r="72">` +
    `<stop offset="0" stop-color="${t.light}"/><stop offset="${metallic ? 0.35 : 0.42}" stop-color="${t.base}"/>` +
    (metallic ? `<stop offset="0.55" stop-color="${t.light}"/>` : '') +
    `<stop offset="1" stop-color="${t.dark}"/></radialGradient>`;
  // a mask (unlike a clip path) respects strokes, so patterns fill rounded stars and diamonds completely
  const clip = art.stroked ? '' : `<mask id="${id}c" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${art.body('#fff')}</mask>`;
  const [hx, hy] = art.hole;
  const [gx, gy] = art.gloss;
  return (
    `<defs>${grad}${clip}</defs>` +
    (shadow ? '<ellipse cx="50" cy="94" rx="30" ry="4.6" fill="#5a3a1a" opacity=".16"/>' : '') +
    art.body(`url(#${id}g)`) +
    (art.stroked ? '' : pattern(design, `${id}c`)) +
    (art.detail ?? '') +
    (art.accent ?? '') +
    `<ellipse cx="${hx}" cy="${hy}" rx="10" ry="6.4" fill="${t.dark}" opacity=".55"/>` +
    `<ellipse cx="${hx}" cy="${hy - 0.8}" rx="7.6" ry="4.6" fill="#241a2a" opacity=".78"/>` +
    `<ellipse cx="${hx - 1}" cy="${hy + 3}" rx="5" ry="1.4" fill="#fff" opacity=".28"/>` +
    `<ellipse cx="${gx}" cy="${gy}" rx="11" ry="6" fill="#fff" opacity=".55" transform="rotate(-32 ${gx} ${gy})"/>` +
    `<circle cx="${gx + 14}" cy="${gy + 9}" r="2.2" fill="#fff" opacity=".6"/>`
  );
}

/** A standalone bead as an svg string. */
export function beadSVG(shape: ShapeId, design: DesignId, size = 64, shadow = true): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${beadInner(shape, design, shadow)}</svg>`;
}

const ICON_DETAIL = new Set<ShapeId>(['shell', 'leaf', 'diamond']);

/** A small flat icon of a shape (for the tabs): one soft colour, no hole. */
export function shapeIcon(shape: ShapeId, color: string, size = 30): string {
  const art = SHAPES[shape];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${art.body(color)}${ICON_DETAIL.has(shape) ? (art.detail ?? '').replace('rgba(0,0,0,.18)', 'rgba(255,255,255,.7)').replace('rgba(0,0,0,.22)', 'rgba(255,255,255,.7)') : ''}</svg>`;
}

/** The icon for the plain round bead is a 2x2 group of dots, like the mockup's first tab. */
export function dotsIcon(color: string, size = 30): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g fill="${color}"><circle cx="28" cy="28" r="19"/><circle cx="72" cy="28" r="19"/><circle cx="28" cy="72" r="19"/><circle cx="72" cy="72" r="19"/></g></svg>`;
}
