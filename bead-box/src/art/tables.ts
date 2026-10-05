// The table, rope and clasp, painted once per place into a 400 x 330 picture (see scene.ts). The beads are
// the only live part of the bracelet, so none of this is redrawn while you play.

import { FX, f1, lg, rg, rng } from './paint';

export const CX = 200;
export const CY = 150;
export const RX = 126;
export const RY = 64;

type Kind = 'planks' | 'rings' | 'lacquer' | 'concrete' | 'snow' | 'garden';

interface Look {
  kind: Kind;
  top: [string, string]; // light, base
  edge: [string, string]; // lit, shaded
  seam: string;
  rim: string;
}

const LOOKS: Record<string, Look> = {
  beach: { kind: 'planks', top: ['#efc48e', '#cf9560'], edge: ['#b97c47', '#7e4e26'], seam: '#7a4a22', rim: '#fff1d4' },
  woods: { kind: 'rings', top: ['#e1b377', '#bd8650'], edge: ['#6b4426', '#3d2412'], seam: '#7a4a24', rim: '#ffe6bf' },
  ball: { kind: 'lacquer', top: ['#6d58c4', '#34277e'], edge: ['#3a2b8a', '#160f40'], seam: '#1d1450', rim: '#c9bdff' },
  city: { kind: 'concrete', top: ['#d3d8e2', '#a3aab8'], edge: ['#8c93a4', '#5d6475'], seam: '#5d6475', rim: '#ffffff' },
  snow: { kind: 'snow', top: ['#ffffff', '#d9e9f8'], edge: ['#cfe3f6', '#8fb2d6'], seam: '#9fbddb', rim: '#ffffff' },
  garden: { kind: 'garden', top: ['#efcb94', '#d3a469'], edge: ['#b98450', '#7d522a'], seam: '#7d522a', rim: '#fff0cf' },
};

const TOP = `<ellipse cx="200" cy="190" rx="188" ry="86"/>`;

function surface(look: Look, id: string): string {
  const r = rng(9);
  switch (look.kind) {
    case 'planks':
    case 'garden': {
      let s = '';
      // three long planks: seams follow the table's curve
      [-30, 2, 34].forEach((dy, i) => {
        s += `<path d="M10 ${190 + dy} Q200 ${190 + dy + (i - 1) * 12 + 14} 390 ${190 + dy}" stroke="${look.seam}" stroke-width="2.2" fill="none" opacity=".55"/><path d="M10 ${191.6 + dy} Q200 ${191.6 + dy + (i - 1) * 12 + 14} 390 ${191.6 + dy}" stroke="#fff" stroke-width="1" fill="none" opacity=".3"/>`;
      });
      for (let i = 0; i < 26; i++) {
        const y = 110 + r() * 160;
        const x = 20 + r() * 300;
        const l = 40 + r() * 120;
        s += `<path d="M${f1(x)} ${f1(y)} q${f1(l / 2)} ${f1(-2 - r() * 4)} ${f1(l)} ${f1(r() * 3)}" stroke="${look.seam}" stroke-width="${(0.6 + r() * 1.1).toFixed(1)}" fill="none" opacity="${(0.12 + r() * 0.16).toFixed(2)}"/>`;
      }
      s += [[96, 150], [286, 232]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4" fill="none" stroke="${look.seam}" stroke-width="1.6" opacity=".4"/><ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="${look.seam}" opacity=".3"/>`).join('');
      if (look.kind === 'garden') s += [[110, 214, 14], [300, 150, 11], [250, 250, 9]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${Number(w) * 0.4}" fill="#5fa04c" opacity=".55"/><ellipse cx="${Number(x) - 2}" cy="${Number(y) - 1}" rx="${Number(w) * 0.6}" ry="${Number(w) * 0.2}" fill="#9bd36a" opacity=".6"/>`).join('') + [[160, 130, '#ff9bbc'], [320, 200, '#fff'], [90, 200, '#ffd84a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}" opacity=".9"/><circle cx="${x}" cy="${y}" r="1.4" fill="#f4a020"/>`).join('');
      return s + `<rect width="400" height="290" filter="url(#wood)" opacity=".75"/>`;
    }
    case 'rings': {
      let s = '';
      [0.94, 0.82, 0.7, 0.58, 0.46, 0.34, 0.22, 0.12].forEach((k, i) => {
        s += `<ellipse cx="${200 + (i % 2) * 3}" cy="${190 + (i % 3)}" rx="${f1(188 * k)}" ry="${f1(86 * k)}" fill="none" stroke="${look.seam}" stroke-width="${(1.2 + (i % 3) * 0.6).toFixed(1)}" opacity="${(0.3 - i * 0.02).toFixed(2)}"/>`;
      });
      s += `<path d="M200 190 L380 176 M200 190 L30 200 M200 190 L250 270" stroke="${look.seam}" stroke-width="1.2" opacity=".22" fill="none"/>`;
      return s + `<rect width="400" height="290" filter="url(#wood)" opacity=".5"/>`;
    }
    case 'lacquer': {
      let s = `<ellipse cx="150" cy="150" rx="120" ry="40" fill="#fff" opacity=".13" filter="url(#b8)" transform="rotate(-8 150 150)"/>`;
      s += `<path d="M40 214 Q200 270 360 206" stroke="#fff" stroke-width="2" fill="none" opacity=".22"/>`;
      for (let i = 0; i < 40; i++) {
        const x = 30 + r() * 340;
        const y = 120 + r() * 140;
        if (((x - 200) / 180) ** 2 + ((y - 190) / 80) ** 2 > 1) continue;
        const sz = 0.8 + r() * 1.8;
        s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(sz)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
        if (sz > 2) s += `<path d="M${f1(x)} ${f1(y - sz * 3)} v${f1(sz * 6)} M${f1(x - sz * 3)} ${f1(y)} h${f1(sz * 6)}" stroke="#fff" stroke-width=".7" opacity=".7"/>`;
      }
      return s;
    }
    case 'concrete': {
      let s = `<path d="M200 104 L200 276 M20 190 L380 190" stroke="${look.seam}" stroke-width="2" opacity=".35"/><path d="M110 120 L110 262 M290 120 L290 262" stroke="${look.seam}" stroke-width="1.4" opacity=".22"/>`;
      for (let i = 0; i < 18; i++) s += `<ellipse cx="${f1(40 + r() * 320)}" cy="${f1(120 + r() * 140)}" rx="${f1(6 + r() * 22)}" ry="${f1(2 + r() * 6)}" fill="#6a7184" opacity="${(0.05 + r() * 0.07).toFixed(2)}" filter="url(#b3)"/>`;
      return s + `<rect width="400" height="290" filter="url(#grainDark)" opacity=".55"/>`;
    }
    case 'snow': {
      let s = '';
      for (let i = 0; i < 9; i++) s += `<ellipse cx="${f1(60 + r() * 280)}" cy="${f1(130 + r() * 130)}" rx="${f1(30 + r() * 50)}" ry="${f1(8 + r() * 14)}" fill="#a9c8ea" opacity="${(0.12 + r() * 0.12).toFixed(2)}" filter="url(#b8)"/>`;
      for (let i = 0; i < 60; i++) {
        const x = 24 + r() * 352;
        const y = 112 + r() * 156;
        if (((x - 200) / 182) ** 2 + ((y - 190) / 80) ** 2 > 1) continue;
        s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${(0.7 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
      }
      return s;
    }
  }
  void id;
  return '';
}

function rope(): string {
  const N = 110;
  let twist = '';
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const px = CX + RX * Math.cos(a);
    const py = CY + RY * Math.sin(a);
    const tx = -RX * Math.sin(a);
    const ty = RY * Math.cos(a);
    const m = Math.hypot(tx, ty);
    const ang = Math.atan2(ty, tx) + 0.95;
    const dx = Math.cos(ang) * 4.4;
    const dy = Math.sin(ang) * 4.4;
    void m;
    twist += `<path d="M${f1(px - dx)} ${f1(py - dy)} L${f1(px + dx)} ${f1(py + dy)}" stroke="#7d4f24" stroke-width="2.1" stroke-linecap="round" opacity=".55"/><path d="M${f1(px - dx + 1)} ${f1(py - dy - 0.4)} L${f1(px + dx + 1)} ${f1(py + dy - 0.4)}" stroke="#f0c98c" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>`;
  }
  return (
    `<ellipse cx="${CX}" cy="${CY + 6}" rx="${RX}" ry="${RY}" fill="none" stroke="#2a1608" stroke-opacity=".3" stroke-width="9" filter="url(#b3)"/>` +
    `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="#a8743c" stroke-width="9"/>` +
    twist +
    `<ellipse cx="${CX}" cy="${CY - 2.4}" rx="${RX}" ry="${RY}" fill="none" stroke="#fff3d6" stroke-width="1.6" opacity=".55"/>`
  );
}

function knot(): string {
  const y = CY - RY;
  return (
    // two loose tails with frayed ends
    `<path d="M${CX - 6} ${y + 6} q-10 14 -20 16" stroke="#9a6a38" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${CX + 6} ${y + 6} q10 14 20 16" stroke="#9a6a38" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M${CX - 27} ${y + 21} l-5 5 M${CX - 26} ${y + 22} l-1 6 M${CX - 25} ${y + 21} l3 5 M${CX + 27} ${y + 21} l5 5 M${CX + 26} ${y + 22} l1 6 M${CX + 25} ${y + 21} l-3 5" stroke="#c99a5e" stroke-width="1.3" stroke-linecap="round"/>` +
    `<defs>${lg('kn', [[0, '#d9a867'], [0.5, '#b07a40'], [1, '#7d4f24']])}</defs>` +
    `<ellipse cx="${CX}" cy="${y + 12}" rx="22" ry="5" fill="#2a1608" opacity=".28" filter="url(#b2)"/>` +
    `<rect x="${CX - 19}" y="${y - 12}" width="38" height="24" rx="11" fill="url(#kn)"/>` +
    [-12, -6, 0, 6, 12].map((dx) => `<path d="M${CX + dx - 4} ${y - 10} L${CX + dx + 4} ${y + 10}" stroke="#6a4020" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M${CX + dx - 3} ${y - 10} L${CX + dx + 5} ${y + 10}" stroke="#f0c98c" stroke-width="1" stroke-linecap="round" opacity=".6"/>`).join('') +
    `<ellipse cx="${CX - 5}" cy="${y - 6}" rx="10" ry="3.2" fill="#fff" opacity=".4"/>`
  );
}

/** The table, rope and clasp as an svg fragment for a 400 x 330 box. */
export function tableArt(place: string): string {
  const look = LOOKS[place] ?? LOOKS.beach;
  const id = `t${place}`;
  return (
    `<defs>${FX}` +
    rg(id + 'top', [[0, look.top[0]], [1, look.top[1]]], 0.34, 0.3, 0.85) +
    lg(id + 'edge', [[0, look.edge[1]], [0.18, look.edge[0]], [0.5, look.edge[0]], [1, look.edge[1]]], 0, 0, 1, 0) +
    lg(id + 'ed2', [[0, '#fff', 0.22], [0.5, '#000', 0], [1, '#000', 0.4]]) +
    lg(id + 'rim', [[0, look.rim, 0.9], [0.5, look.rim, 0.1], [1, '#000', 0.25]]) +
    `<clipPath id="${id}clip">${TOP}</clipPath>` +
    `<clipPath id="${id}eclip"><path d="M12 190 A188 86 0 0 0 388 190 L388 224 A188 86 0 0 1 12 224Z"/></clipPath></defs>` +
    // shadow on the ground
    `<ellipse cx="200" cy="246" rx="176" ry="36" fill="#2a1608" opacity=".3" filter="url(#b8)"/><ellipse cx="200" cy="236" rx="178" ry="24" fill="#1a0e04" opacity=".3" filter="url(#b3)"/>` +
    // the thick edge
    `<path d="M12 190 A188 86 0 0 0 388 190 L388 224 A188 86 0 0 1 12 224Z" fill="url(#${id}edge)"/>` +
    `<g clip-path="url(#${id}eclip)">` +
    (look.kind === 'snow' ? '' : `<rect y="190" width="400" height="40" filter="url(#wood)" opacity=".7"/>`) +
    `<path d="M12 190 A188 86 0 0 0 388 190 L388 224 A188 86 0 0 1 12 224Z" fill="url(#${id}ed2)"/>` +
    (look.kind === 'rings' ? `<rect y="200" width="400" height="30" filter="url(#bark)" opacity=".9"/>` : '') +
    `</g>` +
    // the top
    `<ellipse cx="200" cy="190" rx="188" ry="86" fill="url(#${id}top)"/>` +
    `<g clip-path="url(#${id}clip)">${surface(look, id)}<ellipse cx="140" cy="140" rx="130" ry="46" fill="#fff" opacity=".18" filter="url(#b8)" transform="rotate(-8 140 140)"/></g>` +
    `<ellipse cx="200" cy="190" rx="187" ry="85" fill="none" stroke="url(#${id}rim)" stroke-width="3.4"/>` +
    rope() + knot()
  );
}
