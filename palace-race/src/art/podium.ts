// The picture at the end of every race: in the palace garden, the winner stands on the top step holding a big
// golden cup, and every other child stands on a step or beside the podium, clapping with a medal on, while the
// animals stand behind them looking happy. Children left of the winner face right and those on the right are
// mirrored, so everyone turns toward the winner. 1600 x 900, painted once.

import { drawAnimal, type AnimalId } from './animals';
import { drawKid, HIP_H, type KidId, type Outfit } from './riders';
import { saddle } from './runner';
import { f, linG, pt, radG, shade, type P } from './geom';
import { rng } from './paint';
import { trackLayer } from './tracks';

export interface Racer { animal: AnimalId; kid: KidId; outfit: Outfit }

const STEP = [
  { x: 800, top: 600, w: 230, label: '1', col: '#ffcf3a' },
  { x: 560, top: 660, w: 220, label: '2', col: '#d8dce8' },
  { x: 1040, top: 690, w: 220, label: '3', col: '#e8a26a' },
];
const FLOOR = 790;

/** The golden cup, its foot at `c`. */
export function trophy(c: P, s: number): string {
  const g = `tg${Math.round(c.x)}${Math.round(c.y)}`;
  const handle = (m: number) => `<path d="M${30 * m} -70 C${50 * m} -64 ${52 * m} -34 ${24 * m} -30" fill="none" stroke="#8a4a10" stroke-width="11"/><path d="M${30 * m} -70 C${50 * m} -64 ${52 * m} -34 ${24 * m} -30" fill="none" stroke="#ffd23f" stroke-width="6"/>`;
  return `<g transform="translate(${f(c.x)} ${f(c.y)}) scale(${f(s)})"><defs>${linG(g, [[0, '#fff3b8'], [0.3, '#ffd23f'], [0.7, '#f4a21c'], [1, '#c8700e']], 0, 0, 1, 0)}</defs>` +
    handle(-1) + handle(1) +
    `<path d="M-34 -76 H34 C34 -40 18 -22 6 -18 V-2 H-6 V-18 C-18 -22 -34 -40 -34 -76Z" fill="url(#${g})" stroke="#8a4a10" stroke-width="3"/>` +
    `<ellipse cx="0" cy="-76" rx="34" ry="6" fill="#c8700e" stroke="#8a4a10" stroke-width="3"/>` +
    `<path d="M-22 -2 H22 V14 H-22Z" fill="#b07a48" stroke="#5a3418" stroke-width="3"/><path d="M-14 4 H14" stroke="#ffd23f" stroke-width="3"/>` +
    `<path d="M-20 -68 C-22 -50 -14 -36 -6 -30" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>` +
    `<path d="M0 -66 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10Z" fill="#fff8c8" stroke="#c8700e" stroke-width="1.4"/></g>`;
}

function medal(c: P, s: number, col: string, n: number): string {
  return `<path d="M${f(c.x - 8 * s)} ${f(c.y - 24 * s)} L${f(c.x)} ${f(c.y)} L${f(c.x + 8 * s)} ${f(c.y - 24 * s)}" fill="none" stroke="#4dabf7" stroke-width="${f(5 * s)}"/>` +
    `<circle cx="${f(c.x)}" cy="${f(c.y + 6 * s)}" r="${f(9 * s)}" fill="${col}" stroke="#4a2a1e" stroke-width="${f(2 * s)}"/>` +
    `<text x="${f(c.x)}" y="${f(c.y + 10 * s)}" font-size="${f(11 * s)}" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#4a2a1e">${n}</text>`;
}

function confetti(seed: number): string {
  const r = rng(seed);
  const cols = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#ff8fc8'];
  let s = '';
  for (let i = 0; i < 170; i++) {
    const x = r() * 1600;
    const y = r() * 560;
    const c = cols[i % cols.length];
    if (i % 3 === 0) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4 + r() * 4)}" fill="${c}"/>`;
    else s += `<rect x="${f(x)}" y="${f(y)}" width="${f(8 + r() * 6)}" height="${f(4 + r() * 3)}" fill="${c}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`;
  }
  // streamers
  for (let i = 0; i < 6; i++) {
    const x = 100 + i * 280 + r() * 60;
    s += `<path d="M${f(x)} -10 q30 60 -10 120 q-40 60 10 120" fill="none" stroke="${cols[(i * 2) % cols.length]}" stroke-width="6" stroke-linecap="round" opacity=".85"/>`;
  }
  return s;
}

/** Places `order[0]` is the winner. The animals stand behind their children. */
export function podiumSVG(order: Racer[]): string {
  let s = trackLayer('garden', 'sky');
  // a lawn and a hedge around the stage
  s += `<path d="M0 700 Q800 640 1600 700 V900 H0Z" fill="#5fae5a"/><path d="M0 760 Q800 720 1600 760 V900 H0Z" fill="#4a9e52"/>`;
  s += `<defs>${radG('spot', [[0, '#fffbe0', 0.85], [1, '#fffbe0', 0]])}</defs><ellipse cx="800" cy="660" rx="520" ry="170" fill="url(#spot)"/>`;
  // where each place stands: 1-3 on steps, 4 and 5 on the lawn at the sides
  const spots = [
    { x: STEP[0].x, y: STEP[0].top, face: 1 },
    { x: STEP[1].x, y: STEP[1].top, face: 1 },
    { x: STEP[2].x, y: STEP[2].top, face: -1 },
    { x: 260, y: FLOOR, face: 1 },
    { x: 1340, y: FLOOR, face: -1 },
  ];
  // animals first (behind), the winner's last so it is in front of the others
  const animalAt = [
    { x: 712, y: 604, s: 0.8 },
    { x: 470, y: 620, s: 0.58 },
    { x: 1130, y: 640, s: 0.58 },
    { x: 150, y: 740, s: 0.62 },
    { x: 1450, y: 740, s: 0.62 },
  ];
  [3, 4, 1, 2, 0].forEach((i) => {
    const rc = order[i];
    if (!rc) return;
    const a = drawAnimal(rc.animal, 'happy');
    const sd = saddle(rc.outfit.saddle, a.anchors.seat, a.anchors.seatAngle);
    const at = animalAt[i];
    const face = spots[i].face;
    s += `<g transform="translate(${at.x} ${at.y}) scale(${f(at.s * face)} ${f(at.s)})">${a.svg}${sd.under}</g>`;
  });
  // the podium steps
  STEP.forEach((st) => {
    const g = `st${st.label}`;
    s += `<defs>${linG(g, [[0, shade(st.col, 0.3)], [1, shade(st.col, -0.2)]])}</defs>`;
    s += `<path d="M${st.x - st.w / 2} ${FLOOR + 20} V${st.top + 8} Q${st.x - st.w / 2} ${st.top} ${st.x - st.w / 2 + 10} ${st.top} H${st.x + st.w / 2 - 10} Q${st.x + st.w / 2} ${st.top} ${st.x + st.w / 2} ${st.top + 8} V${FLOOR + 20}Z" fill="url(#${g})" stroke="#4a2a5c" stroke-width="4"/>`;
    s += `<path d="M${st.x - st.w / 2 + 8} ${st.top + 10} H${st.x + st.w / 2 - 8}" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>`;
    s += `<circle cx="${st.x}" cy="${(st.top + FLOOR) / 2 + 18}" r="38" fill="#fff" stroke="#4a2a5c" stroke-width="4"/><text x="${st.x}" y="${(st.top + FLOOR) / 2 + 36}" font-size="52" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#4a2a5c">${st.label}</text>`;
  });
  // the children
  const K = 1.85;
  order.forEach((rc, i) => {
    const sp = spots[i];
    const pose = i === 0 ? 'trophy' : i % 2 ? 'clap0' : 'clap1';
    const k = drawKid(rc.kid, pose, rc.outfit, pt(0, -HIP_H));
    let body = `<ellipse cx="0" cy="2" rx="34" ry="7" fill="#2a3a10" opacity=".25"/>` + k.back + k.front;
    if (i === 0) {
      // the cup is held in front of the tummy, below the face
      const mid = pt((k.hands[0].x + k.hands[1].x) / 2 + 4, Math.max(k.hands[0].y, k.hands[1].y) + 10);
      body += trophy(mid, 0.4);
      // little stars of joy around the winner
      body += [[-40, -170], [44, -180], [-52, -120], [56, -110]].map(([x, y]) => `<path d="M${x} ${y - 8} L${x + 2.4} ${y - 2.4} L${x + 8} ${y} L${x + 2.4} ${y + 2.4} L${x} ${y + 8} L${x - 2.4} ${y + 2.4} L${x - 8} ${y} L${x - 2.4} ${y - 2.4}Z" fill="#ffe066" stroke="#c8700e" stroke-width="1.2"/>`).join('');
    }
    s += `<g transform="translate(${sp.x} ${sp.y}) scale(${f(K * sp.face)} ${K})">${body}</g>`;
    // medals for 2nd and 3rd only (4th and 5th just clap); drawn outside the mirrored group, so their numbers read
    // the right way round
    if (i === 1 || i === 2) s += medal(pt(sp.x + k.chest.x * K * sp.face, sp.y + k.chest.y * K), K, ['#ffcf3a', '#d8dce8', '#e8a26a', '#8fd0f0', '#c9a0ff'][i], i + 1);
  });
  s += confetti(17);
  // a soft frame
  s += `<defs>${radG('vg', [[0.6, '#3a1a4a', 0], [1, '#3a1a4a', 0.28]], 0.5, 0.5, 0.75)}</defs><rect width="1600" height="900" fill="url(#vg)"/>`;
  return s;
}
