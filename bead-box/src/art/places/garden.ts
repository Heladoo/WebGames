// Flower Garden: a rainbow over patchwork hills, a cottage, a picket fence and flowers in layers. 400 x 700.

import { FX, blossom, bokeh, butterfly, cloud, f1, foliage, glints, grass, lg, rg, rng, vignette } from '../paint';

const stem = (x: number, y: number, h: number, lean: number) =>
  `<path d="M${f1(x)} ${f1(y)} Q${f1(x + lean * 0.3)} ${f1(y - h * 0.5)} ${f1(x + lean)} ${f1(y - h)}" stroke="#2f8a3f" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${f1(x + 1.2)} ${f1(y)} Q${f1(x + lean * 0.3 + 1.2)} ${f1(y - h * 0.5)} ${f1(x + lean + 1.2)} ${f1(y - h)}" stroke="#7fcf6a" stroke-width="1.2" fill="none" opacity=".7"/>` +
  `<path d="M${f1(x + lean * 0.2)} ${f1(y - h * 0.3)} q-18 -4 -24 -22 q18 0 24 22Z" fill="#3a9a4a"/><path d="M${f1(x + lean * 0.3)} ${f1(y - h * 0.5)} q16 -6 24 -24 q-20 4 -24 24Z" fill="#4cae58"/>`;

function tulip(x: number, y: number, h: number, lean: number, c: [string, string], id: string): string {
  const tx = x + lean;
  const ty = y - h;
  return (
    `<defs>${lg(id, [[0, c[0]], [1, c[1]]])}</defs>` + stem(x, y, h, lean) +
    `<ellipse cx="${f1(tx + 2)}" cy="${f1(ty + 6)}" rx="14" ry="5" fill="#000" opacity=".12" filter="url(#b2)"/>` +
    `<path d="M${f1(tx - 15)} ${f1(ty - 4)} C${f1(tx - 18)} ${f1(ty - 30)} ${f1(tx - 6)} ${f1(ty - 34)} ${f1(tx)} ${f1(ty - 22)} C${f1(tx + 6)} ${f1(ty - 34)} ${f1(tx + 18)} ${f1(ty - 30)} ${f1(tx + 15)} ${f1(ty - 4)} C${f1(tx + 10)} ${f1(ty + 12)} ${f1(tx - 10)} ${f1(ty + 12)} ${f1(tx - 15)} ${f1(ty - 4)}Z" fill="url(#${id})"/>` +
    `<path d="M${f1(tx)} ${f1(ty - 22)} C${f1(tx - 8)} ${f1(ty - 8)} ${f1(tx - 6)} ${f1(ty + 6)} ${f1(tx)} ${f1(ty + 11)} C${f1(tx + 8)} ${f1(ty + 4)} ${f1(tx + 8)} ${f1(ty - 10)} ${f1(tx)} ${f1(ty - 22)}Z" fill="${c[1]}" opacity=".5"/>` +
    `<path d="M${f1(tx - 10)} ${f1(ty - 22)} C${f1(tx - 13)} ${f1(ty - 12)} ${f1(tx - 12)} ${f1(ty - 4)} ${f1(tx - 9)} ${f1(ty + 2)}" stroke="#fff" stroke-width="2.6" fill="none" opacity=".5" stroke-linecap="round"/>`
  );
}

function sunflower(x: number, y: number, h: number, r: number): string {
  const tx = x;
  const ty = y - h;
  let petals = '';
  for (let k = 0; k < 2; k++) for (let i = 0; i < 16; i++) {
    const a = (360 / 16) * i + k * 11;
    petals += `<ellipse cx="0" cy="${f1(-r * (k ? 0.78 : 0.9))}" rx="${f1(r * 0.2)}" ry="${f1(r * 0.42)}" fill="${k ? '#f6b81c' : '#ffd23a'}" transform="rotate(${a})"/>`;
  }
  let seeds = '';
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4;
    const d = Math.sqrt(i / 26) * r * 0.42;
    seeds += `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" r="1.5" fill="#d9a05a" opacity=".6"/>`;
  }
  return (
    stem(x, y, h, 0) + `<g transform="translate(${f1(tx)} ${f1(ty)})"><ellipse cx="3" cy="${f1(r * 0.8)}" rx="${f1(r)}" ry="${f1(r * 0.3)}" fill="#000" opacity=".12" filter="url(#b3)"/>${petals}` +
    `<defs>${rg('sfc', [[0, '#7a4a22'], [1, '#3e220e']], 0.4, 0.35, 0.8)}</defs><circle r="${f1(r * 0.48)}" fill="url(#sfc)"/>${seeds}<circle cx="${f1(-r * 0.15)}" cy="${f1(-r * 0.15)}" r="${f1(r * 0.16)}" fill="#fff" opacity=".25"/></g>`
  );
}

function daisy(x: number, y: number, h: number, lean: number, r: number): string {
  const tx = x + lean;
  const ty = y - h;
  let petals = '';
  for (let i = 0; i < 14; i++) petals += `<ellipse cx="0" cy="${f1(-r * 0.78)}" rx="${f1(r * 0.17)}" ry="${f1(r * 0.4)}" fill="#fff" stroke="#e1ecf5" stroke-width=".7" transform="rotate(${(360 / 14) * i})"/>`;
  return stem(x, y, h, lean) + `<g transform="translate(${f1(tx)} ${f1(ty)})">${petals}<circle r="${f1(r * 0.3)}" fill="#ffcf2a"/><circle cx="${f1(-r * 0.08)}" cy="${f1(-r * 0.08)}" r="${f1(r * 0.12)}" fill="#fff" opacity=".6"/></g>`;
}

function rose(x: number, y: number, h: number, lean: number, c: [string, string], id: string): string {
  const tx = x + lean;
  const ty = y - h;
  let spiral = '';
  for (let i = 0; i < 5; i++) spiral += `<path d="M${f1(-9 + i * 1.4)} ${f1(-3 + i)} Q${f1(-1)} ${f1(-12 + i * 2.4)} ${f1(9 - i * 1.4)} ${f1(-2 + i)}" stroke="${c[1]}" stroke-width="1.5" fill="none" opacity=".7" stroke-linecap="round"/>`;
  return (
    `<defs>${rg(id, [[0, c[0]], [1, c[1]]], 0.4, 0.3, 0.9)}</defs>` + stem(x, y, h, lean) +
    `<g transform="translate(${f1(tx)} ${f1(ty)})"><ellipse cx="2" cy="12" rx="15" ry="4" fill="#000" opacity=".12" filter="url(#b2)"/><circle r="16" fill="url(#${id})"/><circle cx="-5" cy="-5" r="9" fill="${c[0]}" opacity=".55"/>${spiral}<path d="M-10 -8 Q-4 -15 4 -13" stroke="#fff" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/></g>`
  );
}

function cottage(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="4" cy="2" rx="52" ry="7" fill="#2a5a2a" opacity=".3" filter="url(#b3)"/>` +
    `<rect x="40" y="-92" width="12" height="26" fill="#a85a3a"/>` + [[46, -104, 7, 0.5], [52, -118, 10, 0.4], [60, -136, 13, 0.3]].map(([cx, cy, r, op]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${op}" filter="url(#b3)"/>`).join('') +
    `<rect x="-46" y="-52" width="92" height="54" fill="#fbeed4"/><rect x="-46" y="-52" width="92" height="6" fill="#fff" opacity=".6"/><rect x="36" y="-52" width="10" height="54" fill="#d9c49a" opacity=".6"/>` +
    `<path d="M-58 -48 L0 -96 L58 -48Z" fill="#c9553a"/><path d="M-58 -48 L0 -96 L58 -48Z" fill="none" stroke="#8a2f1f" stroke-width="2"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${-48 + i * 17} -50 L${-34 + i * 11 - 14} -66" stroke="#a8412a" stroke-width="2" opacity=".6"/>`).join('') +
    `<path d="M0 -96 L58 -48 L40 -48 L0 -88Z" fill="#8a2f1f" opacity=".35"/>` +
    `<rect x="-12" y="-30" width="24" height="32" rx="12" fill="#6a8fd0"/><circle cx="6" cy="-12" r="2" fill="#ffd24a"/>` +
    `<rect x="-40" y="-40" width="20" height="18" rx="2" fill="#bfe4f6" stroke="#fff" stroke-width="3"/><path d="M-30 -40 v18 M-40 -31 h20" stroke="#fff" stroke-width="2"/><rect x="-42" y="-20" width="24" height="7" rx="2" fill="#7a4a2c"/>` + [-38, -30, -22].map((dx, i) => `<circle cx="${dx}" cy="-22" r="3.4" fill="${['#ff7a9a', '#ffd23a', '#fff'][i]}"/>`).join('') +
    `<rect x="20" y="-40" width="20" height="18" rx="2" fill="#bfe4f6" stroke="#fff" stroke-width="3"/><path d="M30 -40 v18 M20 -31 h20" stroke="#fff" stroke-width="2"/></g>`
  );
}

export function garden(): string {
  const r = rng(1515);
  const hill = (base: number, amp: number, ph: number) => (x: number) => base + Math.sin(x / 70 + ph) * amp + Math.sin(x / 31 + ph * 2) * amp * 0.3;
  let rows = '';
  for (let i = 0; i < 12; i++) rows += `<path d="M-10 ${f1(350 + i * 6)} Q100 ${f1(334 + i * 6)} 200 ${f1(344 + i * 6)} T410 ${f1(340 + i * 6)}" stroke="#7bb85a" stroke-width="1.2" fill="none" opacity=".4"/>`;
  const fence = (y: number) => {
    let s = `<rect x="-10" y="${y - 14}" width="420" height="7" fill="#f4f6f8" stroke="#d6dde4" stroke-width="1"/><rect x="-10" y="${y + 6}" width="420" height="7" fill="#f4f6f8" stroke="#d6dde4" stroke-width="1"/>`;
    for (let i = 0; i < 15; i++) s += `<path d="M${i * 29 - 8} ${y + 24} L${i * 29 - 8} ${y - 18} L${i * 29 + 2} ${y - 28} L${i * 29 + 12} ${y - 18} L${i * 29 + 12} ${y + 24}Z" fill="#fff" stroke="#d6dde4" stroke-width="1.2"/><path d="M${i * 29 + 8} ${y - 20} L${i * 29 + 8} ${y + 24}" stroke="#c9d3dc" stroke-width="3" opacity=".6"/><path d="M${i * 29 - 5} ${y - 16} L${i * 29 - 5} ${y + 22}" stroke="#fff" stroke-width="1.6" opacity=".9"/>`;
    return s + `<rect x="-10" y="${y + 24}" width="420" height="8" fill="#2f6a2c" opacity=".35" filter="url(#b3)"/>`;
  };
  const sparkles = Array.from({ length: 40 }, () => `<circle cx="${f1(r() * 400)}" cy="${f1(450 + r() * 250)}" r="${(0.8 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`).join('');

  return (
    `<defs>${FX}` +
    lg('gsky', [[0, '#69c2f2'], [0.6, '#b7e4f8'], [1, '#eaf8f6']]) +
    lg('ggnd', [[0, '#96d86e'], [0.5, '#6cbb55'], [1, '#4a9e45']]) +
    rg('gsun', [[0, '#fffbe0', 0.6], [1, '#fffbe0', 0]], 0.2, 0.05, 0.6) +
    `</defs>` +
    `<rect width="400" height="700" fill="url(#gsky)"/><rect width="400" height="480" fill="url(#gsun)"/>` +
    // rainbow with a glow
    `<g fill="none" stroke-width="11"><path d="M24 360 A176 176 0 0 1 376 360" stroke="#ff6f7f" opacity=".5"/><path d="M35 360 A165 165 0 0 1 365 360" stroke="#ffb347" opacity=".5"/><path d="M46 360 A154 154 0 0 1 354 360" stroke="#ffe36a" opacity=".5"/><path d="M57 360 A143 143 0 0 1 343 360" stroke="#7fd68a" opacity=".5"/><path d="M68 360 A132 132 0 0 1 332 360" stroke="#6fb8f2" opacity=".5"/><path d="M79 360 A121 121 0 0 1 321 360" stroke="#a58cf0" opacity=".5"/></g>` +
    `<path d="M24 360 A176 176 0 0 1 376 360" stroke="#fff" stroke-width="30" fill="none" opacity=".22" filter="url(#b8)"/>` +
    cloud(-30, 130, 150, 48, 4, ['#bccdf0', '#f6ecf8', '#ffffff'], '#ffd6e6') + cloud(250, 80, 120, 38, 9, ['#bccdf0', '#f6ecf8', '#ffffff'], '#ffd6e6', 0.95) + cloud(190, 300, 150, 40, 14, ['#c4d4f2', '#f8f0fa', '#ffffff'], '#ffe0ec', 0.9) +
    // hills
    foliage(-10, 410, hill(350, 10, 0), 440, 3, ['#8fd36a', '#a7e07a', '#c8f09a'], 14, 0.8) + rows +
    cottage(86, 372, 0.9) +
    foliage(-10, 410, hill(398, 8, 2), 460, 5, ['#6cbb55', '#82cf62', '#a9e57c'], 12, 0.9) +
    `<path d="M-10 452 Q200 428 410 456 L410 700 L-10 700Z" fill="url(#ggnd)"/>` +
    fence(444) +
    grass(-10, 410, 480, 90, 28, 3) +
    [[40, 470, '#ff8fb0'], [120, 480, '#fff'], [220, 474, '#ffd24a'], [310, 482, '#d9a0f0'], [380, 470, '#fff']].map(([x, y, c]) => blossom(+x, +y, 5, String(c))).join('') +
    // flowers in layers, tall at the back and low at the front
    tulip(22, 596, 124, 6, ['#ff6d95', '#d93a6a'], 't1') + tulip(344, 600, 138, -8, ['#b98af0', '#7a4cc2'], 't2') + sunflower(386, 640, 168, 30) + sunflower(12, 660, 150, 26) +
    rose(66, 660, 90, 4, ['#ff7a8a', '#c92a4a'], 'r1') + daisy(320, 660, 80, -4, 18) + daisy(98, 620, 70, 6, 15) + tulip(290, 640, 90, 6, ['#ffd24a', '#e8a01a'], 't3') + tulip(54, 700, 64, 0, ['#ff9a4a', '#e0641a'], 't4') +
    grass(-10, 410, 700, 100, 40, 9, '#2f8a3f', '#6cc050') +
    butterfly(128, 296, 0.9, -12, '#ff9ac0', '#e0457f', 'bf1') + butterfly(300, 380, 0.7, 14, '#ffd24a', '#f08a1a', 'bf2') + butterfly(210, 520, 0.6, -8, '#9ab0ff', '#5a52d8', 'bf3') +
    glints(6, 30, 0, 400, 460, 700, 3, '#ffffff') + sparkles +
    bokeh(5, 14, 0, 400, 120, 600, ['#fff', '#ffe9a8', '#ffd6e6'], 3, 8, 0.4) +
    vignette(0.16, 'vigg')
  );
}
