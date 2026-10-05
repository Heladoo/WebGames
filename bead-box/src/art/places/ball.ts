// Night Ball: a moonlit ballroom with a mirror ball, a chandelier, velvet curtains and a polished floor. 400 x 700.

import { FX, bokeh, f1, lg, rg, rng, vignette } from '../paint';

function mirrorBall(cx: number, cy: number, r: number, id: string): string {
  const q = rng(61);
  let facets = '';
  const rows = 9;
  for (let a = 0; a < rows; a++) {
    const v0 = -1 + (2 * a) / rows;
    const v1 = -1 + (2 * (a + 1)) / rows;
    const y0 = cy + v0 * r;
    const y1 = cy + v1 * r;
    const w0 = Math.sqrt(Math.max(0, 1 - v0 * v0)) * r;
    const w1 = Math.sqrt(Math.max(0, 1 - v1 * v1)) * r;
    const cols = 11;
    for (let b = 0; b < cols; b++) {
      const u0 = -1 + (2 * b) / cols;
      const u1 = -1 + (2 * (b + 1)) / cols;
      const tone = q();
      const fill = tone > 0.8 ? '#ffffff' : tone > 0.55 ? '#dfe4ff' : tone > 0.3 ? '#b9c2ee' : '#8e98d8';
      facets += `<polygon points="${f1(cx + u0 * w0)},${f1(y0)} ${f1(cx + u1 * w0)},${f1(y0)} ${f1(cx + u1 * w1)},${f1(y1)} ${f1(cx + u0 * w1)},${f1(y1)}" fill="${fill}" stroke="#6f79c0" stroke-width=".5" opacity=".95"/>`;
    }
  }
  return (
    `<defs>${rg(id, [[0, '#ffffff', 0.5], [0.7, '#000000', 0], [1, '#101040', 0.55]], 0.35, 0.3, 0.8)}<clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>` +
    `<line x1="${cx}" y1="-10" x2="${cx}" y2="${cy - r}" stroke="#d9d4ff" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="#b9b0ff" opacity=".22" filter="url(#b14)"/>` +
    `<g clip-path="url(#${id}c)">${facets}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/></g>` +
    `<ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.4}" rx="${r * 0.2}" ry="${r * 0.1}" fill="#fff" opacity=".95" transform="rotate(-35 ${cx - r * 0.35} ${cy - r * 0.4})"/>` +
    [[-0.5, 0.3], [0.4, -0.3], [0.1, 0.55], [-0.2, -0.65]].map(([a, b]) => `<path d="M${f1(cx + r * a)} ${f1(cy + r * b - 5)} l1.3 3.7 l3.7 1.3 l-3.7 1.3 l-1.3 3.7 l-1.3 -3.7 l-3.7 -1.3 l3.7 -1.3Z" fill="#fff"/>`).join('')
  );
}

function window3(x: number, id: string): string {
  const q = rng(x * 3 + 5);
  let stars = '';
  for (let i = 0; i < 18; i++) stars += `<circle cx="${f1(x + 8 + q() * 60)}" cy="${f1(110 + q() * 120)}" r="${(0.7 + q() * 1.3).toFixed(1)}" fill="#fff" opacity="${(0.5 + q() * 0.5).toFixed(2)}"/>`;
  const d = `M${x} 300 L${x} 150 C${x} 100 ${x + 76} 100 ${x + 76} 150 L${x + 76} 300Z`;
  return (
    `<defs>${lg(id, [[0, '#0d1252'], [0.6, '#2b2a86'], [1, '#6a4aa8']])}<clipPath id="${id}c"><path d="${d}"/></clipPath></defs>` +
    `<path d="${d}" fill="#e6c36c" transform="translate(-4 -4) scale(1.0)" opacity="0"/>` +
    `<path d="M${x - 5} 306 L${x - 5} 148 C${x - 5} 92 ${x + 81} 92 ${x + 81} 148 L${x + 81} 306Z" fill="#e8c97a"/><path d="M${x - 5} 306 L${x - 5} 148 C${x - 5} 92 ${x + 81} 92 ${x + 81} 148 L${x + 81} 306Z" fill="none" stroke="#fff3c0" stroke-width="1.4" opacity=".7"/>` +
    `<path d="${d}" fill="url(#${id})"/><g clip-path="url(#${id}c)">${stars}<ellipse cx="${x + 38}" cy="320" rx="60" ry="40" fill="#8a6ac8" opacity=".5" filter="url(#b8)"/></g>` +
    `<path d="M${x + 38} 112 L${x + 38} 300 M${x} 200 L${x + 76} 200 M${x} 250 L${x + 76} 250" stroke="#e8c97a" stroke-width="3"/>` +
    `<path d="M${x - 8} 306 h92 v8 h-92Z" fill="#d7b25a"/><path d="M${x - 8} 306 h92" stroke="#fff3c0" stroke-width="1.2" opacity=".7"/>`
  );
}

function curtain(side: 'l' | 'r'): string {
  const s = side === 'l' ? 1 : -1;
  const x0 = side === 'l' ? -4 : 404;
  let folds = '';
  for (let i = 0; i < 6; i++) {
    const x = x0 + s * (8 + i * 9);
    folds += `<path d="M${x} -4 C${x + s * 6} 120 ${x - s * 4} 250 ${x + s * 8} 410 L${x + s * 5} 410 C${x - s * 4} 250 ${x + s * 8} 120 ${x + s * 2} -4Z" fill="${i % 2 ? '#a02a80' : '#5e154c'}" opacity=".6"/>`;
  }
  return (
    `<path d="M${x0} -4 L${x0 + s * 62} -4 C${x0 + s * 46} 130 ${x0 + s * 70} 260 ${x0 + s * 40} 412 L${x0} 412Z" fill="#7a1f62"/>${folds}` +
    `<path d="M${x0 + s * 6} -4 C${x0 + s * 12} 140 ${x0 + s * 4} 260 ${x0 + s * 14} 412" stroke="#ff9bd6" stroke-width="3" fill="none" opacity=".25"/>` +
    // tieback with a tassel
    `<path d="M${x0 + s * 36} 250 q${s * 18} 8 ${s * 34} -2" stroke="#e8c97a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${x0 + s * 46}" cy="266" r="4" fill="#e8c97a"/><path d="M${x0 + s * 46} 266 v16" stroke="#e8c97a" stroke-width="3"/><path d="M${x0 + s * 42} 282 h8 l-2 12 h-4Z" fill="#d7b25a"/>`
  );
}

function chandelier(cx: number): string {
  let crystals = '';
  for (let i = 0; i < 14; i++) {
    const a = -1 + (2 * i) / 13;
    const x = cx + a * 56;
    const y = 74 + Math.abs(a) * 10 + (i % 2) * 8;
    crystals += `<path d="M${f1(x)} ${f1(y)} l-3.4 8 l3.4 9 l3.4 -9Z" fill="#e7f0ff" stroke="#fff" stroke-width=".6" opacity=".95"/><circle cx="${f1(x)}" cy="${f1(y - 3)}" r="1.6" fill="#fff"/>`;
  }
  return (
    `<line x1="${cx}" y1="-10" x2="${cx}" y2="44" stroke="#e8c97a" stroke-width="3"/>` +
    `<circle cx="${cx}" cy="64" r="64" fill="#ffe9a8" opacity=".22" filter="url(#b14)"/>` +
    `<path d="M${cx - 60} 66 Q${cx} 92 ${cx + 60} 66 Q${cx} 78 ${cx - 60} 66Z" fill="#e8c97a" stroke="#a8802a" stroke-width="1.4"/><ellipse cx="${cx}" cy="44" rx="10" ry="6" fill="#e8c97a" stroke="#a8802a"/>` +
    [-44, -22, 0, 22, 44].map((dx) => `<rect x="${cx + dx - 2.4}" y="54" width="4.8" height="12" fill="#fff6e0"/><ellipse cx="${cx + dx}" cy="50" rx="3.2" ry="6" fill="#ffd25a"/><ellipse cx="${cx + dx}" cy="50" rx="7" ry="11" fill="#ffd25a" opacity=".35" filter="url(#b2)"/>`).join('') + crystals
  );
}

export function ball(): string {
  const r = rng(808);
  // the floor: tiles in perspective, a glossy sheen, and the room's lights reflected in it
  const ROWS = 7;
  const COLS = 12;
  const yAt = (i: number) => 372 + (i / ROWS) ** 1.7 * 330;
  let tiles = '';
  for (let a = 0; a < ROWS; a++) {
    const y0 = yAt(a);
    const y1 = yAt(a + 1);
    const k0 = 1 + (a / ROWS) ** 1.7 * 3.4;
    const k1 = 1 + ((a + 1) / ROWS) ** 1.7 * 3.4;
    for (let b = 0; b < COLS; b++) {
      const x = (i: number, k: number) => 200 + (i - COLS / 2) * 34 * k;
      tiles += `<polygon points="${f1(x(b, k0))},${f1(y0)} ${f1(x(b + 1, k0))},${f1(y0)} ${f1(x(b + 1, k1))},${f1(y1)} ${f1(x(b, k1))},${f1(y1)}" fill="${(a + b) % 2 ? '#3a2d86' : '#5d44ae'}"/>`;
    }
  }
  let lightSpots = '';
  const cols = ['#ff8fd0', '#8fe0ff', '#ffe08a', '#b9a0ff', '#ffffff'];
  for (let i = 0; i < 46; i++) {
    const onFloor = r() > 0.4;
    const x = r() * 420 - 10;
    const y = onFloor ? 400 + r() * 280 : 20 + r() * 330;
    lightSpots += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(5 + r() * 9)}" ry="${f1(onFloor ? 2.4 + r() * 4 : 5 + r() * 9)}" fill="${cols[Math.floor(r() * cols.length)]}" opacity="${(0.16 + r() * 0.32).toFixed(2)}"/>`;
  }
  // swags of string lights
  const swag = (y0: number, sag: number, n: number, off: number) =>
    `<path d="M-10 ${y0} Q200 ${y0 + sag} 410 ${y0}" stroke="#f1d58a" stroke-width="1.6" fill="none" opacity=".85"/>` +
    Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const x = -10 + t * 420;
      const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * (y0 + sag) + t * t * y0 + 5;
      const c = ['#ffe08a', '#ff9ec7', '#9ee6ff', '#c8ff9e'][(i + off) % 4];
      return `<circle cx="${f1(x)}" cy="${f1(y)}" r="16" fill="${c}" opacity=".28" filter="url(#b3)"/><circle cx="${f1(x)}" cy="${f1(y)}" r="5.6" fill="${c}"/><circle cx="${f1(x - 1.6)}" cy="${f1(y - 1.8)}" r="1.8" fill="#fff"/>`;
    }).join('');

  return (
    `<defs>${FX}` +
    lg('bwall', [[0, '#11175a'], [0.55, '#2e2386'], [1, '#52308f']]) +
    lg('bfloor', [[0, '#9f86ff', 0.4], [0.35, '#ffffff', 0.05], [1, '#0a0630', 0.55]]) +
    lg('bref', [[0, '#ffe9a8', 0.35], [1, '#ffe9a8', 0]]) +
    rg('bglow', [[0, '#a98cff', 0.5], [1, '#a98cff', 0]], 0.5, 0.35, 0.6) +
    `</defs>` +
    `<rect width="400" height="700" fill="url(#bwall)"/><rect width="400" height="420" fill="url(#bglow)"/>` +
    window3(30, 'w1') + window3(162, 'w2') + window3(294, 'w3') +
    `<circle cx="326" cy="162" r="28" fill="#fff6cc"/><circle cx="326" cy="162" r="58" fill="#fff6cc" opacity=".25" filter="url(#b8)"/>` +
    `<rect y="372" width="400" height="330" fill="#241a6e"/>` + tiles +
    `<rect y="372" width="400" height="330" fill="url(#bfloor)"/>` +
    // reflections of the three windows in the floor
    [30, 162, 294].map((x) => `<polygon points="${x + 10},372 ${x + 66},372 ${x + 100},520 ${x - 30},520" fill="url(#bref)" opacity=".5" filter="url(#b3)"/>`).join('') +
    `<rect y="366" width="400" height="12" fill="#e8c97a" opacity=".5"/><rect y="372" width="400" height="3" fill="#fff3c0" opacity=".6"/>` +
    lightSpots +
    chandelier(198) + mirrorBall(96, 168, 36, 'mb') +
    swag(34, 22, 9, 0) + swag(56, 26, 9, 2) +
    curtain('l') + curtain('r') +
    bokeh(12, 34, 0, 400, 90, 640, ['#ffe08a', '#ff9ec7', '#9ee6ff', '#fff'], 2, 8, 0.45) +
    vignette(0.34, 'vigball')
  );
}
