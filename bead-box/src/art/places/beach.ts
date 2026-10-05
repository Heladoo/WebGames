// Hawaii Beach: the reference scene, painted to match the mockup. 400 x 700.

import { FX, bez, bigLeaf, cirrus, cloud, f1, foliage, glints, grass, hibiscus, lg, palm, rg, rng, shell, starfish, vignette, type Pt } from '../paint';

// The shore: where the sea meets the sand. Two cubic pieces, sampled so other things can sit along it.
const SEG: [Pt, Pt, Pt, Pt][] = [
  [{ x: -10, y: 414 }, { x: 80, y: 402 }, { x: 160, y: 384 }, { x: 240, y: 362 }],
  [{ x: 240, y: 362 }, { x: 290, y: 348 }, { x: 345, y: 340 }, { x: 410, y: 336 }],
];
const SHORE = `M${SEG[0][0].x} ${SEG[0][0].y} C${SEG[0][1].x} ${SEG[0][1].y} ${SEG[0][2].x} ${SEG[0][2].y} ${SEG[0][3].x} ${SEG[0][3].y} C${SEG[1][1].x} ${SEG[1][1].y} ${SEG[1][2].x} ${SEG[1][2].y} ${SEG[1][3].x} ${SEG[1][3].y}`;
const shoreAt = (u: number): Pt => {
  const k = u * 2;
  const seg = SEG[k < 1 ? 0 : 1];
  return bez(seg[0], seg[1], seg[2], seg[3], k < 1 ? k : k - 1);
};

export function beach(): string {
  const r = rng(77);
  const HZ = 290; // horizon

  let foamBubbles = '';
  for (let i = 0; i < 70; i++) {
    const p = shoreAt(r());
    const dy = 3 + r() * 20;
    const rad = 0.7 + r() * 1.9;
    foamBubbles += `<circle cx="${f1(p.x + (r() - 0.5) * 8)}" cy="${f1(p.y + dy)}" r="${f1(rad)}" fill="#fff" fill-opacity="${(0.12 + r() * 0.3).toFixed(2)}" stroke="#fff" stroke-opacity="${(0.4 + r() * 0.4).toFixed(2)}" stroke-width=".6"/>`;
  }

  let ripples = '';
  for (let i = 0; i < 26; i++) {
    const x = r() * 420 - 10;
    const y = 430 + r() * 260;
    const l = 24 + r() * 60;
    ripples += `<path d="M${f1(x)} ${f1(y)} q${f1(l / 2)} ${f1(-4 - r() * 4)} ${f1(l)} ${f1(r() * 3 - 1)}" stroke="#c99a6a" stroke-width="${(0.8 + r()).toFixed(1)}" fill="none" opacity="${(0.14 + r() * 0.12).toFixed(2)}" stroke-linecap="round"/><path d="M${f1(x)} ${f1(y + 2.4)} q${f1(l / 2)} ${f1(-4 - r() * 4)} ${f1(l)} ${f1(r() * 3 - 1)}" stroke="#fff3dc" stroke-width="1" fill="none" opacity=".28" stroke-linecap="round"/>`;
  }
  let pebbles = '';
  for (let i = 0; i < 16; i++) {
    const x = r() * 400;
    const y = 450 + r() * 240;
    const w = 2 + r() * 3.6;
    pebbles += `<ellipse cx="${f1(x + 1)}" cy="${f1(y + 1)}" rx="${f1(w)}" ry="${f1(w * 0.6)}" fill="#a4764a" opacity=".3"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(w * 0.6)}" fill="${r() > 0.5 ? '#f1d2ac' : '#e4bb91'}"/><ellipse cx="${f1(x - w * 0.3)}" cy="${f1(y - w * 0.2)}" rx="${f1(w * 0.4)}" ry="${f1(w * 0.2)}" fill="#fff" opacity=".6"/>`;
  }

  // sea depth bands: long soft wavy stripes
  let bands = '';
  for (let i = 0; i < 9; i++) {
    const y = HZ + 6 + i * 13 + r() * 5;
    bands += `<path d="M-10 ${f1(y)} Q60 ${f1(y - 5 - r() * 4)} 130 ${f1(y)} T270 ${f1(y)} T410 ${f1(y)} L410 ${f1(y + 7 + r() * 5)} L-10 ${f1(y + 7 + r() * 5)}Z" fill="${i % 2 ? '#1796cf' : '#5fd6e6'}" opacity="${(0.14 + r() * 0.1).toFixed(2)}"/>`;
  }
  let crests = '';
  for (let i = 0; i < 18; i++) {
    const x = r() * 380 - 10;
    const y = HZ + 14 + r() * 100;
    const l = 20 + r() * 50;
    crests += `<path d="M${f1(x)} ${f1(y)} q${f1(l * 0.25)} -3 ${f1(l * 0.5)} 0 t${f1(l * 0.5)} 0" stroke="#fff" stroke-width="${(0.8 + r() * 1.2).toFixed(1)}" fill="none" opacity="${(0.25 + r() * 0.4).toFixed(2)}" stroke-linecap="round"/>`;
  }

  // karst islands on the horizon, blue with haze
  const island = (x: number, w: number, h: number, seed: number, fill: string, op: number) => {
    const q = rng(seed);
    const pts = [`${f1(x)},${HZ + 2}`];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const bump = Math.sin(Math.PI * u) ** 0.8;
      const jag = i % 2 === 0 ? 1 : 0.62 + q() * 0.3;
      pts.push(`${f1(x + u * w)},${f1(HZ + 2 - bump * h * jag * (0.7 + q() * 0.4))}`);
    }
    pts.push(`${f1(x + w)},${HZ + 2}`);
    return `<path d="M${pts.join(' L')}Z" fill="${fill}" opacity="${op}" filter="url(#b1)"/>`;
  };

  // the jungle hill on the right
  const hill = (x0: number, base: number, peak: number, bump: number, ph: number) => (x: number) => {
    const u = Math.min(1, Math.max(0, (x - x0) / (410 - x0)));
    const ramp = Math.min(1, Math.max(0, (x - x0) / 70));
    return base - (base - peak) * u ** 0.85 * (ramp * ramp * (3 - 2 * ramp)) + Math.sin(x / bump + ph) * 2.6;
  };
  const hillBack = hill(190, 452, 296, 14, 0);
  const hillMid = hill(212, 462, 330, 9, 2);
  const hillFront = hill(240, 474, 396, 8, 1);

  const defs =
    `<defs>${FX}` +
    lg('sky', [[0, '#3aa8ee'], [0.4, '#68c5f6'], [0.75, '#abe1f8'], [1, '#e6f6f6']], 0, 0, 0, 1) +
    lg('sea', [[0, '#1c93cc'], [0.3, '#26aadf'], [0.65, '#4ecde4'], [1, '#86e8e4']], 0, 0, 0, 1) +
    lg('sand', [[0, '#fae2bc'], [0.45, '#f6d2a8'], [1, '#efc19b']], 0, 0, 0, 1) +
    lg('wet', [[0, '#d7b68c', 0.65], [1, '#e7c9a2', 0]], 0, 0, 0, 1) +
    lg('isle1', [[0, '#7fb9cc'], [1, '#b6dce3']], 0, 0, 0, 1) +
    lg('isle2', [[0, '#5ea6b8'], [1, '#9fd0d8']], 0, 0, 0, 1) +
    lg('haze', [[0, '#ffffff', 0], [1, '#eaf8f8', 0.85]], 0, 0, 0, 1) +
    rg('sunglow', [[0, '#fffbe8', 0.4], [0.5, '#fff4d0', 0.1], [1, '#fff4d0', 0]], 0.08, 0.03, 0.5) +
    rg('pinksand', [[0, '#f6a8b8', 0.35], [1, '#f6a8b8', 0]], 0.5, 0.5, 0.5) +
    `<clipPath id="sandclip"><path d="${SHORE} L410 700 L-10 700Z"/></clipPath>` +
    `</defs>`;

  return (
    defs +
    `<rect width="400" height="700" fill="url(#sky)"/>` +
    `<rect y="${HZ - 90}" width="400" height="100" fill="#ffd9b8" opacity=".22" filter="url(#b14)"/>` +
    `<rect width="400" height="520" fill="url(#sunglow)"/>` +
    cirrus(5, 9, 24, 150) +
    cloud(-30, 118, 150, 54, 11, ['#c4cdef', '#f4e5f6', '#ffffff'], '#f9bdd9') +
    cloud(200, 82, 110, 38, 23, ['#c4cdef', '#f4e5f6', '#ffffff'], '#fbc6dc', 0.95) +
    cloud(250, 168, 160, 52, 31, ['#c4cdef', '#f4e5f6', '#ffffff'], '#f9bdd9') +
    cloud(40, 214, 120, 30, 41, ['#c9d2f0', '#f6e8f7', '#ffffff'], '#fbd0e2', 0.85) +
    island(-14, 120, 52, 3, 'url(#isle2)', 0.9) + island(70, 100, 34, 9, 'url(#isle1)', 0.85) + island(190, 80, 22, 5, 'url(#isle1)', 0.75) +
    `<rect y="${HZ - 12}" width="400" height="18" fill="url(#haze)"/>` +
    // sea
    `<path d="M-10 ${HZ} L410 ${HZ} L410 336 C345 340 290 348 240 362 C160 384 80 402 -10 414Z" fill="url(#sea)"/>` +
    bands + crests + glints(21, 90, -10, 360, HZ + 4, 400, 9) +
    `<path d="${SHORE}" stroke="#8ff2e8" stroke-width="46" fill="none" opacity=".5" filter="url(#b8)"/>` +
    `<path d="${SHORE}" stroke="#c8fff4" stroke-width="16" fill="none" opacity=".55" filter="url(#b3)" transform="translate(0 -6)"/>` +
    // sand
    `<path d="${SHORE} L410 700 L-10 700Z" fill="url(#sand)"/>` +
    `<g clip-path="url(#sandclip)">` +
    `<ellipse cx="120" cy="560" rx="170" ry="70" fill="url(#pinksand)"/><ellipse cx="320" cy="640" rx="150" ry="60" fill="url(#pinksand)"/><ellipse cx="60" cy="470" rx="120" ry="40" fill="#fff" opacity=".12" filter="url(#b14)"/>` +
    `<path d="${SHORE}" stroke="#d4b088" stroke-width="30" fill="none" opacity=".55" filter="url(#b5)" transform="translate(0 16)"/>` +
    `<path d="${SHORE}" stroke="#fff6e4" stroke-width="7" fill="none" opacity=".35" filter="url(#b2)" transform="translate(0 9)"/>` +
    ripples + pebbles +
    `<rect width="400" height="700" filter="url(#grainSand)" opacity=".5"/>` +
    `</g>` +
    // foam
    `<path d="${SHORE}" stroke="#fff" stroke-width="14" fill="none" opacity=".55" filter="url(#b5)" transform="translate(0 -3)"/>` +
    `<path d="${SHORE}" stroke="#fff" stroke-width="5.5" fill="none" opacity=".96" stroke-linecap="round" stroke-dasharray="30 4 14 5 46 6" transform="translate(0 1)"/>` +
    `<path d="${SHORE}" stroke="#fff" stroke-width="3.2" fill="none" opacity=".8" stroke-linecap="round" stroke-dasharray="12 5 24 8" transform="translate(0 8)"/>` +
    `<path d="${SHORE}" stroke="#fff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round" stroke-dasharray="5 7 14 6" transform="translate(0 15)"/>` +
    foamBubbles +
    // the jungle hill
    foliage(190, 412, hillBack, 453, 5, ['#1f6a43', '#2f8a4d', '#6cbb5e'], 13) +
    palm(290, 410, 126, 14, 131, 0.85, 9) + palm(386, 380, 170, -22, 161, 0.9, 9) +
    foliage(212, 412, hillMid, 466, 8, ['#2a8148', '#3fa653', '#8fd568'], 12) +
    palm(322, 438, 214, 26, 211, 1.05, 10) + palm(356, 462, 286, -40, 241, 1.2, 11) +
    foliage(240, 412, hillFront, 480, 12, ['#318a3f', '#4cae55', '#9bdc6c'], 10, 1.1) +
    `<ellipse cx="330" cy="482" rx="110" ry="10" fill="#5a3a1a" opacity=".22" filter="url(#b5)"/>` +
    grass(246, 410, 478, 70, 30, 3) +
    `<path d="M200 470 C300 450 360 446 412 452 L412 520 C340 512 260 496 200 470Z" fill="#f0c797" opacity=".0"/>` +
    // foreground, left: leaves and a hibiscus
    bigLeaf(-16, 668, 150, 58, -62, '#2f9a4e', '#17613a', '#9fe29a', 'lf1') +
    bigLeaf(-10, 700, 150, 52, -34, '#3aa955', '#1e6f40', '#a6e8a0', 'lf2') +
    bigLeaf(-6, 640, 120, 46, -92, '#3a9f50', '#1a6638', '#9fe29a', 'lf3') +
    bigLeaf(8, 618, 110, 40, -118, '#3fa456', '#1b6a3b', '#a6e8a0', 'lf4') +
    hibiscus(40, 576, 40, 'hib1') +
    // shell and starfish, right
    shell(352, 600, 44, -10) + starfish(388, 652, 30, 18) +
    // light and edges
    vignette(0.18, 'vigb')
  );
}
