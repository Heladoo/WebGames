// The Paper Cut style kit: palette, paper pieces with cast shadows, the
// hand-cut edge filter and the shared face language.

export const C = {
  ink: '#3f3238',
  paper: '#fffdf8',
  cream: '#f6efe3',
  shadow: '#3a2a20',
  blush: '#f2a28f',
  coral: '#e3685b',
  teal: '#3f8f8a',
  mustard: '#e8a93c',
  butter: '#f6d98a',
  indigo: '#6c7fc4',
  sky: '#9fd0d6',
  leaf: '#5f9e6e',
  leafLight: '#78b07c',
  grass: '#8cbf73',
  trail: '#f2dcb1',
  bark: '#8e6246',
  white: '#fffdf6',
  rose: '#f0a3b4',
};

/** Lighten (k>0) or darken (k<0) a hex colour. */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export interface PieceOpts {
  part?: string; // data-part (character anatomy, used by the anatomy tests)
  item?: string; // data-item (wearables and carried things)
  word?: string; // data-word (tap to hear)
  t?: string; // transform
  lift?: number; // how far the paper piece floats above the one below (shadow offset)
  cls?: string;
}

/**
 * One paper piece: a crisp cast shadow a little below it, then the piece.
 * Cast shadows between layers are what make the scene read as layered paper,
 * and they cost nothing to draw (no filters), so they are safe to animate.
 */
export function piece(d: string, fill: string, o: PieceOpts = {}): string {
  const lift = o.lift ?? 1.6;
  const attrs = [
    o.part ? `data-part="${o.part}"` : '',
    o.item ? `data-item="${o.item}"` : '',
    o.word ? `data-word="${o.word}"` : '',
    o.cls ? `class="${o.cls}"` : '',
    o.t ? `transform="${o.t}"` : '',
  ].filter(Boolean).join(' ');
  const shadow = lift > 0 ? `<path data-shadow="" d="${d}" fill="${C.shadow}" opacity="0.17" transform="translate(${lift * 0.5} ${lift})"/>` : '';
  return `<g ${attrs}>${shadow}<path d="${d}" fill="${fill}"/></g>`;
}

/** A flat detail with no shadow (eyes, stripes, freckles). */
export const flat = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;

/** A paper strip drawn as a stroke (whiskers, strings, stems). */
export const line = (d: string, color: string, w = 2.4, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

/** Ellipse as a path (so it can be a paper piece). */
export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${(cx - rx).toFixed(2)} ${cy} A${rx} ${ry} 0 1 0 ${(cx + rx).toFixed(2)} ${cy} A${rx} ${ry} 0 1 0 ${(cx - rx).toFixed(2)} ${cy} Z`;

/** Stacked paper layers: each one a little smaller, lighter and higher. */
export function layered(make: (k: number) => string, fills: string[], o: PieceOpts = {}) {
  return fills.map((f, i) => piece(make(i), f, { ...o, lift: 2.2 - i * 0.4 })).join('');
}

/**
 * Filters shared by everything. `pc` gives a hand-cut paper edge with a soft
 * drop shadow (used on characters, friends and pictures); `ps` is a soft drop
 * shadow only (cheap, for bigger groups).
 */
export const FILTER_DEFS = `
  <filter id="pc" x="-10%" y="-10%" width="120%" height="125%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feDropShadow in="d" dx="0" dy="2" stdDeviation="1.6" flood-color="${C.shadow}" flood-opacity="0.26"/>
  </filter>
  <filter id="ps" x="-10%" y="-10%" width="120%" height="130%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="${C.shadow}" flood-opacity="0.22"/>
  </filter>`;

/** An eye in the shared face language: dark oval, a big shine and a small one. */
export function eye(cx: number, cy: number, r: number, part: string, squash = 1) {
  const rx = r * 0.78 * squash;
  return `<g data-part="${part}">
    ${flat(ell(cx, cy, rx, r), C.ink)}
    ${flat(ell(cx + rx * 0.3, cy - r * 0.38, r * 0.3, r * 0.32), '#fffdf6')}
    ${flat(ell(cx - rx * 0.3, cy + r * 0.42, r * 0.13, r * 0.13), '#fffdf6')}</g>`;
}

/** Put the shared filters into the page once (they are referenced by id). */
export function installDefs() {
  let sprite = document.getElementById('paper-defs');
  if (!sprite) {
    sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as unknown as HTMLElement;
    sprite.id = 'paper-defs';
    sprite.setAttribute('aria-hidden', 'true');
    sprite.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    document.body.prepend(sprite);
  }
  sprite.innerHTML = `<defs>${FILTER_DEFS}</defs>`;
}

/** A picture wrapped as a standalone SVG (cards, stickers, icons). */
export function svgBox(inner: string, box = '0 0 200 200', cls = 'pic'): string {
  return `<svg class="${cls}" viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}
