// The finished bracelet worn on a wrist, for the album picture. The arm is painted once (forearm in a linen
// sleeve, the back of a hand with polished nails); the bracelet is drawn as a ring round the wrist, with the far
// half of the ring behind the arm and the near half over it, so it really wraps.
//
// Local coordinates: the wrist centre is (0, 0), the forearm runs along -x, the hand along +x, y points down.
// WRIST_T places that drawing in the 400 x 700 album picture.

import type { Bead } from '../content';
import { beadInner } from './beads';
import { FX, f1, lg, rg } from './paint';

export const WRIST_T = 'translate(152 516) rotate(-22) scale(1.95)';

// the ring the bracelet makes round the wrist (a little loose, so it shows above and below the arm)
const RING = { cx: -20, cy: 0, rx: 36, ry: 50, tilt: 10 };
const SIZE = 18; // bead size in local units

const FINGERS: { y: number; len: number; w: number; a: number }[] = [
  { y: -27, len: 66, w: 17, a: -8 },
  { y: -9, len: 75, w: 17, a: -2.5 },
  { y: 9, len: 69, w: 16, a: 4 },
  { y: 26, len: 53, w: 14, a: 11 },
];

const nail = (len: number, w: number) =>
  `<ellipse cx="${f1(len - 9)}" cy="0" rx="7.2" ry="${f1(w * 0.36)}" fill="url(#nail)"/><ellipse cx="${f1(len - 11.5)}" cy="${f1(-w * 0.12)}" rx="3" ry="${f1(w * 0.12)}" fill="#fff" opacity=".7"/>`;

function finger(f: { y: number; len: number; w: number; a: number }): string {
  return (
    `<g transform="translate(90 ${f.y}) rotate(${f.a})"><rect x="-4" y="${f1(-f.w / 2)}" width="${f.len + 4}" height="${f.w}" rx="${f1(f.w / 2)}" fill="url(#skin)"/>` +
    `<path d="M${f1(f.len * 0.36)} ${f1(-f.w / 2 + 2.5)} q-2 ${f1(f.w / 2 - 2.5)} 0 ${f1(f.w - 5)}" stroke="#b9714f" stroke-width="1" fill="none" opacity=".4"/><path d="M${f1(f.len * 0.68)} ${f1(-f.w / 2 + 3)} q-1.6 ${f1(f.w / 2 - 3)} 0 ${f1(f.w - 6)}" stroke="#b9714f" stroke-width="1" fill="none" opacity=".3"/>` +
    `<rect x="2" y="${f1(-f.w / 2 + 2)}" width="${f.len - 12}" height="${f1(f.w * 0.2)}" rx="${f1(f.w * 0.1)}" fill="#fff" opacity=".22"/>` +
    nail(f.len, f.w) + `</g>`
  );
}

/** The forearm, sleeve and hand as an svg fragment in local coordinates. */
export function wristArt(): string {
  const forearm = 'M-136 -47 C-86 -45 -42 -35 4 -32.5 L4 32.5 C-42 35 -86 47 -136 50Z';
  return (
    `<defs>${FX}` +
    lg('skin', [[0, '#fcdcc6'], [0.42, '#f3bf9f'], [1, '#d68c6c']]) +
    lg('nail', [[0, '#ff9ec0'], [1, '#f2628f']]) +
    lg('sleeve', [[0, '#faf4e6'], [0.55, '#eadfc8'], [1, '#cdbf9f']]) +
    lg('cuff', [[0, '#fffaf0'], [1, '#d8cbb0']]) +
    lg('cuffShadow', [[0, '#5a2e1c', 0.5], [1, '#5a2e1c', 0]], 0, 0, 1, 0, true).replace('x1="0" y1="0" x2="1" y2="0"', 'x1="-128" y1="0" x2="-96" y2="0"') +
    rg('hi', [[0, '#fff', 0.35], [1, '#fff', 0]]) +
    `</defs>` +
    // soft shadow of the arm on the scene far below
    `<ellipse cx="-60" cy="64" rx="150" ry="20" fill="#1c1006" opacity=".2" filter="url(#b8)"/><ellipse cx="100" cy="64" rx="80" ry="18" fill="#1c1006" opacity=".18" filter="url(#b8)"/>` +
    // forearm
    `<path d="${forearm}" fill="url(#skin)"/><path d="${forearm}" fill="url(#cuffShadow)"/>` +
    `<ellipse cx="-4" cy="25" rx="9" ry="5.4" fill="#c27c5c" opacity=".35"/><ellipse cx="-6" cy="23" rx="6" ry="3" fill="#fff" opacity=".4"/>` +
    // thumb and the mound under it, behind the back of the hand
    `<g transform="translate(20 -30) rotate(-50)"><rect x="-4" y="-10" width="64" height="20" rx="10" fill="url(#skin)"/>${nail(64, 20)}<path d="M26 -7 q-2 7 0 14" stroke="#b9714f" stroke-width="1" fill="none" opacity=".4"/></g>` +
    `<ellipse cx="36" cy="-30" rx="30" ry="15" fill="url(#skin)" transform="rotate(-16 36 -30)"/>` +
    // the back of the hand, then the fingers
    `<path d="M-3 -33 C28 -39 56 -41 85 -38 C94 -37 98 -30 98 -20 L98 24 C98 33 94 39 85 40 C56 41 28 37 -3 33Z" fill="url(#skin)"/>` +
    FINGERS.map(finger).join('') +
    // tendons, knuckles and light on the back of the hand
    [[-13, -22], [0, -4], [13, 14]].map(([y0, y1]) => `<path d="M8 ${y0} C36 ${y0 - 2} 60 ${Number(y1) - 2} 88 ${y1}" stroke="#fff" stroke-width="3.4" fill="none" opacity=".16" stroke-linecap="round"/><path d="M8 ${Number(y0) + 3} C36 ${Number(y0) + 1} 60 ${Number(y1) + 1} 88 ${Number(y1) + 3}" stroke="#b8714f" stroke-width="1.4" fill="none" opacity=".18" stroke-linecap="round"/>`).join('') +
    [-27, -9, 9, 26].map((y) => `<circle cx="90" cy="${y}" r="4.6" fill="#fff" opacity=".2"/>`).join('') +
    `<ellipse cx="52" cy="-14" rx="40" ry="13" fill="url(#hi)"/>` +
    // the sleeve and its cuff, over the start of the forearm
    `<path d="M-128 -52 C-160 -56 -240 -66 -350 -86 L-350 96 C-240 78 -160 60 -128 56Z" fill="url(#sleeve)"/>` +
    [[-70, -150, 30], [-30, -200, 24], [10, -150, 22], [44, -230, 18]].map(([y, x, l]) => `<path d="M${x} ${y} q${-Number(l)} 6 ${-Number(l) * 2.4} 2" stroke="#9c8c6a" stroke-width="2" fill="none" opacity=".32" stroke-linecap="round"/><path d="M${Number(x) + 2} ${Number(y) + 5} q${-Number(l)} 6 ${-Number(l) * 2.4} 2" stroke="#fff" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/>`).join('') +
    `<path d="M-158 -57 L-128 -52 L-128 56 L-158 61Z" fill="url(#cuff)"/><path d="M-143 -55 L-143 59" stroke="#b6a684" stroke-width="1.4" stroke-dasharray="4 3.4" opacity=".8"/><path d="M-128 -52 L-128 56" stroke="#a89877" stroke-width="2" opacity=".55"/>` +
    `<path d="M-158 -57 L-128 -52" stroke="#fff" stroke-width="2" opacity=".7"/>`
  );
}

interface Placed { x: number; y: number; ang: number; front: boolean }

/** Positions of the 12 beads round the ring, evenly spaced along it, centred on the near side of the wrist. */
function place(n: number): Placed[] {
  const from = -110;
  const to = 110;
  const N = 300;
  const rot = (RING.tilt * Math.PI) / 180;
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const x = RING.rx * Math.cos(a);
    const y = RING.ry * Math.sin(a);
    return { a, x: RING.cx + x * Math.cos(rot) - y * Math.sin(rot), y: RING.cy + x * Math.sin(rot) + y * Math.cos(rot), deg };
  };
  const pts = Array.from({ length: N + 1 }, (_, i) => pt(from + ((to - from) * i) / N));
  const len = [0];
  for (let i = 1; i <= N; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return Array.from({ length: n }, (_, k) => {
    const target = (len[N] * k) / (n - 1);
    let i = 1;
    while (i < N && len[i] < target) i++;
    const p = pts[i];
    const q = pts[Math.min(N, i + 1)];
    const o = pts[Math.max(0, i - 1)];
    return { x: p.x, y: p.y, ang: (Math.atan2(q.y - o.y, q.x - o.x) * 180) / Math.PI, front: Math.cos(p.a) > -0.05 };
  });
}

/** The cord of the bracelet: the near half over the arm, the far half behind it. */
function cord(front: boolean): string {
  const rot = RING.tilt;
  const d = front
    ? `M0 ${-RING.ry} A${RING.rx} ${RING.ry} 0 0 1 0 ${RING.ry}`
    : `M0 ${RING.ry} A${RING.rx} ${RING.ry} 0 0 1 0 ${-RING.ry}`;
  return `<g transform="translate(${RING.cx} ${RING.cy}) rotate(${rot})"><path d="${d}" stroke="#2a1608" stroke-opacity="${front ? 0.3 : 0.2}" stroke-width="7" fill="none" transform="translate(2 4)" filter="url(#b3)"/><path d="${d}" stroke="#a8743c" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f0c98c" stroke-width="1.2" fill="none" stroke-dasharray="2 2.4" opacity=".8"/></g>`;
}

/** The bracelet as two layers: `back` goes behind the arm and `front` over it. Both are in local coordinates. */
export function wristBeads(beads: (Bead | null)[]): { back: string; front: string } {
  const spots = place(beads.length);
  let back = cord(false);
  let front = cord(true);
  beads.forEach((b, i) => {
    if (!b) return;
    const p = spots[i];
    const k = SIZE / 100;
    const g = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(p.ang)}) scale(${k.toFixed(3)}) translate(-50 -50)">${beadInner(b.shape, b.design, false, 'side')}</g>`;
    // a soft shadow on the skin under each near bead
    if (p.front) front += `<ellipse cx="${f1(p.x + 2)}" cy="${f1(p.y + 4)}" rx="${f1(SIZE * 0.55)}" ry="${f1(SIZE * 0.4)}" fill="#5a2e1c" opacity=".28" filter="url(#b2)"/>` + g;
    else back += g;
  });
  return { back, front };
}

/** A whole-picture svg (400 x 700 units) holding some local-coordinate artwork on the wrist. */
export const wristLayerSVG = (inner: string, scale = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" width="${400 * scale}" height="${700 * scale}"><defs>${FX}</defs><g transform="${WRIST_T}">${inner}</g></svg>`;

export const wristArmSVG = (scale = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" width="${400 * scale}" height="${700 * scale}"><g transform="${WRIST_T}">${wristArt()}</g></svg>`;
