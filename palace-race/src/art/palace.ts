// The fairy-tale palace at the end of every race, in the spirit of the owner's logo: round towers under tall
// purple and blue roofs with fish-scale shingles, gold rings and finials, many spires and turrets, arched windows of
// blue glass in gold frames, dormers in the big roofs, stone walls with battlements, a golden gate with lanterns,
// pennants, and a warm golden glow with sparkles behind it. Drawn around its base centre (0, 0), about 440 wide and
// 420 tall. `haze` mixes it toward the sky colour, for when it stands far away.

import { f, linG, mix, radG, shade } from './geom';

let uidN = 0;

export interface PalaceLook { wall: string; roofA: string; roofB: string; haze?: string; hazeK?: number; wave?: number }

export const PALACE_LOOK: PalaceLook = { wall: '#efe4f8', roofA: '#9a5ad6', roofB: '#3f8ee0' };

export function palace(x: number, y: number, sc: number, look: PalaceLook = PALACE_LOOK): string {
  const u = `p${(uidN++).toString(36)}`;
  const k = look.haze ? (look.hazeK ?? 0.4) : 0;
  const hz = (c: string) => (look.haze ? mix(c, look.haze, k) : c);
  const ink = hz('#4e3470');
  const gold = hz('#ffcf3a');
  const goldD = hz('#c8861a');
  const wall = hz(look.wall);
  const wallD = hz(shade(look.wall, -0.2));
  const defs: string[] = [];
  let n = 0;
  const cyl = (c: string) => {
    const id = `${u}c${n++}`;
    defs.push(linG(id, [[0, hz(shade(c, -0.2))], [0.3, hz(shade(c, 0.3))], [0.62, hz(c)], [1, hz(shade(c, -0.3))]], 0, 0, 1, 0));
    return `url(#${id})`;
  };
  const glassId = `${u}glass`;
  defs.push(linG(glassId, [[0, hz('#bfe4ff')], [0.5, hz('#4a90e0')], [1, hz('#2a4fa0')]]));
  const wv = look.wave ?? 0;

  const flag = (fx: number, fy: number, col: string, len = 24) => {
    const w = Math.sin(wv * 6.28 + fx) * 3;
    return `<path d="M${f(fx)} ${f(fy)} v-28" stroke="${ink}" stroke-width="2"/><path d="M${f(fx)} ${f(fy - 28)} q${f(len * 0.5)} ${f(-4 + w)} ${f(len)} ${f(3)} l-6 4 l6 4 q${f(-len * 0.5)} ${f(2 - w)} ${f(-len)} 0Z" fill="${hz(col)}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
  };

  /** An arched window of blue glass in a gold frame, with a glint. */
  const win = (wx: number, wy: number, w: number, h: number) =>
    `<path d="M${f(wx - w / 2 - 2)} ${f(wy + h + 1)} v${f(-h + w / 2)} a${f(w / 2 + 2)} ${f(w / 2 + 2)} 0 0 1 ${f(w + 4)} 0 v${f(h - w / 2)}Z" fill="${gold}" stroke="${ink}" stroke-width="1.4"/>` +
    `<path d="M${f(wx - w / 2)} ${f(wy + h)} v${f(-h + w / 2)} a${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(w)} 0 v${f(h - w / 2)}Z" fill="url(#${glassId})"/>` +
    `<path d="M${f(wx)} ${f(wy + 1)} v${f(h - 1)} M${f(wx - w / 2)} ${f(wy + h * 0.55)} h${f(w)}" stroke="${gold}" stroke-width="1.1"/>` +
    `<path d="M${f(wx - w * 0.28)} ${f(wy + h * 0.2)} v${f(h * 0.25)}" stroke="#fff" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>`;

  /** A tall conical roof with fish-scale shingles, a gold ring at its base and a gold finial. */
  const roof = (tx: number, top: number, w: number, roofH: number, col: string, flagCol: string, dormer = false) => {
    const L = tx - w / 2 - 9;
    const R = tx + w / 2 + 9;
    const apex = top - roofH;
    const d = `M${f(L)} ${f(top + 2)} Q${f(tx - w * 0.22)} ${f(top - roofH * 0.45)} ${f(tx)} ${f(apex)} Q${f(tx + w * 0.22)} ${f(top - roofH * 0.45)} ${f(R)} ${f(top + 2)} Q${f(tx)} ${f(top + 11)} ${f(L)} ${f(top + 2)}Z`;
    const id = `${u}r${n++}`;
    defs.push(linG(id, [[0, hz(shade(col, -0.3))], [0.32, hz(shade(col, 0.35))], [0.62, hz(col)], [1, hz(shade(col, -0.4))]], 0, 0, 1, 0));
    defs.push(`<clipPath id="${id}k"><path d="${d}"/></clipPath>`);
    let t = `<path d="${d}" fill="url(#${id})"/>`;
    // shingles: rows of little arcs, every other row offset
    let sh = '';
    const rows = Math.max(4, Math.round(roofH / 9));
    for (let i = 1; i <= rows; i++) {
      const yy = apex + (i / rows) * (top + 4 - apex);
      const sw = 7 + (i / rows) * 4;
      for (let xx = L - 10 + (i % 2) * sw * 0.5; xx < R + 10; xx += sw) sh += `M${f(xx)} ${f(yy)} a${f(sw / 2)} ${f(sw / 2.2)} 0 0 0 ${f(sw)} 0`;
    }
    t += `<g clip-path="url(#${id}k)"><path d="${sh}" stroke="${hz(shade(col, -0.35))}" stroke-width="1.2" fill="none" opacity=".75"/>` +
      `<path d="M${f(tx - w * 0.3)} ${f(top)} Q${f(tx - w * 0.14)} ${f(top - roofH * 0.5)} ${f(tx - 1)} ${f(apex + 8)}" stroke="#fff" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/></g>`;
    t += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    if (dormer) {
      // a little dormer window jutting out of the roof
      const dy = top - roofH * 0.34;
      t += `<path d="M${f(tx - 9)} ${f(dy + 14)} V${f(dy)} L${f(tx)} ${f(dy - 10)} L${f(tx + 9)} ${f(dy)} V${f(dy + 14)}Z" fill="${wall}" stroke="${ink}" stroke-width="1.6"/>` +
        `<path d="M${f(tx - 12)} ${f(dy + 1)} L${f(tx)} ${f(dy - 12)} L${f(tx + 12)} ${f(dy + 1)}" fill="none" stroke="${gold}" stroke-width="2.4"/>` + win(tx, dy - 2, 8, 13);
    }
    // the gold ring at the base and the finial on top
    t += `<path d="M${f(L - 1)} ${f(top + 1)} Q${f(tx)} ${f(top + 13)} ${f(R + 1)} ${f(top + 1)} L${f(R - 2)} ${f(top + 7)} Q${f(tx)} ${f(top + 17)} ${f(L + 2)} ${f(top + 7)}Z" fill="${gold}" stroke="${ink}" stroke-width="1.4"/>`;
    t += `<path d="M${f(tx)} ${f(apex - 14)} L${f(tx + 3)} ${f(apex - 2)} L${f(tx - 3)} ${f(apex - 2)}Z" fill="${gold}" stroke="${ink}" stroke-width="1"/><circle cx="${f(tx)}" cy="${f(apex - 1)}" r="4" fill="${gold}" stroke="${ink}" stroke-width="1.2"/>`;
    t += flag(tx, apex - 13, flagCol);
    return t;
  };

  /** A round tower: a shaded stone cylinder with windows and a battlement ring, under its roof. */
  const tower = (tx: number, w: number, h: number, roofH: number, col: string, flagCol: string, base = 0, opts: { windows?: number; dormer?: boolean } = {}) => {
    const top = base - h;
    let t = `<path d="M${f(tx - w / 2)} ${f(base)} V${f(top)} H${f(tx + w / 2)} V${f(base)}Z" fill="${cyl(look.wall)}" stroke="${ink}" stroke-width="2"/>`;
    // stone courses
    for (let yy = top + 22; yy < base - 6; yy += 18) t += `<path d="M${f(tx - w / 2 + 3)} ${f(yy)} Q${f(tx)} ${f(yy + 3)} ${f(tx + w / 2 - 3)} ${f(yy)}" stroke="${wallD}" stroke-width="1" fill="none" opacity=".7"/>`;
    const nw = opts.windows ?? (h > 120 ? 2 : 1);
    for (let i = 0; i < nw; i++) t += win(tx, top + 26 + i * Math.min(70, (h - 60) / Math.max(1, nw)), Math.min(13, w * 0.28), 20);
    // the battlement ring under the roof
    const bw = w + 8;
    t += `<path d="M${f(tx - bw / 2)} ${f(top + 12)} h${f(bw)} v-10 h${f(-bw)}Z" fill="${wallD}" stroke="${ink}" stroke-width="1.6"/>`;
    for (let i = 0; i < 4; i++) t += `<rect x="${f(tx - bw / 2 + 1 + i * (bw / 4))}" y="${f(top - 4)}" width="${f(bw / 4 - 3)}" height="7" fill="${wall}" stroke="${ink}" stroke-width="1.2"/>`;
    t += roof(tx, top - 2, w, roofH, col, flagCol, opts.dormer);
    return t;
  };

  const crenel = (x0: number, x1: number, yy: number) => {
    let c = '';
    for (let cx = x0; cx < x1 - 4; cx += 16) c += `<rect x="${f(cx)}" y="${f(yy - 10)}" width="10" height="12" fill="${wall}" stroke="${ink}" stroke-width="1.6"/>`;
    return c;
  };
  const stones = (x0: number, x1: number, y0: number, y1: number) => {
    let d = '';
    for (let yy = y0 + 14, r = 0; yy < y1; yy += 14, r++) {
      d += `M${x0 + 2} ${yy}H${x1 - 2}`;
      for (let xx = x0 + (r % 2 ? 12 : 24); xx < x1 - 4; xx += 24) d += `M${xx} ${yy}v-14`;
    }
    return `<path d="${d}" stroke="${wallD}" stroke-width="1" opacity=".55" fill="none"/>`;
  };

  let s = '';
  // the warm glow and sparkles behind the palace
  const gid = `${u}glow`;
  defs.push(radG(gid, [[0, hz('#fff3b0'), 0.95], [0.45, hz('#ffd27a'), 0.5], [1, hz('#ffd27a'), 0]]));
  s += `<ellipse cx="0" cy="-200" rx="300" ry="250" fill="url(#${gid})" opacity="${f(1 - k * 0.8)}"/>`;
  [[-230, -330, 9], [210, -360, 11], [-150, -420, 7], [160, -440, 8], [250, -230, 7], [-260, -200, 6], [60, -470, 6]].forEach(([sx, sy, r]) => {
    s += `<path d="M${sx} ${sy - r} L${sx + r * 0.25} ${sy - r * 0.25} L${sx + r} ${sy} L${sx + r * 0.25} ${sy + r * 0.25} L${sx} ${sy + r} L${sx - r * 0.25} ${sy + r * 0.25} L${sx - r} ${sy} L${sx - r * 0.25} ${sy - r * 0.25}Z" fill="${hz('#fff6c8')}" opacity="${f(1 - k)}"/>`;
  });
  const A = look.roofA;
  const B = look.roofB;
  // back towers peek over everything
  s += tower(-122, 34, 232, 92, B, '#3fc4c8') + tower(122, 34, 232, 92, B, '#3fc4c8');
  s += tower(-160, 26, 190, 70, A, '#9a5ad6', 0, { windows: 1 }) + tower(160, 26, 190, 70, A, '#9a5ad6', 0, { windows: 1 });
  // outer walls with battlements and little turrets
  s += crenel(-204, -60, -112) + crenel(60, 204, -112);
  s += `<path d="M-204 0 V-112 H204 V0Z" fill="${cyl(look.wall)}" stroke="${ink}" stroke-width="2"/>` + stones(-204, 204, -112, 0);
  for (let i = 0; i < 6; i++) s += win(-176 + i * 24 + (i > 2 ? 208 : 0), -88, 10, 18);
  s += tower(-130, 20, 34, 40, A, '#3fc4c8', -112, { windows: 0 }) + tower(130, 20, 34, 40, A, '#3fc4c8', -112, { windows: 0 });
  s += tower(-202, 54, 176, 98, A, '#ff7aa8', 0, { dormer: true }) + tower(202, 54, 176, 98, A, '#3fc4c8', 0, { dormer: true });
  // the keep in the middle, with corner turrets
  s += crenel(-72, 76, -198);
  s += `<path d="M-72 0 V-198 H72 V0Z" fill="${cyl(look.wall)}" stroke="${ink}" stroke-width="2"/>` + stones(-72, 72, -198, -60);
  s += win(-38, -176, 13, 24) + win(38, -176, 13, 24);
  s += tower(-62, 40, 272, 112, B, '#9a5ad6') + tower(62, 40, 272, 112, B, '#9a5ad6');
  s += tower(-86, 20, 44, 44, A, '#3fc4c8', -198, { windows: 0 }) + tower(86, 20, 44, 44, A, '#3fc4c8', -198, { windows: 0 });
  s += tower(0, 60, 334, 146, A, '#ff7aa8', 0, { windows: 3, dormer: true });
  // a little gold crown under the tallest roof
  s += `<path d="M-14 -352 l4 -14 l5 8 l5 -12 l5 12 l5 -8 l4 14Z" fill="${gold}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="0" cy="-358" r="2.4" fill="${hz('#4ad0ff')}"/>`;
  // a balcony on the keep
  s += `<path d="M-26 -132 h52 v8 h-52Z" fill="${gold}" stroke="${ink}" stroke-width="1.4"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${-22 + i * 9} -124 v12" stroke="${goldD}" stroke-width="2"/>`;
  s += `<path d="M-26 -112 h52" stroke="${ink}" stroke-width="2"/>`;
  s += win(0, -170, 22, 36);
  // the golden gate under a gold arch, a rose window above and lanterns beside it
  s += `<path d="M-34 0 V-48 a34 34 0 0 1 68 0 V0Z" fill="${gold}" stroke="${ink}" stroke-width="2"/>`;
  s += `<path d="M-27 0 V-46 a27 27 0 0 1 54 0 V0Z" fill="${hz('#8a4a2a')}" stroke="${ink}" stroke-width="1.6"/>`;
  s += `<path d="M-9 0 V-70 M9 0 V-70 M-27 -22 H27 M-27 -40 H27" stroke="${goldD}" stroke-width="2"/>`;
  s += `<circle cx="0" cy="-96" r="14" fill="url(#${glassId})" stroke="${gold}" stroke-width="3"/><path d="M0 -110 V-82 M-14 -96 H14 M-10 -106 L10 -86 M10 -106 L-10 -86" stroke="${gold}" stroke-width="1.4"/>`;
  [-50, 50].forEach((lx) => (s += `<path d="M${lx} -40 v10" stroke="${ink}" stroke-width="2"/><path d="M${lx - 6} -30 h12 l-2 14 h-8Z" fill="${hz('#fff0a0')}" stroke="${ink}" stroke-width="1.6"/><circle cx="${lx}" cy="-23" r="12" fill="${hz('#fff3b0')}" opacity=".35"/>`));
  // garlands of pennants between the towers
  [[-202, -62], [62, 202]].forEach(([a, b]) => {
    const yy = -122;
    s += `<path d="M${a} ${yy} Q${(a + b) / 2} ${yy + 22} ${b} ${yy}" stroke="${ink}" stroke-width="1.2" fill="none"/>`;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const px = a + (b - a) * t;
      const py = yy + 2 * t * (1 - t) * 22;
      s += `<path d="M${f(px - 5)} ${f(py)} l5 10 l5 -10Z" fill="${hz(['#ff7aa8', '#ffd23f', '#3fc4c8', '#9a5ad6'][i % 4])}"/>`;
    }
  });
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${sc})"><defs>${defs.join('')}</defs>${s}</g>`;
}
