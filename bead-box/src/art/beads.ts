// Beads are drawn in code, in a 0..100 box, from gradients and masks only (no filters), so a dozen of them on
// screen and in the album stay cheap. Every bead is built from the same layers, back to front:
//   contact shadow, glazed body, subsurface glow, pattern, rim shading, shape detail, the tunnel, bounce light,
//   highlights. The tunnel (the string hole) is drawn as a real hole: a lit lip, an inner wall that catches
//   bounce light, and a deep void.

import type { DesignId, ShapeId } from '../content';

interface Tone { base: string; light: string; dark: string }

export const TONES: Record<string, Tone> = {
  blue: { base: '#22b5e4', light: '#a6f0fd', dark: '#0b78ad' },
  pink: { base: '#f56f9a', light: '#ffc9da', dark: '#bd3868' },
  yellow: { base: '#f9c42f', light: '#ffee94', dark: '#c58c12' },
  purple: { base: '#9566dc', light: '#d6bcf8', dark: '#6339ac' },
  green: { base: '#43ad5b', light: '#adeab2', dark: '#27763a' },
  white: { base: '#f4efe6', light: '#ffffff', dark: '#b9ae9c' },
  red: { base: '#e8433b', light: '#ffa597', dark: '#a41f1d' },
  orange: { base: '#f68f32', light: '#ffd093', dark: '#bf5c0c' },
  brown: { base: '#8d5836', light: '#cf9672', dark: '#552f19' },
  black: { base: '#3b3b4c', light: '#8d8da4', dark: '#16161f' },
  gold: { base: '#f0bd2a', light: '#fff4b6', dark: '#9a6a0a' },
};

/** The plain colour a design is built on (patterns sit on a colour). */
const BASE_OF: Record<string, string> = { stripes: 'blue', dots: 'pink', gold: 'gold', glitter: 'purple' };

export const toneOf = (d: DesignId): Tone => TONES[BASE_OF[d] ?? d];

// ---------- colour helpers ----------

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function mix(a: string, b: string, t: number): string {
  const x = hex(a);
  const y = hex(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// ---------- shapes ----------

const petals = (n: number, dist: number, r: number, f: string, cx = 50, cy = 50) =>
  Array.from({ length: n }, (_, i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return `<circle cx="${(cx + Math.cos(a) * dist).toFixed(1)}" cy="${(cy + Math.sin(a) * dist).toFixed(1)}" r="${r}" fill="${f}"/>`;
  }).join('');

const STAR: [number, number][] = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 38 : 17;
  const a = (-90 + 36 * i) * (Math.PI / 180);
  return [50 + Math.cos(a) * r, 52 + Math.sin(a) * r];
});
const starPoints = STAR.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Everything a shape's detail needs to colour itself. */
interface Ctx { id: string; t: Tone; dk: string; lt: string }

interface ShapeArt {
  /** elements painted with `f` (a fill, or a stroke for line shapes) */
  body: (f: string) => string;
  /** shading and decoration clipped to the shape */
  detail?: (c: Ctx) => string;
  /** the tunnel seen from the front: centre x, y and half-width */
  hole: [number, number, number];
  /** the tunnel seen along the string (on the bracelet): centre x, y */
  side: [number, number];
  gloss: [number, number];
  stroked?: boolean; // built from strokes, so patterns cannot be clipped to it
  accent?: string; // marks in fixed colours (eyes, wheels...) drawn under the tunnel
}

const line = (d: string, c: string, w = 2, o = 0.2) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;

const SHAPES: Record<ShapeId, ShapeArt> = {
  round: { body: (f) => `<ellipse cx="50" cy="50" rx="41" ry="39.5" fill="${f}"/>`, hole: [52, 38, 13], side: [17, 52], gloss: [26, 24] },
  flower: {
    body: (f) => `${petals(5, 24, 19, f)}<circle cx="50" cy="50" r="15" fill="${f}"/>`,
    detail: ({ dk, lt }) =>
      [0, 1, 2, 3, 4].map((i) => {
        const a = (-90 + 72 * i) * (Math.PI / 180);
        const b = a + Math.PI / 5;
        const px = 50 + Math.cos(a) * 30;
        const py = 50 + Math.sin(a) * 30;
        return line(`M50 50 L${(50 + Math.cos(b) * 40).toFixed(1)} ${(50 + Math.sin(b) * 40).toFixed(1)}`, dk, 2.4, 0.3) +
          `<ellipse cx="${(px - 4).toFixed(1)}" cy="${(py - 5).toFixed(1)}" rx="6" ry="3.4" fill="${lt}" opacity=".5" transform="rotate(${(-90 + 72 * i) + 60} ${(px - 4).toFixed(1)} ${(py - 5).toFixed(1)})"/>`;
      }).join(''),
    accent: '<circle cx="50" cy="50" r="15" fill="#ffe27a" stroke="#d9951c" stroke-width="2.4"/><circle cx="50" cy="50" r="15" fill="none" stroke="#fff4b8" stroke-width="1.2" stroke-dasharray="3 3.4" opacity=".8"/>',
    hole: [50, 50, 9], side: [20, 50], gloss: [33, 28],
  },
  shell: {
    body: (f) => `<path d="M50 90 C20 86 6 58 12 38 C18 20 36 12 50 12 C64 12 82 20 88 38 C94 58 80 86 50 90Z" fill="${f}"/>`,
    detail: ({ dk, lt }) =>
      [-42, -30, -18, -6, 6, 18, 30, 42].map((a) => {
        const r = (a * Math.PI) / 180;
        const x = 50 + Math.sin(r) * 74;
        const y = 88 - Math.cos(r) * 78;
        return line(`M50 88 L${x.toFixed(1)} ${y.toFixed(1)}`, dk, 3.2, 0.2) + line(`M52.5 88 L${(x + 3).toFixed(1)} ${(y + 1).toFixed(1)}`, lt, 1.6, 0.5);
      }).join('') + `<path d="M12 40 C20 20 40 12 50 12 C60 12 80 20 88 40 C70 30 30 30 12 40Z" fill="#fff" opacity=".3"/>`,
    hole: [50, 80, 8], side: [50, 82], gloss: [34, 26],
  },
  star: {
    body: (f) => `<polygon points="${starPoints}" fill="${f}" stroke="${f}" stroke-width="9" stroke-linejoin="round"/>`,
    detail: ({ dk, lt }) =>
      [0, 2, 4, 6, 8].map((i) => {
        const tip = STAR[i];
        const inner = STAR[(i + 1) % 10];
        return `<polygon points="50,52 ${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${inner[0].toFixed(1)},${inner[1].toFixed(1)}" fill="${dk}" opacity=".16"/>` +
          `<path d="M50 52 L${tip[0].toFixed(1)} ${tip[1].toFixed(1)}" stroke="${lt}" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>`;
      }).join(''),
    hole: [50, 52, 9], side: [30, 52], gloss: [38, 34],
  },
  heart: {
    body: (f) => `<path d="M50 88 C14 62 8 38 20 24 C32 12 46 18 50 30 C54 18 68 12 80 24 C92 38 86 62 50 88Z" fill="${f}"/>`,
    detail: ({ dk, lt }) => line('M50 32 C47 46 49 62 50 80', dk, 2.6, 0.22) + `<ellipse cx="30" cy="30" rx="8" ry="4.6" fill="${lt}" opacity=".5" transform="rotate(-40 30 30)"/><ellipse cx="70" cy="30" rx="6" ry="3.4" fill="${lt}" opacity=".3" transform="rotate(40 70 30)"/>`,
    hole: [50, 40, 9], side: [22, 42], gloss: [30, 28],
  },
  leaf: {
    body: (f) => `<path d="M14 86 C10 40 40 10 88 12 C90 60 62 88 14 86Z" fill="${f}"/>`,
    detail: ({ dk, lt }) =>
      line('M16 84 C38 58 60 38 84 16', dk, 3.2, 0.3) + line('M17 83 C39 57 61 37 85 15', lt, 1.2, 0.45) +
      [0.22, 0.36, 0.5, 0.64, 0.78].map((t) => {
        const x = 16 + 68 * t;
        const y = 84 - 68 * t;
        return line(`M${x.toFixed(1)} ${y.toFixed(1)} l${(14 - t * 6).toFixed(1)} ${(2 + t * 6).toFixed(1)}`, dk, 1.8, 0.22) + line(`M${x.toFixed(1)} ${y.toFixed(1)} l${(-2 - t * 6).toFixed(1)} ${(-14 + t * 6).toFixed(1)}`, dk, 1.8, 0.22);
      }).join(''),
    hole: [28, 68, 8], side: [18, 80], gloss: [40, 28],
  },
  acorn: {
    body: (f) => `<path d="M24 46 C24 80 40 92 50 92 C60 92 76 80 76 46Z" fill="${f}"/><path d="M16 50 C14 26 32 16 50 16 C68 16 86 26 84 50Z" fill="${f}"/>`,
    detail: ({ dk, lt }) =>
      `<path d="M16 50 C14 26 32 16 50 16 C68 16 86 26 84 50Z" fill="rgba(70,36,12,.32)"/>` +
      Array.from({ length: 7 }, (_, i) => line(`M${22 + i * 9} 22 L${14 + i * 9} 46`, '#2a1408', 1.3, 0.22) + line(`M${20 + i * 9} 22 L${28 + i * 9} 46`, '#2a1408', 1.3, 0.22)).join('') +
      line('M50 16 L50 5', '#5a3418', 5, 0.95) + `<ellipse cx="38" cy="24" rx="10" ry="4" fill="${lt}" opacity=".35"/>` + line('M30 62 C32 76 40 84 48 86', dk, 2, 0.2),
    hole: [50, 32, 9], side: [26, 52], gloss: [34, 26],
  },
  mushroom: {
    body: (f) => `<path d="M38 52 L38 80 C38 92 62 92 62 80 L62 52Z" fill="${f}"/><path d="M10 56 C10 28 30 10 50 10 C70 10 90 28 90 56Z" fill="${f}"/>`,
    detail: ({ lt }) =>
      `<path d="M38 52 L38 80 C38 92 62 92 62 80 L62 52Z" fill="${mix(lt, '#fff4dc', 0.7)}"/><path d="M52 54 L62 54 L62 80 C62 90 56 92 52 92Z" fill="rgba(150,110,70,.28)"/><path d="M38 54 L38 80 C38 84 40 87 42 88 L42 54Z" fill="#fff" opacity=".4"/>` +
      `<path d="M12 56 C30 62 70 62 88 56 L88 52 C70 58 30 58 12 52Z" fill="rgba(255,240,220,.45)"/>` +
      [[28, 36, 7], [54, 24, 5.5], [72, 42, 6.5], [46, 44, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".92"/><path d="M${x - r * 0.8} ${y + r * 0.4} A${r} ${r} 0 0 0 ${x + r * 0.8} ${y + r * 0.4}" stroke="rgba(0,0,0,.14)" stroke-width="1.4" fill="none"/>`).join(''),
    hole: [50, 24, 8], side: [16, 40], gloss: [32, 24],
  },
  butterfly: {
    body: (f) => `<path d="M50 48 C30 8 6 14 10 40 C12 56 32 58 50 48Z" fill="${f}"/><path d="M50 48 C70 8 94 14 90 40 C88 56 68 58 50 48Z" fill="${f}"/><path d="M50 52 C30 56 14 66 24 82 C34 92 48 74 50 52Z" fill="${f}"/><path d="M50 52 C70 56 86 66 76 82 C66 92 52 74 50 52Z" fill="${f}"/>`,
    detail: ({ dk }) =>
      [line('M50 48 C38 34 24 26 14 28', dk, 1.8, 0.25), line('M50 48 C40 44 26 44 14 44', dk, 1.8, 0.25), line('M50 48 C62 34 76 26 86 28', dk, 1.8, 0.25), line('M50 48 C60 44 74 44 86 44', dk, 1.8, 0.25)].join('') +
      [[24, 32, 4], [76, 32, 4], [30, 74, 3.4], [70, 74, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".8"/>`).join(''),
    accent: '<rect x="46" y="30" width="8" height="46" rx="4" fill="#4a3a52"/><rect x="47.5" y="32" width="2.4" height="38" rx="1.2" fill="#fff" opacity=".25"/><path d="M48 32 C44 20 38 16 34 14 M52 32 C56 20 62 16 66 14" stroke="#4a3a52" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="34" cy="14" r="2.4" fill="#4a3a52"/><circle cx="66" cy="14" r="2.4" fill="#4a3a52"/>',
    hole: [50, 56, 6], side: [50, 60], gloss: [30, 26],
  },
  moon: {
    body: (f) => `<path d="M64 10 C36 12 14 34 16 58 C18 80 40 92 62 88 C44 76 38 54 46 36 C50 26 56 16 64 10Z" fill="${f}"/>`,
    detail: ({ dk, lt }) => [[30, 56, 6], [26, 74, 4], [42, 82, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dk}" opacity=".18"/><path d="M${x - r * 0.7} ${y + r * 0.7} A${r} ${r} 0 0 0 ${x + r * 0.8} ${y + r * 0.5}" stroke="${lt}" stroke-width="1.2" fill="none" opacity=".5"/>`).join(''),
    hole: [40, 62, 7], side: [22, 56], gloss: [27, 40],
  },
  diamond: {
    body: (f) => `<path d="M50 8 L86 40 L50 92 L14 40Z" fill="${f}" stroke="${f}" stroke-width="6" stroke-linejoin="round"/>`,
    detail: () => {
      const fc = (pts: string, o: number, c = '#fff') => `<polygon points="${pts}" fill="${c}" opacity="${o}"/>`;
      return fc('50,8 34,40 14,40', 0.34) + fc('50,8 66,40 86,40', 0.12, '#000') + fc('50,8 34,40 66,40', 0.5) + fc('14,40 34,40 50,92', 0.2) + fc('34,40 66,40 50,92', 0.08) + fc('66,40 86,40 50,92', 0.22, '#000') +
        line('M14 40 L86 40 M50 8 L34 40 L50 92 L66 40 L50 8', '#fff', 1.8, 0.6);
    },
    hole: [50, 22, 8], side: [34, 40], gloss: [36, 26],
  },
  bow: {
    body: (f) => `<path d="M50 50 C30 20 8 22 8 50 C8 78 30 80 50 50Z" fill="${f}"/><path d="M50 50 C70 20 92 22 92 50 C92 78 70 80 50 50Z" fill="${f}"/><circle cx="50" cy="50" r="12" fill="${f}"/>`,
    detail: ({ dk, lt }) => line('M44 50 C32 34 20 34 14 46', dk, 2.2, 0.25) + line('M44 52 C32 66 20 66 14 54', dk, 2.2, 0.25) + line('M56 50 C68 34 80 34 86 46', dk, 2.2, 0.25) + line('M56 52 C68 66 80 66 86 54', dk, 2.2, 0.25) +
      `<circle cx="50" cy="50" r="12" fill="${dk}" opacity=".16"/><ellipse cx="46" cy="45" rx="5" ry="2.6" fill="${lt}" opacity=".55"/>`,
    hole: [50, 50, 6], side: [30, 50], gloss: [24, 38],
  },
  car: {
    body: (f) => `<rect x="6" y="46" width="88" height="28" rx="10" fill="${f}"/><path d="M22 48 L32 26 C33 24 35 24 36 24 L64 24 C66 24 67 25 68 26 L80 48Z" fill="${f}"/>`,
    detail: ({ dk, lt }) => line('M50 48 L50 72', dk, 1.8, 0.25) + `<rect x="9" y="56" width="82" height="3" rx="1.5" fill="${lt}" opacity=".4"/><rect x="10" y="66" width="80" height="6" rx="3" fill="${dk}" opacity=".22"/>`,
    accent: '<defs><linearGradient id="cw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#8fd0ea"/></linearGradient></defs><path d="M29 46 L36 29 L48 29 L48 46Z M52 46 L52 29 L63 29 L72 46Z" fill="url(#cw)"/><path d="M33 44 L38 32" stroke="#fff" stroke-width="2" opacity=".8" stroke-linecap="round"/><circle cx="87" cy="55" r="3.2" fill="#fff6b0"/><circle cx="28" cy="76" r="11" fill="#30303c"/><circle cx="72" cy="76" r="11" fill="#30303c"/><circle cx="28" cy="76" r="5" fill="#d4d4de"/><circle cx="72" cy="76" r="5" fill="#d4d4de"/><circle cx="26.5" cy="74.5" r="1.6" fill="#fff"/><circle cx="70.5" cy="74.5" r="1.6" fill="#fff"/>',
    hole: [50, 60, 6], side: [10, 58], gloss: [30, 34],
  },
  cloud: {
    body: (f) => `<circle cx="30" cy="58" r="20" fill="${f}"/><circle cx="52" cy="42" r="26" fill="${f}"/><circle cx="74" cy="58" r="19" fill="${f}"/><rect x="30" y="56" width="44" height="22" fill="${f}"/>`,
    detail: ({ dk, lt }) => `<path d="M12 70 C20 82 80 82 90 70 L90 78 C80 84 20 84 12 78Z" fill="${dk}" opacity=".22"/>` + [[30, 50, 12], [52, 30, 15], [74, 50, 11]].map(([x, y, r]) => `<ellipse cx="${x - 3}" cy="${y - 2}" rx="${r}" ry="${r * 0.5}" fill="${lt}" opacity=".4" transform="rotate(-25 ${x - 3} ${y - 2})"/>`).join('') + line('M40 56 C42 66 46 70 52 70', dk, 1.6, 0.18),
    hole: [52, 56, 8], side: [14, 62], gloss: [42, 30],
  },
  snowflake: {
    stroked: true,
    body: (f) => ['0', '60', '120'].map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 10 L50 90 M50 24 L40 14 M50 24 L60 14 M50 76 L40 86 M50 76 L60 86" stroke="${f}" stroke-width="9" stroke-linecap="round" fill="none"/></g>`).join('') + `<circle cx="50" cy="50" r="13" fill="${f}"/>`,
    detail: ({ lt }) => ['0', '60', '120'].map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 12 L50 88 M50 24 L41 15 M50 24 L59 15 M50 76 L41 85 M50 76 L59 85" stroke="${lt}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/></g>`).join('') + [[50, 8], [50, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" opacity=".9"/>`).join(''),
    hole: [50, 50, 7], side: [38, 50], gloss: [42, 38],
  },
};

// ---------- the tunnel ----------

/** A string hole: lit lip, inner wall catching bounce light, deep void. rot tilts it; `thread` shows the string. */
function tunnel(id: string, t: Tone, cx: number, cy: number, rx: number, ry: number, rot: number, thread: boolean): { defs: string; body: string } {
  const wallTop = mix(t.dark, '#000000', 0.4);
  const wallBottom = mix(t.base, t.light, 0.3);
  const voidCore = mix(t.dark, '#000000', 0.78);
  const voidEdge = mix(t.dark, '#000000', 0.5);
  const g = `<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wallTop}"/><stop offset=".55" stop-color="${mix(t.dark, '#000', 0.2)}"/><stop offset="1" stop-color="${wallBottom}"/></linearGradient>` +
    `<radialGradient id="${id}v" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="${voidCore}"/><stop offset=".65" stop-color="${voidEdge}"/><stop offset="1" stop-color="${t.dark}" stop-opacity=".75"/></radialGradient>`;
  const tr = `transform="rotate(${rot} ${cx} ${cy})"`;
  return {
    defs: g,
    body:
      // soft shadow the lip throws on the bead, then the bevelled lip itself
      `<ellipse cx="${cx + 0.8}" cy="${cy + 1.4}" rx="${(rx * 1.3).toFixed(2)}" ry="${(ry * 1.32).toFixed(2)}" fill="${t.dark}" opacity=".4" ${tr}/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * 1.22).toFixed(2)}" ry="${(ry * 1.22).toFixed(2)}" fill="${mix(t.light, t.base, 0.4)}" opacity=".95" ${tr}/>` +
      `<ellipse cx="${cx + 0.5}" cy="${cy + 0.9}" rx="${(rx * 1.1).toFixed(2)}" ry="${(ry * 1.1).toFixed(2)}" fill="${t.dark}" opacity=".55" ${tr}/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}w)" ${tr}/>` +
      `<ellipse cx="${(cx + rx * 0.1).toFixed(2)}" cy="${(cy - ry * 0.22).toFixed(2)}" rx="${(rx * 0.7).toFixed(2)}" ry="${(ry * 0.58).toFixed(2)}" fill="url(#${id}v)" ${tr}/>` +
      (thread ? `<path d="M${(cx - rx * 0.9).toFixed(2)} ${(cy + ry * 0.2).toFixed(2)} Q${cx} ${(cy + ry * 0.5).toFixed(2)} ${(cx + rx * 0.9).toFixed(2)} ${(cy - ry * 0.1).toFixed(2)}" stroke="#c99458" stroke-width="${(ry * 0.5).toFixed(2)}" fill="none" stroke-linecap="round" ${tr}/><path d="M${(cx - rx * 0.8).toFixed(2)} ${(cy + ry * 0.05).toFixed(2)} Q${cx} ${(cy + ry * 0.3).toFixed(2)} ${(cx + rx * 0.8).toFixed(2)} ${(cy - ry * 0.25).toFixed(2)}" stroke="#f0cf96" stroke-width="${(ry * 0.14).toFixed(2)}" fill="none" stroke-linecap="round" opacity=".8" ${tr}/>` : '') +
      // a thin bright edge along the lower inner wall: bounce light
      `<path d="M${(cx - rx * 0.72).toFixed(2)} ${(cy + ry * 0.55).toFixed(2)} Q${cx} ${(cy + ry * 1.02).toFixed(2)} ${(cx + rx * 0.72).toFixed(2)} ${(cy + ry * 0.55).toFixed(2)}" stroke="#fff" stroke-width="${Math.max(0.8, ry * 0.12).toFixed(2)}" fill="none" opacity=".5" stroke-linecap="round" ${tr}/>`,
  };
}

let uid = 0;

function pattern(design: DesignId, mask: string): string {
  switch (design) {
    case 'stripes':
      return `<g mask="url(#${mask})" fill="#fff" opacity=".94">${[22, 43, 64].map((y) => `<path d="M-6 ${y} Q50 ${y + 17} 106 ${y} L106 ${y + 10} Q50 ${y + 28} -6 ${y + 10}Z"/>`).join('')}</g>`;
    case 'dots':
      return `<g mask="url(#${mask})" fill="#fff" opacity=".94">${[[30, 28], [62, 24], [46, 50], [76, 48], [28, 70], [60, 74], [88, 66], [14, 48]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${(5.6 * (1 - Math.abs(x - 50) / 95)).toFixed(2)}" ry="5.4"/>`).join('')}</g>`;
    case 'glitter':
      return `<g mask="url(#${mask})" fill="#fff">${[[30, 34, 3], [58, 26, 2.4], [44, 56, 3.4], [72, 52, 2.6], [26, 72, 2.4], [58, 76, 3.2], [82, 70, 2], [18, 50, 2]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2} L${x + r * 0.6} ${y - r * 0.6} L${x + r * 2} ${y} L${x + r * 0.6} ${y + r * 0.6} L${x} ${y + r * 2} L${x - r * 0.6} ${y + r * 0.6} L${x - r * 2} ${y} L${x - r * 0.6} ${y - r * 0.6}Z" opacity=".96"/>`).join('')}${[[40, 40], [66, 62], [36, 80], [78, 34], [52, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" opacity=".8"/>`).join('')}</g>`;
    default:
      return '';
  }
}

export type BeadView = 'front' | 'side';

/** The inside of a bead's svg (defs + drawing). `shadow` adds a soft contact shadow under it. */
export function beadInner(shape: ShapeId, design: DesignId, shadow = true, view: BeadView = 'front'): string {
  const id = `b${++uid}`;
  const art = SHAPES[shape];
  const t = toneOf(design);
  const metallic = design === 'gold';
  const pearl = design === 'white';
  const glow = mix(t.base, '#ffffff', 0.18);
  const ctx: Ctx = { id, t, dk: t.dark, lt: t.light };

  const bodyStops = metallic
    ? `<stop offset="0" stop-color="${t.light}"/><stop offset=".22" stop-color="${t.base}"/><stop offset=".4" stop-color="${mix(t.dark, t.base, 0.4)}"/><stop offset=".56" stop-color="${t.light}"/><stop offset=".78" stop-color="${t.base}"/><stop offset="1" stop-color="${t.dark}"/>`
    : `<stop offset="0" stop-color="${t.light}"/><stop offset=".36" stop-color="${t.base}"/><stop offset=".78" stop-color="${mix(t.base, t.dark, 0.62)}"/><stop offset="1" stop-color="${t.dark}"/>`;
  const defs =
    `<radialGradient id="${id}g" gradientUnits="userSpaceOnUse" cx="34" cy="28" r="76">${bodyStops}</radialGradient>` +
    `<radialGradient id="${id}s" gradientUnits="userSpaceOnUse" cx="66" cy="72" r="38"><stop offset="0" stop-color="${glow}" stop-opacity=".62"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}r" gradientUnits="userSpaceOnUse" cx="46" cy="44" r="58"><stop offset=".6" stop-color="${t.dark}" stop-opacity="0"/><stop offset="1" stop-color="${mix(t.dark, '#000', 0.4)}" stop-opacity=".5"/></radialGradient>` +
    `<radialGradient id="${id}b" gradientUnits="userSpaceOnUse" cx="62" cy="96" r="38"><stop offset="0" stop-color="${mix(t.light, '#fff', 0.3)}" stop-opacity=".55"/><stop offset="1" stop-color="${t.light}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${id}k" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="60" y2="70"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${id}h"><stop offset="0" stop-color="#4a2a10" stop-opacity=".42"/><stop offset="1" stop-color="#4a2a10" stop-opacity="0"/></radialGradient>` +
    // pearl iridescence: a faint pink and a faint aqua glow
    (pearl ? `<radialGradient id="${id}p1" gradientUnits="userSpaceOnUse" cx="30" cy="64" r="34"><stop offset="0" stop-color="#ffb6d4" stop-opacity=".5"/><stop offset="1" stop-color="#ffb6d4" stop-opacity="0"/></radialGradient><radialGradient id="${id}p2" gradientUnits="userSpaceOnUse" cx="72" cy="40" r="30"><stop offset="0" stop-color="#a8e4ff" stop-opacity=".45"/><stop offset="1" stop-color="#a8e4ff" stop-opacity="0"/></radialGradient>` : '') +
    (art.stroked ? '' : `<mask id="${id}c" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${art.body('#fff')}</mask>`);

  const mask = art.stroked ? '' : `mask="url(#${id}c)"`;
  const [hx, hy, hr] = art.hole;
  const front = view === 'front';
  const tun = front
    ? tunnel(id, t, hx, hy, hr, hr * 0.74, -14, false)
    : tunnel(id, t, Math.max(art.side[0], 17), art.side[1], Math.max(4.2, hr * 0.42), Math.max(8.5, hr * 0.95), 6, true);
  const [gx, gy] = art.gloss;

  return (
    `<defs>${defs}${tun.defs}</defs>` +
    (shadow ? `<ellipse cx="50" cy="93" rx="36" ry="7" fill="url(#${id}h)"/>` : '') +
    art.body(`url(#${id}g)`) +
    art.body(`url(#${id}s)`) +
    (pearl ? art.body(`url(#${id}p1)`) + art.body(`url(#${id}p2)`) : '') +
    (art.stroked ? '' : pattern(design, `${id}c`)) +
    art.body(`url(#${id}r)`) +
    (art.detail ? `<g ${mask}>${art.detail(ctx)}</g>` : '') +
    (art.accent ?? '') +
    art.body(`url(#${id}b)`) +
    art.body(`url(#${id}k)`) +
    tun.body +
    // two highlights: a broad soft one and a small sharp one, plus a tiny kick on the far rim
    `<ellipse cx="${gx}" cy="${gy}" rx="12" ry="6.4" fill="#fff" opacity=".6" transform="rotate(-32 ${gx} ${gy})"/>` +
    `<ellipse cx="${gx - 2}" cy="${gy - 1.4}" rx="5" ry="2.2" fill="#fff" opacity=".9" transform="rotate(-32 ${gx} ${gy})"/>` +
    `<circle cx="${gx + 15}" cy="${gy + 10}" r="2" fill="#fff" opacity=".65"/>` +
    (metallic || design === 'glitter' ? `<path d="M${gx + 22} ${gy - 8} l1.6 4.4 l4.4 1.6 l-4.4 1.6 l-1.6 4.4 l-1.6 -4.4 l-4.4 -1.6 l4.4 -1.6Z" fill="#fff" opacity=".95"/>` : '')
  );
}

/** A standalone bead as an svg string. */
export function beadSVG(shape: ShapeId, design: DesignId, size = 64, shadow = true, view: BeadView = 'front'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${beadInner(shape, design, shadow, view)}</svg>`;
}

const ICON_DETAIL = new Set<ShapeId>(['shell', 'leaf', 'diamond']);

/** A small flat icon of a shape (for the tabs): one soft colour, no hole. */
export function shapeIcon(shape: ShapeId, color: string, size = 30): string {
  const art = SHAPES[shape];
  const detail = ICON_DETAIL.has(shape) && art.detail ? art.detail({ id: 'icon', t: TONES.white, dk: '#ffffff', lt: '#ffffff' }) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${art.body(color)}${detail}</svg>`;
}

/** The icon for the plain round bead is a 2x2 group of dots, like the mockup's first tab. */
export function dotsIcon(color: string, size = 30): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g fill="${color}"><circle cx="28" cy="28" r="19"/><circle cx="72" cy="28" r="19"/><circle cx="28" cy="72" r="19"/><circle cx="72" cy="72" r="19"/></g></svg>`;
}
