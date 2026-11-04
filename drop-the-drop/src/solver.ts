// An exact solver for a level's current state: can the cups still be filled,
// and what is the first move of the shortest way to do it?
//
// The game asks it after each move (not every frame). It searches the moves a
// player can make with the drops (join two, split one, give one glitter, pour
// one into a cup), breadth first, so the first move it returns belongs to a
// shortest solution. Positions on the paper don't matter here, only what the
// drops are. Amounts are kept in quarters (integers), so halves of halves are exact.

import { sameColor, share, type Pig } from './color';

export interface SDrop { p: [number, number, number]; g: boolean }   // paint in quarters, glitter
export interface SCup { pig: Pig; need: number; room: number; g: boolean } // need and room in quarters
export interface SLevel { mixing: boolean; glue: boolean }

export type Move =
  | { kind: 'pour'; drop: number; cup: number }
  | { kind: 'join'; a: number; b: number }   // b joins a (indices in the starting list)
  | { kind: 'split'; drop: number }
  | { kind: 'glitter'; drop: number };

export interface Answer {
  /** 'yes' with a first move, 'no' (a dead end), or 'unknown' (search too big: assume it can be done) */
  solvable: 'yes' | 'no' | 'unknown';
  move?: Move;
}

const Q = 4;
const vol = (d: SDrop) => d.p[0] + d.p[1] + d.p[2];
const asPig = (d: SDrop): Pig => [d.p[0] / Q, d.p[1] / Q, d.p[2] / Q];

/** Could this drop still end up (alone or with others, split or not) in some cup? */
function couldFit(d: SDrop, cups: SCup[], lv: SLevel): boolean {
  return cups.some((c) => {
    if (c.room <= 0) return false;
    if (d.g && !c.g) return false;
    if (!d.g && c.g && !lv.glue) return false;
    const t = share(c.pig);
    for (let s = 1; s === 1 || vol(d) * s >= Q - 0.01; s /= 2) {
      if (d.p.every((v, k) => v * s <= t[k] * c.room + 0.01)) return true;
    }
    return false;
  });
}

function key(drops: SDrop[], cups: SCup[]): string {
  return drops.map((d) => d.p.join(',') + (d.g ? '*' : '')).sort().join('|') + '#' + cups.map((c) => c.room).join(',');
}

interface Node { drops: SDrop[]; cups: SCup[]; first?: Move }

export function solve(start: SDrop[], cups0: SCup[], lv: SLevel, budget = 12000): Answer {
  if (cups0.every((c) => c.room <= 0)) return { solvable: 'yes' };
  const seen = new Set<string>([key(start, cups0)]);
  let queue: Node[] = [{ drops: start, cups: cups0 }];
  let n = 0;
  while (queue.length) {
    const next: Node[] = [];
    for (const node of queue) {
      if (++n > budget) return { solvable: 'unknown' };
      const { drops, cups } = node;
      const kids: [SDrop[], SCup[], Move][] = [];
      // pour
      drops.forEach((d, i) => cups.forEach((c, j) => {
        if (c.room <= 0 || c.g !== d.g || vol(d) < c.need - 0.01 || vol(d) > c.room + 0.01) return;
        if (!sameColor(asPig(d), c.pig)) return;
        const nc = cups.map((x, k) => (k === j ? { ...x, room: x.room - vol(d) } : x));
        kids.push([drops.filter((_, k) => k !== i), nc, { kind: 'pour', drop: i, cup: j }]);
      }));
      // join
      for (let i = 0; i < drops.length; i++) for (let j = i + 1; j < drops.length; j++) {
        const a = drops[i], b = drops[j];
        if (!lv.mixing && !sameColor(asPig(a), asPig(b))) continue;
        const m: SDrop = { p: [a.p[0] + b.p[0], a.p[1] + b.p[1], a.p[2] + b.p[2]], g: a.g || b.g };
        if (!couldFit(m, cups, lv)) continue;
        const [big, small] = vol(a) >= vol(b) ? [i, j] : [j, i];
        kids.push([[...drops.filter((_, k) => k !== i && k !== j), m], cups, { kind: 'join', a: big, b: small }]);
      }
      // split (only drops of 2 or more, into exact halves)
      drops.forEach((d, i) => {
        if (vol(d) < 2 * Q - 0.01 || d.p.some((v) => v % 2)) return;
        const h: SDrop = { p: [d.p[0] / 2, d.p[1] / 2, d.p[2] / 2], g: d.g };
        if (!couldFit(h, cups, lv)) return;
        kids.push([[...drops.filter((_, k) => k !== i), h, { ...h, p: [...h.p] as SDrop['p'] }], cups, { kind: 'split', drop: i }]);
      });
      // glitter
      if (lv.glue) drops.forEach((d, i) => {
        if (d.g) return;
        const gd: SDrop = { p: d.p, g: true };
        if (!couldFit(gd, cups, lv)) return;
        kids.push([drops.map((x, k) => (k === i ? gd : x)), cups, { kind: 'glitter', drop: i }]);
      });
      for (const [kd, kc, mv] of kids) {
        const first = node.first ?? mv;
        if (kc.every((c) => c.room <= 0)) return { solvable: 'yes', move: first };
        if (!kd.every((d) => couldFit(d, kc, lv))) continue;
        const k = key(kd, kc);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ drops: kd, cups: kc, first });
      }
    }
    queue = next;
  }
  return { solvable: 'no' };
}

/** Quarters from a paint amount. */
export const quarters = (p: Pig): SDrop['p'] => [Math.round(p[0] * Q), Math.round(p[1] * Q), Math.round(p[2] * Q)];
export const QUARTER = Q;
