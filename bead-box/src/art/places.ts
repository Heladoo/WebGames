// Six places, painted in code with soft gradients and simple shapes. Each scene is an SVG fragment for a
// 400 x 700 box (sky on top, ground below). The table and bracelet are drawn separately (see scene.ts).

type P = Record<string, string>;

const lg = (id: string, stops: [number, string][], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

const cloud = (x: number, y: number, s: number, fill = '#fff', shade = '#ffd3e6', o = 0.95) =>
  `<g class="drift" transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="30" cy="22" rx="52" ry="14" fill="${shade}" opacity=".55"/>` +
  `<circle cx="0" cy="8" r="20" fill="${fill}"/><circle cx="26" cy="-6" r="27" fill="${fill}"/><circle cx="58" cy="2" r="23" fill="${fill}"/><circle cx="78" cy="14" r="15" fill="${fill}"/><rect x="0" y="8" width="80" height="21" rx="10" fill="${fill}"/></g>`;

const palm = (x: number, y: number, h: number, lean: number, s = 1) => {
  const tx = x + lean;
  const ty = y - h;
  const fronds = [-170, -135, -100, -60, -25, 10, 45].map((a, i) =>
    `<path transform="translate(${tx} ${ty}) rotate(${a}) scale(${s})" d="M0 0 C30 -34 76 -26 104 12 C70 -6 34 -4 0 0Z" fill="${i % 2 ? '#2f8f4a' : '#1f7a46'}"/>`).join('');
  return `<path d="M${x} ${y} C${x - lean * 0.2} ${y - h * 0.4} ${x + lean * 0.6} ${y - h * 0.7} ${tx} ${ty}" stroke="#7a4e2c" stroke-width="${11 * s}" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x + 3} ${y} C${x - lean * 0.2 + 3} ${y - h * 0.4} ${x + lean * 0.6 + 3} ${y - h * 0.7} ${tx + 3} ${ty}" stroke="#a97a4d" stroke-width="${3 * s}" fill="none" stroke-linecap="round" opacity=".6"/>` +
    fronds + `<circle cx="${tx}" cy="${ty + 3}" r="${6 * s}" fill="#6a4020"/>`;
};

const pine = (x: number, y: number, s: number, c1: string, c2: string, snow = false) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-5" y="0" width="10" height="22" fill="#6b4528"/>` +
  [[-34, 4, 34, 0], [-28, -22, 28, 0], [-22, -46, 22, 0]].map(([hw, ty, w], i) => `<path d="M${hw} ${ty + 30 - i * 4} L0 ${ty - 22} L${-hw} ${ty + 30 - i * 4}Z" fill="${i % 2 ? c1 : c2}"/><path d="M${hw * 0.85} ${ty + 12} L0 ${ty - 22} L${-hw * 0.85} ${ty + 12}Z" fill="${c1}" opacity=".35"/>${snow ? `<path d="M${hw * 0.5} ${ty - 3} L0 ${ty - 22} L${-hw * 0.5} ${ty - 3} Q0 ${ty + 4} ${hw * 0.5} ${ty - 3}Z" fill="#fff"/>` : ''}${w ? '' : ''}`).join('') + '</g>';

const flower = (x: number, y: number, r: number, petal: string, mid = '#ffd84a', n = 5) =>
  `<g transform="translate(${x} ${y})">${Array.from({ length: n }, (_, i) => {
    const a = (360 / n) * i;
    return `<ellipse cx="0" cy="${-r}" rx="${r * 0.62}" ry="${r}" fill="${petal}" transform="rotate(${a})"/>`;
  }).join('')}<circle r="${r * 0.55}" fill="${mid}"/></g>`;

const stars = (seed: number, n: number, y0: number, y1: number, col = '#fff') => {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => {
    const x = (rnd() * 390 + 5).toFixed(0);
    const y = (y0 + rnd() * (y1 - y0)).toFixed(0);
    const r = (0.8 + rnd() * 1.8).toFixed(1);
    return `<circle class="twinkle" cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"/>`;
  }).join('');
};

// ---------------------------------------------------------------------------

function beach(): string {
  return (
    `<defs>${lg('bsky', [[0, '#4fbef4'], [0.65, '#9fe0fa'], [1, '#e2f6fb']])}${lg('bsea', [[0, '#2aaee0'], [1, '#86e0f0']])}${lg('bsand', [[0, '#fbe3b8'], [1, '#f0c493']])}</defs>` +
    `<rect width="400" height="700" fill="url(#bsky)"/>` +
    cloud(40, 130, 1.5, '#fff', '#f9c6e0') + cloud(210, 80, 1.0, '#fff', '#f9c6e0', 0.9) + cloud(290, 170, 1.2, '#fff', '#ffd1e4', 0.92) +
    `<path d="M0 292 L30 262 L48 276 L72 244 L96 280 L128 270 L150 292Z" fill="#7cc2cf" opacity=".7"/>` +
    `<rect y="290" width="400" height="96" fill="url(#bsea)"/>` +
    `<g class="shimmer" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"><path d="M20 312 q14 -5 28 0 t28 0"/><path d="M150 332 q14 -5 28 0 t28 0"/><path d="M60 354 q14 -5 28 0 t28 0"/><path d="M230 316 q14 -5 28 0 t28 0"/></g>` +
    `<path d="M0 372 C80 352 160 380 250 360 C320 346 370 340 400 344 L400 700 L0 700Z" fill="url(#bsand)"/>` +
    `<path d="M0 372 C80 352 160 380 250 360 C320 346 370 340 400 344" fill="none" stroke="#fff" stroke-width="7" opacity=".85" stroke-linecap="round"/>` +
    `<path d="M0 384 C80 364 160 392 250 372 C320 358 370 352 400 356" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/>` +
    `<path d="M0 470 C100 440 220 470 400 430 L400 700 L0 700Z" fill="#f6d3a2" opacity=".5"/>` +
    palm(362, 450, 260, -40, 1.25) + palm(330, 410, 200, 26, 1) + palm(386, 330, 140, -16, 0.8) +
    `<path d="M300 440 C330 420 380 410 400 400 L400 470 C360 470 320 462 300 440Z" fill="#4c9a48"/><path d="M330 445 C350 425 380 424 400 420 L400 470Z" fill="#3a8540"/>` +
    // hibiscus and leaves, bottom left
    `<g transform="translate(34 560)"><path d="M0 0 C-30 -20 -40 -60 -10 -80 C10 -50 20 -20 0 0Z" fill="#2f8f4a"/><path d="M0 0 C30 -30 60 -40 80 -20 C50 -10 20 -4 0 0Z" fill="#3aa356"/>${flower(20, -40, 22, '#f0557d', '#ffd84a')}<path d="M20 -40 l16 -22" stroke="#e8a52a" stroke-width="3" stroke-linecap="round"/></g>` +
    // shell and starfish
    `<g transform="translate(340 596) rotate(-8)"><path d="M0 22 C-26 18 -34 -4 -26 -16 C-16 -28 16 -28 26 -16 C34 -4 26 18 0 22Z" fill="#fbe0e6"/><path d="M0 20 L0 -22 M0 20 L-16 -20 M0 20 L16 -20" stroke="#e9aebd" stroke-width="2" fill="none"/></g>` +
    `<g transform="translate(392 640) rotate(18) scale(1.2)"><polygon points="0,-30 8,-9 30,-9 12,5 19,28 0,15 -19,28 -12,5 -30,-9 -8,-9" fill="#f6a93b" stroke="#f6a93b" stroke-width="6" stroke-linejoin="round"/><circle cx="0" cy="-3" r="2" fill="#fbd27a"/></g>`
  );
}

function woods(): string {
  const trunk = (x: number, w: number, c: string, h = 520) => `<rect x="${x}" y="0" width="${w}" height="${h}" fill="${c}"/>`;
  return (
    `<defs>${lg('wsky', [[0, '#b9e6c4'], [1, '#f6f7d0']])}${lg('wgnd', [[0, '#7bbd5e'], [1, '#4b9046']])}${lg('wray', [[0, '#fffbd0'], [1, 'rgba(255,251,208,0)']])}</defs>` +
    `<rect width="400" height="700" fill="url(#wsky)"/>` +
    `<g opacity=".55"><polygon points="90,0 150,0 230,420 120,420" fill="url(#wray)"/><polygon points="210,0 250,0 340,420 250,420" fill="url(#wray)"/></g>` +
    `<g fill="#8fcfa6" opacity=".7">${[[10, 120], [70, 150], [330, 140], [380, 110]].map(([x, h]) => `<ellipse cx="${x}" cy="${230 + h * 0.2}" rx="60" ry="${h}"/>`).join('')}</g>` +
    `<g opacity=".95">${trunk(14, 34, '#7a5233')}${trunk(310, 40, '#6f4a2e')}${trunk(362, 26, '#865a38')}${trunk(150, 14, '#9a6c44', 400)}</g>` +
    `<g fill="#4fa05a">${[[30, 90, 90], [330, 80, 96], [375, 70, 70], [158, 150, 56]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
    `<g fill="#6cbb6a" opacity=".85">${[[18, 60, 52], [320, 40, 58], [160, 120, 38]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
    `<path d="M0 380 C100 360 200 392 300 372 C350 362 380 366 400 370 L400 700 L0 700Z" fill="url(#wgnd)"/>` +
    `<path d="M0 470 C120 448 240 482 400 452 L400 700 L0 700Z" fill="#5aa04e" opacity=".6"/>` +
    // ferns
    [[40, 470], [370, 492], [200, 410]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[-60, -30, 0, 30, 60].map((a) => `<path d="M0 0 C-4 -34 4 -56 0 -74" stroke="#2f7d3c" stroke-width="5" fill="none" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g>`).join('') +
    // mushrooms
    `<g transform="translate(330 585)"><rect x="-7" y="-14" width="14" height="30" rx="6" fill="#f6ead7"/><path d="M-26 -10 C-26 -42 26 -42 26 -10Z" fill="#e4503f"/><circle cx="-9" cy="-24" r="4" fill="#fff"/><circle cx="8" cy="-28" r="3.5" fill="#fff"/><circle cx="16" cy="-17" r="3" fill="#fff"/></g>` +
    `<g transform="translate(60 610) scale(.75)"><rect x="-7" y="-14" width="14" height="30" rx="6" fill="#f6ead7"/><path d="M-26 -10 C-26 -42 26 -42 26 -10Z" fill="#d9822b"/><circle cx="-6" cy="-26" r="4" fill="#fff"/><circle cx="10" cy="-20" r="3" fill="#fff"/></g>` +
    // flowers in the grass
    [[110, 520, '#fff'], [250, 530, '#ffd84a'], [20, 560, '#f6a0c0'], [300, 660, '#fff']].map(([x, y, c]) => flower(+x, +y, 7, String(c), '#f0a030')).join('')
  );
}

function ball(): string {
  const win = (x: number) => `<g transform="translate(${x} 70)"><path d="M0 250 L0 60 C0 20 70 20 70 60 L70 250Z" fill="#2c2f86" stroke="#ffd98a" stroke-width="4"/><path d="M0 250 L0 60 C0 20 70 20 70 60 L70 250Z" fill="url(#nsky)" opacity=".9"/><path d="M35 20 L35 250 M0 130 L70 130" stroke="#ffd98a" stroke-width="3"/></g>`;
  const bulbs = Array.from({ length: 11 }, (_, i) => {
    const x = 10 + i * 38;
    const y = 54 + Math.sin(i * 0.9) * 10 + (i % 2 ? 6 : 0);
    return `<circle class="twinkle" cx="${x}" cy="${y}" r="6" fill="${['#ffe08a', '#ff9ec7', '#9ee6ff'][i % 3]}"/><circle cx="${x}" cy="${y}" r="12" fill="${['#ffe08a', '#ff9ec7', '#9ee6ff'][i % 3]}" opacity=".25"/>`;
  }).join('');
  const tiles = Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
    const y0 = 376 + r * r * 5 + r * 26;
    const y1 = 376 + (r + 1) * (r + 1) * 5 + (r + 1) * 26;
    const k0 = 1 + r * 0.22;
    const k1 = 1 + (r + 1) * 0.22;
    const x = (i: number, k: number) => 200 + (i - 4) * 46 * k;
    return `<polygon points="${x(c, k0)},${y0} ${x(c + 1, k0)},${y0} ${x(c + 1, k1)},${y1} ${x(c, k1)},${y1}" fill="${(r + c) % 2 ? '#3b2e86' : '#5a3fa8'}"/>`;
  }).join('')).join('');
  return (
    `<defs>${lg('nsky', [[0, '#141a5a'], [1, '#6a3f9c']])}${lg('nwall', [[0, '#231f6b'], [1, '#4a2f86']])}${lg('nfloor', [[0, '#4a3392'], [1, '#2a1f66']])}</defs>` +
    `<rect width="400" height="700" fill="url(#nwall)"/>` + stars(7, 26, 8, 40) + win(24) + win(162) + win(306) +
    `<circle cx="352" cy="122" r="26" fill="#fff4c4"/><circle cx="364" cy="114" r="24" fill="#2c2f86" opacity=".0"/>` +
    `<path d="M0 54 C100 90 300 90 400 54" stroke="#ffd98a" stroke-width="2" fill="none" opacity=".8"/>` + bulbs +
    `<rect y="372" width="400" height="330" fill="url(#nfloor)"/>` + tiles +
    `<g transform="translate(198 6)"><line x1="0" y1="0" x2="0" y2="40" stroke="#c9c2e8" stroke-width="2"/><circle cx="0" cy="68" r="30" fill="#d7d3f2"/>${[[-14, 56], [4, 50], [16, 64], [-6, 74], [12, 82], [-20, 78], [0, 92]].map(([x, y], i) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2" fill="${['#fff', '#b9e3ff', '#ffc6ea', '#e6dcff'][i % 4]}" opacity=".9"/>`).join('')}<ellipse cx="-10" cy="56" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 -10 56)"/></g>` +
    `<g opacity=".25" fill="#fff">${[[60, 440, 18], [320, 470, 14], [220, 420, 10], [120, 500, 12], [280, 530, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
    // a velvet curtain at each side
    `<path d="M0 0 L46 0 C30 120 50 260 20 380 L0 380Z" fill="#8a2a6a" opacity=".9"/><path d="M400 0 L354 0 C370 120 350 260 380 380 L400 380Z" fill="#8a2a6a" opacity=".9"/>`
  );
}

function city(): string {
  const bld = (x: number, w: number, h: number, c: string, win: string, y0 = 380, seed = 1) => {
    const cols = Math.max(2, Math.floor(w / 18));
    const rows = Math.floor((h - 14) / 22);
    let s = seed;
    const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
    let ws = '';
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const lit = rnd() > 0.4;
      ws += `<rect x="${x + 7 + q * ((w - 14) / cols)}" y="${y0 - h + 10 + r * 22}" width="${(w - 14) / cols - 5}" height="12" rx="2" fill="${lit ? win : 'rgba(255,255,255,.25)'}"/>`;
    }
    return `<rect x="${x}" y="${y0 - h}" width="${w}" height="${h}" rx="3" fill="${c}"/>${ws}`;
  };
  return (
    `<defs>${lg('csky', [[0, '#6ec3ff'], [0.7, '#bfe6ff'], [1, '#ffe9cf']])}</defs>` +
    `<rect width="400" height="700" fill="url(#csky)"/>` + cloud(60, 90, 1.2, '#fff', '#cfe6ff') + cloud(250, 150, 0.9, '#fff', '#cfe6ff', 0.9) +
    `<g opacity=".55">${bld(10, 50, 140, '#9db8d8', '#fff', 380, 2)}${bld(70, 40, 190, '#a9c2de', '#fff', 380, 3)}${bld(300, 56, 170, '#9db8d8', '#fff', 380, 4)}${bld(360, 46, 120, '#a9c2de', '#fff', 380, 5)}</g>` +
    bld(110, 62, 200, '#f08a7a', '#fff2b0', 392, 6) + bld(180, 54, 150, '#f6c15a', '#fff7cf', 392, 7) + bld(238, 66, 230, '#6fa8dc', '#fff7cf', 392, 8) + bld(0, 48, 110, '#8dcf9a', '#fff7cf', 392, 9) + bld(312, 60, 120, '#c58ad6', '#fff7cf', 392, 10) +
    `<rect y="392" width="400" height="308" fill="#cfd3dc"/><rect y="392" width="400" height="18" fill="#b9bfcb"/>` +
    `<rect y="470" width="400" height="140" fill="#6b7080"/>` +
    `<g fill="#f6f0d8">${Array.from({ length: 9 }, (_, i) => `<rect x="${8 + i * 46}" y="536" width="26" height="6" rx="3"/>`).join('')}</g>` +
    `<g fill="#fff" opacity=".9">${Array.from({ length: 7 }, (_, i) => `<rect x="${290 + i * 14}" y="476" width="8" height="40" rx="2" transform="skewX(-10)"/>`).join('')}</g>` +
    `<g transform="translate(36 410)"><rect x="-3" y="0" width="6" height="64" fill="#4a5060"/><rect x="-10" y="-34" width="20" height="40" rx="6" fill="#3a3f4c"/><circle cx="0" cy="-24" r="5" fill="#ff5a4d"/><circle cx="0" cy="-12" r="5" fill="#ffd34a"/><circle cx="0" cy="0" r="5" fill="#59d36b"/></g>` +
    `<g transform="translate(300 520)"><rect x="-4" y="14" width="86" height="26" rx="12" fill="#e8473f"/><path d="M10 16 L22 -2 L60 -2 L72 16Z" fill="#e8473f"/><path d="M20 14 L26 2 L40 2 L40 14Z M44 14 L44 2 L58 2 L66 14Z" fill="#cfeefa"/><circle cx="16" cy="42" r="10" fill="#2f3340"/><circle cx="62" cy="42" r="10" fill="#2f3340"/></g>` +
    `<g transform="translate(366 440)"><rect x="-4" y="0" width="8" height="70" fill="#6a4a2b"/><circle cx="0" cy="-8" r="30" fill="#4fae5a"/><circle cx="-14" cy="6" r="20" fill="#3f9a4c"/></g>`
  );
}

function snow(): string {
  const peak = (x: number, y: number, w: number, h: number, body: string, shade: string) =>
    `<path d="M${x - w / 2} ${y} L${x} ${y - h} L${x + w / 2} ${y}Z" fill="${body}"/><path d="M${x} ${y - h} L${x + w / 2} ${y} L${x + w * 0.08} ${y}Z" fill="${shade}" opacity=".6"/>` +
    `<path d="M${x - w * 0.16} ${y - h * 0.68} L${x} ${y - h} L${x + w * 0.16} ${y - h * 0.68} L${x + w * 0.07} ${y - h * 0.6} L${x} ${y - h * 0.7} L${x - w * 0.08} ${y - h * 0.6}Z" fill="#fff"/>`;
  const flakes = Array.from({ length: 34 }, (_, i) => `<circle class="fall" cx="${(i * 97) % 400}" cy="${(i * 53) % 560}" r="${1.6 + (i % 3)}" fill="#fff" opacity=".85" style="animation-delay:${-(i % 9)}s"/>`).join('');
  return (
    `<defs>${lg('ssky', [[0, '#8fcdf6'], [0.7, '#d4ecfb'], [1, '#f6fbff']])}${lg('sgnd', [[0, '#ffffff'], [1, '#d3e6f6']])}</defs>` +
    `<rect width="400" height="700" fill="url(#ssky)"/>` +
    `<circle cx="320" cy="120" r="34" fill="#fff6d6" opacity=".95"/><circle cx="320" cy="120" r="52" fill="#fff6d6" opacity=".3"/>` +
    cloud(40, 110, 1.1, '#fff', '#cfe6f6') +
    peak(110, 340, 260, 230, '#8fb4dc', '#6f94c4') + peak(290, 340, 280, 200, '#9bbfe4', '#7aa0cf') + peak(210, 340, 200, 140, '#b5d2ee', '#8fb4dc') +
    `<path d="M0 340 C100 320 220 350 400 326 L400 700 L0 700Z" fill="url(#sgnd)"/>` +
    `<path d="M0 450 C100 420 240 460 400 424 L400 700 L0 700Z" fill="#fff"/>` +
    `<path d="M0 450 C100 420 240 460 400 424" stroke="#c9ddf0" stroke-width="3" fill="none"/>` +
    pine(40, 380, 1, '#2f7a5a', '#26694c', true) + pine(88, 400, 0.78, '#357f60', '#2a6f52', true) + pine(364, 392, 1.1, '#2f7a5a', '#26694c', true) + pine(318, 410, 0.7, '#357f60', '#2a6f52', true) +
    `<g transform="translate(70 600)"><circle cy="0" r="30" fill="#fff" stroke="#cfe0f0" stroke-width="2"/><circle cy="-40" r="21" fill="#fff" stroke="#cfe0f0" stroke-width="2"/><circle cx="-6" cy="-44" r="2.4" fill="#333"/><circle cx="6" cy="-44" r="2.4" fill="#333"/><path d="M0 -40 L16 -37 L0 -34Z" fill="#f08a2a"/><path d="M-22 -26 Q0 -18 22 -26 L22 -20 Q0 -12 -22 -20Z" fill="#e8473f"/></g>` +
    `<g>${flakes}</g>`
  );
}

function garden(): string {
  const tulip = (x: number, y: number, c: string, h = 80) =>
    `<path d="M${x} ${y} L${x} ${y - h}" stroke="#3a9a4a" stroke-width="5" stroke-linecap="round"/><path d="M${x} ${y - h * 0.4} C${x + 26} ${y - h * 0.5} ${x + 30} ${y - h * 0.2} ${x + 6} ${y - h * 0.1}Z" fill="#4cb05e"/>` +
    `<path d="M${x - 14} ${y - h + 4} C${x - 16} ${y - h - 22} ${x - 4} ${y - h - 22} ${x} ${y - h - 10} C${x + 4} ${y - h - 22} ${x + 16} ${y - h - 22} ${x + 14} ${y - h + 4} C${x + 10} ${y - h + 18} ${x - 10} ${y - h + 18} ${x - 14} ${y - h + 4}Z" fill="${c}"/>`;
  const bfly = (x: number, y: number, c: string, s = 1) => `<g class="flutter" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-9" cy="-4" rx="10" ry="8" fill="${c}"/><ellipse cx="9" cy="-4" rx="10" ry="8" fill="${c}"/><ellipse cx="-7" cy="7" rx="7" ry="6" fill="${c}" opacity=".85"/><ellipse cx="7" cy="7" rx="7" ry="6" fill="${c}" opacity=".85"/><rect x="-1.5" y="-10" width="3" height="22" rx="1.5" fill="#5a4560"/></g>`;
  return (
    `<defs>${lg('gsky', [[0, '#8bd3f6'], [1, '#e8f8fb']])}${lg('ggnd', [[0, '#8ed16a'], [1, '#55a84e']])}</defs>` +
    `<rect width="400" height="700" fill="url(#gsky)"/>` +
    `<g fill="none" stroke-width="9" opacity=".38"><path d="M30 330 A170 170 0 0 1 370 330" stroke="#ff7a8a"/><path d="M39 330 A161 161 0 0 1 361 330" stroke="#ffd45a"/><path d="M48 330 A152 152 0 0 1 352 330" stroke="#7ad68a"/><path d="M57 330 A143 143 0 0 1 343 330" stroke="#6ab8f0"/></g>` +
    cloud(250, 90, 1.1, '#fff', '#ffe0ee') + cloud(20, 160, 0.9, '#fff', '#ffe0ee', 0.9) +
    `<path d="M0 340 C80 300 180 330 240 318 C310 304 360 310 400 326 L400 700 L0 700Z" fill="#9ad876"/>` +
    `<path d="M0 396 C100 366 240 400 400 372 L400 700 L0 700Z" fill="url(#ggnd)"/>` +
    // white picket fence
    `<g fill="#fff" stroke="#e1e8ee" stroke-width="2">${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 32 + 4} 410 L${i * 32 + 4} 370 L${i * 32 + 15} 358 L${i * 32 + 26} 370 L${i * 32 + 26} 410Z"/>`).join('')}<rect x="0" y="376" width="400" height="7" fill="#fff"/><rect x="0" y="396" width="400" height="7" fill="#fff"/></g>` +
    `<path d="M0 450 C120 428 250 462 400 436 L400 700 L0 700Z" fill="#6cbb5a" opacity=".7"/>` +
    tulip(30, 560, '#f2597f', 120) + tulip(68, 590, '#ffc83a', 90) + tulip(372, 570, '#b07ae6', 130) + tulip(336, 600, '#ff8f4a', 90) +
    `<g transform="translate(14 480)"><line x1="0" y1="0" x2="0" y2="110" stroke="#3a9a4a" stroke-width="6"/>${flower(0, -2, 22, '#ffd33a', '#8a5a2a', 10)}</g>` +
    [[120, 520, '#fff'], [170, 560, '#f6a0c0'], [250, 520, '#ffd84a'], [230, 650, '#fff'], [120, 660, '#c9a0f0']].map(([x, y, c]) => flower(+x, +y, 8, String(c), '#f0a030')).join('') +
    bfly(120, 250, '#ff8fb8', 1.3) + bfly(300, 290, '#ffc83a', 1) + bfly(220, 430, '#9a8cf0', 0.9)
  );
}

export const PLACE_ART: P = { beach, woods, ball, city, snow, garden } as unknown as P;

/** The scenery of a place as an svg fragment for a 400 x 700 box. */
export function placeArt(id: string): string {
  const f = (PLACE_ART as unknown as Record<string, () => string>)[id] ?? beach;
  return f();
}

/** How the table in each place looks: top colours, edge colour, and whether it shows tree rings. */
export interface TableLook { top: [string, string]; edge: string; grain: string; rings?: boolean; sparkle?: boolean }
export const TABLES: Record<string, TableLook> = {
  beach: { top: ['#e6b883', '#cf9560'], edge: '#a96d3e', grain: '#8a5530' },
  woods: { top: ['#d9a96e', '#bd8650'], edge: '#8d5b30', grain: '#7a4a24', rings: true },
  ball: { top: ['#5b46b0', '#34277e'], edge: '#251a5c', grain: '#ffffff', sparkle: true },
  city: { top: ['#c6cbd6', '#a3aab8'], edge: '#7d8596', grain: '#6a7184' },
  snow: { top: ['#ffffff', '#dcebf8'], edge: '#b9d2ea', grain: '#9fbddb' },
  garden: { top: ['#e9c58d', '#d3a469'], edge: '#aa7a45', grain: '#8c5f32' },
};
