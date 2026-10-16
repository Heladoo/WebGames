// The five race tracks, painted in a warm storybook style. Each track is five layers on a 1600 x 900 stage:
//   sky    the backdrop (it does not move): sky, sun glow, clouds and the palace far away on the horizon
//   far    distant hills, mountains or trees, hazy (scrolls slowly)
//   mid    trees, rocks or hedges beside the track
//   ground the path with its three lanes (scrolls with the runners)
//   front  plants close to the camera along the bottom edge (scrolls a little faster)
// Every scrolling layer is a tile that repeats without a seam: its content is drawn three times, one tile apart, so
// anything that reaches past an edge comes back in on the other side, and skylines are sums of sines with whole
// periods across the tile (`periodic`).

import { FX, blossom, butterfly, cloud, fern, foliage, grass, mushroom, pine, rays, rng, trunk } from './paint';
import { blob, ellipse, f, linG, mix, pt, radG, shade, type P } from './geom';
import { PALACE_LOOK, palace } from './palace';

export const STAGE_W = 1600;
export const STAGE_H = 900;
/** Where hooves touch the ground in each lane (far, middle, near), and how big runners are drawn there. */
export const LANE_Y = [655, 745, 835];
export const LANE_SCALE = [0.8, 0.9, 1];
export const TRACK_TOP = 600;

export type TrackId = 'forest' | 'meadow' | 'snow' | 'canyon' | 'garden';
export const TRACKS: TrackId[] = ['forest', 'meadow', 'snow', 'canyon', 'garden'];
export const TRACK_NAME: Record<TrackId, string> = { forest: 'היער הקסום', meadow: 'אחו הפרחים', snow: 'הרי השלג', canyon: 'צוקי השקיעה', garden: 'גני הארמון' };
export type Layer = 'sky' | 'far' | 'mid' | 'ground' | 'front';
export const LAYERS: Layer[] = ['sky', 'far', 'mid', 'ground', 'front'];
/** How fast each layer moves compared with the ground. */
export const PARALLAX: Record<Layer, number> = { sky: 0, far: 0.12, mid: 0.4, ground: 1, front: 1.3 };

const W = STAGE_W;

/** Draw something at x (a readable name for the many placed shapes; tiling is done once, in `trackLayer`). */
const at = (x: number, draw: (x: number) => string) => draw(x);

/** A skyline that repeats exactly every tile: a sum of sines with whole numbers of periods. */
function periodic(seed: number, base: number, amps: number[]): (x: number) => number {
  const r = rng(seed);
  const ph = amps.map(() => r() * Math.PI * 2);
  return (x) => base + amps.reduce((s, a, i) => s + a * Math.sin(((i + 1) * 2 * Math.PI * x) / W + ph[i]), 0);
}

let gradN = 0;
/** A vertical gradient (in stage units) from a lit top colour to a deeper one: depth for hills, rocks and snow. */
function vgrad(top: string, y0: number, y1: number, k = 0.22): string {
  const id = `vg${gradN++}`;
  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}"><stop offset="0" stop-color="${shade(top, k)}"/><stop offset=".45" stop-color="${top}"/><stop offset="1" stop-color="${shade(top, -k)}"/></linearGradient></defs>` + `url(#${id})`;
}
/** Split a `vgrad` result into its defs and its fill reference. */
function grad(top: string, y0: number, y1: number, k = 0.22): [string, string] {
  const g = vgrad(top, y0, y1, k);
  const i = g.indexOf('url(');
  return [g.slice(0, i), g.slice(i)];
}

function band(top: (x: number) => number, bottom: number, fill: string, extra = ''): string {
  let d = `M-4 ${bottom}`;
  for (let i = 0; i <= 101; i++) {
    const x = -4 + (i * (W + 8)) / 101;
    d += `L${f(x)} ${f(top(x))}`;
  }
  return `<path d="${d}L${W + 4} ${bottom}Z" fill="${fill}"${extra}/>`;
}

interface Look {
  sky: [string, string, string]; // top, middle, horizon
  sun: string;
  haze: string;
  clouds: [string, string, string];
  palace: { x: number; y: number; s: number; k: number };
  dirt: [string, string, string]; // light, base, dark
  verge: [string, string, string];
}

const LOOK: Record<TrackId, Look> = {
  forest: { sky: ['#8fc3d8', '#f4d9a4', '#ffe7b0'], sun: '#fff3c4', haze: '#f3dcae', clouds: ['#e8b98c', '#f9dcb6', '#fff6e2'], palace: { x: 820, y: 478, s: 0.62, k: 0.35 }, dirt: ['#f0cf8e', '#d9ab68', '#b07c42'], verge: ['#3f8a3a', '#68ad48', '#a5d36a'] },
  meadow: { sky: ['#5fb0ea', '#a9daf6', '#e8f6ff'], sun: '#fffbe0', haze: '#d8eefa', clouds: ['#c3d3f0', '#eef2fb', '#ffffff'], palace: { x: 1060, y: 470, s: 0.5, k: 0.42 }, dirt: ['#f4dca0', '#e2be7a', '#bf9454'], verge: ['#4f9e3e', '#7cc152', '#b8e27a'] },
  snow: { sky: ['#7fa8e6', '#bcd6f4', '#eef6ff'], sun: '#ffffff', haze: '#dfeaf8', clouds: ['#b8c8e6', '#e6eefa', '#ffffff'], palace: { x: 760, y: 430, s: 0.5, k: 0.45 }, dirt: ['#f4f8ff', '#cfdcf0', '#94a9cc'], verge: ['#d6e6f6', '#eef5fd', '#ffffff'] },
  canyon: { sky: ['#8a6fc8', '#f4a07c', '#ffd79a'], sun: '#fff0b8', haze: '#f6c08e', clouds: ['#d8829a', '#f6b4a0', '#ffe2c4'], palace: { x: 900, y: 470, s: 0.55, k: 0.4 }, dirt: ['#f2b47a', '#d98a52', '#a85a32'], verge: ['#c97a3a', '#e8a052', '#f6c37a'] },
  garden: { sky: ['#6fb4ec', '#c0e2f8', '#fff1d6'], sun: '#fffbe6', haze: '#f1e6f4', clouds: ['#d4c8ee', '#f4ecfa', '#ffffff'], palace: { x: 800, y: 600, s: 1.15, k: 0.12 }, dirt: ['#f6ead6', '#e2cfb0', '#bba582'], verge: ['#3f8f48', '#5fae5a', '#a6d77c'] },
};

// ---------------------------------------------------------------- sky

function sky(id: TrackId): string {
  const L = LOOK[id];
  const r = rng(11 + id.length);
  let s = `<defs>${linG('sky', [[0, L.sky[0]], [0.55, L.sky[1]], [0.8, L.sky[2]]])}${radG('sun', [[0, '#ffffff', 1], [0.25, L.sun, 0.9], [1, L.sun, 0]], 0.5, 0.5, 0.5)}</defs>`;
  s += `<rect width="${W}" height="900" fill="url(#sky)"/>`;
  s += `<circle cx="${L.palace.x}" cy="${L.palace.y - 160}" r="560" fill="url(#sun)" opacity=".85"/>`;
  s += rays(L.palace.x, L.palace.y - 220, 9, 760, 120, 7, '#fffbe0', 0.18);
  // clouds: a few big ones high up and smaller ones near the horizon
  for (let i = 0; i < 7; i++) {
    const x = r() * 1500;
    const y = 90 + r() * 240;
    const w = 160 + r() * 220;
    s += `<g transform="translate(${f(x)} ${f(y)}) scale(${(1.4 + r() * 0.8).toFixed(2)})">${cloud(0, 0, w / 1.6, 46, 31 + i, L.clouds, mix(L.clouds[0], '#ff9ac0', 0.4), 0.95)}</g>`;
  }
  // the palace far away, on its hill
  const P = L.palace;
  if (id !== 'garden') {
    s += `<path d="M${P.x - 380} ${P.y + 140} Q${P.x - 200} ${P.y - 20} ${P.x} ${P.y - 6} Q${P.x + 200} ${P.y - 20} ${P.x + 380} ${P.y + 140}Z" fill="${mix(L.verge[1], L.haze, 0.55)}" filter="url(#b3)"/>`;
  }
  s += `<g filter="url(#soften)">${palace(P.x, P.y, P.s, { ...PALACE_LOOK, haze: L.haze, hazeK: P.k, wave: 0.2 })}</g>`;
  return s;
}

// ---------------------------------------------------------------- far layers

function farLayer(id: TrackId): string {
  const L = LOOK[id];
  const r = rng(101 + id.length * 7);
  let s = '';
  if (id === 'snow') {
    // snowy peaks: periodic jagged ridge, snowcaps, and a soft shadow side
    const peaks = (seed: number, base: number, amp: number, col: string, k: number) => {
      const q = rng(seed);
      const pts: P[] = [];
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * W;
        const top = i === n ? pts[0].y : base - amp * (0.4 + q() * 0.6);
        pts.push(pt(x, top));
        if (i < n) pts.push(pt(x + W / n / 2, base - amp * (0.05 + q() * 0.2)));
      }
      let d = `M-4 900`;
      pts.forEach((p) => (d += `L${f(p.x)} ${f(p.y)}`));
      let out = `<path d="${d}L${W + 4} 900Z" fill="${mix(col, L.haze, k)}"/>`;
      // snow on each peak
      for (let i = 0; i < pts.length - 1; i += 2) {
        const p = pts[i];
        const cap = `M${f(p.x - 46)} ${f(p.y + 60)} L${f(p.x)} ${f(p.y)} L${f(p.x + 50)} ${f(p.y + 64)} Q${f(p.x + 30)} ${f(p.y + 52)} ${f(p.x + 18)} ${f(p.y + 66)} Q${f(p.x)} ${f(p.y + 50)} ${f(p.x - 14)} ${f(p.y + 64)} Q${f(p.x - 30)} ${f(p.y + 50)} ${f(p.x - 46)} ${f(p.y + 60)}Z`;
        out += at(p.x, (xx) => `<path d="${cap}" transform="translate(${f(xx - p.x)} 0)" fill="${mix('#ffffff', L.haze, k * 0.5)}"/>`);
        out += at(p.x, (xx) => `<path d="M${f(xx)} ${f(p.y)} L${f(xx + 120)} ${f(p.y + 240)} L${f(xx + 40)} ${f(p.y + 240)}Z" fill="#3a5a8a" opacity=".12"/>`);
      }
      return out;
    };
    s += peaks(3, 420, 200, '#9db6dc', 0.55) + peaks(9, 520, 170, '#7f9ccc', 0.35);
    const [d1, g1] = grad(mix('#ffffff', L.haze, 0.3), 560, 700, 0.12);
    s += d1 + band(periodic(4, 600, [14, 8, 4]), 900, g1);
    for (let i = 0; i < 26; i++) {
      const x = r() * W;
      const y = 560 + r() * 40;
      s += at(x, (xx) => pine(xx, y, 0.9 + r() * 0.4, ['#3f6f8a', '#5a8aa4', '#86b0c6'], true, 5));
    }
    return s;
  }
  if (id === 'canyon') {
    // flat-topped red mesas with striped cliffs
    const mesa = (x: number, y: number, w: number, h: number, col: string, k: number) =>
      at(x, (xx) => {
        const c = mix(col, L.haze, k);
        const [md, mg] = grad(c, y, 640, 0.3);
        let m = md + `<path d="M${f(xx - w / 2)} 900 L${f(xx - w / 2 + 20)} ${f(y + 30)} Q${f(xx - w / 2 + 26)} ${f(y)} ${f(xx - w / 2 + 50)} ${f(y)} H${f(xx + w / 2 - 40)} Q${f(xx + w / 2 - 20)} ${f(y)} ${f(xx + w / 2 - 14)} ${f(y + 30)} L${f(xx + w / 2)} 900Z" fill="${mg}"/>`;
        for (let i = 1; i < 5; i++) m += `<path d="M${f(xx - w / 2 + 16)} ${f(y + i * h * 0.2)} H${f(xx + w / 2 - 12)}" stroke="${shade(c, -0.12)}" stroke-width="${f(6 - i)}" opacity=".6"/>`;
        m += `<path d="M${f(xx + w * 0.2)} ${f(y + 6)} L${f(xx + w / 2 - 14)} ${f(y + 30)} L${f(xx + w / 2)} 900 H${f(xx + w * 0.25)}Z" fill="#5a1a3a" opacity=".14"/>`;
        return m;
      });
    [[160, 380, 260, 220], [620, 420, 220, 180], [1050, 360, 300, 240], [1420, 430, 200, 170]].forEach(([x, y, w, h], i) => (s += mesa(x, y, w, h, i % 2 ? '#c96a4a' : '#d9805a', 0.45)));
    const [d1, g1] = grad(mix('#c8744a', L.haze, 0.3), 520, 680, 0.25);
    s += d1 + band(periodic(6, 560, [20, 10, 6]), 900, g1);
    s += grass(0, W, 600, 220, 14, 41, '#b8743a', '#e8a052');
    return s;
  }
  // green hills with tree lines (forest, meadow, garden)
  const hillA = periodic(21 + id.length, id === 'meadow' ? 470 : 500, [26, 16, 8]);
  const hillB = periodic(33 + id.length, id === 'meadow' ? 545 : 560, [22, 12, 6, 4]);
  const [dA, gA] = grad(mix(L.verge[1], L.haze, 0.55), 430, 640, 0.18);
  s += dA + band(hillA, 900, gA);
  s += foliage(-20, W + 20, (x) => hillA(x) - 6, 640, 7, [mix(L.verge[0], L.haze, 0.5), mix(L.verge[1], L.haze, 0.45), mix(L.verge[2], L.haze, 0.4)], 22, 0.4);
  const [dB, gB] = grad(mix(L.verge[1], L.haze, 0.3), 520, 660, 0.2);
  s += dB + band(hillB, 900, gB);
  if (id === 'meadow') {
    // patchwork fields and flower dots on the near hill
    const fields = ['#8fca5a', '#a8d870', '#7ab84a', '#c8e08a', '#9ccf68'];
    for (let i = 0; i < 12; i++) {
      const x0 = i * (W / 12);
      const x1 = x0 + W / 12;
      const top = (x: number) => hillB(x) + 18 + (i % 2) * 12;
      let d = `M${f(x0)} ${f(top(x0))}`;
      for (let k = 1; k <= 8; k++) d += `L${f(x0 + ((x1 - x0) * k) / 8)} ${f(top(x0 + ((x1 - x0) * k) / 8))}`;
      s += `<path d="${d}L${f(x1)} 700L${f(x0)} 700Z" fill="${mix(fields[i % fields.length], L.haze, 0.3)}" opacity=".7"/>`;
      s += `<path d="M${f(x0)} ${f(top(x0) + 30)} L${f(x1)} ${f(top(x1) + 30)}" stroke="${mix('#5a9a3a', L.haze, 0.3)}" stroke-width="2" opacity=".5"/>`;
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * W;
      s += roundTree(x, hillB(x) + 10, 0.6 + r() * 0.4, [mix(L.verge[0], L.haze, 0.35), mix(L.verge[1], L.haze, 0.3), mix(L.verge[2], L.haze, 0.25)], 70 + i);
    }
    for (let i = 0; i < 160; i++) {
      const x = r() * W;
      s += `<circle cx="${f(x)}" cy="${f(hillB(x) + 8 + r() * 60)}" r="${f(1.6 + r() * 2.2)}" fill="${['#ff9ec8', '#fff2a8', '#ffffff', '#c9a0ff'][i % 4]}" opacity=".8"/>`;
    }
  } else {
    // a line of round trees and pines along the near hill
    for (let i = 0; i < 30; i++) {
      const x = r() * W;
      const y = hillB(x) + 8;
      if (id === 'forest' && i % 3 === 0) s += at(x, (xx) => pine(xx, y, 1 + r() * 0.5, [mix('#2f6a4a', L.haze, 0.35), mix('#3f8a5a', L.haze, 0.3), mix('#6aac7a', L.haze, 0.3)]));
      else s += at(x, (xx) => roundTree(xx, y, 0.8 + r() * 0.5, [mix(L.verge[0], L.haze, 0.3), mix(L.verge[1], L.haze, 0.3), mix(L.verge[2], L.haze, 0.25)], i));
    }
  }
  return s;
}

function roundTree(x: number, y: number, s: number, cols: [string, string, string], seed: number): string {
  const r = rng(seed * 13 + 5);
  let t = `<path d="M${f(x - 5 * s)} ${f(y)} Q${f(x - 3 * s)} ${f(y - 20 * s)} ${f(x - 2 * s)} ${f(y - 40 * s)} L${f(x + 3 * s)} ${f(y - 40 * s)} Q${f(x + 3 * s)} ${f(y - 20 * s)} ${f(x + 6 * s)} ${f(y)}Z" fill="#6a4a2a"/>`;
  t += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(30 * s)}" ry="${f(5 * s)}" fill="#1a2a10" opacity=".2"/>`;
  const cy = y - 62 * s;
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 24 * s;
    t += `<circle cx="${f(x + Math.cos(a) * d * 1.2)}" cy="${f(cy + Math.sin(a) * d * 0.9 + 6 * s)}" r="${f((13 + r() * 8) * s)}" fill="${cols[0]}"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 20 * s;
    t += `<circle cx="${f(x - 4 * s + Math.cos(a) * d)}" cy="${f(cy - 4 * s + Math.sin(a) * d * 0.8)}" r="${f((9 + r() * 7) * s)}" fill="${cols[1]}"/>`;
  }
  for (let i = 0; i < 8; i++) t += `<circle cx="${f(x - 10 * s + (r() - 0.5) * 24 * s)}" cy="${f(cy - 14 * s + (r() - 0.5) * 16 * s)}" r="${f((4 + r() * 5) * s)}" fill="${cols[2]}" opacity=".8"/>`;
  return t;
}

// ---------------------------------------------------------------- mid layers

/** A huge old tree with a bark-textured trunk, roots and a leafy crown that reaches the top of the stage. */
function bigTree(x: number, seed: number, cols: [string, string, string]): string {
  const r = rng(seed);
  const lean = (r() - 0.5) * 50;
  const w = 70 + r() * 40;
  let s = '';
  // branches into the crown
  s += trunk({ x: x + lean * 0.3, y: 260 }, { x: x - 30 + lean, y: 170 }, { x: x - 90, y: 110 }, { x: x - 170, y: 60 }, 32, 12, '#6b4426', '#a47445', '#3f2512', false);
  s += trunk({ x: x + lean * 0.4, y: 230 }, { x: x + 40 + lean, y: 150 }, { x: x + 100, y: 90 }, { x: x + 190, y: 50 }, 30, 10, '#6b4426', '#a47445', '#3f2512', false);
  s += trunk({ x, y: 640 }, { x: x + lean * 0.2, y: 460 }, { x: x + lean * 0.6, y: 280 }, { x: x + lean, y: 80 }, w, w * 0.55, '#6b4426', '#b07a48', '#3f2512', false);
  s += `<path d="M${f(x - w * 0.9)} 650 Q${f(x - w * 0.5)} 600 ${f(x - w * 0.3)} 560 L${f(x + w * 0.3)} 560 Q${f(x + w * 0.5)} 600 ${f(x + w * 0.95)} 652 Q${f(x)} 636 ${f(x - w * 0.9)} 650Z" fill="#5a3820"/>`;
  s += `<path d="M${f(x - w * 0.1)} 600 C${f(x - w * 0.12 + lean * 0.2)} 450 ${f(x - w * 0.05 + lean * 0.5)} 300 ${f(x + lean * 0.9)} 100" stroke="#ffe7b0" stroke-width="${f(w * 0.12)}" fill="none" opacity=".25" filter="url(#b3)"/>`;
  s += `<ellipse cx="${f(x + lean * 0.4 - 6)}" cy="380" rx="9" ry="14" fill="#2a170a" opacity=".55"/>`;
  // crown: dark, mid, and sun-lit clumps
  for (let i = 0; i < 60; i++) {
    const cx = x + (r() - 0.5) * 520;
    const cy = -20 + r() * 170;
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(30 + r() * 40)}" fill="${cols[0]}"/>`;
  }
  for (let i = 0; i < 50; i++) {
    const cx = x + (r() - 0.5) * 480;
    const cy = -30 + r() * 140;
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(20 + r() * 26)}" fill="${cols[1]}" opacity=".9"/>`;
  }
  for (let i = 0; i < 40; i++) {
    const cx = x + (r() - 0.5) * 440;
    const cy = -30 + r() * 120;
    s += `<circle cx="${f(cx - 6)}" cy="${f(cy - 6)}" r="${f(8 + r() * 14)}" fill="${cols[2]}" opacity="${(0.5 + r() * 0.4).toFixed(2)}"/>`;
  }
  return s;
}

function bush(x: number, y: number, s: number, cols: [string, string, string], seed: number, flowers?: string): string {
  const r = rng(seed);
  let b = `<ellipse cx="${f(x)}" cy="${f(y + 4)}" rx="${f(60 * s)}" ry="${f(10 * s)}" fill="#1a2a10" opacity=".25" filter="url(#b3)"/>`;
  for (let i = 0; i < 12; i++) b += `<circle cx="${f(x + (r() - 0.5) * 90 * s)}" cy="${f(y - 18 * s - r() * 34 * s)}" r="${f((16 + r() * 14) * s)}" fill="${cols[i < 5 ? 0 : 1]}"/>`;
  for (let i = 0; i < 7; i++) b += `<circle cx="${f(x - 10 * s + (r() - 0.5) * 70 * s)}" cy="${f(y - 40 * s - r() * 20 * s)}" r="${f((6 + r() * 8) * s)}" fill="${cols[2]}" opacity=".75"/>`;
  if (flowers) for (let i = 0; i < 8; i++) b += blossom(x + (r() - 0.5) * 80 * s, y - 20 * s - r() * 40 * s, 4.5 * s, flowers);
  return b;
}

function midLayer(id: TrackId): string {
  const L = LOOK[id];
  const r = rng(303 + id.length * 3);
  let s = '';
  if (id === 'forest') {
    [150, 820, 1330].forEach((x, i) => (s += at(x, (xx) => bigTree(xx, 70 + i, ['#2d6b3a', '#3f8a46', '#8fca62']))));
    for (let i = 0; i < 9; i++) {
      const x = r() * W;
      s += at(x, (xx) => bush(xx, 616, 1 + r() * 0.5, ['#2f7a3c', '#4a9a48', '#9ad06a'], 200 + i));
    }
    [300, 1100].forEach((x) => (s += at(x, (xx) => mushroom(xx, 612, 1.1, ['#ff6a55', '#c9302a'], `m${xx | 0}`))));
    return s;
  }
  if (id === 'meadow') {
    for (let i = 0; i < 4; i++) {
      const x = 200 + i * 400 + (r() - 0.5) * 120;
      s += at(x, (xx) => roundTree(xx, 615, 2.6 + r() * 0.6, ['#3f8a3a', '#62ad4a', '#a8d870'], 50 + i));
    }
    for (let i = 0; i < 10; i++) {
      const x = r() * W;
      s += at(x, (xx) => bush(xx, 618, 0.9 + r() * 0.4, ['#4a9a40', '#6cbc50', '#b6e27a'], 300 + i, ['#ff9ec8', '#ffffff', '#ffd23f', '#c9a0ff'][i % 4]));
    }
    // a little wooden fence along the field
    for (let x = 0; x < W; x += 64) s += `<rect x="${x + 20}" y="560" width="9" height="56" rx="2" fill="#a8774a" stroke="#6a4424" stroke-width="2"/>`;
    s += `<path d="M0 574 H${W} M0 596 H${W}" stroke="#b8865a" stroke-width="7"/><path d="M0 572 H${W} M0 594 H${W}" stroke="#d8a876" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) s += butterfly(r() * W, 380 + r() * 160, 0.7, (r() - 0.5) * 40, '#ffb3d9', '#c46aa8', `bf${i}`);
    return s;
  }
  if (id === 'snow') {
    [[110, 2.9], [300, 1.9], [420, 2.4], [980, 3.1], [1130, 2.0], [1250, 2.6], [1480, 1.8]].forEach(([x, k]) => {
      s += at(x, (xx) => pine(xx, 604, k, ['#1f5a4e', '#2f7a63', '#58a07a'], true, 6));
    });
    for (let i = 0; i < 8; i++) {
      const x = r() * W;
      s += at(x, (xx) => `<path d="${blob([pt(xx - 70, 620), pt(xx - 40, 590), pt(xx + 10, 582), pt(xx + 60, 596), pt(xx + 80, 622)], 0.8)}" fill="#ffffff"/><path d="M${f(xx - 40)} 600 q30 -12 70 -4" stroke="#c6d8ee" stroke-width="4" fill="none" opacity=".7"/>`);
    }
    return s;
  }
  if (id === 'canyon') {
    // tall red rock pillars and boulders
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 330 + (r() - 0.5) * 80;
      const h = 220 + r() * 140;
      const w = 90 + r() * 50;
      s += at(x, (xx) => {
        const d = blob([pt(xx - w * 0.5, 620), pt(xx - w * 0.42, 620 - h * 0.5), pt(xx - w * 0.3, 620 - h), pt(xx + w * 0.3, 620 - h - 10), pt(xx + w * 0.44, 620 - h * 0.5), pt(xx + w * 0.55, 620)], 0.6);
        const [pd, pg] = grad('#c4603e', 620 - h, 620, 0.3);
        let p = pd + `<path d="${d}" fill="${pg}" stroke="#7a2e1e" stroke-width="3"/>`;
        p += `<path d="M${f(xx + w * 0.1)} ${f(630 - h)} Q${f(xx + w * 0.5)} ${f(620 - h * 0.5)} ${f(xx + w * 0.55)} 620 L${f(xx + w * 0.15)} 620Z" fill="#7a2e1e" opacity=".22"/>`;
        for (let k = 1; k < 5; k++) p += `<path d="M${f(xx - w * 0.4)} ${f(620 - h + k * h * 0.2)} q${f(w * 0.4)} 6 ${f(w * 0.85)} 0" stroke="#e8885a" stroke-width="3" fill="none" opacity=".55"/>`;
        p += `<path d="M${f(xx - w * 0.3)} ${f(622 - h)} q${f(w * 0.3)} -8 ${f(w * 0.6)} -6" stroke="#ffb07a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
        return p;
      });
    }
    for (let i = 0; i < 7; i++) {
      const x = r() * W;
      s += at(x, (xx) => `<path d="${blob([pt(xx - 46, 620), pt(xx - 34, 588), pt(xx, 576), pt(xx + 36, 590), pt(xx + 48, 620)], 0.8)}" fill="#b85a3a" stroke="#7a2e1e" stroke-width="2.4"/><path d="M${f(xx - 26)} 590 q20 -10 40 -4" stroke="#f0a070" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    }
    // a little dragon cave
    s += `<path d="M1180 620 Q1180 520 1240 520 Q1300 520 1300 620Z" fill="#3a1424"/><path d="M1190 620 Q1192 534 1240 532" stroke="#ffb07a" stroke-width="4" fill="none" opacity=".6"/>`;
    return s;
  }
  // garden: clipped hedges, round topiary, lamp posts and a fountain
  s += band(() => 560, 640, '#3f8f48', ` stroke="#245a2c" stroke-width="3"`);
  for (let x = 0; x < W; x += 40) s += `<circle cx="${x + 20}" cy="560" r="22" fill="#4a9e52"/>`;
  for (let x = 0; x < W; x += 40) s += `<circle cx="${x + 14}" cy="552" r="8" fill="#8fd27a" opacity=".6"/>`;
  [200, 600, 1000, 1400].forEach((x, i) => {
    s += `<rect x="${x - 6}" y="470" width="12" height="150" fill="#6a4a2a"/><circle cx="${x}" cy="440" r="58" fill="#3f8f48" stroke="#245a2c" stroke-width="3"/><circle cx="${x - 16}" cy="420" r="22" fill="#8fd27a" opacity=".6"/>`;
    if (i % 2) s += `<rect x="${x - 40}" y="586" width="80" height="34" rx="6" fill="#e9dcc6" stroke="#8a7458" stroke-width="2.4"/>`;
    for (let k = 0; k < 6; k++) s += blossom(x - 40 + k * 16, 404 + (k % 2) * 30, 6, ['#ff9ec8', '#ffd23f', '#ffffff'][k % 3]);
  });
  [400, 1200].forEach((x) => {
    s += `<path d="M${x - 4} 620 V470 h8 V620Z" fill="#3a3a5a"/><path d="M${x - 14} 470 h28 l-6 -30 h-16Z" fill="#ffe8a0" stroke="#3a3a5a" stroke-width="3"/><circle cx="${x}" cy="455" r="30" fill="#fff2b0" opacity=".35" filter="url(#b8)"/>`;
  });
  // the fountain
  const fx = 800;
  s += `<ellipse cx="${fx}" cy="608" rx="110" ry="20" fill="#d9cdb6" stroke="#8a7458" stroke-width="3"/><ellipse cx="${fx}" cy="602" rx="96" ry="13" fill="#8fd0f0"/>`;
  s += `<rect x="${fx - 10}" y="520" width="20" height="84" fill="#e9dcc6" stroke="#8a7458" stroke-width="2.4"/><ellipse cx="${fx}" cy="524" rx="44" ry="10" fill="#e9dcc6" stroke="#8a7458" stroke-width="2.4"/>`;
  s += `<path d="M${fx} 500 q-30 -10 -40 28 M${fx} 500 q30 -10 40 28 M${fx} 500 v-30" stroke="#bfe8fa" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${fx}" cy="470" r="7" fill="#e6f8ff"/>`;
  void L;
  return s;
}

// ---------------------------------------------------------------- ground and front

function groundLayer(id: TrackId): string {
  const L = LOOK[id];
  const r = rng(505 + id.length);
  const top = periodic(61, TRACK_TOP, [6, 4]);
  let s = `<defs>${linG('dirt', [[0, L.dirt[0]], [0.35, L.dirt[1]], [1, L.dirt[2]]])}${linG('verge', [[0, L.verge[2]], [1, L.verge[0]]])}</defs>`;
  // grass verge behind the track, then the track itself
  s += band((x) => top(x) - 26, 900, 'url(#verge)');
  s += band(top, 900, id === 'garden' ? L.dirt[1] : 'url(#dirt)');
  if (id === 'garden') {
    // paving stones in rows
    for (let row = 0; row < 9; row++) {
      const y = TRACK_TOP + 16 + row * 34;
      const h = 30;
      const off = row % 2 ? 0 : 40;
      for (let x = -80 + off; x < W + 80; x += 80) s += `<rect x="${x + 3}" y="${y}" width="74" height="${h}" rx="8" fill="${shade(L.dirt[0], -(row * 0.02))}" stroke="${L.dirt[2]}" stroke-width="2.4"/>`;
    }
  }
  // the three lanes: worn hoof tracks a little lighter, with soft borders between them
  LANE_Y.forEach((y, i) => {
    const k = LANE_SCALE[i];
    s += `<path d="${band(periodic(70 + i, y - 30 * k, [3]), y + 18 * k, L.dirt[0]).match(/d="([^"]*)"/)![1]}" fill="${L.dirt[0]}" opacity="${id === 'snow' ? 0.5 : 0.35}"/>`;
    if (i < 2) {
      const yb = (y + LANE_Y[i + 1]) / 2 + 6;
      s += `<path d="M0 ${yb} H${W}" stroke="${L.dirt[2]}" stroke-width="3" stroke-dasharray="28 22" opacity=".35" stroke-linecap="round"/>`;
    }
  });
  // pebbles, hoof prints and tufts
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    const y = TRACK_TOP + 20 + r() * 270;
    const rr = 2 + r() * 5;
    s += at(x, (xx) => `<path d="${ellipse(pt(xx, y), rr * 1.4, rr)}" fill="${shade(L.dirt[1], -0.18)}" opacity=".6"/><path d="${ellipse(pt(xx - rr * 0.3, y - rr * 0.3), rr * 0.6, rr * 0.4)}" fill="#fff" opacity=".3"/>`);
  }
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    const y = LANE_Y[i % 3] - 6 + r() * 10;
    s += at(x, (xx) => `<path d="M${f(xx - 5)} ${f(y)} a5 3.4 0 1 0 10 0" stroke="${L.dirt[2]}" stroke-width="2" fill="none" opacity=".3"/>`);
  }
  // the verge's grass edge and its flowers
  s += grass(0, W, TRACK_TOP + 4, 420, 26, 9, L.verge[0], L.verge[2]);
  const flowerCols = id === 'snow' ? ['#c6e0ff', '#ffffff'] : id === 'canyon' ? ['#ffd23f', '#ff8a5a'] : ['#ff9ec8', '#ffffff', '#ffd23f', '#c9a0ff'];
  for (let i = 0; i < 46; i++) {
    const x = r() * W;
    s += at(x, (xx) => blossom(xx, top(xx) - 8 - r() * 14, 4 + r() * 3, flowerCols[i % flowerCols.length]));
  }
  if (id === 'snow') {
    // soft blue shadows in the snow, sled tracks and glitter
    for (let i = 0; i < 30; i++) {
      const x = r() * W;
      const y = TRACK_TOP + 30 + r() * 250;
      s += `<path d="${ellipse(pt(x, y), 60 + r() * 90, 6 + r() * 6)}" fill="#9fb6dc" opacity="${(0.12 + r() * 0.15).toFixed(2)}" filter="url(#b3)"/>`;
    }
    LANE_Y.forEach((y) => (s += `<path d="M0 ${y + 4} H${W} M0 ${y + 14} H${W}" stroke="#a8bce0" stroke-width="2.4" opacity=".45"/>`));
    for (let i = 0; i < 160; i++) s += `<circle cx="${f(r() * W)}" cy="${f(TRACK_TOP + 10 + r() * 280)}" r="${f(1 + r() * 2)}" fill="${i % 3 ? '#ffffff' : '#d8f0ff'}" opacity=".9"/>`;
  }
  return s;
}

function frontLayer(id: TrackId): string {
  const L = LOOK[id];
  const r = rng(707 + id.length);
  let s = '';
  // clumps of plants at the bottom edge, with gaps so the near lane stays visible
  const clumps = [120, 560, 980, 1420];
  clumps.forEach((x, i) => {
    s += at(x, (xx) => {
      let c = '';
      if (id === 'snow') {
        c += `<path d="${blob([pt(xx - 170, 910), pt(xx - 120, 862), pt(xx - 30, 846), pt(xx + 60, 856), pt(xx + 150, 880), pt(xx + 180, 910)], 0.8)}" fill="#ffffff" stroke="#c6d8ee" stroke-width="3"/>`;
        c += pine(xx + 80, 900, 1.4, ['#1f5a4e', '#2f7a63', '#58a07a'], true, 3);
        return c;
      }
      if (id === 'canyon') {
        c += `<path d="${blob([pt(xx - 150, 910), pt(xx - 110, 852), pt(xx - 20, 838), pt(xx + 70, 852), pt(xx + 130, 910)], 0.7)}" fill="#a84a2e" stroke="#6a2416" stroke-width="3"/>`;
        c += `<path d="M${f(xx - 90)} 860 q40 -14 90 -10" stroke="#e8885a" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        // a little cactus with a flower
        c += `<path d="M${f(xx + 90)} 910 V820 a12 12 0 0 1 24 0 V910Z M${f(xx + 90)} 860 h-14 v-24 a7 7 0 0 1 14 0Z" fill="#5a9a52" stroke="#2a5a2a" stroke-width="3"/>${blossom(xx + 102, 812, 6, '#ff7aa8')}`;
        return c;
      }
      c += fern(xx - 40, 912, 1.6, i + 3, shade(L.verge[0], -0.25), L.verge[1]);
      c += fern(xx + 50, 916, 1.3, i + 9, shade(L.verge[0], -0.2), L.verge[2]);
      for (let k = 0; k < 6; k++) c += blossom(xx - 80 + k * 32 + (r() - 0.5) * 10, 870 - (k % 2) * 22, 7, ['#ff7aa8', '#c9a0ff', '#ffd23f', '#ffffff'][(i + k) % 4]);
      return c;
    });
  });
  return s;
}

// ---------------------------------------------------------------- assembly

const SOFTEN = `<filter id="soften" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".6"/></filter>`;

export function trackLayer(id: TrackId, layer: Layer): string {
  if (layer === 'sky') return `<defs>${FX}${SOFTEN}</defs>${sky(id)}`;
  const body = layer === 'far' ? farLayer(id) : layer === 'mid' ? midLayer(id) : layer === 'ground' ? groundLayer(id) : frontLayer(id);
  return `<defs>${FX}${SOFTEN}<g id="tile">${body}</g></defs><use href="#tile" x="${-W}"/><use href="#tile"/><use href="#tile" x="${W}"/>`;
}

