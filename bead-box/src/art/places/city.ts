// Big City: a bright afternoon skyline in three depths, a street with a crosswalk, lamp posts and a car. 400 x 700.

import { FX, building, bokeh, cloud, f1, glints, lg, rg, rng, vignette } from '../paint';

function lamp(x: number, y: number, h: number): string {
  return (
    `<ellipse cx="${x + 3}" cy="${y + 3}" rx="10" ry="3" fill="#1a1a2a" opacity=".3" filter="url(#b2)"/>` +
    `<rect x="${x - 2.4}" y="${y - h}" width="4.8" height="${h}" rx="2" fill="#3b4256"/><rect x="${x - 2.4}" y="${y - h}" width="1.6" height="${h}" fill="#7d86a0" opacity=".7"/>` +
    `<path d="M${x} ${y - h} q0 -10 14 -12" stroke="#3b4256" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${x + 16}" cy="${y - h - 11}" rx="9" ry="4.6" fill="#4a5068"/><circle cx="${x + 16}" cy="${y - h - 8}" r="22" fill="#fff0b0" opacity=".28" filter="url(#b5)"/><ellipse cx="${x + 16}" cy="${y - h - 8}" rx="6" ry="2.4" fill="#fff6c8"/>`
  );
}

function trafficLight(x: number, y: number): string {
  return (
    `<ellipse cx="${x + 2}" cy="${y + 3}" rx="9" ry="3" fill="#1a1a2a" opacity=".3" filter="url(#b2)"/>` +
    `<rect x="${x - 2.4}" y="${y - 84}" width="4.8" height="84" rx="2" fill="#4a5068"/>` +
    `<rect x="${x - 11}" y="${y - 122}" width="22" height="48" rx="7" fill="#2e3344"/><rect x="${x - 11}" y="${y - 122}" width="7" height="48" rx="6" fill="#fff" opacity=".12"/>` +
    [['#ff5a4d', -108, 0.9], ['#ffd34a', -98, 0.25], ['#59d36b', -88, 0.3]].map(([c, dy, op]) => `<circle cx="${x}" cy="${y + Number(dy) + 1}" r="4.6" fill="#10131c"/><circle cx="${x}" cy="${y + Number(dy)}" r="4.2" fill="${c}" opacity="${op}"/>`).join('') +
    `<circle cx="${x}" cy="${y - 108}" r="14" fill="#ff5a4d" opacity=".3" filter="url(#b3)"/>`
  );
}

function tree(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="4" cy="2" rx="24" ry="5" fill="#1a2a1a" opacity=".28" filter="url(#b3)"/>` +
    `<path d="M-4 0 L-3 -46 L3 -46 L4 0Z" fill="#6b4a2c"/><path d="M0 -30 l-14 -14 M0 -36 l14 -14" stroke="#6b4a2c" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="-16" cy="-58" r="22" fill="#2f8a47"/><circle cx="16" cy="-60" r="24" fill="#3a9a52"/><circle cx="0" cy="-76" r="26" fill="#44a85a"/><circle cx="-6" cy="-84" r="14" fill="#7fd070" opacity=".7"/><circle cx="14" cy="-70" r="9" fill="#9be27e" opacity=".6"/></g>`
  );
}

function car(x: number, y: number, body: [string, string], id: string): string {
  return (
    `<g transform="translate(${x} ${y})"><defs>${lg(id, [[0, body[0]], [1, body[1]]])}${lg(id + 'g', [[0, '#e8fbff'], [1, '#8fd0ea']], 0, 0, 1, 1)}</defs>` +
    `<ellipse cx="42" cy="46" rx="52" ry="7" fill="#10131c" opacity=".35" filter="url(#b3)"/>` +
    `<path d="M-4 30 C-4 20 4 14 14 12 L26 -6 C28 -9 32 -10 36 -10 L62 -10 C66 -10 70 -8 72 -5 L82 12 C92 14 100 20 100 30 L100 38 L-4 38Z" fill="url(#${id})"/>` +
    `<path d="M28 12 L36 -4 L50 -4 L50 12Z M54 12 L54 -4 L64 -4 L76 12Z" fill="url(#${id}g)"/><path d="M33 9 L39 -1" stroke="#fff" stroke-width="2.2" opacity=".85" stroke-linecap="round"/>` +
    `<rect x="-2" y="26" width="102" height="3.4" fill="#fff" opacity=".35"/><rect x="-4" y="34" width="104" height="6" fill="#000" opacity=".2"/><rect x="92" y="22" width="9" height="5" rx="2" fill="#fff3a8"/><rect x="-3" y="24" width="6" height="5" rx="2" fill="#ff6a5a"/>` +
    `<circle cx="22" cy="40" r="11" fill="#252733"/><circle cx="76" cy="40" r="11" fill="#252733"/><circle cx="22" cy="40" r="5.4" fill="#d6d9e4"/><circle cx="76" cy="40" r="5.4" fill="#d6d9e4"/><circle cx="20" cy="38" r="1.8" fill="#fff"/><circle cx="74" cy="38" r="1.8" fill="#fff"/></g>`
  );
}

export function city(): string {
  const r = rng(909);
  // buildings in three depths: hazy and far, coloured and mid, big and near
  let far = '';
  [[-6, 56, 190], [48, 44, 240], [92, 60, 170], [160, 50, 220], [212, 64, 190], [276, 46, 250], [320, 66, 180], [372, 50, 210]].forEach(([x, w, h], i) =>
    far += building(x, 396 - h, w, h, ['#a9c3e2', '#8aa6cc'], 20 + i, '#e6f2ff', 'rgba(255,255,255,.25)'));
  let mid = '';
  const pal: [string, string][] = [['#f4968a', '#d76a62'], ['#f7c65c', '#d99a2a'], ['#78b2e4', '#4f86bf'], ['#8fd3a4', '#58a874'], ['#c797dc', '#9a68b8'], ['#f6a96e', '#d6783a']];
  [[-10, 64, 200], [48, 70, 150], [120, 60, 230], [186, 76, 170], [268, 66, 250], [336, 70, 160]].forEach(([x, w, h], i) =>
    mid += building(x, 420 - h, w, h, pal[i % pal.length], 60 + i, '#fff2b0', 'rgba(30,50,90,.4)'));
  let birds = '';
  for (let i = 0; i < 6; i++) {
    const x = 40 + r() * 300;
    const y = 70 + r() * 150;
    birds += `<path d="M${f1(x)} ${f1(y)} q4 -5 8 0 q4 -5 8 0" stroke="#3a4a66" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  // road stripes in perspective
  let zebra = '';
  for (let i = 0; i < 9; i++) {
    const x0 = 6 + i * 44;
    zebra += `<polygon points="${f1(x0)},560 ${f1(x0 + 26)},560 ${f1(x0 + 30 + i * 3.4 - 14)},612 ${f1(x0 - 6 + i * 3.4 - 14)},612" fill="#f7f1da" opacity=".95"/>`;
  }
  let tiles = '';
  for (let i = 0; i < 12; i++) tiles += `<path d="M${i * 36 - 8} 424 L${i * 36 - 30 + i * 3} 470" stroke="#98a0b4" stroke-width="1" opacity=".6"/>`;

  return (
    `<defs>${FX}` +
    lg('csky', [[0, '#4faef0'], [0.55, '#9fdafa'], [1, '#ffe6c4']]) +
    lg('road', [[0, '#5e6478'], [1, '#444a5c']]) +
    lg('walk', [[0, '#d9dde8'], [1, '#bcc2d2']]) +
    rg('csun', [[0, '#fff3c8', 0.85], [0.35, '#ffe49a', 0.3], [1, '#ffe49a', 0]], 0.82, 0.38, 0.5) +
    `</defs>` +
    `<rect width="400" height="700" fill="url(#csky)"/><rect width="400" height="420" fill="url(#csun)"/>` +
    `<circle cx="326" cy="266" r="26" fill="#fff6d8"/>` +
    cloud(-20, 110, 130, 44, 3, ['#bcd0f0', '#f1f3fb', '#ffffff'], '#ffe0cc') + cloud(230, 60, 120, 40, 8, ['#bcd0f0', '#f1f3fb', '#ffffff'], '#ffe0cc', 0.95) + cloud(120, 190, 100, 30, 14, ['#c4d6f2', '#f4f6fc', '#ffffff'], '#ffe8d6', 0.85) + birds +
    `<g opacity=".7" filter="url(#b1)">${far}</g><rect y="300" width="400" height="100" fill="#dff0ff" opacity=".4" filter="url(#b8)"/>` +
    mid +
    // glass glints on the sunny faces
    glints(5, 34, 120, 380, 240, 400, 6, '#fff') +
    `<rect y="400" width="400" height="300" fill="url(#walk)"/><rect y="398" width="400" height="12" fill="#eef0f6"/><rect y="408" width="400" height="4" fill="#8a92a8" opacity=".5"/>` + tiles +
    `<rect y="476" width="400" height="224" fill="url(#road)"/><rect y="472" width="400" height="8" fill="#cfd4e0"/><rect y="478" width="400" height="3" fill="#7d849a" opacity=".6"/>` +
    `<g fill="#f7f1da" opacity=".95">${Array.from({ length: 8 }, (_, i) => `<rect x="${8 + i * 52}" y="524" width="30" height="6" rx="3"/>`).join('')}</g>` +
    zebra +
    `<ellipse cx="90" cy="650" rx="70" ry="10" fill="#8fb4e8" opacity=".25" filter="url(#b5)"/>` +
        lamp(40, 470, 120) + trafficLight(362, 474) + tree(318, 468, 0.95) + tree(130, 464, 0.8) +
    car(214, 478, ['#ff7a6a', '#d94a3e'], 'car1') +
    bokeh(3, 14, 0, 400, 200, 420, ['#fff', '#ffe49a'], 2, 5, 0.4) +
    vignette(0.2, 'vigc')
  );
}
