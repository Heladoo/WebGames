// Draws the race on a Canvas 2D from the pictures painted beforehand (sprites.ts). Nothing here changes the race;
// it only reads the simulation.
//
// Layout: on landscape screens the 1600 x 900 stage covers the screen by its height and the camera keeps the child's
// runner at 36% of the width. On portrait phones the stage sits at the top, and the big
// buttons sit in the ground-coloured space below it.
// (on portrait screens the stage shows about 720 units across, so the runners stay big)
//
// Depth: the lanes are drawn far to near; within a lane, the back of an obstacle (a far post or trunk), then the
// candies, the runners and the front of the obstacle, so a runner passes between an arch's posts and under a branch.

import { RUNNER_BOX, RUNNER_DRAW } from '../art/sprite';
import { LANE_SCALE, LANE_Y, PARALLAX, STAGE_H, STAGE_W, TRACK_TOP, skyPalace, trackFloor, type Layer, type TrackId } from '../art/tracks';
import type { PoseId } from '../art/animals';
import { DUCK_GAP } from '../art/props';
import { CANDY_BOX, PALACE_BOX, PROP_BOX, type Frames, type PropPics } from './sprites';
import { Race, type RaceEvent, type Runner } from './sim';

export interface Pics {
  runners: Frames[];
  layers: Record<Layer, HTMLCanvasElement>;
  props: PropPics[]; // by obstacle kind index
  candies: Record<string, HTMLCanvasElement>;
  extra: Record<string, HTMLCanvasElement>; // up, down, palace
}

/** CSS pixels per stage unit, and the stage's place, for a screen of this size. */
export function stageLayout(W: number, H: number) {
  const portrait = W / H < 1;
  const s = portrait ? Math.min(W / 720, (H - 200) / STAGE_H) : H / STAGE_H;
  const top = portrait ? Math.max(0, Math.min(H * 0.1, H - STAGE_H * s - 190)) : 0;
  return { portrait, s, top, vw: W / s };
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; kind: 'spark' | 'star' | 'dust' | 'rainbow'; color: string; size: number }

const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];

const laneY = (f: number) => {
  const i = Math.max(0, Math.min(1, Math.floor(f)));
  const t = Math.max(0, Math.min(2, f)) - i;
  return LANE_Y[i] + (LANE_Y[i + 1] - LANE_Y[i]) * t;
};
const laneK = (f: number) => {
  const i = Math.max(0, Math.min(1, Math.floor(f)));
  const t = Math.max(0, Math.min(2, f)) - i;
  return LANE_SCALE[i] + (LANE_SCALE[i + 1] - LANE_SCALE[i]) * t;
};

export function poseFor(ru: Runner): PoseId {
  if (ru.finish >= 0 && ru.speed < 140) return 'happy';
  if (ru.bump > 0.45) return 'bump';
  if (ru.air >= 0) return 'jump';
  if (ru.duck > 0) return 'duck';
  return `run${Math.floor(ru.phase * 6) % 6}` as PoseId;
}

export class RaceView {
  private g: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private s = 1;
  private top = 0;
  private vw = STAGE_W;
  private camX = 0;
  private snap = true;
  private time = 0;
  private dust = 0;
  private particles: Particle[] = [];
  reduced = false;

  constructor(private cv: HTMLCanvasElement, private race: Race, private pics: Pics, private track: TrackId) {
    this.g = cv.getContext('2d')!;
    this.layout();
  }

  layout() {
    const r = this.cv.getBoundingClientRect();
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.cv.width = Math.round(this.W * this.dpr);
    this.cv.height = Math.round(this.H * this.dpr);
    const l = stageLayout(this.W, this.H);
    this.s = l.s;
    this.top = l.top;
    this.vw = l.vw;
  }

  /** Where a stage point is on screen (CSS px), for DOM things placed over the canvas. */
  toScreen(x: number, y: number) {
    return { x: (x - this.camX) * this.s, y: this.top + y * this.s };
  }

  /** Effects for race events. */
  onEvent(e: RaceEvent) {
    if (this.reduced && e.type !== 'candy') return;
    const ru = this.race.runners[e.id];
    const k = RUNNER_DRAW * laneK(ru.laneF);
    const gy = laneY(ru.laneF);
    if (e.type === 'candy') {
      const c = e.candy;
      const cy = gy - (c.high ? 300 : 150) * k;
      for (let i = 0; i < (this.reduced ? 4 : 12); i++) {
        const a = (i / 12) * Math.PI * 2;
        this.particles.push({ x: c.x, y: cy, vx: Math.cos(a) * 160 + ru.speed * 0.6, vy: Math.sin(a) * 160, life: 0, max: 0.6, kind: 'spark', color: i % 2 ? '#fff6b0' : RAINBOW[i % 6], size: 7 });
      }
    } else if (e.type === 'bump') {
      for (let i = 0; i < 6; i++) this.particles.push({ x: ru.x + 30, y: gy - 330 * k, vx: Math.cos(i) * 60 + ru.speed * 0.5, vy: -40 - i * 10, life: 0, max: 1.1, kind: 'star', color: '#ffe066', size: 13 });
    } else if (e.type === 'jump' || e.type === 'lane') {
      for (let i = 0; i < 5; i++) this.particles.push({ x: ru.x - 60 + i * 20, y: gy, vx: -40 + i * 20, vy: -30 - i * 6, life: 0, max: 0.5, kind: 'dust', color: '#fff4dc', size: 16 });
    }
  }

  draw(dt: number) {
    const g = this.g;
    const { s, top } = this;
    this.time += dt;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const race = this.race;
    const me = race.me;
    const target = me.x - this.vw * 0.36;
    this.camX = this.snap ? target : this.camX + (target - this.camX) * Math.min(1, dt * 6);
    this.snap = false;
    const camX = this.camX;

    // below the stage on tall phones: the ground colour
    g.fillStyle = trackFloor(this.track);
    g.fillRect(0, 0, this.W, this.H);

    // the sky does not move; it is scaled up to cover very wide screens
    const f = Math.max(1, this.vw / STAGE_W);
    const sky = this.pics.layers.sky;
    const skyW = STAGE_W * s * f;
    g.drawImage(sky, (this.W - skyW) / 2, top + STAGE_H * s * (1 - f), skyW, STAGE_H * s * f);
    this.palaceNear();
    this.tile('far', camX);
    this.tile('mid', camX);
    this.tile('ground', camX);
    this.finishLine(camX, 'ground');

    const lo = camX - 500;
    const hi = camX + this.vw + 500;
    const obs = race.course.obstacles.filter((o) => o.x > lo && o.x < hi);
    const candies = race.course.candies.filter((c) => c.taken < 0 && c.x > lo && c.x < hi);
    for (let lane = 0; lane < 3; lane++) {
      const k = RUNNER_DRAW * LANE_SCALE[lane];
      const gy = LANE_Y[lane];
      const laneObs = obs.filter((o) => o.lanes.includes(lane));
      for (const o of laneObs) {
        const p = this.pics.props[o.kind];
        if (p.back) this.blit(p.back, PROP_BOX, o.x, gy, k);
      }
      if (lane === 0) this.finishLine(camX, 'back');
      for (const c of candies) {
        if (c.lane !== lane) continue;
        const pic = this.pics.candies[`${c.kind}:${c.kind === 'gold' ? 0 : c.tone}`];
        const bob = this.reduced ? 0 : Math.sin(this.time * 3 + c.x * 0.01) * 8;
        this.blit(pic, CANDY_BOX, c.x, gy - (c.high ? 300 : 150) * k + bob * k, k);
      }
      const here = race.runners.filter((r) => Math.round(r.laneF) === lane).sort((a, b) => a.x - b.x);
      for (const ru of here) this.runner(ru);
      for (const o of laneObs) this.blit(this.pics.props[o.kind].front, PROP_BOX, o.x, gy, k);
    }
    this.finishLine(camX, 'front');
    this.effects(dt, camX);
    this.tile('front', camX);
    this.hint(camX);
  }

  private tile(l: Layer, camX: number) {
    const pic = this.pics.layers[l];
    const off = (((camX * PARALLAX[l]) % STAGE_W) + STAGE_W) % STAGE_W;
    const w = STAGE_W * this.s;
    for (let x0 = -off * this.s; x0 < this.W; x0 += w) this.g.drawImage(pic, Math.floor(x0), this.top, Math.ceil(w) + 1, STAGE_H * this.s);
  }

  /** Draw a painted picture whose local origin sits at stage point (x, y), at size k. */
  private blit(pic: HTMLCanvasElement, box: { x: number; y: number; w: number; h: number }, x: number, y: number, k: number) {
    const { s } = this;
    this.g.drawImage(pic, (x - this.camX + box.x * k) * s, this.top + (y + box.y * k) * s, box.w * k * s, box.h * k * s);
  }

  private runner(ru: Runner) {
    const g = this.g;
    const k = RUNNER_DRAW * laneK(ru.laneF);
    const gy = laneY(ru.laneF);
    const lift = Race.lift(ru) * k;
    const sx = (ru.x - this.camX) * this.s;
    const sy = this.top + gy * this.s;
    // the child's own runner stands in a soft golden glow
    g.save();
    if (ru.id === this.race.player) {
      g.fillStyle = 'rgba(255,240,150,0.5)';
      g.beginPath();
      g.ellipse(sx, sy, 190 * k * this.s, 26 * k * this.s, 0, 0, Math.PI * 2);
      g.fill();
    }
    const shrink = 1 - Math.min(0.5, lift / 300);
    g.fillStyle = 'rgba(74,42,16,0.22)';
    g.beginPath();
    g.ellipse(sx - 10 * k * this.s, sy + 2 * this.s, 150 * k * this.s * shrink, 16 * k * this.s * shrink, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // a rainbow dash leaves a trail
    if (ru.dash > 0 && !this.reduced && Math.random() < 0.6)
      this.particles.push({ x: ru.x - 120 * k, y: gy - (120 + Math.random() * 120) * k - lift, vx: -60, vy: (Math.random() - 0.5) * 30, life: 0, max: 0.6, kind: 'rainbow', color: RAINBOW[Math.floor(Math.random() * 6)], size: 9 });
    if (ru.id === this.race.player && ru.air < 0 && ru.speed > 120 && !this.reduced) {
      this.dust += 1;
      if (this.dust % 9 === 0) this.particles.push({ x: ru.x - 110 * k, y: gy, vx: -50, vy: -20, life: 0, max: 0.5, kind: 'dust', color: '#fff4dc', size: 12 });
    }
    // a runner in front of the child's own (a nearer lane, overlapping it) turns see-through, so the child never
    // loses sight of their animal
    const me = this.race.me;
    const cover = ru.id !== this.race.player && ru.laneF > me.laneF + 0.5 && Math.abs(ru.x - me.x) < 330;
    if (cover) this.g.globalAlpha = 0.45;
    this.blit(this.pics.runners[ru.id][poseFor(ru)], RUNNER_BOX, ru.x, gy - lift, k);
    this.g.globalAlpha = 1;
  }

  /** Near the finish the palace on the horizon grows and sharpens, as if the race were riding up to it. */
  private palaceNear() {
    const pic = this.pics.extra.palace;
    if (!pic) return;
    const prog = this.race.me.x / this.race.course.length;
    const u = Math.max(0, Math.min(1, (prog - 0.65) / 0.35));
    const e = u * u * (3 - 2 * u);
    if (e <= 0) return;
    // the same spot as the sky's palace (the sky is centred and scaled to cover the screen)
    const P = skyPalace(this.track);
    const f = Math.max(1, this.vw / STAGE_W);
    const { s, top } = this;
    const skyX = (this.W - STAGE_W * s * f) / 2;
    const skyY = top + STAGE_H * s * (1 - f);
    const k = P.s * f * (1 + (P.s > 1 ? 0.25 : 0.9) * e);
    const bx = skyX + P.x * s * f;
    const by = skyY + (P.y + 40 * e) * s * f;
    this.g.globalAlpha = e;
    this.g.drawImage(pic, bx + PALACE_BOX.x * k * s, by + PALACE_BOX.y * k * s, PALACE_BOX.w * k * s, PALACE_BOX.h * k * s);
    this.g.globalAlpha = 1;
  }

  private finishLine(camX: number, part: 'ground' | 'back' | 'front') {
    const g = this.g;
    const X = this.race.course.length;
    const sx = (X - camX) * this.s;
    if (sx < -300 || sx > this.W + 300) return;
    const { s, top } = this;
    if (part === 'ground') {
      // a checkered strip across the three lanes
      const n = 12;
      for (let i = 0; i < n; i++) {
        const y0 = TRACK_TOP + 10 + (i * (STAGE_H - TRACK_TOP - 10)) / n;
        const h = (STAGE_H - TRACK_TOP - 10) / n;
        const lean = (y0 - TRACK_TOP) * 0.18;
        for (let j = 0; j < 2; j++) {
          g.fillStyle = (i + j) % 2 ? '#ffffff' : '#4a2a5c';
          g.fillRect(sx + (lean + j * 18) * s, top + y0 * s, 18 * s, h * s + 0.5);
        }
      }
      return;
    }
    const post = (x: number, y: number, k: number) => {
      const px = sx + x * s;
      g.fillStyle = '#ffcf3a';
      g.strokeStyle = '#4a2a5c';
      g.lineWidth = 3 * k * s;
      g.beginPath();
      g.rect(px - 8 * k * s, top + (y - 420 * k) * s, 16 * k * s, 420 * k * s);
      g.fill();
      g.stroke();
      g.fillStyle = RAINBOW[(Math.floor(x) & 3) + 1];
      g.beginPath();
      g.arc(px, top + (y - 430 * k) * s, 14 * k * s, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    };
    const far = { x: 40, y: LANE_Y[0] - 40 };
    const near = { x: 150, y: LANE_Y[2] + 20 };
    if (part === 'back') {
      post(far.x, far.y, 0.8);
      return;
    }
    post(near.x, near.y, 1);
    // the banner between the posts, with little flags
    const a = { x: sx + far.x * s, y: top + (far.y - 400 * 0.8) * s };
    const b = { x: sx + near.x * s, y: top + (near.y - 400) * s };
    g.strokeStyle = '#4a2a5c';
    g.lineWidth = 4 * s;
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 30 * s, b.x, b.y);
    g.stroke();
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t + 30 * s * 2 * t * (1 - t);
      g.fillStyle = RAINBOW[i % 6];
      g.beginPath();
      g.moveTo(x - 9 * s, y);
      g.lineTo(x + 9 * s, y);
      g.lineTo(x, y + 22 * s);
      g.closePath();
      g.fill();
    }
  }

  private effects(dt: number, camX: number) {
    const g = this.g;
    const { s, top } = this;
    this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'star' || p.kind === 'spark') p.vy += 120 * dt;
      const a = 1 - p.life / p.max;
      const x = (p.x - camX) * s;
      const y = top + p.y * s;
      const r = p.size * s * (p.kind === 'dust' ? 1 + p.life * 2 : 1);
      g.globalAlpha = p.kind === 'dust' ? a * 0.5 : a;
      g.fillStyle = p.color;
      if (p.kind === 'dust' || p.kind === 'rainbow') {
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      } else {
        // a four-pointed sparkle (stars spin a little)
        const rot = p.kind === 'star' ? p.life * 4 : 0;
        g.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = rot + (i * Math.PI) / 4;
          const rr = i % 2 ? r * 0.35 : r;
          g.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
        }
        g.closePath();
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  /** A glowing bubble with the right arrow above the next obstacle in the child's lane. */
  private hint(camX: number) {
    const me = this.race.me;
    if (me.finish >= 0) return;
    const a = this.race.ahead(me);
    if (!a || a.t > 2.4) return;
    const o = a.o;
    const lane = Math.round(me.laneF);
    const k = RUNNER_DRAW * LANE_SCALE[lane];
    const gy = LANE_Y[lane];
    const pic = this.pics.extra[o.act === 'jump' ? 'up' : 'down'];
    const ob = this.pics.props[o.kind].ob;
    // above a low obstacle; in front of an overhead one, at the height the rider's head would be
    const y = o.act === 'jump' ? gy + ob.top * k - 70 : gy - (DUCK_GAP - 60) * k;
    const x = o.act === 'jump' ? o.x : o.x - 150 * k;
    const { s, top } = this;
    const pulse = this.reduced ? 1 : 1 + 0.08 * Math.sin(this.time * 7);
    const r = Math.max(26, Math.min(54, 70 * s * 1.3)) * pulse;
    const cx = (x - camX) * s;
    const cy = top + y * s;
    const g = this.g;
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
    grad.addColorStop(0, 'rgba(255,251,224,0.98)');
    grad.addColorStop(0.62, 'rgba(255,243,184,0.85)');
    grad.addColorStop(1, 'rgba(255,243,184,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    g.fill();
    g.drawImage(pic, cx - r * 0.75, cy - r * 0.75, r * 1.5, r * 1.5);
  }
}
