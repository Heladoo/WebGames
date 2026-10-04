// Snowy Mountain: faceted peaks, frosted pines, a cosy cabin and a snowman. 400 x 700.

import { FX, bokeh, cloud, f1, glints, lg, pine, rays, rg, rng, vignette } from '../paint';

/** A mountain with a lit face, a shadowed face, a jagged snow cap and rocky streaks. */
function peak(cx: number, base: number, h: number, w: number, seed: number, lit: [string, string], shade: [string, string], id: string): string {
  const q = rng(seed);
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    left.push([cx - w / 2 + (w / 2) * t + (i > 0 && i < n ? (q() - 0.5) * 12 : 0), base - h * t ** 1.12 + (i > 0 && i < n ? (q() - 0.5) * 12 : 0)]);
    right.push([cx + w / 2 - (w / 2) * t + (i > 0 && i < n ? (q() - 0.5) * 12 : 0), base - h * t ** 1.12 + (i > 0 && i < n ? (q() - 0.5) * 12 : 0)]);
  }
  const apex = left[n];
  right[n] = apex;
  const outline = left.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ') + ' ' + right.slice(0, n).reverse().map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ');
  // the shadow side: from the apex, down a zigzag spine, to the right foot
  const spine: [number, number][] = Array.from({ length: 7 }, (_, i) => [apex[0] + (i / 6) * w * 0.12 + (q() - 0.5) * 10, apex[1] + (i / 6) * h * 1.02]);
  const shadePoly = `${f1(apex[0])},${f1(apex[1])} ` + right.slice(0, n).reverse().filter((p) => p[1] > apex[1]).map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ') + ' ' + spine.slice().reverse().map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ');
  // snow cap: everything above a jagged line a third of the way down
  const capY = apex[1] + h * 0.36;
  const zig = Array.from({ length: 9 }, (_, i) => `${f1(apex[0] - w * 0.3 + (i / 8) * w * 0.6)},${f1(capY + (i % 2 ? 16 : -6) + (q() - 0.5) * 8)}`).join(' ');
  return (
    `<defs>${lg(id, [[0, lit[0]], [1, lit[1]]])}${lg(id + 's', [[0, shade[0]], [1, shade[1]]])}<clipPath id="${id}c"><polygon points="${outline}"/></clipPath></defs>` +
    `<polygon points="${outline}" fill="url(#${id})"/>` +
    `<g clip-path="url(#${id}c)"><polygon points="${shadePoly}" fill="url(#${id}s)"/>` +
    Array.from({ length: 6 }, (_, i) => `<path d="M${f1(apex[0] + (q() - 0.5) * w * 0.4)} ${f1(apex[1] + h * 0.3)} l${f1((q() - 0.5) * 24)} ${f1(h * (0.3 + q() * 0.3))}" stroke="#5f7fa8" stroke-width="${(1.2 + q() * 2).toFixed(1)}" opacity="${(0.18 + i * 0.01).toFixed(2)}" fill="none" stroke-linecap="round"/>`).join('') +
    `<polygon points="${f1(apex[0] - w * 0.34)},${f1(apex[1] + h * 0.5)} ${f1(apex[0])},${f1(apex[1] - 2)} ${f1(apex[0] + w * 0.34)},${f1(apex[1] + h * 0.5)} ${zig.split(' ').reverse().join(' ')}" fill="#fff"/>` +
    `<polygon points="${f1(apex[0])},${f1(apex[1] - 2)} ${f1(apex[0] + w * 0.34)},${f1(apex[1] + h * 0.5)} ${f1(apex[0] + w * 0.02)},${f1(apex[1] + h * 0.46)}" fill="#c4dcf2" opacity=".85"/>` +
    `</g>`
  );
}

function cabin(x: number, y: number, s: number): string {
  let logs = '';
  for (let i = 0; i < 7; i++) logs += `<rect x="-34" y="${-52 + i * 8}" width="68" height="8.4" rx="4" fill="${i % 2 ? '#8a5a34' : '#9a6a3e'}"/><path d="M-32 ${-50 + i * 8} h64" stroke="#d9a468" stroke-width="1.2" opacity=".5"/><path d="M-32 ${-45 + i * 8} h64" stroke="#4a2c14" stroke-width="1" opacity=".5"/>`;
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="6" cy="4" rx="52" ry="8" fill="#5f7fa8" opacity=".35" filter="url(#b3)"/>` +
    // chimney and smoke
    `<rect x="14" y="-92" width="12" height="30" fill="#7a4a2c"/><rect x="12" y="-96" width="16" height="6" rx="2" fill="#a06a40"/>` +
    [[20, -108, 9, 0.5], [26, -124, 12, 0.4], [34, -144, 15, 0.3], [44, -166, 18, 0.2]].map(([cx, cy, r, op]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${op}" filter="url(#b3)"/>`).join('') +
    `<rect x="-34" y="-52" width="68" height="56" fill="#9a6a3e"/>${logs}` +
    // door and a window that glows
    `<rect x="-24" y="-26" width="16" height="30" rx="2" fill="#5e3a1e"/><circle cx="-12" cy="-10" r="1.6" fill="#e8c97a"/>` +
    `<circle cx="14" cy="-24" r="26" fill="#ffd27a" opacity=".5" filter="url(#b5)"/><rect x="4" y="-34" width="20" height="18" rx="2" fill="#ffe08a"/><path d="M14 -34 v18 M4 -25 h20" stroke="#8a5a34" stroke-width="2"/><rect x="2" y="-36" width="24" height="22" rx="3" fill="none" stroke="#6a4020" stroke-width="2.4"/>` +
    // thick snowy roof with icicles
    `<path d="M-46 -48 L0 -90 L46 -48Z" fill="#7a4a2c"/><path d="M-50 -46 Q-30 -62 0 -96 Q30 -62 50 -46 Q46 -40 38 -42 Q30 -34 22 -42 Q12 -34 2 -43 Q-8 -34 -16 -42 Q-26 -36 -34 -42 Q-44 -38 -50 -46Z" fill="#fff"/>` +
    `<path d="M0 -96 Q30 -62 50 -46 Q40 -48 30 -58 Q12 -76 0 -96Z" fill="#cfe2f6"/>` +
    [-38, -26, -14, 8, 20, 32].map((dx, i) => `<path d="M${dx} -42 l2 ${8 + (i % 3) * 4} l2 -${8 + (i % 3) * 4}Z" fill="#e6f4ff" stroke="#bcd6ee" stroke-width=".6"/>`).join('') +
    `<path d="M-40 4 Q-20 -10 0 -2 Q22 -12 44 4 Q20 10 -40 4Z" fill="#fff"/></g>`
  );
}

function snowman(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><defs>${rg('sm', [[0, '#ffffff'], [0.7, '#e6f1fb'], [1, '#aac8e6']], 0.35, 0.3, 0.85)}</defs>` +
    `<ellipse cx="6" cy="6" rx="44" ry="8" fill="#5f7fa8" opacity=".38" filter="url(#b3)"/>` +
    `<path d="M-36 -40 L-62 -66 M-62 -66 l-8 -4 M-62 -66 l-4 -10" stroke="#6a4020" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M36 -40 L62 -64 M62 -64 l8 -3 M62 -64 l4 -10" stroke="#6a4020" stroke-width="3" stroke-linecap="round" fill="none"/>` +
    `<circle cx="0" cy="-26" r="32" fill="url(#sm)"/><circle cx="0" cy="-70" r="24" fill="url(#sm)"/><circle cx="0" cy="-104" r="18" fill="url(#sm)"/>` +
    `<path d="M-20 -86 Q0 -78 20 -86 L22 -78 Q0 -70 -22 -78Z" fill="#e8473f"/><path d="M12 -80 q6 14 2 22 l8 0 q4 -10 -4 -22Z" fill="#c9302a"/>` +
    `<rect x="-14" y="-128" width="28" height="4" rx="2" fill="#262a38"/><rect x="-10" y="-146" width="20" height="20" rx="2" fill="#262a38"/><rect x="-10" y="-132" width="20" height="4" fill="#e8473f"/>` +
    `<circle cx="-6" cy="-108" r="2.2" fill="#262a38"/><circle cx="6" cy="-108" r="2.2" fill="#262a38"/><path d="M0 -103 l16 3 l-16 3Z" fill="#ff8a2a"/>` +
    [[0, -78], [0, -66], [0, -52]].map(([bx, by]) => `<circle cx="${bx}" cy="${by}" r="2.6" fill="#262a38"/>`).join('') + `</g>`
  );
}

export function snow(): string {
  const r = rng(1212);
  let flakes = '';
  for (let i = 0; i < 90; i++) {
    const big = i % 7 === 0;
    flakes += `<circle cx="${f1(r() * 400)}" cy="${f1(r() * 700)}" r="${f1(big ? 3 + r() * 3 : 0.9 + r() * 1.8)}" fill="#fff" opacity="${(big ? 0.55 : 0.5 + r() * 0.45).toFixed(2)}"${big ? ' filter="url(#b1)"' : ''}/>`;
  }
  let dunes = '';
  [[420, '#f4f9ff', '#dbe9f7'], [470, '#ffffff', '#d3e4f5'], [540, '#ffffff', '#cfe1f4']].forEach(([y, c1, c2], i) => {
    dunes += `<defs>${lg('dn' + i, [[0, String(c1)], [1, String(c2)]])}</defs><path d="M-10 ${Number(y) + 10} Q90 ${Number(y) - 22 - i * 4} 200 ${Number(y) - 4} T410 ${Number(y) - 12} L410 700 L-10 700Z" fill="url(#dn${i})"/>` +
      `<path d="M-10 ${Number(y) + 10} Q90 ${Number(y) - 22 - i * 4} 200 ${Number(y) - 4} T410 ${Number(y) - 12}" stroke="#fff" stroke-width="3" fill="none" opacity=".9"/><path d="M-10 ${Number(y) + 20} Q90 ${Number(y) - 12 - i * 4} 200 ${Number(y) + 6} T410 ${Number(y) - 2}" stroke="#a9c8ea" stroke-width="10" fill="none" opacity=".22" filter="url(#b5)"/>`;
  });
  let drifts = '';
  for (let i = 0; i < 22; i++) {
    const x = r() * 400;
    const y = 450 + r() * 240;
    const l = 30 + r() * 70;
    drifts += `<path d="M${f1(x)} ${f1(y)} q${f1(l / 2)} ${f1(-5 - r() * 5)} ${f1(l)} ${f1(r() * 3)}" stroke="#a9c8ea" stroke-width="${(1 + r() * 1.4).toFixed(1)}" fill="none" opacity="${(0.25 + r() * 0.2).toFixed(2)}" stroke-linecap="round"/>`;
  }

  return (
    `<defs>${FX}` +
    lg('ssky', [[0, '#5aaeea'], [0.5, '#a6d6f6'], [1, '#eaf6ff']]) +
    rg('ssun', [[0, '#fffbe6', 0.95], [0.3, '#fff3c2', 0.4], [1, '#fff3c2', 0]], 0.78, 0.2, 0.5) +
    `</defs>` +
    `<rect width="400" height="700" fill="url(#ssky)"/><rect width="400" height="480" fill="url(#ssun)"/>` +
    rays(312, 130, 7, 380, 80, 7, '#fff8d8', 0.2) +
    `<circle cx="312" cy="130" r="26" fill="#fffbe8"/><circle cx="312" cy="130" r="40" fill="#fff6d0" opacity=".5" filter="url(#b5)"/>` +
    cloud(-30, 120, 150, 46, 5, ['#b4c8ee', '#eef3fc', '#ffffff'], '#dbe9ff') + cloud(220, 210, 120, 34, 9, ['#bcceee', '#f0f5fc', '#ffffff'], '#e3eeff', 0.9) +
    peak(80, 400, 190, 250, 3, ['#bcd3ee', '#8fb2d8'], ['#7f9fcb', '#5f80b4'], 'pk1') +
    peak(300, 400, 220, 280, 8, ['#cfe0f4', '#9bbde0'], ['#86a8d2', '#6286b8'], 'pk2') +
    peak(190, 410, 150, 220, 5, ['#dbe9f8', '#b0cbe8'], ['#98b7dc', '#7599c6'], 'pk3') +
    `<ellipse cx="200" cy="410" rx="260" ry="24" fill="#fff" opacity=".7" filter="url(#b8)"/>` +
    dunes +
    pine(36, 452, 0.95, ['#1f6b4e', '#2f8a63', '#48a87a'], true, 5) + pine(86, 470, 0.72, ['#256f55', '#348f69', '#4eae82'], true, 4) + pine(364, 462, 1.05, ['#1f6b4e', '#2f8a63', '#48a87a'], true, 5) + pine(318, 482, 0.7, ['#256f55', '#348f69', '#4eae82'], true, 4) +
    cabin(150, 498, 1.1) +
    drifts + snowman(60, 650, 0.82) +
    glints(4, 120, 0, 400, 430, 700, 5, '#ffffff') + glints(9, 50, 0, 400, 430, 700, 4, '#8fc0f0') +
    flakes + bokeh(6, 10, 0, 400, 60, 640, ['#ffffff'], 4, 10, 0.3) +
    vignette(0.18, 'vigs')
  );
}
