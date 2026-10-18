// The four children who ride, and the things they can wear. A child is a small puppet in side view facing right,
// with a big round head in a 3/4 turn (both eyes visible, the far one narrower), drawn with the same ink line and cel
// shading as the animals. Every pose is a set of joint angles (measured from straight down, positive = forward).
// Items sit on named anchors: helmets on the head (`head`, `headR`), hairstyles at the back of the head, and the
// saddle on the animal's `seat`.

import { add, blob, capsule, circle, curve, down, ellipse, f, inked, linG, lockPath, pt, radG, rot, shade, type P, type Sh } from './geom';

export type KidId = 'maya' | 'tamar' | 'yoav' | 'ari';
export const KIDS: KidId[] = ['maya', 'tamar', 'yoav', 'ari'];
export const KID_NAME: Record<KidId, string> = { maya: 'מאיה', tamar: 'תמר', yoav: 'יואב', ari: 'ארי' };

export type HelmetId = 'basic' | 'rainbow' | 'stars' | 'crown' | 'flowers' | 'unicorn' | 'knight' | 'racer' | 'dino';
// hair: 'none' is the child's own hair; braids come in pink, gold and rainbow; the other styles suit anyone
export type HairId = 'none' | 'ponytail' | 'curls' | 'spikes' | 'surfer' | 'pink' | 'gold' | 'rainbow';
export type SaddleId = 'basic' | 'royal' | 'flowers' | 'stars' | 'rainbow';
export const HELMETS: HelmetId[] = ['basic', 'flowers', 'stars', 'racer', 'rainbow', 'knight', 'dino', 'unicorn', 'crown'];
export const HAIRS: HairId[] = ['none', 'spikes', 'curls', 'surfer', 'ponytail', 'pink', 'gold', 'rainbow'];
/** The braids (the rest of the hairstyles suit boys as well as girls). */
export const BRAID_STYLES: HairId[] = ['pink', 'gold', 'rainbow'];
export const SADDLES: SaddleId[] = ['basic', 'royal', 'flowers', 'stars', 'rainbow'];

export interface Outfit { helmet: HelmetId; hair: HairId; saddle: SaddleId }
export const PLAIN: Outfit = { helmet: 'basic', hair: 'none', saddle: 'basic' };

interface Kid {
  girl: boolean;
  skin: string;
  hair: string;
  style: 'braid' | 'puffs' | 'short' | 'spiky';
  shirt: string;
  pants: string;
  boots: string;
  eyes: string;
  helmet: string; // colour of the plain helmet
}

export const KID: Record<KidId, Kid> = {
  maya: { girl: true, skin: '#fbd3b6', hair: '#a8532a', style: 'braid', shirt: '#f37aa8', pants: '#4f8fd8', boots: '#7a4428', eyes: '#5a3418', helmet: '#e94f8c' },
  tamar: { girl: true, skin: '#a8693f', hair: '#2a1a14', style: 'puffs', shirt: '#ffc23d', pants: '#8a5cc8', boots: '#5e3420', eyes: '#2a160c', helmet: '#8a5cc8' },
  yoav: { girl: false, skin: '#f6ccac', hair: '#6b3f1f', style: 'short', shirt: '#4aa3e8', pants: '#5a4a3a', boots: '#5a3420', eyes: '#3d6aa0', helmet: '#2f6fc0' },
  ari: { girl: false, skin: '#d99a6a', hair: '#1f1612', style: 'spiky', shirt: '#4cbf6a', pants: '#3e5a8a', boots: '#6a3a20', eyes: '#2a1a10', helmet: '#e8672e' },
};

const INK = '#4a2a1e';
const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];

export type RiderPose = 'ride0' | 'ride1' | 'ride2' | 'jump' | 'duck' | 'bump' | 'wave' | 'stand' | 'clap0' | 'clap1' | 'trophy';
export const RIDER_POSES: RiderPose[] = ['ride0', 'ride1', 'ride2', 'jump', 'duck', 'bump', 'wave', 'stand', 'clap0', 'clap1', 'trophy'];

interface RP {
  seated: boolean;
  lean: number; // torso, forward > 0
  head: number; // head tilt, forward > 0
  bob: number;
  thigh: number;
  shin: number;
  armN: [number, number]; // near arm: upper, fore
  armF: [number, number];
  legF?: [number, number]; // far leg when standing
  reach?: [P, P]; // where the near and far hands reach, from the shoulder (overrides the arm angles; for clapping)
  eyes: 'open' | 'happy';
  mouth: 'smile' | 'open' | 'grin';
}

function poseOf(p: RiderPose): RP {
  const ride = (lean: number, bob: number): RP => ({ seated: true, lean, head: -lean * 0.6, bob, thigh: 78, shin: -8, armN: [38, 84], armF: [44, 88], eyes: 'open', mouth: 'smile' });
  switch (p) {
    case 'ride0': return ride(14, 0);
    case 'ride1': return ride(18, 2);
    case 'ride2': return ride(16, -1);
    case 'jump': return { ...ride(30, -4), armN: [62, 92], armF: [66, 96], mouth: 'grin', thigh: 70, shin: -24 };
    case 'duck': return { ...ride(76, 8), head: -30, armN: [108, 116], armF: [112, 120], thigh: 70, shin: -16 };
    case 'bump': return { ...ride(-6, -2), head: 6, armN: [62, 104], armF: [70, 116], eyes: 'happy', mouth: 'open' };
    case 'wave': return { ...ride(4, 0), armN: [70, 105], armF: [64, 100], eyes: 'happy', mouth: 'grin' };
    case 'stand': return { seated: false, lean: 2, head: 0, bob: 0, thigh: 4, shin: -2, legF: [-6, -6], armN: [10, 14], armF: [-8, -4], eyes: 'open', mouth: 'smile' };
    // clapping: hands apart (0), then together in front of the chest (1)
    case 'clap0': return { seated: false, lean: 4, head: -4, bob: 0, thigh: 4, shin: -2, legF: [-6, -6], armN: [0, 0], armF: [0, 0], reach: [pt(22, 16), pt(25, -6)], eyes: 'happy', mouth: 'grin' };
    case 'clap1': return { seated: false, lean: 4, head: -8, bob: -2, thigh: 6, shin: -2, legF: [-8, -6], armN: [0, 0], armF: [0, 0], reach: [pt(25, 7), pt(28, 6)], eyes: 'happy', mouth: 'open' };
    case 'trophy': return { seated: false, lean: 0, head: -10, bob: -2, thigh: 6, shin: -2, legF: [-10, -8], armN: [26, 70], armF: [34, 78], eyes: 'happy', mouth: 'grin' };
  }
}

export interface RiderArt { back: string; front: string; hands: P[]; head: P; headR: number; feet: P[]; chest: P; eyeR: number }

let uidN = 0;

const LEG = { thigh: 24, shin: 24 };
const TORSO = 34;
const HEAD_R = 30;

/** The standing height of a child's hip above the ground. */
export const HIP_H = LEG.thigh + LEG.shin + 7;

/**
 * Draw a child. `at` is the hip (on the saddle when seated, or above the ground when standing), `tilt` the
 * slope it rests on (degrees, nose up > 0). Returns the drawing in two layers: `back` (the far arm and leg, drawn
 * before the saddle) and `front`.
 */
/** Upper and fore arm angles that put a hand at `to`, with the elbow bent downward. */
function reachAngles(from: P, to: P, a: number, b: number): [number, number] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.min(a + b - 0.5, Math.max(Math.abs(a - b) + 0.5, Math.hypot(dx, dy)));
  const base = (Math.atan2(dx, dy) * 180) / Math.PI;
  const alpha = (Math.acos((a * a + d * d - b * b) / (2 * a * d)) * 180) / Math.PI;
  const upper = base - alpha;
  const elbow = down(from, upper, a);
  return [upper, (Math.atan2(to.x - elbow.x, to.y - elbow.y) * 180) / Math.PI];
}

/** A medal on a ribbon, worn on the chest. `mirror` turns the number back when the child is drawn mirrored. */
export interface Medal { n: number; color: string; mirror?: boolean }

export function drawKid(id: KidId, pose: RiderPose, outfit: Outfit, at: P, tilt = 0, medal?: Medal): RiderArt {
  const k = KID[id];
  const p = poseOf(pose);
  const uid = `k${(uidN++).toString(36)}`;
  const defs: string[] = [];
  const W = (q: P) => rot(add(at, q), at, -tilt);
  const hip = W(pt(0, p.bob));
  const neck = down(hip, 180 - p.lean, TORSO);
  const headC = down(neck, 180 - p.lean - p.head * 0.3, HEAD_R * 0.86);
  const shoulder = down(hip, 180 - p.lean, TORSO - 6);
  const shirtG = `${uid}sh`;
  defs.push(linG(shirtG, [[0, shade(k.shirt, 0.25)], [0.6, k.shirt], [1, shade(k.shirt, -0.2)]], 0, 0, 1, 1));
  const pantsG = `${uid}pa`;
  defs.push(linG(pantsG, [[0, shade(k.pants, 0.2)], [1, shade(k.pants, -0.2)]], 0, 0, 0, 1));
  const skinG = `${uid}sk`;
  defs.push(radG(skinG, [[0, shade(k.skin, 0.25)], [0.7, k.skin], [1, shade(k.skin, -0.12)]], 0.6, 0.35, 0.75));

  const limb = (from: P, angles: [number, number], len: [number, number], w: [number, number, number], fill: string, endFill: string, endR: number, boot = false): { sh: Sh[]; end: P } => {
    const mid = down(from, angles[0], len[0]);
    const end = down(mid, angles[1], len[1]);
    const sh: Sh[] = [
      { d: capsule(from, mid, w[0] / 2, w[1] / 2), fill },
      { d: capsule(mid, end, w[1] / 2, w[2] / 2), fill },
    ];
    if (boot) {
      const a = angles[1];
      const B = (x: number, y: number) => rot(add(end, pt(x, y)), end, -a);
      sh.push({ d: blob([B(-7, -6), B(7, -6), B(9, 4), B(16, 7), B(15, 11), B(-7, 11)], 0.5), fill: endFill });
    } else sh.push({ d: circle(end, endR), fill: endFill });
    return { sh, end };
  };

  // far arm and far leg (behind the body; the far leg only shows when standing)
  const sF = add(shoulder, pt(-3, -2));
  const sN = add(shoulder, pt(2, 0));
  if (p.reach) {
    p.armN = reachAngles(sN, add(shoulder, p.reach[0]), 16, 15);
    p.armF = reachAngles(sF, add(shoulder, p.reach[1]), 16, 15);
  }
  const armF = limb(sF, p.armF, [16, 15], [10, 9, 8], shade(k.shirt, -0.22), shade(k.skin, -0.15), 5.2);
  let back = '';
  if (p.legF) {
    const legF = limb(add(hip, pt(-3, -2)), p.legF, [LEG.thigh, LEG.shin], [13, 11, 10], shade(k.pants, -0.25), shade(k.boots, -0.2), 6, true);
    back += inked(legF.sh, INK, 2);
  }
  back += inked(armF.sh, INK, 2);

  // torso (a rounded shirt with a collar) and the near leg
  const T = (x: number, y: number) => rot(add(hip, pt(x, y)), hip, -p.lean);
  const torso: P[] = [T(-10, 4), T(-12, -10), T(-11, -26), T(-6, -36), T(7, -36), T(12, -26), T(13, -10), T(11, 4)];
  const legN = limb(add(hip, pt(2, 0)), [p.thigh, p.shin], [LEG.thigh, LEG.shin], [15, 12, 11], `url(#${pantsG})`, k.boots, 6, true);
  let front = inked([...legN.sh.slice(0, 2), { d: blob(torso, 0.9), fill: `url(#${shirtG})` }, legN.sh[2]], INK, 2);
  // boot cuff and shirt hem
  front += `<path d="${curve([T(-10, 0), T(0, 3), T(11, 0)])}" stroke="${shade(k.shirt, -0.3)}" stroke-width="2" fill="none" opacity=".6"/>`;
  front += `<path d="${curve([T(-5, -35), T(1, -30), T(7, -35)])}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
  // a medal: the ribbon goes round the neck (under the chin), the disc hangs on the chest
  const disc = T(6, -15);
  if (medal) front += `<path d="M${f(T(-4, -36).x)} ${f(T(-4, -36).y)} L${f(disc.x - 2)} ${f(disc.y - 5)} M${f(T(9, -36).x)} ${f(T(9, -36).y)} L${f(disc.x + 2)} ${f(disc.y - 5)}" stroke="${INK}" stroke-width="5.4" stroke-linecap="round" fill="none"/><path d="M${f(T(-4, -36).x)} ${f(T(-4, -36).y)} L${f(disc.x - 2)} ${f(disc.y - 5)}" stroke="#ff7aa8" stroke-width="3" stroke-linecap="round"/><path d="M${f(T(9, -36).x)} ${f(T(9, -36).y)} L${f(disc.x + 2)} ${f(disc.y - 5)}" stroke="#4dabf7" stroke-width="3" stroke-linecap="round"/>`;

  // head
  front += head(k, headC, p, outfit, defs, uid, skinG);

  // near arm over everything
  const armN = limb(sN, p.armN, [16, 15], [11, 10, 9], `url(#${shirtG})`, `url(#${skinG})`, 5.6);
  front += inked(armN.sh, INK, 2);
  // the medal's disc in front, so its number always shows
  if (medal) {
    front += `<circle cx="${f(disc.x)}" cy="${f(disc.y)}" r="7.6" fill="${medal.color}" stroke="${INK}" stroke-width="2"/><circle cx="${f(disc.x)}" cy="${f(disc.y)}" r="5.2" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>`;
    front += `<text x="0" y="0" transform="translate(${f(disc.x)} ${f(disc.y + 3.4)})${medal.mirror ? ' scale(-1 1)' : ''}" font-size="9.5" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="${INK}">${medal.n}</text>`;
  }
  // claps: little lines where the hands meet
  if (pose === 'clap1') {
    const h = lerp(armN.end, armF.end);
    front += `<path d="M${f(h.x + 9)} ${f(h.y - 9)} l5 -5 M${f(h.x + 11)} ${f(h.y)} l7 0 M${f(h.x + 9)} ${f(h.y + 9)} l5 5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
  }

  return { back: `<defs>${defs.join('')}</defs>${back}`, front, hands: [armN.end, armF.end], head: headC, headR: HEAD_R, feet: [legN.end], chest: T(4, -22), eyeR: HEAD_R * 0.19 };
}

function head(k: Kid, c: P, p: RP, o: Outfit, defs: string[], uid: string, skinG: string): string {
  const tilt = p.head;
  const H = (x: number, y: number) => rot(add(c, pt(x, y)), c, -tilt);
  const r = HEAD_R;
  let s = '';
  // hair behind the head
  s += hairBack(k, H, o, defs, uid);
  // the head: big and round with chubby cheeks, a button nose and a soft chin, facing right
  const shape = [H(-r, 0), H(-r * 0.72, -r * 0.72), H(0, -r), H(r * 0.72, -r * 0.72), H(r * 0.98, -r * 0.1), H(r * 1.04, r * 0.2), H(r * 0.98, r * 0.4), H(r * 0.8, r * 0.7), H(r * 0.36, r * 0.94), H(-r * 0.3, r * 0.9), H(-r * 0.82, r * 0.58)];
  const ear = H(-r * 0.2, r * 0.14);
  s += inked([{ d: blob(shape, 1), fill: `url(#${skinG})` }, { d: ellipse(ear, r * 0.2, r * 0.26), fill: shade(k.skin, -0.05) }], INK, 2);
  s += `<path d="${ellipse(add(ear, pt(1, 0)), r * 0.09, r * 0.15)}" fill="${shade(k.skin, -0.2)}"/>`;
  // big, glossy eyes set low in the face (a high forehead reads as young and sweet)
  const eyeN = H(r * 0.3, r * 0.1);
  const eyeF = H(r * 0.74, r * 0.08);
  const rx = r * 0.19;
  const ry = r * 0.27;
  if (p.eyes === 'happy') {
    const arc = (e: P, w: number) => `M${f(e.x - w)} ${f(e.y + 2)} Q${f(e.x)} ${f(e.y - w * 1.3)} ${f(e.x + w)} ${f(e.y + 2)}`;
    s += `<path d="${arc(eyeN, rx * 1.1)} ${arc(eyeF, rx * 0.8)}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  } else {
    const one = (e: P, w: number, h: number) =>
      `<path d="${ellipse(e, w, h)}" fill="${INK}"/>` +
      `<path d="${ellipse(add(e, pt(w * 0.06, h * 0.18)), w * 0.78, h * 0.72)}" fill="${k.eyes}"/>` +
      `<path d="${ellipse(add(e, pt(w * 0.08, h * 0.26)), w * 0.42, h * 0.4)}" fill="${INK}"/>` +
      `<circle cx="${f(e.x - w * 0.3)}" cy="${f(e.y - h * 0.32)}" r="${f(w * 0.46)}" fill="#fff"/>` +
      `<circle cx="${f(e.x + w * 0.36)}" cy="${f(e.y + h * 0.42)}" r="${f(w * 0.2)}" fill="#fff" opacity=".9"/>`;
    s += one(eyeN, rx, ry) + one(eyeF, rx * 0.72, ry * 0.94);
    if (k.girl) s += `<path d="M${f(eyeN.x - rx * 0.9)} ${f(eyeN.y - ry * 0.4)} l-5 -2 M${f(eyeN.x - rx * 0.7)} ${f(eyeN.y - ry * 0.78)} l-4 -4 M${f(eyeN.x - rx * 0.2)} ${f(eyeN.y - ry * 1.0)} l-2 -5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
  }
  // brows, rosy cheeks, a button nose and a wide smile
  s += `<path d="M${f(eyeN.x - rx)} ${f(eyeN.y - ry * 1.45)} q${f(rx)} ${f(-ry * 0.45)} ${f(rx * 2)} ${f(-ry * 0.1)} M${f(eyeF.x - rx * 0.6)} ${f(eyeF.y - ry * 1.4)} q${f(rx * 0.7)} ${f(-ry * 0.35)} ${f(rx * 1.3)} 0" stroke="${shade(k.hair, -0.2)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="${ellipse(H(r * 0.1, r * 0.46), r * 0.22, r * 0.14)}" fill="#ff7f8f" opacity=".45"/><path d="${ellipse(H(r * 0.86, r * 0.44), r * 0.12, r * 0.1)}" fill="#ff7f8f" opacity=".45"/>`;
  s += `<path d="${ellipse(H(r * 0.98, r * 0.28), r * 0.07, r * 0.055)}" fill="${shade(k.skin, -0.18)}"/>`;
  const m = H(r * 0.56, r * 0.6);
  const mw = r * 0.24;
  if (p.mouth === 'smile') s += `<path d="M${f(m.x - mw)} ${f(m.y - 2)} Q${f(m.x)} ${f(m.y + mw * 0.9)} ${f(m.x + mw)} ${f(m.y - 3)}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  else {
    const open = p.mouth === 'open' ? mw * 1.1 : mw * 0.8;
    s += `<path d="M${f(m.x - mw)} ${f(m.y - 3)} Q${f(m.x)} ${f(m.y + open + 2)} ${f(m.x + mw)} ${f(m.y - 4)} Q${f(m.x)} ${f(m.y - 1)} ${f(m.x - mw)} ${f(m.y - 3)}Z" fill="#a8323e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<path d="M${f(m.x - mw * 0.45)} ${f(m.y + open * 0.55)} q${f(mw * 0.45)} ${f(mw * 0.3)} ${f(mw * 0.9)} 0" stroke="#ff8a96" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  // hair on top, then the helmet
  s += hairFront(k, H, o.hair, defs, uid);
  s += helmet(k, H, o.helmet, defs, uid);
  return s;
}

function hairBack(k: Kid, H: (x: number, y: number) => P, o: Outfit, defs: string[], uid: string): string {
  const r = HEAD_R;
  const g = `${uid}hb`;
  defs.push(linG(g, [[0, shade(k.hair, 0.22)], [1, shade(k.hair, -0.2)]], 0, 0, 0.4, 1));
  let s = `<path d="${blob([H(-r * 1.08, -r * 0.2), H(-r * 0.6, -r * 0.98), H(r * 0.3, -r * 1.06), H(r * 0.2, r * 0.2), H(-r * 0.6, r * 0.62), H(-r * 1.04, r * 0.36)], 1)}" fill="url(#${g})" stroke="${INK}" stroke-width="2"/>`;
  if (o.hair === 'ponytail') {
    // a high ponytail flowing back from under the helmet, with a scrunchie
    const tie = H(-r * 1.08, -r * 0.2);
    const tail = [tie, add(tie, pt(-12, 2)), add(tie, pt(-22, 12)), add(tie, pt(-24, 26)), add(tie, pt(-18, 36))];
    s += `<path d="${lockPath(tail, (t) => 18 * Math.sin(Math.PI * (0.18 + t * 0.82)) + 2)}" fill="url(#${g})" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="${curve([add(tie, pt(-6, 0)), add(tie, pt(-16, 8)), add(tie, pt(-19, 22))])}" stroke="${shade(k.hair, 0.35)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    s += `<path d="${ellipse(add(tie, pt(-2, 0)), 4.6, 6.4)}" fill="#ff7aa8" stroke="${INK}" stroke-width="1.6"/>`;
    return s;
  }
  if (o.hair === 'curls') {
    // a mop of round curls all round the back, below the helmet
    const at = [[-1.12, -0.36, 8], [-1.2, 0.04, 9], [-1.06, 0.42, 9], [-0.74, 0.7, 8.4], [-0.4, 0.86, 7], [-0.86, -0.7, 7], [-0.5, 0.36, 9], [-0.8, 0.1, 10]];
    let puff = '';
    for (const [x, y, rr] of at) puff += `<path d="${circle(H(r * x, r * y), rr)}" fill="${k.hair}"/>`;
    s += `<g stroke="${INK}" stroke-width="4">${puff.replace(/fill="[^"]*"/g, `fill="${INK}"`)}</g>${puff}`;
    for (const [x, y, rr] of at.slice(0, 5)) s += `<path d="${curve([H(r * x - rr * 0.4, r * y - rr * 0.1), H(r * x, r * y - rr * 0.5), H(r * x + rr * 0.4, r * y - rr * 0.2)])}" stroke="${shade(k.hair, 0.4)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    return s;
  }
  if (o.hair === 'spikes') {
    // cool spikes sticking out behind, with blue tips
    const spikes: [number, number, number][] = [[-0.9, -0.56, 312], [-1.02, -0.18, 290], [-0.98, 0.22, 266], [-0.78, 0.56, 240], [-0.44, 0.78, 214]];
    for (const [x, y, a] of spikes) {
      const b0 = H(r * x, r * y);
      const dir = (a * Math.PI) / 180;
      const tip = add(b0, pt(Math.sin(dir) * 25, -Math.cos(dir) * 25));
      const side = pt(Math.cos(dir) * 9, Math.sin(dir) * 9);
      const l = add(b0, side);
      const rr = add(b0, pt(-side.x, -side.y));
      const mid = (q: P) => ({ x: q.x + (tip.x - q.x) * 0.55, y: q.y + (tip.y - q.y) * 0.55 });
      s += `<path d="M${f(l.x)} ${f(l.y)} L${f(tip.x)} ${f(tip.y)} L${f(rr.x)} ${f(rr.y)}Z" fill="${k.hair}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
      s += `<path d="M${f(mid(l).x)} ${f(mid(l).y)} L${f(tip.x)} ${f(tip.y)} L${f(mid(rr).x)} ${f(mid(rr).y)}Z" fill="#4dabf7" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    }
    return s;
  }
  if (o.hair === 'surfer') {
    // long, wavy surfer locks to the shoulders, with a sunny streak (and a fringe in front, in hairFront)
    const locks: [number, number, number][] = [[-0.98, -0.4, 0], [-1.0, 0.0, 1], [-0.8, 0.4, 2]];
    for (const [x, y, i] of locks) {
      const a = H(r * x, r * y);
      const ps = [a, add(a, pt(-12, 8)), add(a, pt(-16, 22)), add(a, pt(-10 + i * 3, 32 - i * 4)), add(a, pt(-2 + i * 2, 34 - i * 5))];
      s += `<path d="${lockPath(ps, (t) => 16 * (1 - t) + 2)}" fill="${i === 1 ? shade(k.hair, 0.12) : `url(#${g})`}" stroke="${INK}" stroke-width="2"/>`;
      if (i === 1) s += `<path d="${curve(ps.slice(0, 4))}" stroke="#ffd75a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  }
  if (o.hair !== 'none') {
    // two long braids, tied with ribbons
    const cols = o.hair === 'rainbow' ? RAINBOW : o.hair === 'pink' ? ['#ff8fc0', '#e8609c'] : ['#ffd75a', '#e8a91c'];
    const base = o.hair === 'rainbow' ? k.hair : cols[0];
    [H(-r * 0.86, r * 0.3), H(-r * 0.5, r * 0.6)].forEach((b, bi) => {
      let q = b;
      for (let i = 0; i < 5; i++) {
        const nq = add(q, pt(-4 - i * 0.6, 8));
        s += `<path d="${ellipse(lerp(q, nq), 6.4 - i * 0.5, 5.4)}" fill="${bi ? shade(base, -0.12) : base}" stroke="${INK}" stroke-width="1.8"/>`;
        q = nq;
      }
      const bow = cols[(bi + 1) % cols.length];
      s += `<path d="M${f(q.x)} ${f(q.y)} l-8 -5 l0 10Z M${f(q.x)} ${f(q.y)} l8 -5 l0 10Z" fill="${bow}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="${f(q.x)}" cy="${f(q.y)}" r="2.6" fill="${shade(bow, -0.2)}" stroke="${INK}" stroke-width="1.2"/>`;
      s += `<path d="${lockPath([add(q, pt(0, 2)), add(q, pt(-3, 10)), add(q, pt(-1, 16))], (t) => 8 * (1 - t))}" fill="${base}" stroke="${INK}" stroke-width="1.6"/>`;
      if (o.hair === 'rainbow') {
        // ribbons woven through the braid
        s += `<path d="${curve([b, add(b, pt(-6, 14)), add(b, pt(-12, 30)), add(b, pt(-14, 40))])}" stroke="${cols[bi * 2]}" stroke-width="3" fill="none" stroke-dasharray="6 5"/>`;
      }
    });
    return s;
  }
  if (k.style === 'braid') {
    // one long braid hanging down the back
    let q = H(-r * 0.92, r * 0.2);
    for (let i = 0; i < 6; i++) {
      const nq = add(q, pt(-5, 7));
      s += `<path d="${ellipse(lerp(q, nq), 6.6 - i * 0.4, 5.2)}" fill="${i % 2 ? shade(k.hair, -0.1) : k.hair}" stroke="${INK}" stroke-width="1.8"/>`;
      q = nq;
    }
    s += `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="3.4" fill="#ffd23f" stroke="${INK}" stroke-width="1.4"/><path d="${lockPath([add(q, pt(-1, 2)), add(q, pt(-5, 10)), add(q, pt(-4, 16))], (t) => 9 * (1 - t))}" fill="${k.hair}" stroke="${INK}" stroke-width="1.6"/>`;
  } else if (k.style === 'puffs') {
    // a big curly puff at the back
    const c0 = H(-r * 0.95, -r * 0.1);
    let puff = '';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      puff += `<path d="${circle(add(c0, pt(Math.cos(a) * 10, Math.sin(a) * 10)), 8)}" fill="${k.hair}"/>`;
    }
    s = `<g stroke="${INK}" stroke-width="4">${puff.replace(/fill="[^"]*"/g, `fill="${INK}"`)}</g>${puff}` + s;
    s += `<path d="${curve([add(c0, pt(-6, -6)), add(c0, pt(-2, -10)), add(c0, pt(4, -8))])}" stroke="${shade(k.hair, 0.4)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

const lerp = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function hairFront(k: Kid, H: (x: number, y: number) => P, hair: HairId, defs: string[], uid: string): string {
  const r = HEAD_R;
  const g = `${uid}hf`;
  defs.push(linG(g, [[0, shade(k.hair, 0.28)], [1, shade(k.hair, -0.1)]], 0, 0, 0.3, 1));
  let cap: P[];
  if (k.style === 'spiky') cap = [H(-r * 1.04, r * 0.1), H(-r * 1.1, -r * 0.5), H(-r * 0.86, -r * 0.9), H(-r * 0.5, -r * 1.24), H(-r * 0.1, -r * 1.06), H(r * 0.3, -r * 1.3), H(r * 0.56, -r * 0.96), H(r * 0.96, -r * 0.98), H(r * 0.9, -r * 0.5), H(r * 0.56, -r * 0.62), H(r * 0.2, -r * 0.46), H(-r * 0.3, -r * 0.5), H(-r * 0.62, -r * 0.08)];
  else if (k.style === 'short') cap = [H(-r * 1.04, r * 0.16), H(-r * 1.04, -r * 0.6), H(-r * 0.5, -r * 1.1), H(r * 0.3, -r * 1.12), H(r * 0.86, -r * 0.8), H(r * 0.94, -r * 0.4), H(r * 0.6, -r * 0.5), H(r * 0.36, -r * 0.34), H(r * 0.1, -r * 0.5), H(-r * 0.4, -r * 0.5), H(-r * 0.66, -r * 0.1)];
  else if (k.style === 'puffs') cap = [H(-r * 1.04, r * 0.2), H(-r * 1.06, -r * 0.6), H(-r * 0.5, -r * 1.14), H(r * 0.3, -r * 1.14), H(r * 0.9, -r * 0.8), H(r * 0.96, -r * 0.4), H(r * 0.5, -r * 0.6), H(0, -r * 0.6), H(-r * 0.5, -r * 0.4), H(-r * 0.7, r * 0.1)];
  else cap = [H(-r * 1.06, r * 0.3), H(-r * 1.08, -r * 0.6), H(-r * 0.5, -r * 1.12), H(r * 0.3, -r * 1.1), H(r * 0.9, -r * 0.76), H(r * 1.0, -r * 0.3), H(r * 0.7, -r * 0.5), H(r * 0.46, -r * 0.3), H(r * 0.3, -r * 0.56), H(-r * 0.2, -r * 0.5), H(-r * 0.6, -r * 0.2), H(-r * 0.7, r * 0.3)];
  let s = `<path d="${blob(cap, 0.95)}" fill="url(#${g})" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="${curve([H(-r * 0.6, -r * 0.82), H(-r * 0.1, -r * 0.98), H(r * 0.4, -r * 0.9)])}" stroke="#fff" stroke-width="2.6" fill="none" opacity=".4" stroke-linecap="round"/>`;
  s += `<path d="${curve([H(-r * 0.2, -r * 0.6), H(-r * 0.6, -r * 0.4), H(-r * 0.8, r * 0.1)])}" stroke="${shade(k.hair, -0.35)}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  if (hair === 'surfer') {
    // a side-swept fringe from under the helmet, clear of the eyes
    s += `<path d="${blob([H(-r * 0.05, -r * 0.52), H(r * 0.5, -r * 0.5), H(r * 1.0, -r * 0.38), H(r * 0.96, -r * 0.18), H(r * 0.74, -r * 0.3), H(r * 0.46, -r * 0.24), H(r * 0.2, -r * 0.38)], 0.8)}" fill="${shade(k.hair, 0.15)}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<path d="${curve([H(r * 0.24, -r * 0.42), H(r * 0.58, -r * 0.42), H(r * 0.88, -r * 0.3)])}" stroke="#ffd75a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

/** A riding helmet: a dome over the top of the head with a short peak at the front. */
function helmet(k: Kid, H: (x: number, y: number) => P, id: HelmetId, defs: string[], uid: string): string {
  const r = HEAD_R;
  const dome = [H(-r * 1.12, -r * 0.08), H(-r * 1.0, -r * 0.8), H(-r * 0.4, -r * 1.3), H(r * 0.4, -r * 1.3), H(r * 0.98, -r * 0.82), H(r * 1.1, -r * 0.36), H(-r * 0.2, -r * 0.4)];
  const peak = [H(r * 0.7, -r * 0.5), H(r * 1.1, -r * 0.48), H(r * 1.44, -r * 0.3), H(r * 1.4, -r * 0.18), H(r * 0.9, -r * 0.24)];
  const BASES: Record<HelmetId, string> = { basic: k.helmet, stars: '#3d5fd0', crown: '#ffcf3a', flowers: '#ff9ec8', rainbow: '#ffffff', unicorn: '#fff6fb', knight: '#c4ccd8', racer: '#e8344e', dino: '#58c26a' };
  const base = BASES[id];
  const g = `${uid}hm`;
  defs.push(radG(g, [[0, shade(base, 0.5)], [0.55, base], [1, shade(base, -0.25)]], 0.4, 0.25, 0.8));
  const clip = `${uid}hc`;
  defs.push(`<clipPath id="${clip}"><path d="${blob(dome, 0.9)}"/></clipPath>`);
  // things that stand on top of the helmet are drawn first, so the dome covers their feet
  let behind = '';
  const up = (x: number, y: number) => H(r * x, r * y);
  if (id === 'unicorn') {
    // pink ears and a golden spiral horn
    for (const [x, rot] of [[-0.22, -12], [0.12, 8]] as const) {
      const b = up(x, -1.18);
      behind += `<path d="M${f(b.x - 6)} ${f(b.y + 4)} L${f(b.x + rot * 0.3)} ${f(b.y - 17)} L${f(b.x + 6)} ${f(b.y + 4)}Z" fill="#fff6fb" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M${f(b.x - 3)} ${f(b.y + 2)} L${f(b.x + rot * 0.25)} ${f(b.y - 11)} L${f(b.x + 3)} ${f(b.y + 2)}Z" fill="#ffa8cc"/>`;
    }
    const b0 = up(0.36, -1.2);
    const tip = up(0.7, -2.4);
    const nx = (tip.y - b0.y) * 0.24;
    const ny = (b0.x - tip.x) * 0.24;
    behind += `<path d="M${f(b0.x - nx)} ${f(b0.y - ny)} L${f(tip.x)} ${f(tip.y)} L${f(b0.x + nx)} ${f(b0.y + ny)}Z" fill="#ffd84a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    for (const t of [0.3, 0.52, 0.74]) {
      const a = { x: b0.x + (tip.x - b0.x) * t, y: b0.y + (tip.y - b0.y) * t };
      const wv = 1 - t;
      behind += `<path d="M${f(a.x - nx * wv)} ${f(a.y - ny * wv + 3)} L${f(a.x + nx * wv)} ${f(a.y + ny * wv - 3)}" stroke="#e8a21c" stroke-width="2" stroke-linecap="round"/>`;
    }
  } else if (id === 'knight') {
    // a red plume sweeping back from the crest
    const a = up(0.0, -1.28);
    behind += `<path d="M${f(a.x - 4)} ${f(a.y + 4)} C${f(a.x - 6)} ${f(a.y - 22)} ${f(a.x - 30)} ${f(a.y - 30)} ${f(a.x - 44)} ${f(a.y - 16)} C${f(a.x - 32)} ${f(a.y - 20)} ${f(a.x - 22)} ${f(a.y - 12)} ${f(a.x - 18)} ${f(a.y - 2)} C${f(a.x - 26)} ${f(a.y - 4)} ${f(a.x - 34)} ${f(a.y + 4)} ${f(a.x - 36)} ${f(a.y + 12)} C${f(a.x - 22)} ${f(a.y + 8)} ${f(a.x - 10)} ${f(a.y + 12)} ${f(a.x + 4)} ${f(a.y + 6)}Z" fill="#e8344e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M${f(a.x - 6)} ${f(a.y - 2)} C${f(a.x - 14)} ${f(a.y - 18)} ${f(a.x - 28)} ${f(a.y - 22)} ${f(a.x - 38)} ${f(a.y - 14)}" stroke="#ff8fa0" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  } else if (id === 'dino') {
    // a ridge of orange spikes along the back of the head
    for (const [x, y, sz] of [[-0.9, -0.96, 9], [-0.6, -1.2, 11], [-0.22, -1.32, 12], [0.18, -1.34, 11], [0.52, -1.2, 9]] as const) {
      const b = up(x, y);
      const out = H(r * x * 1.1, r * (y - 0.4));
      behind += `<path d="M${f(b.x - sz * 0.6)} ${f(b.y + 3)} L${f(out.x)} ${f(out.y - 4)} L${f(b.x + sz * 0.6)} ${f(b.y + 3)}Z" fill="#ffa23a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    }
  }
  let s = behind + inked([{ d: blob(peak, 0.8), fill: shade(base, -0.2) }, { d: blob(dome, 0.9), fill: `url(#${g})` }], INK, 2);
  let deco = '';
  if (id === 'rainbow') {
    RAINBOW.forEach((col, i) => {
      const x = -r * 1.0 + i * r * 0.36;
      deco += `<path d="M${f(H(x, -r * 1.6).x)} ${f(H(x, -r * 1.6).y)} L${f(H(x + r * 0.4, -r * 1.6).x)} ${f(H(x + r * 0.4, -r * 1.6).y)} L${f(H(x + r * 0.1, 0).x)} ${f(H(x + r * 0.1, 0).y)} L${f(H(x - r * 0.3, 0).x)} ${f(H(x - r * 0.3, 0).y)}Z" fill="${col}" opacity=".9"/>`;
    });
  } else if (id === 'stars') {
    [[-0.6, -0.9, 5], [0.1, -1.05, 6], [0.62, -0.75, 4.4], [-0.2, -0.6, 3.6], [-0.85, -0.45, 3.4]].forEach(([x, y, sz]) => (deco += star(H(r * x, r * y), sz, '#ffe066')));
  } else if (id === 'crown') {
    // crown points around the brim and red jewels
    const pts: P[] = [];
    for (let i = 0; i <= 8; i++) {
      const x = -r * 1.0 + i * r * 0.26;
      pts.push(H(x, -r * (i % 2 ? 1.0 : 0.72)));
    }
    deco += `<path d="M${pts.map((q) => `${f(q.x)} ${f(q.y)}`).join('L')}L${f(H(r * 1.2, -r * 0.2).x)} ${f(H(r * 1.2, -r * 0.2).y)}L${f(H(-r * 1.2, -r * 0.2).x)} ${f(H(-r * 1.2, -r * 0.2).y)}Z" fill="#e8a91c" opacity=".55"/>`;
    [-0.6, 0, 0.55].forEach((x) => (deco += `<circle cx="${f(H(r * x, -r * 0.62).x)}" cy="${f(H(r * x, -r * 0.62).y)}" r="3.6" fill="#e8344e" stroke="${INK}" stroke-width="1.2"/><circle cx="${f(H(r * x - 1, -r * 0.66).x)}" cy="${f(H(r * x - 1, -r * 0.66).y)}" r="1.2" fill="#fff"/>`));
  } else if (id === 'flowers') {
    [[-0.55, -0.95, '#fff'], [0.15, -1.08, '#ffe066'], [0.66, -0.72, '#fff'], [-0.85, -0.5, '#c9a0ff']].forEach(([x, y, col]) => (deco += flower(H(r * (x as number), r * (y as number)), 5.6, col as string)));
  } else if (id === 'unicorn') {
    // a rainbow mane down the back of the dome
    RAINBOW.forEach((col, i) => {
      const x = -r * 1.1 + i * r * 0.17;
      deco += `<path d="${curve([H(x + r * 0.2, -r * 1.4), H(x - r * 0.12, -r * 0.8), H(x - r * 0.05, -r * 0.1)])}" stroke="${col}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    });
    deco += `<path d="${ellipse(H(r * 0.5, -r * 0.55), 3.4, 2.4)}" fill="#ffa8cc" opacity=".8"/>`;
  } else if (id === 'knight') {
    // a gold rim, a ridge down the middle and rivets
    deco += `<path d="${curve([H(-r * 1.1, -r * 0.25), H(0, -r * 0.5), H(r * 1.1, -r * 0.34)])}" stroke="#e8a91c" stroke-width="5"/>`;
    deco += `<path d="${curve([H(-r * 0.3, -r * 1.35), H(-r * 0.1, -r * 0.9), H(-r * 0.05, -r * 0.5)])}" stroke="#8a94a8" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    for (const x of [-0.8, -0.4, 0.2, 0.7]) deco += `<circle cx="${f(H(r * x, -r * 0.46).x)}" cy="${f(H(r * x, -r * 0.46).y)}" r="2.2" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
  } else if (id === 'racer') {
    // two white racing stripes and orange flames licking back from the front
    for (const o of [-0.2, 0.18]) deco += `<path d="${curve([H(r * (o + 0.6), -r * 1.4), H(r * (o + 0.1), -r * 0.9), H(r * (o - 0.5), -r * 0.4)])}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    deco += `<path d="M${f(H(r * 0.9, -r * 0.4).x)} ${f(H(r * 0.9, -r * 0.4).y)} Q${f(H(r * 0.4, -r * 0.62).x)} ${f(H(r * 0.4, -r * 0.62).y)} ${f(H(-r * 0.2, -r * 0.46).x)} ${f(H(-r * 0.2, -r * 0.46).y)} Q${f(H(r * 0.3, -r * 0.4).x)} ${f(H(r * 0.3, -r * 0.4).y)} ${f(H(-r * 0.8, -r * 0.34).x)} ${f(H(-r * 0.8, -r * 0.34).y)} L${f(H(r * 0.9, -r * 0.3).x)} ${f(H(r * 0.9, -r * 0.3).y)}Z" fill="#ffa23a"/><path d="M${f(H(r * 0.9, -r * 0.4).x)} ${f(H(r * 0.9, -r * 0.4).y)} Q${f(H(r * 0.5, -r * 0.5).x)} ${f(H(r * 0.5, -r * 0.5).y)} ${f(H(r * 0.1, -r * 0.4).x)} ${f(H(r * 0.1, -r * 0.4).y)} L${f(H(r * 0.9, -r * 0.3).x)} ${f(H(r * 0.9, -r * 0.3).y)}Z" fill="#ffe066"/>`;
  } else if (id === 'dino') {
    // darker green spots
    for (const [x, y, rr] of [[-0.6, -0.9, 4.4], [0.0, -1.05, 5], [0.55, -0.8, 3.8], [-0.2, -0.62, 3.2], [-0.9, -0.5, 3]] as const) deco += `<path d="${ellipse(H(r * x, r * y), rr * 1.2, rr)}" fill="#2f9a4a" opacity=".85"/>`;
  } else {
    deco += `<path d="${curve([H(-r * 0.2, -r * 1.3), H(-r * 0.1, -r * 0.8), H(0, -r * 0.42)])}" stroke="${shade(base, -0.3)}" stroke-width="3" fill="none" opacity=".6"/>`;
  }
  s += `<g clip-path="url(#${clip})">${deco}<path d="${curve([H(-r * 0.7, -r * 0.9), H(-r * 0.1, -r * 1.2), H(r * 0.5, -r * 1.06)])}" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/></g>`;
  s += `<path d="${blob(dome, 0.9)}" fill="none" stroke="${INK}" stroke-width="2"/>`;
  // chin strap: down behind the ear and along the jaw, clear of the face
  s += `<path d="${curve([H(-r * 0.42, -r * 0.3), H(-r * 0.4, r * 0.42), H(-r * 0.06, r * 0.9)])}" stroke="${shade(base, -0.35)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  return s;
}

export function star(c: P, r: number, fill: string, ink = INK): string {
  const ps: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ps.push(`${f(c.x + Math.cos(a) * rr)} ${f(c.y + Math.sin(a) * rr)}`);
  }
  return `<path d="M${ps.join('L')}Z" fill="${fill}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`;
}

export function flower(c: P, r: number, petal: string, ink = INK): string {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    s += `<path d="${circle(add(c, pt(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62)), r * 0.5)}" fill="${petal}" stroke="${ink}" stroke-width="1"/>`;
  }
  return s + `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(r * 0.36)}" fill="#ffb02e" stroke="${ink}" stroke-width="1"/>`;
}

export { RAINBOW, INK as KID_INK };
