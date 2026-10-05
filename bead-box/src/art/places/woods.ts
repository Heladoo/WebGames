// The Woods: dappled light through a leafy canopy, bark-textured trunks, ferns and mushrooms. 400 x 700.

import { FX, blossom, bokeh, f1, fern, foliage, grass, lg, mushroom, rays, rg, rng, vignette } from '../paint';

function leafShape(x: number, y: number, s: number, rot: number, fill: string) {
  return `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${s})" d="M0 0 C6 -6 14 -6 18 0 C14 6 6 6 0 0Z" fill="${fill}"/>`;
}

export function woods(): string {
  const r = rng(404);

  // misty trees far away
  const mist = (seed: number, n: number, y0: number, col: string, op: number, blur: string) => {
    const q = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = q() * 420 - 10;
      const w = 5 + q() * 9;
      s += `<rect x="${f1(x)}" y="${y0 - 40}" width="${f1(w)}" height="${420 - y0 + 40}" fill="${col}"/>`;
      s += `<circle cx="${f1(x + w / 2)}" cy="${f1(y0 - 20 + q() * 40)}" r="${f1(26 + q() * 30)}" fill="${col}"/><circle cx="${f1(x + w / 2 + 14)}" cy="${f1(y0 + 6 + q() * 30)}" r="${f1(20 + q() * 22)}" fill="${col}"/>`;
    }
    return `<g opacity="${op}" filter="url(#${blur})">${s}</g>`;
  };

  // a big trunk with bark, moss and a flared root
  const trunk = (x: number, w: number, lean: number, base: string, lit: string, id: string, flip = 1) => {
    const top = -20;
    const bot = 440;
    const d = `M${f1(x - w / 2)} ${bot} C${f1(x - w * 0.46 + lean * 0.3)} 300 ${f1(x - w * 0.52 + lean)} 120 ${f1(x - w * 0.42 + lean)} ${top} L${f1(x + w * 0.42 + lean)} ${top} C${f1(x + w * 0.52 + lean)} 120 ${f1(x + w * 0.46 + lean * 0.3)} 300 ${f1(x + w / 2)} ${bot}`;
    return (
      `<defs>${lg(id, [[0, lit], [0.35, base], [1, '#2e1c0e']], flip > 0 ? 0 : 1, 0, flip > 0 ? 1 : 0, 0)}<clipPath id="${id}c"><path d="${d} Z"/></clipPath></defs>` +
      `<path d="${d} L${f1(x + w * 1.1)} 462 Q${f1(x)} 448 ${f1(x - w * 1.1)} 462Z" fill="url(#${id})"/>` +
      `<g clip-path="url(#${id}c)"><rect x="${f1(x - w)}" y="-20" width="${f1(w * 2.4)}" height="480" filter="url(#bark)" opacity=".85"/>` +
      `<path d="M${f1(x - w * 0.18)} 460 C${f1(x - w * 0.2)} 300 ${f1(x - w * 0.1 + lean)} 100 ${f1(x - w * 0.12 + lean)} -20" stroke="#fff3d0" stroke-width="${f1(w * 0.12)}" fill="none" opacity=".22" filter="url(#b3)"/>` +
      [[0.15, 300, 26], [-0.05, 220, 18], [0.2, 380, 22]].map(([k, y, rr]) => `<ellipse cx="${f1(x + Number(k) * w)}" cy="${y}" rx="${rr}" ry="${Number(rr) * 0.6}" fill="#5aa04a" opacity=".6" filter="url(#b2)"/>`).join('') +
      `<ellipse cx="${f1(x - w * 0.1)}" cy="190" rx="7" ry="11" fill="#2a170a" opacity=".5"/></g>`
    );
  };

  // canopy: dark underside first, then mid leaves, then sun-lit tips
  let canopy = '';
  for (let i = 0; i < 150; i++) {
    const x = r() * 420 - 10;
    const y = -20 + r() * 150 + (Math.abs(x - 200) < 60 ? -20 : 0);
    canopy += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(16 + r() * 22)}" fill="#25693c"/>`;
  }
  for (let i = 0; i < 160; i++) {
    const x = r() * 420 - 10;
    const y = -26 + r() * 130;
    canopy += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(11 + r() * 17)}" fill="${r() > 0.5 ? '#3a9150' : '#2f8247'}"/>`;
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * 420 - 10;
    const y = -24 + r() * 110;
    canopy += `<circle cx="${f1(x - 3)}" cy="${f1(y - 3)}" r="${f1(5 + r() * 9)}" fill="${r() > 0.4 ? '#8fd16a' : '#b6e47e'}" opacity="${(0.4 + r() * 0.45).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 70; i++) canopy += leafShape(r() * 400, r() * 130, 0.6 + r() * 0.7, r() * 360, r() > 0.5 ? '#6fbf5c' : '#a3dd72');

  // fallen leaves on the ground
  let leaves = '';
  for (let i = 0; i < 40; i++) leaves += leafShape(r() * 400, 440 + r() * 250, 0.5 + r() * 0.5, r() * 360, ['#e8a23a', '#d9682b', '#f2c94a', '#b9552a'][Math.floor(r() * 4)]);

  const floor = (x: number) => 392 + Math.sin(x / 40) * 8 + Math.sin(x / 17) * 3;
  const floor2 = (x: number) => 448 + Math.sin(x / 55 + 1) * 10;

  return (
    `<defs>${FX}` +
    lg('wsky', [[0, '#a8dcb4'], [0.5, '#cdeabc'], [1, '#f3f4c8']]) +
    lg('wgnd', [[0, '#6fb355'], [0.5, '#4a9444'], [1, '#2f7a3c']]) +
    rg('wsun', [[0, '#fffbd0', 0.85], [0.5, '#fff6b0', 0.25], [1, '#fff6b0', 0]], 0.42, 0.02, 0.55) +
    `</defs>` +
    `<rect width="400" height="700" fill="url(#wsky)"/><rect width="400" height="520" fill="url(#wsun)"/>` +
    rays(140, -10, 8, 560, 56, 3, '#fffbd0', 0.3) +
    mist(2, 9, 250, '#a6d6b4', 0.7, 'b5') + mist(7, 8, 300, '#7fc096', 0.75, 'b3') +
    `<rect y="300" width="400" height="140" fill="#e8f6d8" opacity=".35" filter="url(#b14)"/>` +
    trunk(-6, 74, 14, '#78502e', '#a97c4e', 'tk1') + trunk(402, 86, -16, '#6e4829', '#9d7143', 'tk2', -1) + trunk(300, 34, -6, '#7d5632', '#ab7f50', 'tk3', -1) + trunk(112, 18, 4, '#86603a', '#b58a58', 'tk4') +
    canopy +
    // ground
    `<path d="M-10 ${floor(0)} ` + Array.from({ length: 22 }, (_, i) => `L${f1(-10 + i * 20)} ${f1(floor(-10 + i * 20))}`).join(' ') + ` L410 700 L-10 700Z" fill="url(#wgnd)"/>` +
    foliage(-10, 410, floor, 470, 21, ['#4c9a46', '#69b858', '#a6dc6e'], 9, 1.2) +
    `<ellipse cx="170" cy="470" rx="130" ry="30" fill="#fffbd0" opacity=".22" filter="url(#b8)"/><ellipse cx="320" cy="560" rx="90" ry="26" fill="#fffbd0" opacity=".16" filter="url(#b8)"/>` +
    foliage(-10, 410, floor2, 700, 33, ['#3f8d40', '#5aa94d', '#93d065'], 10, 1.1) +
    fern(36, 520, 1.1, 5) + fern(366, 540, 1.2, 9) + fern(210, 452, 0.8, 13, '#27763c', '#58b25a') + fern(120, 600, 0.9, 17) +
    grass(-10, 410, 700, 120, 34, 4, '#2f7a3c', '#79c35c') +
    leaves +
    mushroom(330, 600, 1.15, ['#ff6a55', '#c4282a'], 'm1') + mushroom(296, 626, 0.7, ['#ffb347', '#d9741a'], 'm2') + mushroom(62, 640, 0.9, ['#d79bf0', '#9440b0'], 'm3') +
    [[110, 520, '#fff'], [250, 530, '#ffd84a'], [20, 580, '#f6a0c0'], [290, 668, '#fff'], [150, 676, '#ffb0c8'], [380, 480, '#fff'], [60, 470, '#ffd84a']].map(([x, y, c]) => blossom(+x, +y, 6, String(c))).join('') +
    bokeh(8, 30, 0, 400, 80, 600, ['#fffbd0', '#e6ffb0', '#fff'], 2, 6, 0.55) +
    vignette(0.26, 'vigw')
  );
}
