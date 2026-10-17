// The race as a pure, deterministic simulation (a seed and the inputs decide everything; no DOM), so it can be
// drawn by the view, driven by tests and calibrated by running hundreds of races at once (?debug=sim).
//
// Stress free by design:
// - Hitting an obstacle is a short stumble: speed dips to 55% and comes back over about a second. It never stops.
// - Pressing early is fine. A jump pressed up to ~1.3 s before an obstacle is "aimed": it waits a moment and/or floats
//   longer so the runner is in the air when it passes. Ducking likewise lasts until the obstacle is passed.
// - Help mode dodges for the child some of the time; the first races slow down before the first obstacles and show
//   which button to press (the tutorial), and if nothing is pressed the animal jumps by itself.
// - Opponents are gentle rubber bands: those ahead ease off a little and those behind catch up a little, so races
//   stay close and children win about half of them (checked by the simulation tests).

import { rng } from '../art/paint';
import { OBSTACLE_ACT, TRACK_OBSTACLES, type Act, type CandyId } from '../art/props';
import type { TrackId } from '../art/tracks';
import { DIFFICULTY } from '../content';

export const BASE_SPEED = 330; // stage units per second
export const JUMP_TIME = 0.9; // seconds in the air for a plain jump
export const MAX_JUMP = 1.7; // longest aimed jump
export const DUCK_TIME = 0.8;
export const BUMP_TIME = 1.1;
export const LANE_SPEED = 4.5; // lanes per second
export const STRIDE = 320; // stage units per gallop cycle
const AIM = 1.3; // how early (seconds) a press still counts for the next obstacle

export interface Obst { x: number; lanes: number[]; act: Act; kind: number; hit: number[] }
/** `taken` lists who has taken it: every runner takes its own, so an opponent never takes a candy away from the child. */
export interface Candy { x: number; lane: number; high: boolean; kind: CandyId; tone: number; taken: number[] }
export interface Course { length: number; obstacles: Obst[]; candies: Candy[] }

export interface Runner {
  id: number;
  x: number;
  lane: number; // the lane it is heading for
  laneF: number; // where it is now (moves smoothly between lanes)
  speed: number;
  bar: number; // the rainbow bar, 0..1
  dash: number; // seconds of rainbow dash left
  air: number; // seconds since take-off, or -1 on the ground
  airLen: number; // how long this jump lasts
  jumpAt: number; // a queued (aimed) take-off time, or -1
  duck: number; // seconds of ducking left
  bump: number; // seconds of stumble left
  phase: number; // gallop phase, 0..1
  finish: number; // finishing time, or -1
  candies: number;
  hits: number;
  skill: number; // opponent accuracy, or -1 for a child-controlled runner
  pace: number;
  react: number; // opponent reaction time
  plans: Record<number, 'act' | 'dodge' | 'miss'>;
  seek: number; // next time it looks for candies
}

export interface Input { jump?: boolean; duck?: boolean; lane?: -1 | 1 }

export type RaceEvent =
  | { type: 'candy'; id: number; candy: Candy }
  | { type: 'bump' | 'jump' | 'duck' | 'dash' | 'finish' | 'lane' | 'pass'; id: number };

export interface RaceOptions {
  track: TrackId;
  seed: number;
  tutorial?: boolean;
  help?: boolean;
  /** Drive the child's runner like an opponent with this accuracy (tests and autopilot); 0 = never press anything;
   * undefined = real input. */
  autopilot?: number;
}

export function buildCourse(track: TrackId, seed: number, tutorial: boolean): Course {
  const d = DIFFICULTY[track];
  const r = rng(seed * 7919 + 13);
  const kinds = TRACK_OBSTACLES[track];
  const jumpKinds = kinds.map((k, i) => [k, i] as const).filter(([k]) => OBSTACLE_ACT[k] === 'jump').map(([, i]) => i);
  const duckKinds = kinds.map((k, i) => [k, i] as const).filter(([k]) => OBSTACLE_ACT[k] === 'duck').map(([, i]) => i);
  const obstacles: Obst[] = [];
  const candies: Candy[] = [];
  const candyKinds: CandyId[] = ['wrapped', 'lolly', 'swirl'];
  const addCandy = (x: number, lane: number, high: boolean) => {
    const gold = r() < 0.06;
    candies.push({ x, lane, high, kind: gold ? 'gold' : candyKinds[Math.floor(r() * 3)], tone: Math.floor(r() * 5), taken: [] });
  };
  let x = tutorial ? 2600 : 2000;
  let n = 0;
  while (x < d.length - 1600) {
    let lanes: number[];
    let act: Act;
    if (tutorial && n < 3) {
      // the first three obstacles of a tutorial race: in the middle lane, jump, duck, jump
      lanes = [1];
      act = n === 1 ? 'duck' : 'jump';
    } else {
      const lane = Math.floor(r() * 3);
      lanes = [lane];
      if (r() < d.doubles) lanes.push(lane === 0 ? 1 : lane === 2 ? 1 : r() < 0.5 ? 0 : 2);
      act = r() < 0.38 ? 'duck' : 'jump';
    }
    const pool = act === 'jump' ? jumpKinds : duckKinds;
    obstacles.push({ x, lanes: lanes.sort(), act, kind: pool[Math.floor(r() * pool.length)], hit: [] });
    // candies above a jump obstacle reward the jump
    if (act === 'jump' && r() < 0.35) [-60, 0, 60].forEach((dx) => addCandy(x + dx, lanes[0], true));
    const gap = tutorial && n < 3 ? 2300 : d.gap[0] + r() * (d.gap[1] - d.gap[0]);
    // a little line of candies between obstacles
    const cl = Math.floor(r() * 3);
    const cn = 3 + Math.floor(r() * 3);
    const c0 = x + 320 + r() * Math.max(0, gap - 320 - cn * 110 - 300);
    for (let i = 0; i < cn; i++) addCandy(c0 + i * 110, cl, false);
    x += gap;
    n++;
  }
  return { length: d.length, obstacles, candies };
}

function runner(id: number, lane: number, x: number, skill: number, pace: number, react: number): Runner {
  return { id, x, lane, laneF: lane, speed: 0, bar: 0, dash: 0, air: -1, airLen: JUMP_TIME, jumpAt: -1, duck: 0, bump: 0, phase: (id * 0.37) % 1, finish: -1, candies: 0, hits: 0, skill, pace, react, plans: {}, seek: 0 };
}

export class Race {
  readonly course: Course;
  readonly runners: Runner[];
  readonly player = 0;
  t = 0;
  started = false;
  done = false;
  order: number[] = [];
  /** Time scale (the tutorial slows everything near its first obstacles). */
  slow = 1;
  /** The obstacle the tutorial is waiting on, if any. */
  hint: Obst | null = null;
  events: RaceEvent[] = [];
  private r: () => number;
  private tutorial: boolean;
  private help: boolean;
  private autopilot: number | undefined;
  private waited = 0;
  private taught = 0;
  private helped: Record<number, boolean> = {};

  constructor(o: RaceOptions) {
    this.tutorial = !!o.tutorial;
    this.help = !!o.help;
    this.autopilot = o.autopilot;
    this.course = buildCourse(o.track, o.seed, this.tutorial);
    this.r = rng(o.seed * 104729 + 7);
    const d = DIFFICULTY[o.track];
    const skill = () => d.ai[0] + this.r() * (d.ai[1] - d.ai[0]);
    this.runners = [
      runner(0, 1, 0, o.autopilot ?? -1, 1, 0.55),
      runner(1, 0, 40, skill(), 0.96 + this.r() * 0.04, 0.4 + this.r() * 0.3),
      runner(2, 2, -40, skill(), 0.96 + this.r() * 0.04, 0.4 + this.r() * 0.3),
      runner(3, 0, -200, skill(), 0.96 + this.r() * 0.04, 0.4 + this.r() * 0.3),
      runner(4, 2, -240, skill(), 0.96 + this.r() * 0.04, 0.4 + this.r() * 0.3),
    ];
  }

  get me() {
    return this.runners[this.player];
  }

  /** The next obstacle ahead of a runner in its lane, and how many seconds away it is. */
  ahead(ru: Runner, lane = Math.round(ru.laneF)): { o: Obst; i: number; t: number } | null {
    const v = Math.max(ru.speed, BASE_SPEED * 0.6);
    for (let i = 0; i < this.course.obstacles.length; i++) {
      const o = this.course.obstacles[i];
      if (o.x < ru.x) continue;
      if (!o.lanes.includes(lane)) continue;
      return { o, i, t: (o.x - ru.x) / v };
    }
    return null;
  }

  private laneFree(lane: number, from: number, to: number) {
    return lane >= 0 && lane <= 2 && !this.course.obstacles.some((o) => o.x > from && o.x < to && o.lanes.includes(lane));
  }

  /** Start a jump; if an obstacle is coming, aim it so the runner is in the air as it passes. */
  private jump(ru: Runner) {
    if (ru.air >= 0 || ru.jumpAt >= 0 || ru.finish >= 0) return;
    ru.duck = 0;
    const a = this.ahead(ru);
    if (a && a.o.act === 'jump' && a.t < AIM) {
      // land a little after passing it: wait if it is far, float longer if it is near
      const need = a.t + 0.32;
      if (need > MAX_JUMP) {
        ru.jumpAt = this.t + (need - MAX_JUMP);
        ru.airLen = MAX_JUMP;
        return;
      }
      ru.airLen = Math.max(JUMP_TIME, need);
    } else ru.airLen = JUMP_TIME;
    ru.air = 0;
    this.events.push({ type: 'jump', id: ru.id });
  }

  private duck(ru: Runner) {
    if (ru.air >= 0 || ru.finish >= 0) return;
    ru.jumpAt = -1;
    const a = this.ahead(ru);
    ru.duck = a && a.o.act === 'duck' && a.t < AIM ? Math.max(DUCK_TIME, a.t + 0.35) : DUCK_TIME;
    this.events.push({ type: 'duck', id: ru.id });
  }

  private changeLane(ru: Runner, dir: -1 | 1) {
    const to = ru.lane + dir;
    if (to < 0 || to > 2 || ru.finish >= 0) return;
    ru.lane = to;
    this.events.push({ type: 'lane', id: ru.id });
  }

  /** What an opponent (or the autopilot) does: plan each obstacle once, then act at its reaction time. */
  private think(ru: Runner) {
    const a = this.ahead(ru, ru.lane);
    // between obstacles, steer toward candies in the next lane now and then (as a child would)
    if ((!a || a.t > 1.6) && this.t >= ru.seek && Math.round(ru.laneF) === ru.lane) {
      ru.seek = this.t + 0.7;
      const c = this.course.candies.find((c) => !c.taken.includes(ru.id) && c.x - ru.x > 200 && c.x - ru.x < 900 && Math.abs(c.lane - ru.lane) === 1 && !c.high);
      if (c && this.laneFree(c.lane, ru.x, c.x + 300) && this.r() < ru.skill * 0.7) this.changeLane(ru, (c.lane - ru.lane) as -1 | 1);
    }
    if (!a) return;
    let plan = ru.plans[a.i];
    if (!plan && a.t < 2.5) {
      const x = this.r();
      plan = x < ru.skill ? 'act' : x < ru.skill + (1 - ru.skill) * 0.35 ? 'dodge' : 'miss';
      ru.plans[a.i] = plan;
      if (plan === 'dodge') {
        const opts = [ru.lane - 1, ru.lane + 1].filter((l) => this.laneFree(l, ru.x, a.o.x + 500));
        if (opts.length) this.changeLane(ru, (opts[Math.floor(this.r() * opts.length)] - ru.lane) as -1 | 1);
        else ru.plans[a.i] = 'act';
      }
    }
    if (ru.plans[a.i] === 'act' && a.t < ru.react && Math.round(ru.laneF) === ru.lane) {
      if (a.o.act === 'jump') this.jump(ru);
      else if (ru.duck <= 0) this.duck(ru);
    }
  }

  step(dtReal: number, input: Input = {}) {
    if (this.done) return;
    const dt = Math.min(0.05, dtReal) * this.slow;
    this.t += dt;
    const me = this.me;

    // the child's input (or the autopilot)
    if (this.autopilot === undefined) {
      if (input.lane) this.changeLane(me, input.lane);
      if (input.jump) this.jump(me);
      if (input.duck) this.duck(me);
    } else if (this.autopilot > 0) this.think(me);

    // the tutorial: slow down before each of the first obstacles until the right button is pressed
    if (this.tutorial && this.taught < 3 && me.finish < 0) {
      const a = this.ahead(me);
      const acting = me.air >= 0 || me.jumpAt >= 0 || me.duck > 0;
      if (a && a.t < 1.1 && !acting) {
        this.hint = a.o;
        this.slow += (0.3 - this.slow) * Math.min(1, dtReal * 6);
        this.waited += dtReal;
        if (this.waited > 2.6) (a.o.act === 'jump' ? this.jump(me) : this.duck(me));
      } else {
        if (this.hint && (acting || !a || a.o !== this.hint)) {
          this.taught++;
          this.waited = 0;
          this.hint = null;
        }
        this.slow += (1 - this.slow) * Math.min(1, dtReal * 4);
      }
    } else this.slow += (1 - this.slow) * Math.min(1, dtReal * 4);

    // help mode: now and then the animal dodges by itself when the child did nothing
    if (this.help && this.autopilot === undefined && me.finish < 0) {
      const a = this.ahead(me);
      if (a && a.t < 0.32 && me.air < 0 && me.jumpAt < 0 && me.duck <= 0) {
        if (this.helped[a.i] === undefined) this.helped[a.i] = this.r() < 0.6;
        if (this.helped[a.i]) (a.o.act === 'jump' ? this.jump(me) : this.duck(me));
      }
    }

    for (const ru of this.runners) if (ru.skill >= 0 && ru.id !== this.player) this.think(ru);

    for (const ru of this.runners) this.move(ru, dt);

    // the end: when the child has finished and the others too (or a few seconds later), the order is known
    const fin = me.finish;
    if (fin >= 0 && (this.runners.every((r) => r.finish >= 0) || this.t - fin > 3)) {
      this.order = [...this.runners].sort((a, b) => (a.finish >= 0 ? a.finish : 1e9 - a.x) - (b.finish >= 0 ? b.finish : 1e9 - b.x)).map((r) => r.id);
      this.done = true;
    }
  }

  private move(ru: Runner, dt: number) {
    if (!this.started) return;
    const me = this.me;
    // speed: base, candy bar, rainbow dash, stumble, rubber band, and an easy coast after the finish
    let target = BASE_SPEED * ru.pace * (1 + 0.35 * ru.bar + (ru.dash > 0 ? 0.4 : 0));
    if (ru.bump > 0) target *= 0.55 + 0.45 * (1 - ru.bump / BUMP_TIME);
    if (ru.id !== this.player) {
      const d = ru.x - me.x;
      target *= d > 0 ? 1 - Math.min(0.12, (d / 2000) * 0.12) : 1 + Math.min(0.04, (-d / 2500) * 0.04);
    }
    if (ru.finish >= 0) target = BASE_SPEED * 0.3;
    ru.speed += (target - ru.speed) * Math.min(1, dt * (ru.speed < 60 ? 1.5 : 3));
    const x0 = ru.x;
    ru.x += ru.speed * dt;
    ru.phase = (ru.phase + (ru.speed * dt) / STRIDE) % 1;
    // lanes
    const dl = ru.lane - ru.laneF;
    ru.laneF += Math.sign(dl) * Math.min(Math.abs(dl), LANE_SPEED * dt);
    // timers
    if (ru.jumpAt >= 0 && this.t >= ru.jumpAt) {
      ru.jumpAt = -1;
      ru.air = 0;
      this.events.push({ type: 'jump', id: ru.id });
    }
    if (ru.air >= 0) {
      ru.air += dt;
      if (ru.air >= ru.airLen) ru.air = -1;
    }
    ru.duck = Math.max(0, ru.duck - dt);
    ru.bump = Math.max(0, ru.bump - dt);
    ru.dash = Math.max(0, ru.dash - dt);
    ru.bar = Math.max(0, ru.bar - 0.035 * dt);
    const lane = Math.round(ru.laneF);
    // obstacles crossed this step
    for (const o of this.course.obstacles) {
      if (o.x <= x0 || o.x > ru.x || !o.lanes.includes(lane) || o.hit.includes(ru.id)) continue;
      const ok = o.act === 'jump' ? ru.air >= 0 : ru.duck > 0;
      if (ok) this.events.push({ type: 'pass', id: ru.id });
      else {
        o.hit.push(ru.id);
        ru.bump = BUMP_TIME;
        ru.hits++;
        ru.air = -1;
        ru.duck = 0;
        this.events.push({ type: 'bump', id: ru.id });
      }
    }
    // candies
    for (const c of this.course.candies) {
      if (c.taken.includes(ru.id) || c.x <= x0 - 20 || c.x > ru.x + 20 || c.lane !== lane) continue;
      if (c.high && ru.air < 0) continue;
      c.taken.push(ru.id);
      ru.candies++;
      ru.bar += c.kind === 'gold' ? 0.3 : 0.12;
      this.events.push({ type: 'candy', id: ru.id, candy: c });
      if (ru.bar >= 1) {
        ru.bar = 0;
        ru.dash = 2.2;
        this.events.push({ type: 'dash', id: ru.id });
      }
    }
    if (ru.finish < 0 && ru.x >= this.course.length) {
      ru.finish = this.t;
      this.events.push({ type: 'finish', id: ru.id });
    }
  }

  /** The runners' current places (1 = leading), by finish time and then distance. */
  places(): number[] {
    const sorted = [...this.runners].sort((a, b) => (a.finish >= 0 ? a.finish : 1e9 - a.x) - (b.finish >= 0 ? b.finish : 1e9 - b.x));
    const out: number[] = [];
    sorted.forEach((r, i) => (out[r.id] = i + 1));
    return out;
  }

  /** Height of a runner's jump arc above its pose (stage units, near lane). */
  static lift(ru: Runner): number {
    if (ru.air < 0) return 0;
    const u = ru.air / ru.airLen;
    return 4 * u * (1 - u) * (90 + 30 * Math.min(1, (ru.airLen - JUMP_TIME) / (MAX_JUMP - JUMP_TIME)));
  }
}
