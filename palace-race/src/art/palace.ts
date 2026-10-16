// The fairy-tale palace at the end of every race: round towers with tall pointed roofs, pennants, arched lit
// windows, crenellated walls and a golden gate. Drawn around its base centre (0, 0), about 420 wide and 400 tall.
// `haze` mixes it toward the sky colour, for when it stands far away.

import { f, linG, mix, shade } from './geom';

let uidN = 0;

export interface PalaceLook { wall: string; roofA: string; roofB: string; haze?: string; hazeK?: number; wave?: number }

export function palace(x: number, y: number, sc: number, look: PalaceLook = { wall: '#f1e8f8', roofA: '#8a6ad6', roofB: '#ee8cbf' }): string {
  const u = `p${(uidN++).toString(36)}`;
  const hz = (c: string) => (look.haze ? mix(c, look.haze, look.hazeK ?? 0.4) : c);
  const ink = hz('#5a3f78');
  const wall = hz(look.wall);
  const wallD = hz(shade(look.wall, -0.2));
  const defs: string[] = [];
  const cyl = (id: string, c: string) => {
    defs.push(linG(id, [[0, shade(c, -0.18)], [0.3, shade(c, 0.25)], [0.6, c], [1, shade(c, -0.28)]], 0, 0, 1, 0));
    return `url(#${id})`;
  };
  const roofG = (id: string, c: string) => {
    defs.push(linG(id, [[0, shade(c, -0.25)], [0.35, shade(c, 0.3)], [0.65, c], [1, shade(c, -0.35)]], 0, 0, 1, 0));
    return `url(#${id})`;
  };
  const wv = look.wave ?? 0;
  let n = 0;
  const flag = (fx: number, fy: number, col: string, len = 26) => {
    const w = Math.sin(wv * 6.28 + fx) * 3;
    return `<path d="M${f(fx)} ${f(fy)} v-30" stroke="${ink}" stroke-width="2"/><path d="M${f(fx)} ${f(fy - 30)} q${f(len * 0.5)} ${f(-4 + w)} ${f(len)} ${f(2)} q${f(-len * 0.5)} ${f(4 - w)} ${f(-len)} 10Z" fill="${hz(col)}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
  };
  const window = (wx: number, wy: number, w: number, h: number) =>
    `<path d="M${f(wx - w / 2)} ${f(wy + h)} v${f(-h + w / 2)} a${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(w)} 0 v${f(h - w / 2)}Z" fill="${hz('#ffd56a')}" stroke="${ink}" stroke-width="1.6"/><path d="M${f(wx)} ${f(wy + 2)} v${f(h - 2)}" stroke="${hz('#e8a13a')}" stroke-width="1.2"/>`;
  const tower = (tx: number, w: number, h: number, roofH: number, roof: string, flagCol: string) => {
    const top = -h;
    const id = `${u}t${n++}`;
    let t = `<path d="M${f(tx - w / 2)} 0 V${f(top)} H${f(tx + w / 2)} V0Z" fill="${cyl(id, look.wall)}" stroke="${ink}" stroke-width="2"/>`;
    // a ring of stone under the roof
    t += `<path d="M${f(tx - w / 2 - 5)} ${f(top + 2)} h${f(w + 10)} v10 h${f(-w - 10)}Z" fill="${wallD}" stroke="${ink}" stroke-width="1.8"/>`;
    for (let i = 0; i < 3; i++) t += window(tx, top + 30 + i * (h - 60) / 2.4, Math.min(14, w * 0.26), 22);
    const rid = `${u}r${n++}`;
    t += `<path d="M${f(tx - w / 2 - 9)} ${f(top + 2)} Q${f(tx - w * 0.2)} ${f(top - roofH * 0.45)} ${f(tx)} ${f(top - roofH)} Q${f(tx + w * 0.2)} ${f(top - roofH * 0.45)} ${f(tx + w / 2 + 9)} ${f(top + 2)} Q${f(tx)} ${f(top + 10)} ${f(tx - w / 2 - 9)} ${f(top + 2)}Z" fill="${roofG(rid, roof)}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    t += `<path d="M${f(tx - w * 0.22)} ${f(top - 4)} Q${f(tx - w * 0.1)} ${f(top - roofH * 0.5)} ${f(tx - 1)} ${f(top - roofH + 6)}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>`;
    t += `<circle cx="${f(tx)}" cy="${f(top - roofH)}" r="3.4" fill="${hz('#ffd23f')}" stroke="${ink}" stroke-width="1.2"/>`;
    t += flag(tx, top - roofH - 2, flagCol);
    return t;
  };
  const crenel = (x0: number, x1: number, yy: number) => {
    let c = '';
    for (let cx = x0; cx < x1 - 4; cx += 16) c += `<rect x="${f(cx)}" y="${f(yy - 10)}" width="10" height="12" fill="${wall}" stroke="${ink}" stroke-width="1.6"/>`;
    return c;
  };
  let s = '';
  // back towers peek over the walls
  s += tower(-118, 34, 230, 90, look.roofB, '#ffd23f') + tower(118, 34, 230, 90, look.roofB, '#ffd23f');
  // outer walls and towers
  s += crenel(-200, -60, -110) + crenel(60, 200, -110);
  s += `<path d="M-200 0 V-110 H200 V0Z" fill="${cyl(`${u}w`, look.wall)}" stroke="${ink}" stroke-width="2"/>`;
  for (let i = 0; i < 6; i++) s += window(-170 + i * 22 + (i > 2 ? 208 : 0), -84, 10, 18);
  s += tower(-196, 52, 170, 96, look.roofA, '#ff7aa8') + tower(196, 52, 170, 96, look.roofA, '#7fc4ff');
  // the keep in the middle
  s += crenel(-70, 74, -196);
  s += `<path d="M-70 0 V-196 H70 V0Z" fill="${cyl(`${u}k`, look.wall)}" stroke="${ink}" stroke-width="2"/>`;
  s += window(-34, -170, 14, 26) + window(34, -170, 14, 26) + window(0, -150, 20, 34);
  s += tower(-60, 40, 270, 110, look.roofA, '#ffd23f') + tower(60, 40, 270, 110, look.roofA, '#ffd23f');
  s += tower(0, 58, 330, 140, look.roofB, '#ff7aa8');
  // the golden gate under an arch, with a rose window above
  s += `<path d="M-30 0 V-46 a30 30 0 0 1 60 0 V0Z" fill="${hz('#7a4a2a')}" stroke="${ink}" stroke-width="2"/>`;
  s += `<path d="M-24 0 V-44 a24 24 0 0 1 48 0 V0Z" fill="${hz('#f4c142')}" stroke="${ink}" stroke-width="1.6"/>`;
  s += `<path d="M0 -68 V0 M-24 -24 H24 M-24 -10 H24" stroke="${hz('#c48a1a')}" stroke-width="1.6"/>`;
  s += `<circle cx="0" cy="-100" r="13" fill="${hz('#ffd56a')}" stroke="${ink}" stroke-width="1.8"/><path d="M0 -113 V-87 M-13 -100 H13 M-9 -109 L9 -91 M9 -109 L-9 -91" stroke="${hz('#e8a13a')}" stroke-width="1.2"/>`;
  // garlands of pennants between the towers
  [[-196, -60], [60, 196]].forEach(([a, b]) => {
    const yy = -118;
    s += `<path d="M${a} ${yy} Q${(a + b) / 2} ${yy + 22} ${b} ${yy}" stroke="${ink}" stroke-width="1.2" fill="none"/>`;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const px = a + (b - a) * t;
      const py = yy + 2 * t * (1 - t) * 22;
      s += `<path d="M${f(px - 5)} ${f(py)} l5 10 l5 -10Z" fill="${hz(['#ff7aa8', '#ffd23f', '#7fc4ff'][i % 3])}"/>`;
    }
  });
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${sc})"><defs>${defs.join('')}</defs>${s}</g>`;
}
