// The game's logo: "המרוץ לארמון" in big golden storybook letters under a rainbow, with the palace rising behind
// them and sparkles around. It is live SVG (not a painted picture) so the letters use the page's own Hebrew font.

import { palace } from './palace';

const sparkle = (x: number, y: number, r: number, c = '#fff') =>
  `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28}Z" fill="${c}"/>`;

/** The logo, 800 x 440 units. `id` keeps gradient ids unique when the logo is on a page twice. */
export function logoSVG(id = 'lg', cls = 'logo'): string {
  const rainbow = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
  let s = `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-label="המרוץ לארמון">`;
  s += `<defs><linearGradient id="${id}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".42" stop-color="#ffd23f"/><stop offset=".62" stop-color="#f4a21c"/><stop offset="1" stop-color="#d9780e"/></linearGradient>`;
  s += `<linearGradient id="${id}pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2f0"/><stop offset=".5" stop-color="#ff8fc8"/><stop offset="1" stop-color="#d94f96"/></linearGradient>`;
  s += `<filter id="${id}sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#3a1a4a" flood-opacity=".35"/></filter></defs>`;
  // rainbow arc and the palace
  rainbow.forEach((c, i) => (s += `<path d="M${120 + i * 14} 300 A${280 - i * 14} ${230 - i * 14} 0 0 1 ${680 - i * 14} 300" fill="none" stroke="${c}" stroke-width="15" opacity=".92"/>`));
  s += `<g filter="url(#${id}sh)">${palace(400, 236, 0.5, { wall: '#f6effc', roofA: '#8a6ad6', roofB: '#ee8cbf', wave: 0.3 })}</g>`;
  // clouds the words sit on
  s += `<g fill="#fff" stroke="#c9b6e0" stroke-width="3">${[[150, 330, 70], [240, 350, 80], [400, 356, 110], [560, 350, 80], [650, 330, 70]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
  s += `<g fill="#fff">${[[150, 330, 68], [240, 350, 78], [400, 356, 108], [560, 350, 78], [650, 330, 68]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
  // the words: a thick dark outline, a gold body, then a white shine
  const word = (txt: string, x: number, y: number, size: number, fill: string, rot = 0) => {
    const t = (extra: string) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" font-family="Fredoka, 'Varela Round', system-ui, sans-serif" font-weight="700" transform="rotate(${rot} ${x} ${y})" ${extra}>${txt}</text>`;
    return t(`fill="#4a2a5c" stroke="#4a2a5c" stroke-width="22" stroke-linejoin="round" filter="url(#${id}sh)"`) +
      t(`fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"`) +
      t(`fill="url(#${fill})" stroke="#8a4a10" stroke-width="2.4" stroke-linejoin="round"`);
  };
  s += word('המרוץ', 400, 300, 104, `${id}pink`, -2);
  s += word('לארמון', 400, 412, 132, `${id}gold`, 0);
  [[96, 120, 16], [700, 110, 20], [640, 220, 10], [160, 230, 12], [740, 300, 12], [60, 330, 10]].forEach(([x, y, r]) => (s += sparkle(x, y, r, '#fff8c8')));
  return s + `</svg>`;
}
