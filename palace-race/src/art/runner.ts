// A runner is one animal, its saddle and its child, composed from anchors: the saddle sits on the animal's `seat`
// at the slope of its back, the child's hip sits on the saddle, the stirrup hangs to the child's foot and the reins
// run from the child's hands to the animal's `rein` point.

import { drawAnimal, type AnimalId, type PoseId } from './animals';
import { drawKid, flower, KID, KID_INK, RAINBOW, star, type KidId, type Outfit, type RiderPose, type SaddleId } from './riders';
import { add, blob, curve, f, inked, linG, pt, rot, shade, type P } from './geom';

let uidN = 0;

/** How much larger a child is drawn on an animal than standing. */
export const RIDER_SCALE = 1.35;

/** Which rider pose goes with an animal pose. */
export function riderPoseFor(p: PoseId): RiderPose {
  if (p.startsWith('run')) return (['ride0', 'ride1', 'ride2'] as const)[Number(p.slice(3)) % 3];
  if (p === 'jump' || p === 'duck' || p === 'bump') return p;
  if (p === 'happy') return 'wave';
  return 'ride0';
}

const SADDLE_LOOK: Record<SaddleId, { cloth: string; trim: string; leather: string; deco: 'none' | 'tassels' | 'flowers' | 'stars' | 'rainbow' }> = {
  basic: { cloth: '#3fa7a0', trim: '#f5f0e0', leather: '#8a5230', deco: 'none' },
  royal: { cloth: '#c8283e', trim: '#ffcf3a', leather: '#6e2a1c', deco: 'tassels' },
  flowers: { cloth: '#ff9ec8', trim: '#ffffff', leather: '#c98a5a', deco: 'flowers' },
  stars: { cloth: '#2f4fb0', trim: '#ffe066', leather: '#5a4a8a', deco: 'stars' },
  rainbow: { cloth: '#ffffff', trim: '#b197fc', leather: '#8a5230', deco: 'rainbow' },
};

export function saddle(id: SaddleId, seat: P, tilt: number): { under: string; over: string; hip: P } {
  const look = SADDLE_LOOK[id];
  const uid = `s${(uidN++).toString(36)}`;
  const S = (x: number, y: number) => rot(add(seat, pt(x, y)), seat, -tilt);
  const defs: string[] = [];
  // the saddle cloth hangs over the animal's side
  const cloth = [S(-34, -6), S(32, -8), S(36, 10), S(30, 34), S(4, 40), S(-26, 36), S(-38, 14)];
  const g = `${uid}c`;
  defs.push(linG(g, [[0, shade(look.cloth, 0.2)], [1, shade(look.cloth, -0.2)]], 0, 0, 0, 1));
  let under = inked([{ d: blob(cloth, 0.7), fill: `url(#${g})` }], KID_INK, 2);
  const clip = `${uid}k`;
  defs.push(`<clipPath id="${clip}"><path d="${blob(cloth, 0.7)}"/></clipPath>`);
  let deco = '';
  if (look.deco === 'rainbow') {
    RAINBOW.forEach((col, i) => (deco += `<path d="${blob([S(-40, 2 + i * 6.4), S(40, 2 + i * 6.4), S(40, 8.4 + i * 6.4), S(-40, 8.4 + i * 6.4)], 0.2)}" fill="${col}"/>`));
  } else if (look.deco === 'stars') {
    [[-20, 12, 5], [0, 26, 6], [20, 12, 5], [-8, 6, 3], [14, 30, 3.4], [-24, 28, 3.4]].forEach(([x, y, r]) => (deco += star(S(x, y), r, '#ffe066')));
  } else if (look.deco === 'flowers') {
    [[-20, 16, '#fff'], [2, 28, '#ffe066'], [20, 14, '#fff'], [-6, 8, '#c9a0ff']].forEach(([x, y, c]) => (deco += flower(S(x as number, y as number), 6, c as string)));
  } else if (look.deco === 'tassels') {
    deco += `<path d="${curve([S(-30, 18), S(0, 26), S(30, 16)])}" stroke="${look.trim}" stroke-width="2" fill="none" stroke-dasharray="2 4"/>`;
  }
  // a trim band along the edge
  under += `<g clip-path="url(#${clip})">${deco}<path d="${blob(cloth, 0.7)}" fill="none" stroke="${look.trim}" stroke-width="7"/></g>`;
  if (look.deco === 'tassels') {
    [S(-26, 36), S(4, 40), S(30, 34)].forEach((q) => (under += `<path d="M${f(q.x)} ${f(q.y)} l-4 12 h8Z" fill="${look.trim}" stroke="${KID_INK}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="${f(q.x)}" cy="${f(q.y)}" r="3" fill="${look.trim}" stroke="${KID_INK}" stroke-width="1.2"/>`));
  }
  // the leather saddle: a dished seat with a cantle behind and a pommel in front
  const lg = `${uid}l`;
  defs.push(linG(lg, [[0, shade(look.leather, 0.35)], [1, shade(look.leather, -0.15)]], 0, 0, 0, 1));
  const seatShape = [S(-30, -4), S(-30, -16), S(-22, -14), S(-10, -8), S(10, -8), S(20, -14), S(26, -18), S(30, -10), S(24, 2), S(10, 8), S(-12, 8), S(-26, 4)];
  under += inked([{ d: blob(seatShape, 0.7), fill: `url(#${lg})` }, { d: blob([S(-18, 4), S(6, 6), S(10, 22), S(-14, 22)], 0.6), fill: shade(look.leather, -0.08) }], KID_INK, 2);
  under += `<path d="${curve([S(-24, -8), S(0, -2), S(22, -10)])}" stroke="${shade(look.leather, 0.5)}" stroke-width="2" fill="none" opacity=".7"/>`;
  if (look.deco !== 'none') [S(-24, -2), S(22, -6)].forEach((q) => (under += `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="2.6" fill="#ffcf3a" stroke="${KID_INK}" stroke-width="1"/>`));
  return { under: `<defs>${defs.join('')}</defs>${under}`, over: '', hip: S(-2, -10) };
}

export interface RunnerArt { svg: string; top: number; nose: number; head: P }

export function drawRunner(animal: AnimalId, kid: KidId, pose: PoseId, outfit: Outfit, rider?: RiderPose): RunnerArt {
  const a = drawAnimal(animal, pose);
  const { seat, seatAngle, rein } = a.anchors;
  const sd = saddle(outfit.saddle, seat, seatAngle);
  const rp = rider ?? riderPoseFor(pose);
  // the children are drawn a little larger when riding, so they read well next to the big animals
  const K = RIDER_SCALE;
  const hip = sd.hip;
  const k = drawKid(kid, rp, outfit, hip, seatAngle);
  const big = (q: P) => pt(hip.x + (q.x - hip.x) * K, hip.y + (q.y - hip.y) * K);
  const grow = (svg: string) => `<g transform="translate(${f(hip.x)} ${f(hip.y)}) scale(${K}) translate(${f(-hip.x)} ${f(-hip.y)})">${svg}</g>`;
  const foot = big(k.feet[0]);
  const hands = k.hands.map(big);
  // stirrup leather from the saddle to the foot, and the iron under the boot
  const top = rot(add(seat, pt(2, 2)), seat, -seatAngle);
  const stirrup = `<path d="M${f(top.x)} ${f(top.y)} L${f(foot.x)} ${f(foot.y + 4)}" stroke="#5a3420" stroke-width="3.4"/>` +
    `<path d="M${f(foot.x - 8)} ${f(foot.y + 13)} h18" stroke="#c9c2b8" stroke-width="3.6" stroke-linecap="round"/>`;
  // reins: from both hands to the mouth, sagging a little
  const reins = hands.map((h) => {
    const mid = { x: (h.x + rein.x) / 2, y: Math.max(h.y, rein.y) + 10 };
    return `<path d="${curve([h, mid, rein])}" stroke="${shade(KID[kid].boots, -0.1)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  });
  const holding = rp.startsWith('ride') || rp === 'jump' || rp === 'duck';
  const svg = a.svg + grow(k.back) + sd.under + stirrup + grow(k.front) + (holding ? reins.join('') : '') + `<circle cx="${f(rein.x)}" cy="${f(rein.y)}" r="3" fill="none" stroke="#d8c8a0" stroke-width="2"/>`;
  const head = big(k.head);
  return { svg, top: Math.min(a.anchors.top, head.y - k.headR * K * 1.4), nose: a.anchors.nose, head };
}
