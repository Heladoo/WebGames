// The five royal animals, drawn in code in a classic hand-animated look: one ink line around each piece, soft
// cel shading (a lit side and a shadow side), big glossy eyes and flowing manes and tails.
//
// Every animal is a puppet on a shared four-legged skeleton (`Species`), facing right in side view. A pose bends the
// legs (absolute angles, measured from straight down, positive = forward), tilts the body, neck and head, and sets
// the eyes. The figure is placed so that its lowest hoof touches the ground (y = 0 in local coordinates), plus a lift
// for jumps. Each drawing returns named anchors (`seat`, `rein`, `head`) that the saddle and the rider use, so any
// item follows any pose.

import { add, mix, blob, capsule, circle, curve, down, ellipse, f, inked, linG, lockPath, pt, radG, ribbon, rot, sample, shade, swell, type P, type Sh } from './geom';

export type AnimalId = 'horse' | 'unicorn' | 'dragon' | 'deer' | 'reindeer';
export const ANIMALS: AnimalId[] = ['unicorn', 'horse', 'deer', 'reindeer', 'dragon'];
export const ANIMAL_NAME: Record<AnimalId, string> = { horse: 'סוס', unicorn: 'חד-קרן', dragon: 'דרקון', deer: 'עופר', reindeer: 'אייל צפון' };

export type PoseId = 'run0' | 'run1' | 'run2' | 'run3' | 'run4' | 'run5' | 'jump' | 'duck' | 'bump' | 'stand' | 'happy';
export const RUN_FRAMES: PoseId[] = ['run0', 'run1', 'run2', 'run3', 'run4', 'run5'];
export const POSES: PoseId[] = [...RUN_FRAMES, 'jump', 'duck', 'bump', 'stand', 'happy'];

type Leg = number[]; // absolute segment angles
interface Pose {
  legs: [Leg, Leg, Leg, Leg]; // hind far, hind near, front far, front near
  pitch: number; // degrees, nose up > 0
  lift: number; // extra height above the ground
  neck: number; // neck turn, forward-down < 0
  head: number; // head turn
  tail: number; // tail lift
  wave: number; // phase of the flowing mane and tail
  eyes: 'open' | 'happy';
  wings: 'fold' | 'open' | 'up';
  low?: number; // how far the body sinks (duck)
}

export interface Anchors {
  seat: P; // where the rider sits (top of the saddle)
  seatAngle: number; // back slope, degrees (nose up > 0)
  rein: P; // where the reins meet the head
  headTop: P; // top of the head (for a crown-like hit box)
  top: number; // highest point of the figure (y, negative up)
  ground: number; // lowest point of the feet (0 on the ground, negative when lifted)
  eyeR: number; // eye radius, for the test that faces stay clear at game size
  nose: number; // front-most x
}

export interface AnimalArt { svg: string; anchors: Anchors }

// ---------------------------------------------------------------- gaits

const ease = (t: number) => t * t * (3 - 2 * t);
const wrap = (t: number) => ((t % 1) + 1) % 1;

function frontGallop(ph: number): Leg {
  const t = wrap(ph);
  if (t < 0.42) {
    const a = 26 - 56 * (t / 0.42);
    return [a, a, a + 30];
  }
  const s = (t - 0.42) / 0.58;
  const a = -30 + 56 * ease(s);
  const fold = Math.sin(Math.PI * Math.min(1, s * 1.15)) * 110;
  return [a, a - fold, a - fold * 1.2 + 30];
}

function hindGallop(ph: number): Leg {
  const t = wrap(ph);
  let sw: number;
  let fold = 0;
  if (t < 0.42) sw = 24 - 56 * (t / 0.42);
  else {
    const s = (t - 0.42) / 0.58;
    sw = -32 + 56 * ease(s);
    fold = Math.sin(Math.PI * s) * 70;
  }
  return [18 + sw * 0.55 + fold * 0.5, -30 + sw - fold * 0.55, 4 + sw + fold * 0.7, 30 + sw * 0.8 + fold * 0.6];
}

function poseOf(id: PoseId): Pose {
  if (id.startsWith('run')) {
    const t = Number(id.slice(3)) / 6;
    return {
      legs: [hindGallop(t), hindGallop(t + 0.1), frontGallop(t + 0.48), frontGallop(t + 0.58)],
      pitch: Math.sin(2 * Math.PI * (t + 0.15)) * 3,
      lift: Math.max(0, Math.sin(2 * Math.PI * (t - 0.1))) * 6,
      neck: Math.sin(2 * Math.PI * (t + 0.5)) * 4 - 4,
      head: Math.sin(2 * Math.PI * (t + 0.6)) * 3,
      tail: 10,
      wave: t,
      eyes: 'open',
      wings: 'fold',
    };
  }
  const stand: [Leg, Leg, Leg, Leg] = [
    [14, -34, -1, 26],
    [18, -30, 3, 28],
    [-2, -3, 24],
    [3, 0, 26],
  ];
  switch (id) {
    case 'jump':
      return { legs: [[-28, -70, -62, -40], [-22, -64, -56, -34], [62, -40, -70], [70, -30, -62]], pitch: 9, lift: 64, neck: 4, head: -4, tail: 22, wave: 0.3, eyes: 'open', wings: 'open' };
    case 'duck':
      return { legs: [[50, -50, 14, 38], [54, -46, 18, 40], [44, -30, 22], [50, -26, 26]], pitch: -7, lift: 0, neck: -46, head: -20, tail: 4, wave: 0.6, eyes: 'open', wings: 'fold', low: 1 };
    case 'bump':
      return { legs: [[10, -38, -6, 20], [20, -26, 8, 30], [36, 30, 52], [44, 38, 60]], pitch: -5, lift: 2, neck: -14, head: 10, tail: 30, wave: 0.8, eyes: 'happy', wings: 'up' };
    case 'happy':
      return { legs: [stand[0], stand[1], [6, 2, 26], [64, -46, -20]], pitch: 7, lift: 0, neck: 8, head: -6, tail: 26, wave: 0.15, eyes: 'happy', wings: 'up' };
    default:
      return { legs: stand, pitch: 1, lift: 0, neck: 4, head: 0, tail: 2, wave: 0.45, eyes: 'open', wings: 'fold' };
  }
}

// ---------------------------------------------------------------- species

interface Species {
  coat: string; // base colour
  light: string; // lit side
  dark: string; // shadow side
  ink: string;
  belly?: string;
  hoof: string;
  mane: string[]; // lock colours (more than one: rainbow)
  bodyY: number; // body centre height above the ground (before the feet are fitted)
  body: P[]; // body outline, relative to its centre, facing right
  shoulder: P;
  hip: P;
  front: [number, number, number][]; // [length, width at start, width at end]
  hind: [number, number, number][];
  neckBase: P; // pivot of the neck, relative to the body centre
  poll: P; // where the head joins the neck, relative to neckBase, before turning
  neck: P[]; // neck outline relative to neckBase
  headAngle: number;
  tailRoot: P;
  foot: 'hoof' | 'cloven' | 'claw';
  eyeColor: string;
}

const HORSE_BODY: P[] = [pt(84, -6), pt(72, 24), pt(36, 37), pt(-6, 41), pt(-46, 34), pt(-72, 20), pt(-90, -6), pt(-82, -32), pt(-54, -43), pt(-8, -36), pt(38, -44), pt(70, -30)];
const HORSE_NECK: P[] = [pt(-28, -16), pt(-14, -52), pt(10, -84), pt(38, -100), pt(60, -82), pt(52, -54), pt(40, -14), pt(28, 20), pt(-4, 10)];

const SPECIES: Record<AnimalId, Species> = {
  horse: {
    coat: '#e8b45c', light: '#f7d48e', dark: '#b97a33', ink: '#5a3216', hoof: '#5b4636',
    mane: ['#fff1c9', '#f8dc98', '#efc777', '#fbe7b4'], eyeColor: '#6b3d1e',
    bodyY: 150, body: HORSE_BODY, shoulder: pt(50, 6), hip: pt(-56, 2),
    front: [[56, 36, 22], [50, 17, 14], [20, 14, 13]],
    hind: [[44, 42, 24], [46, 23, 15], [40, 15, 13], [18, 14, 13]],
    neckBase: pt(52, -26), poll: pt(44, -96), neck: HORSE_NECK, headAngle: 34, tailRoot: pt(-84, -30), foot: 'hoof',
  },
  unicorn: {
    coat: '#fbf7fb', light: '#ffffff', dark: '#d5c8e6', ink: '#6a4d8c', hoof: '#f2b6d2',
    mane: ['#ff8fc8', '#c48cf2', '#7fb6ff', '#7fe0d0', '#ffe07a', '#ffb08a'], eyeColor: '#5a3fa0',
    bodyY: 150, body: HORSE_BODY, shoulder: pt(50, 6), hip: pt(-56, 2),
    front: [[56, 36, 22], [50, 17, 14], [20, 14, 13]],
    hind: [[44, 42, 24], [46, 23, 15], [40, 15, 13], [18, 14, 13]],
    neckBase: pt(52, -26), poll: pt(44, -96), neck: HORSE_NECK, headAngle: 34, tailRoot: pt(-84, -30), foot: 'hoof',
  },
  deer: {
    coat: '#c98a4e', light: '#e7b47a', dark: '#94582c', ink: '#4c2a12', belly: '#f6e6cc', hoof: '#3d2a1e',
    mane: [], eyeColor: '#3a2412',
    bodyY: 150,
    body: [pt(74, -8), pt(64, 20), pt(32, 32), pt(-6, 35), pt(-44, 30), pt(-66, 16), pt(-80, -6), pt(-72, -30), pt(-46, -38), pt(-8, -32), pt(34, -38), pt(62, -28)],
    shoulder: pt(46, 4), hip: pt(-52, 0),
    front: [[58, 28, 14], [54, 10, 8], [20, 8, 7]],
    hind: [[46, 34, 16], [50, 15, 9], [42, 9, 8], [18, 8, 7]],
    neckBase: pt(46, -24), poll: pt(40, -92),
    neck: [pt(-20, -16), pt(0, -50), pt(20, -84), pt(36, -94), pt(52, -80), pt(46, -52), pt(36, -12), pt(22, 16), pt(-4, 8)],
    headAngle: 46, tailRoot: pt(-78, -28), foot: 'cloven',
  },
  reindeer: {
    coat: '#8a5a38', light: '#b07c52', dark: '#5e3a22', ink: '#3a2010', belly: '#f1e5d0', hoof: '#2f241c',
    mane: ['#f4ead8', '#e6d6bc'], eyeColor: '#2e1a0c',
    bodyY: 148,
    body: [pt(82, -6), pt(70, 26), pt(34, 38), pt(-6, 42), pt(-46, 35), pt(-72, 20), pt(-88, -6), pt(-80, -32), pt(-52, -42), pt(-8, -36), pt(38, -44), pt(70, -30)],
    shoulder: pt(50, 6), hip: pt(-56, 2),
    front: [[56, 34, 18], [50, 14, 11], [20, 12, 11]],
    hind: [[44, 40, 20], [46, 19, 12], [40, 12, 11], [18, 12, 11]],
    neckBase: pt(52, -26), poll: pt(42, -88),
    neck: [pt(-26, -18), pt(-4, -52), pt(20, -80), pt(38, -90), pt(60, -76), pt(60, -46), pt(48, -6), pt(28, 22), pt(-4, 10)],
    headAngle: 50, tailRoot: pt(-84, -28), foot: 'cloven',
  },
  dragon: {
    coat: '#e8663a', light: '#ff9a5c', dark: '#b03c22', ink: '#5e1a0e', belly: '#ffd27a', hoof: '#fff2d6',
    mane: ['#ffcf4a', '#ffb02e'], eyeColor: '#1f7a4e',
    bodyY: 138,
    body: [pt(84, -4), pt(72, 26), pt(36, 40), pt(-8, 44), pt(-50, 38), pt(-80, 22), pt(-96, -2), pt(-86, -30), pt(-54, -40), pt(-8, -34), pt(38, -42), pt(70, -28)],
    shoulder: pt(48, 8), hip: pt(-58, 6),
    front: [[50, 34, 22], [42, 18, 15], [14, 15, 14]],
    hind: [[44, 44, 26], [40, 24, 16], [32, 16, 14], [14, 15, 14]],
    neckBase: pt(52, -24), poll: pt(56, -96),
    neck: [pt(-26, -16), pt(-6, -50), pt(16, -82), pt(42, -102), pt(66, -96), pt(62, -64), pt(46, -16), pt(28, 22), pt(-4, 10)],
    headAngle: 58, tailRoot: pt(-90, -18), foot: 'claw',
  },
};

// ---------------------------------------------------------------- drawing helpers

interface Ctx {
  sp: Species;
  id: AnimalId;
  defs: string[];
  uid: string;
}

/** Body-coloured fill with the light from the top left: a vertical gradient from lit to shadow. */
function coatGrad(c: Ctx, name: string, light: string, base: string, dark: string, y1 = 1): string {
  const id = `${c.uid}${name}`;
  c.defs.push(linG(id, [[0, light], [0.45, base], [1, dark]], 0.2, 0, 0.35, y1));
  return `url(#${id})`;
}

function legChain(root: P, angles: Leg, segs: [number, number, number][]): P[] {
  const pts = [root];
  let p = root;
  segs.forEach(([len], i) => {
    p = down(p, angles[i] ?? angles[angles.length - 1], len);
    pts.push(p);
  });
  return pts;
}

function footShape(c: Ctx, end: P, angle: number, far: boolean): Sh[] {
  const sp = c.sp;
  const col = far ? shade(sp.hoof, -0.18) : sp.hoof;
  const toeCol = far ? mix(sp.coat, sp.dark, 0.65) : sp.coat;
  // a hoof stands on its flat sole: lean it only a little with the pastern
  const a = Math.max(-40, Math.min(40, angle - 26));
  const R = (x: number, y: number) => rot(add(end, pt(x, y)), end, a);
  if (sp.foot === 'claw') {
    const toe = [R(-9, -4), R(10, -6), R(18, 2), R(20, 10), R(-10, 10)];
    return [
      { d: blob(toe, 0.8), fill: toeCol },
      { d: `M${f(R(10, 8).x)} ${f(R(10, 8).y)}l7 -2l-3 5Z M${f(R(2, 9).x)} ${f(R(2, 9).y)}l7 -1l-3 5Z`, fill: col },
    ];
  }
  if (sp.foot === 'cloven') {
    return [{ d: blob([R(-6, -2), R(6, -3), R(10, 10), R(-6, 10)], 0.5), fill: col }];
  }
  return [{ d: blob([R(-8, -2), R(8, -3), R(12, 13), R(-9, 13)], 0.45), fill: col }];
}

function drawLeg(c: Ctx, root: P, angles: Leg, segs: [number, number, number][], far: boolean): { upper: Sh[]; lower: Sh[] } {
  const sp = c.sp;
  const pts = legChain(root, angles, segs);
  const fill = far ? coatGrad(c, 'lf', mix(sp.coat, sp.dark, 0.4), mix(sp.coat, sp.dark, 0.65), shade(sp.dark, -0.18)) : coatGrad(c, 'ln', sp.light, sp.coat, sp.dark);
  const lower: Sh[] = [];
  segs.forEach(([, w0, w1], i) => i > 0 && lower.push({ d: capsule(pts[i], pts[i + 1], w0 / 2, w1 / 2), fill }));
  // the fetlock: a small rounded joint above the hoof
  if (sp.foot !== 'claw') lower.push({ d: circle(pts[segs.length - 1], segs[segs.length - 1][1] * 0.55), fill });
  lower.push(...footShape(c, pts[pts.length - 1], angles[angles.length - 1], far));
  return { upper: [{ d: capsule(pts[0], pts[1], segs[0][1] / 2, segs[0][2] / 2), fill }], lower };
}

// ---------------------------------------------------------------- heads

interface Head { sh: Sh[]; over: string; rein: P; top: P; nose: number }

function eye(c: Ctx, at: P, r: number, mode: 'open' | 'happy', lashes: boolean, tilt = 0): string {
  const sp = c.sp;
  const brow = `<path d="M${f(at.x - r * 0.7)} ${f(at.y - r * 1.75)} Q${f(at.x + r * 0.1)} ${f(at.y - r * 2.15)} ${f(at.x + r * 0.9)} ${f(at.y - r * 1.65)}" stroke="${sp.ink}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
  if (mode === 'happy') {
    return `<g transform="rotate(${tilt} ${f(at.x)} ${f(at.y)})">` +
      `<path d="M${f(at.x - r)} ${f(at.y + 2)} Q${f(at.x)} ${f(at.y - r * 1.3)} ${f(at.x + r)} ${f(at.y + 2)}" stroke="${sp.ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>` +
      (lashes ? `<path d="M${f(at.x - r)} ${f(at.y + 1)} l-6 -3 M${f(at.x - r * 0.55)} ${f(at.y - r * 0.6)} l-4 -5" stroke="${sp.ink}" stroke-width="2.2" stroke-linecap="round"/>` : '') +
      brow + `</g>`;
  }
  const id = `${c.uid}iris`;
  c.defs.push(radG(id, [[0, shade(sp.eyeColor, 0.55)], [0.55, sp.eyeColor], [1, shade(sp.eyeColor, -0.5)]], 0.5, 0.65, 0.6));
  const sparkle = (x: number, y: number, k: number) => `<path d="M${f(x)} ${f(y - k)} L${f(x + k * 0.3)} ${f(y)} L${f(x)} ${f(y + k)} L${f(x - k * 0.3)} ${f(y)}Z M${f(x - k)} ${f(y)} L${f(x)} ${f(y - k * 0.3)} L${f(x + k)} ${f(y)} L${f(x)} ${f(y + k * 0.3)}Z" fill="#fff"/>`;
  return (
    `<g transform="rotate(${tilt} ${f(at.x)} ${f(at.y)})">` +
    `<path d="${ellipse(at, r * 0.95, r * 1.15)}" fill="#fff" stroke="${sp.ink}" stroke-width="2.2"/>` +
    // a big iris that fills most of the eye, looking forward
    `<path d="${ellipse(pt(at.x + r * 0.18, at.y + r * 0.1), r * 0.76, r * 0.98)}" fill="url(#${id})"/>` +
    `<path d="${ellipse(pt(at.x + r * 0.24, at.y + r * 0.2), r * 0.4, r * 0.54)}" fill="#1a0f12"/>` +
    `<circle cx="${f(at.x - r * 0.08)}" cy="${f(at.y - r * 0.32)}" r="${f(r * 0.34)}" fill="#fff"/>` +
    `<circle cx="${f(at.x + r * 0.5)}" cy="${f(at.y + r * 0.52)}" r="${f(r * 0.15)}" fill="#fff" opacity=".95"/>` +
    sparkle(at.x + r * 0.5, at.y - r * 0.3, r * 0.2) +
    // upper lid line
    `<path d="M${f(at.x - r * 1.05)} ${f(at.y - r * 0.15)} Q${f(at.x - r * 0.1)} ${f(at.y - r * 1.6)} ${f(at.x + r * 1.02)} ${f(at.y - r * 0.5)}" stroke="${sp.ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>` +
    (lashes ? `<path d="M${f(at.x - r * 0.95)} ${f(at.y - r * 0.45)} l-7 -4 M${f(at.x - r * 0.55)} ${f(at.y - r * 0.92)} l-5 -7 M${f(at.x)} ${f(at.y - r * 1.12)} l-2 -7" stroke="${sp.ink}" stroke-width="2.4" stroke-linecap="round"/>` : '') +
    brow + `</g>`
  );
}

/** Eye radius per animal (units at full size), for drawing and for the "faces are clear" test. */
const EYE_R: Record<AnimalId, number> = { horse: 12, unicorn: 12.5, deer: 12, reindeer: 10.5, dragon: 11.5 };

function horseHead(c: Ctx, H: P, ang: number, eyes: 'open' | 'happy', wave: number): Head {
  const sp = c.sp;
  const T = (x: number, y: number) => rot(add(H, pt(x, y)), H, -ang + 34);
  const fill = coatGrad(c, 'hd', sp.light, sp.coat, sp.dark);
  const head: P[] = [T(-4, -6), T(18, -6), T(33, 6), T(43, 24), T(51, 40), T(55, 54), T(51, 66), T(39, 71), T(26, 67), T(12, 60), T(-2, 50), T(-12, 32), T(-14, 12)];
  const earN = [T(4, -2), T(0, -26), T(10, -32), T(14, -6)];
  const sh: Sh[] = [
    { d: blob([T(-4, -2), T(-6, -24), T(4, -30), T(6, -4)], 0.9), fill: shade(sp.coat, -0.15) },
    { d: blob(head, 1), fill },
    { d: blob(earN, 0.9), fill },
  ];
  const cheek = T(12, 42);
  let over =
    `<path d="${ellipse(cheek, 15, 13)}" fill="${sp.dark}" opacity=".15"/>` +
    `<path d="${ellipse(T(22, 44), 9, 6)}" fill="#ff8fa8" opacity=".4"/>` +
    `<path d="${blob([T(3, -6), T(3, -22), T(9, -26), T(10, -7)], 0.9)}" fill="${c.id === 'unicorn' ? '#ffc4e1' : shade(sp.coat, -0.2)}"/>` +
    // muzzle shade, nostril and smile
    `<path d="${blob([T(38, 46), T(53, 52), T(54, 65), T(40, 71), T(31, 60)], 1)}" fill="${c.id === 'unicorn' ? '#ffd8ea' : shade(sp.coat, 0.18)}" opacity=".95"/>` +
    `<path d="${ellipse(T(47, 55), 3.4, 2.4)}" fill="${sp.ink}" opacity=".85"/>` +
    `<path d="M${f(T(29, 61).x)} ${f(T(29, 61).y)} Q${f(T(38, 69).x)} ${f(T(38, 69).y)} ${f(T(49, 64).x)} ${f(T(49, 64).y)}" stroke="${sp.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    eye(c, T(19, 18), EYE_R[c.id], eyes, c.id !== 'dragon', -ang * 0.2);
  if (c.id === 'unicorn') {
    // the golden spiral horn
    const b1 = T(10, -6);
    const b2 = T(22, -4);
    const tip = T(26, -48);
    const hid = `${c.uid}horn`;
    c.defs.push(linG(hid, [[0, '#fff6c2'], [0.5, '#ffd34d'], [1, '#e0a020']], 0, 0, 1, 0));
    over += `<path d="M${f(b1.x)} ${f(b1.y)} L${f(tip.x)} ${f(tip.y)} L${f(b2.x)} ${f(b2.y)}Z" fill="url(#${hid})" stroke="#a86e12" stroke-width="2" stroke-linejoin="round"/>`;
    for (let i = 1; i < 5; i++) {
      const u = i / 5;
      const l = { x: b1.x + (tip.x - b1.x) * u, y: b1.y + (tip.y - b1.y) * u };
      const r = { x: b2.x + (tip.x - b2.x) * u, y: b2.y + (tip.y - b2.y) * u };
      over += `<path d="M${f(l.x)} ${f(l.y)} L${f(r.x)} ${f(r.y - 3)}" stroke="#b97d16" stroke-width="1.4" opacity=".8"/>`;
    }
    over += `<path d="M${f(T(20, -12).x)} ${f(T(20, -12).y)} L${f(T(24, -38).x)} ${f(T(24, -38).y)}" stroke="#fff" stroke-width="1.6" opacity=".8" stroke-linecap="round"/>`;
  }
  // forelock: a lock falling forward over the brow
  const fw = Math.sin(2 * Math.PI * wave) * 2;
  over += drawLock(c, [T(-2, -6), T(12, -4), T(20, 4 + fw), T(18, 14)], 13, lockColors(c)[1]);
  return { sh, over, rein: T(40, 62), top: T(4, -30), nose: Math.max(...head.map((p) => p.x)) };
}

function deerHead(c: Ctx, H: P, ang: number, eyes: 'open' | 'happy', reindeer: boolean): Head {
  const sp = c.sp;
  const T = (x: number, y: number) => rot(add(H, pt(x, y)), H, -ang + (reindeer ? 50 : 46));
  const fill = coatGrad(c, 'hd', sp.light, sp.coat, sp.dark);
  const head: P[] = reindeer
    ? [T(-4, -4), T(16, -4), T(32, 8), T(46, 26), T(56, 44), T(54, 58), T(40, 62), T(28, 56), T(12, 48), T(-8, 32), T(-12, 10)]
    : [T(-4, -4), T(16, -6), T(30, 4), T(42, 22), T(50, 38), T(48, 50), T(36, 54), T(24, 48), T(8, 42), T(-8, 28), T(-10, 8)];
  const ear = (bx: number, by: number, len: number, w: number, a: number) => {
    const base = T(bx, by);
    const tip = rot(add(base, pt(-len * 0.5, -len)), base, a);
    const m1 = rot(add(base, pt(-len * 0.15 - w, -len * 0.55)), base, a);
    const m2 = rot(add(base, pt(-len * 0.1 + w, -len * 0.62)), base, a);
    return [base, m1, tip, m2];
  };
  const big = reindeer ? 0.7 : 1;
  const earFar = ear(0, -2, 34 * big, 10 * big, -55);
  const earNear = ear(8, 0, 38 * big, 12 * big, -40);
  const sh: Sh[] = [
    { d: blob(earFar, 0.9), fill: shade(sp.coat, -0.18) },
    { d: blob(head, 1), fill },
    { d: blob(earNear, 0.9), fill },
  ];
  const tipN = earNear[2];
  let over =
    `<path d="${blob([lerp3(earNear[0], tipN, 0.2), lerp3(earNear[1], tipN, 0.3), lerp3(tipN, earNear[0], 0.12), lerp3(earNear[3], tipN, 0.3)], 0.9)}" fill="#f6c7b4" opacity=".9"/>` +
    // white muzzle and black nose
    `<path d="${blob(reindeer ? [T(36, 40), T(54, 46), T(54, 58), T(38, 62), T(30, 52)] : [T(30, 34), T(48, 40), T(48, 50), T(34, 54), T(26, 46)], 1)}" fill="${sp.belly}"/>` +
    `<path d="${ellipse(reindeer ? T(52, 46) : T(47, 40), reindeer ? 7 : 6, reindeer ? 6 : 5)}" fill="#24140c"/>` +
    `<circle cx="${f((reindeer ? T(50, 44) : T(45, 38)).x)}" cy="${f((reindeer ? T(50, 44) : T(45, 38)).y)}" r="1.8" fill="#fff" opacity=".8"/>` +
    `<path d="M${f((reindeer ? T(32, 54) : T(27, 46)).x)} ${f((reindeer ? T(32, 54) : T(27, 46)).y)} Q${f((reindeer ? T(40, 62) : T(34, 54)).x)} ${f((reindeer ? T(40, 62) : T(34, 54)).y)} ${f((reindeer ? T(48, 57) : T(42, 50)).x)} ${f((reindeer ? T(48, 57) : T(42, 50)).y)}" stroke="${sp.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    `<path d="${ellipse(reindeer ? T(20, 40) : T(16, 34), 8, 5.5)}" fill="#ff8fa8" opacity=".4"/>` +
    eye(c, reindeer ? T(17, 13) : T(16, 13), EYE_R[c.id], eyes, !reindeer, -ang * 0.2);
  if (!reindeer) {
    // a fawn's forehead tuft
    over += `<path d="M${f(T(4, -6).x)} ${f(T(4, -6).y)} q6 -9 10 -2 q2 -8 7 -1" fill="${sp.light}" stroke="${sp.ink}" stroke-width="1.6"/>`;
  } else {
    over = antlers(c, T(2, -4), T(10, -2), ang) + over;
  }
  return { sh, over, rein: reindeer ? T(42, 56) : T(36, 50), top: reindeer ? T(0, -96) : tipN, nose: Math.max(...head.map((p) => p.x)) };
}

const lerp3 = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function antlers(c: Ctx, a: P, b: P, ang: number): string {
  // velvet-brown branching antlers, the near one drawn last
  const col = '#c9a06a';
  const ink = c.sp.ink;
  const tilt = -ang * 0.3;
  const one = (base: P, s: number, k: number) => {
    const R = (x: number, y: number) => rot(add(base, pt(x * s, y * s)), base, tilt + k);
    const main = [R(0, 0), R(-10, -30), R(-6, -60), R(-24, -88)];
    const tines = [
      [R(-8, -26), R(10, -44), R(16, -58)],
      [R(-7, -52), R(8, -68), R(10, -82)],
      [R(-14, -74), R(-2, -92), R(0, -104)],
      [R(-10, -40), R(-30, -52), R(-38, -62)],
    ];
    const strokes = [main, ...tines].map((l) => curve(l)).join(' ');
    return `<path d="${strokes}" stroke="${ink}" stroke-width="${f(11 * s)}" fill="none" stroke-linecap="round"/><path d="${strokes}" stroke="${col}" stroke-width="${f(6.5 * s)}" fill="none" stroke-linecap="round"/><path d="${curve(main)}" stroke="#e8c896" stroke-width="${f(2 * s)}" fill="none" stroke-linecap="round" transform="translate(-1.5 -1)"/>`;
  };
  return one(a, 0.85, -14) + one(b, 1, 0);
}

function dragonHead(c: Ctx, H: P, ang: number, eyes: 'open' | 'happy'): Head {
  const sp = c.sp;
  const T = (x: number, y: number) => rot(add(H, pt(x, y)), H, -ang + 58);
  const fill = coatGrad(c, 'hd', sp.light, sp.coat, sp.dark);
  const head: P[] = [T(-12, -8), T(14, -12), T(34, -4), T(50, 10), T(62, 20), T(66, 32), T(60, 44), T(42, 49), T(24, 51), T(8, 47), T(-8, 32), T(-16, 12)];
  const hornCol = '#fff0c8';
  const horn = (bx: number, by: number, len: number, a: number) => {
    const base = T(bx, by);
    const tip = rot(add(base, pt(-len, -len * 0.5)), base, a);
    return blob([rot(add(base, pt(-2, -5)), base, a), tip, rot(add(base, pt(3, 5)), base, a)], 0.4);
  };
  const sh: Sh[] = [
    { d: horn(-2, -2, 30, 10), fill: shade(hornCol, -0.15) },
    { d: blob(head, 1), fill },
    { d: horn(6, -6, 34, 0), fill: hornCol },
  ];
  // frill along the cheek, friendly smile, nostril curl, gold brow
  let over =
    `<path d="${blob([T(-8, 18), T(-24, 26), T(-14, 34), T(-26, 44), T(-6, 44), T(6, 38)], 0.8)}" fill="${sp.mane[0]}" stroke="${sp.ink}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${blob([T(20, 40), T(46, 42), T(66, 38), T(60, 46), T(40, 50), T(22, 48)], 1)}" fill="${sp.belly}" opacity=".95"/>` +
    `<path d="M${f(T(26, 38).x)} ${f(T(26, 38).y)} Q${f(T(42, 50).x)} ${f(T(42, 50).y)} ${f(T(58, 36).x)} ${f(T(58, 36).y)}" stroke="${sp.ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>` +
    `<path d="${ellipse(T(56, 22), 3.2, 2.4)}" fill="${sp.ink}" opacity=".85"/>` +
    `<path d="M${f(T(8, 2).x)} ${f(T(8, 2).y)} Q${f(T(22, -6).x)} ${f(T(22, -6).y)} ${f(T(34, 4).x)} ${f(T(34, 4).y)}" stroke="#ffd25a" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    eye(c, T(21, 13), EYE_R.dragon, eyes, false, -ang * 0.2);
  // cheek blush
  over += `<path d="${ellipse(T(10, 30), 8, 5)}" fill="#ff8a7a" opacity=".45"/>`;
  return { sh, over, rein: T(48, 44), top: T(-26, -20), nose: Math.max(...head.map((p) => p.x)) };
}

// ---------------------------------------------------------------- hair

/** Lock colours: the unicorn's rainbow, or a mane colour with its lighter and darker tones. */
function lockColors(c: Ctx): string[] {
  const m = c.sp.mane;
  if (m.length >= 5) return m;
  return [m[0], shade(m[0], -0.1), shade(m[0], 0.3), m[1] ?? m[0], shade(m[0], -0.18), shade(m[0], 0.15)];
}

function drawLock(c: Ctx, ps: P[], w: number, col: string): string {
  const d = lockPath(ps, swell(w));
  const sheen = curve([lerp3(ps[0], ps[1], 0.6), ps[1], lerp3(ps[1], ps[2], 0.6)]);
  return `<path d="${d}" fill="${col}" stroke="${c.sp.ink}" stroke-width="1.9" stroke-linejoin="round"/>` +
    `<path d="${sheen}" stroke="#fff" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/>`;
}

/**
 * The mane: full locks that start along the crest of the neck and stream back in the wind, each swelling and then
 * tapering to a curled point. Locks near the withers are drawn first, so those near the poll lie on top.
 */
function crestMane(c: Ctx, neck: P[], wave: number, ruff: boolean): string {
  if (ruff) return '';
  const crest = sample([neck[3], neck[2], neck[1], neck[0]], 3); // poll → withers
  const n = crest.length;
  const cols = lockColors(c);
  let s = '';
  for (let i = n - 1; i >= 0; i--) {
    const u = i / (n - 1);
    const b = crest[i];
    const L = 40 + Math.sin(Math.PI * Math.min(1, u * 1.3)) * 26;
    const w = Math.sin(2 * Math.PI * (wave + u * 0.7));
    const ps = [add(b, pt(8, -6)), add(b, pt(-L * 0.22, L * 0.3 + w * 3)), add(b, pt(-L * 0.5, L * 0.62 - w * 3)), add(b, pt(-L * 0.82 - w * 3, L * 0.78)), add(b, pt(-L * 1.02, L * 0.66))];
    s += drawLock(c, ps, 20 + u * 4, cols[(n - 1 - i) % cols.length]);
  }
  return s;
}

function tail(c: Ctx, root: P, lift: number, wave: number, pitch: number): string {
  const sp = c.sp;
  const R = (x: number, y: number) => rot(add(root, pt(x, y)), root, -pitch - lift);
  if (c.id === 'deer' || c.id === 'reindeer') {
    // a short upturned tail with a white underside
    const d = blob([R(2, -4), R(-14, -16), R(-22, -10), R(-12, 2), R(2, 6)], 0.9);
    return `<path d="${d}" fill="${sp.coat}" stroke="${sp.ink}" stroke-width="2.2"/><path d="${blob([R(-4, 2), R(-16, -6), R(-12, 2)], 0.9)}" fill="#fff8ee"/>`;
  }
  if (c.id === 'dragon') {
    const w = Math.sin(2 * Math.PI * wave) * 8;
    const ps = [R(6, 0), R(-30, 4), R(-62, 18 + w), R(-92, 22 - w), R(-120, 8 + w)];
    const body = ribbon(ps, 30, 8, 0.9);
    const tip = ps[ps.length - 1];
    const sp2 = rot(add(tip, pt(-6, 0)), tip, -20 + w);
    const spade = blob([add(sp2, pt(6, -2)), add(sp2, pt(-10, -14)), add(sp2, pt(-22, -2)), add(sp2, pt(-10, 10))], 0.6);
    let s = `<path d="${spade}" fill="${sp.mane[0]}" stroke="${sp.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<path d="${body}" fill="${coatGrad(c, 'tl', sp.light, sp.coat, sp.dark)}" stroke="${sp.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    // spikes along the top
    for (let i = 1; i < ps.length - 1; i++) {
      const p = ps[i];
      s += `<path d="M${f(p.x - 6)} ${f(p.y - 8 + i)} l4 -10 l6 9Z" fill="${sp.mane[0]}" stroke="${sp.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
    return s;
  }
  // a long, full tail: locks fanning out from the root, each in an S-curve
  const cols = lockColors(c);
  const n = Math.max(5, Math.min(6, cols.length));
  let s = '';
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const w = Math.sin(2 * Math.PI * (wave + k * 0.3));
    const L = 1 - Math.abs(k - 0.45) * 0.5;
    const ps = [R(6, -2 + k * 4), R(-28, -10 + k * 12 + w * 3), R(-62 * L, 2 + k * 30 - w * 5), R(-92 * L, 30 + k * 40 + w * 6), R(-104 * L, 62 * L + k * 34 - w * 4), R(-96 * L, 84 * L + k * 30)];
    s += drawLock(c, ps, 24, cols[i % cols.length]);
  }
  return s;
}

function wings(c: Ctx, base: P, mode: 'fold' | 'open' | 'up', far: boolean, wave: number): string {
  const sp = c.sp;
  const a = mode === 'open' ? -18 : mode === 'up' ? 4 : 26 + Math.sin(2 * Math.PI * wave) * 6;
  const s = far ? 0.85 : 1;
  const R = (x: number, y: number) => rot(add(base, pt(x * s, y * s)), base, a + (far ? -14 : 0));
  // arm: shoulder → elbow → wrist, then three finger bones; the membrane hangs between them in scallops
  const elbow = R(-14, -40);
  const wrist = R(-46, -70);
  const fingers = [R(-96, -64), R(-100, -30), R(-82, -6), R(-50, 4)];
  const mem: P[] = [R(6, 4), elbow, wrist, fingers[0]];
  for (let i = 1; i < fingers.length; i++) {
    const a0 = fingers[i - 1];
    const b0 = fingers[i];
    const mid = lerp3(a0, b0, 0.5);
    mem.push(lerp3(mid, wrist, 0.22), b0);
  }
  mem.push(lerp3(fingers[3], R(6, 4), 0.5));
  const memCol = far ? shade(sp.mane[0], -0.28) : sp.mane[0];
  const gid = `${c.uid}wing${far ? 'f' : 'n'}`;
  c.defs.push(linG(gid, [[0, shade(memCol, 0.3)], [1, shade(memCol, -0.15)]], 0, 0, 1, 1));
  let out = `<path d="${blob(mem, 0.35)}" fill="url(#${gid})" stroke="${sp.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const boneCol = far ? shade(sp.coat, -0.2) : sp.coat;
  const bones = [curve([R(4, 2), elbow, wrist]), ...fingers.map((fp) => `M${f(wrist.x)} ${f(wrist.y)}L${f(fp.x)} ${f(fp.y)}`)].join(' ');
  out += `<path d="${bones}" stroke="${sp.ink}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${bones}" stroke="${boneCol}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  out += `<path d="M${f(wrist.x)} ${f(wrist.y)} l-3 -9 l7 5Z" fill="#fff0c8" stroke="${sp.ink}" stroke-width="1.4"/>`;
  return out;
}

// ---------------------------------------------------------------- the whole animal

let uidN = 0;

export function drawAnimal(id: AnimalId, poseId: PoseId): AnimalArt {
  const sp = SPECIES[id];
  const pose = poseOf(poseId);
  const c: Ctx = { sp, id, defs: [], uid: `a${(uidN++).toString(36)}` };
  const C0 = pt(0, -sp.bodyY + (pose.low ? 30 : 0));
  const pitch = pose.pitch;
  const B = (p: P) => rot(add(C0, p), C0, -pitch);

  // fit the figure to the ground: find the lowest point of the legs first, then draw everything shifted
  const roots0 = [B(add(sp.hip, pt(6, -2))), B(sp.hip), B(add(sp.shoulder, pt(6, -2))), B(sp.shoulder)];
  const lowest = Math.max(...pose.legs.map((ang, i) => {
    const pts = legChain(roots0[i], ang, i < 2 ? sp.hind : sp.front);
    return Math.max(pts[pts.length - 1].y + 13, ...pts.map((p) => p.y));
  }));
  const dy = -lowest - pose.lift;
  const D = (p: P) => pt(p.x, p.y + dy);
  const legsSh = pose.legs.map((ang, i) => drawLeg(c, D(roots0[i]), ang, i < 2 ? sp.hind : sp.front, i % 2 === 0));

  // body
  const bodyPts = sp.body.map((p) => D(B(p)));
  const bodyFill = coatGrad(c, 'bd', sp.light, sp.coat, sp.dark);
  const bodySh: Sh[] = [{ d: blob(bodyPts, 1), fill: bodyFill }];
  // near shoulder and thigh masses give the body its form
  const thigh = D(B(add(sp.hip, pt(4, -16))));
  const shoulderM = D(B(add(sp.shoulder, pt(-4, -14))));

  // neck and head
  const nb = D(B(sp.neckBase));
  const neckTurn = pitch + pose.neck;
  const NK = (p: P) => rot(add(nb, p), nb, -neckTurn);
  const neckPts = sp.neck.map(NK);
  const poll = NK(sp.poll);
  const headAng = sp.headAngle - pose.head - neckTurn * 0.5;
  const head = id === 'dragon' ? dragonHead(c, poll, headAng, pose.eyes) : id === 'deer' || id === 'reindeer' ? deerHead(c, poll, headAng, pose.eyes, id === 'reindeer') : horseHead(c, poll, headAng, pose.eyes, pose.wave);
  const neckFill = coatGrad(c, 'nk', sp.light, sp.coat, sp.dark);

  let svg = '';
  // far wing, far legs
  if (id === 'dragon') svg += wings(c, D(B(pt(30, -36))), pose.wings, true, pose.wave);
  svg += inked([...legsSh[0].upper, ...legsSh[0].lower], sp.ink);
  svg += inked([...legsSh[2].upper, ...legsSh[2].lower], sp.ink);
  svg += tail(c, D(B(sp.tailRoot)), pose.tail, pose.wave, pitch);
  // body, near legs, neck and head as one inked piece
  // (the near legs join the body's silhouette, so their tops melt into it)
  svg += inked([...legsSh[1].upper, ...legsSh[1].lower, ...legsSh[3].upper, ...legsSh[3].lower, ...bodySh, { d: blob(neckPts, 1), fill: neckFill }, ...head.sh], sp.ink);
  // body shading: shadow under the belly and a soft highlight on the back
  const clip = `${c.uid}clip`;
  c.defs.push(`<clipPath id="${clip}"><path d="${blob(bodyPts, 1)}"/><path d="${blob(neckPts, 1)}"/></clipPath>`);
  const belly = D(B(pt(-4, 40)));
  c.defs.push(`<filter id="${c.uid}soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>`);
  svg += `<g clip-path="url(#${clip})">`;
  const soft = ` filter="url(#${c.uid}soft)"`;
  svg += `<path d="${ellipse(belly, 92, 26)}" fill="${sp.belly ?? sp.dark}" opacity="${sp.belly ? 0.95 : 0.5}"${sp.belly ? '' : soft}/>`;
  svg += `<path d="${ellipse(D(B(pt(-10, -30))), 70, 12)}" fill="${sp.light}" opacity=".8"${soft}/>`;
  svg += `<path d="${ellipse(add(thigh, pt(8, 10)), 30, 34)}" fill="${sp.dark}" opacity=".3"${soft}/><path d="${ellipse(add(thigh, pt(-8, -8)), 20, 22)}" fill="${sp.light}" opacity=".6"${soft}/>`;
  svg += `<path d="${ellipse(add(shoulderM, pt(-10, 6)), 14, 30)}" fill="${sp.dark}" opacity=".25"${soft}/>`;
  if (id === 'deer') {
    // fawn spots along the back
    const sr = [[-50, -24], [-30, -28], [-10, -24], [10, -28], [28, -24], [-40, -10], [-20, -12], [0, -10], [20, -12], [-58, -8]];
    sr.forEach(([x, y], i) => (svg += `<path d="${ellipse(D(B(pt(x, y))), 4.2 - (i % 3) * 0.6, 3.2)}" fill="#fff7e8" opacity=".95"/>`));
  }
  if (id === 'dragon') {
    // belly plates
    for (let i = 0; i < 7; i++) {
      const p = D(B(pt(60 - i * 22, 34 - Math.abs(i - 3) * 1.5)));
      svg += `<path d="M${f(p.x - 10)} ${f(p.y - 8)} Q${f(p.x)} ${f(p.y + 6)} ${f(p.x + 10)} ${f(p.y - 8)}" stroke="${shade(sp.belly!, -0.3)}" stroke-width="2" fill="none"/>`;
    }
  }
  if (id === 'reindeer') {
    // the white ruff on the chest
    const r0 = D(B(pt(76, -10)));
    svg += `<path d="${blob([add(r0, pt(-20, -46)), add(r0, pt(6, -40)), add(r0, pt(14, -10)), add(r0, pt(4, 14)), add(r0, pt(-8, 4)), add(r0, pt(-18, -18))], 0.9)}" fill="#f4ead8"/>`;
  }
  svg += `</g>`;
  // the near legs, over the body, then the head details
  svg += inked(legsSh[1].lower, sp.ink, 1.3);
  svg += inked(legsSh[3].lower, sp.ink, 1.3);
  // mane along the crest
  if (sp.mane.length && id !== 'dragon') svg += crestMane(c, neckPts, pose.wave, id === 'reindeer');
  if (id === 'dragon') {
    // spikes down the neck and back
    [0.2, 0.45, 0.7].forEach((t) => {
      const p = lerp3(neckPts[2], neckPts[1], t);
      svg += `<path d="M${f(p.x - 6)} ${f(p.y)} l2 -14 l9 10Z" fill="${sp.mane[0]}" stroke="${sp.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    });
    svg += wings(c, D(B(pt(18, -30))), pose.wings, false, pose.wave);
  }
  svg += head.over;

  const seat = D(B(pt(-6, -40)));
  const anchors: Anchors = {
    seat,
    seatAngle: pitch,
    rein: head.rein,
    headTop: head.top,
    top: Math.min(head.top.y, ...bodyPts.map((p) => p.y)),
    nose: head.nose,
    ground: -pose.lift,
    eyeR: EYE_R[id],
  };
  return { svg: `<defs>${c.defs.join('')}</defs>${svg}`, anchors };
}
