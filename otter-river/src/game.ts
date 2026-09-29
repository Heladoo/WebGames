import { worldArt } from './art/world';
import { itemById, ItemDef } from './art/items';
import { draw, Sprite } from './art/sprite';
import { WORLD } from './art/palette';
import { anchors, drawOtter, itemFrame, Outfit, Pose } from './otterDraw';
import { River, hash, Biome, DecorKind } from './river';
import { Fauna } from './fauna';

type PickupKind = 'shell' | 'gold' | 'fish' | 'pearl';
const VALUE: Record<PickupKind, number> = { shell: 1, gold: 5, fish: 3, pearl: 10 };

interface Pickup { kind: PickupKind; x: number; wy: number; phase: number }
interface Log { x: number; wy: number; vx: number; hit: boolean }
interface Rock { x: number; wy: number; size: number; side: number; touching: boolean }
interface Pad { x: number; wy: number; flower: boolean; frog: boolean }
interface Floater { x: number; wy: number; phase: number; kind: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number }
interface FloatText { x: number; y: number; text: string; life: number }
interface Twinkle { x: number; y: number; life: number }
interface Firefly { x: number; y: number; phase: number; sx: number; sy: number }
interface Bubble { x: number; y: number; vx: number; life: number }
interface Drop { x: number; y: number }
interface Ripple { x: number; y: number; life: number }
interface Fall { x: number; y: number; vx: number; vy: number; phase: number; kind: 'petal' | 'leaf'; tint: number }

export interface GameEvents {
  collect(value: number): void;
  bump(): void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Day → sunset → night → dawn tint keyframes: [pos, r, g, b, alpha, night]
const SKY: [number, number, number, number, number, number][] = [
  [0, 255, 255, 255, 0, 0],
  [0.48, 255, 255, 255, 0, 0],
  [0.58, 255, 170, 125, 0.32, 0],
  [0.66, 130, 118, 212, 0.44, 0.85],
  [0.86, 106, 106, 200, 0.5, 1],
  [0.94, 255, 196, 178, 0.22, 0.1],
  [1, 255, 255, 255, 0, 0],
];
const DAY_LENGTH = 240;
const OTTER_HALF = 15;
const ROCK_R: [number, number][] = [[7, 5], [10, 7], [14, 9]];

export class Game {
  vw = 320;
  vh = 400;
  t = 0;
  dist = 0;
  speed = 40;
  playing = false;
  reducedMotion = false;
  outfit: Outfit = { equipped: {}, pets: [] };
  ghost: ItemDef | null = null;
  river = new River();
  fauna = new Fauna();
  dayOffset = 0.06;

  keys = { left: false, right: false };
  pointerX: number | null = null;

  otter = { x: 160, targetX: 160, vx: 0, push: 0, blinkIn: 3, blinkT: 0, happyT: 0, bumpT: 0 };
  private followers: { x: number; y: number }[] = [];

  private pickups: Pickup[] = [];
  private logs: Log[] = [];
  private rocks: Rock[] = [];
  private pads: Pad[] = [];
  private floaters: Floater[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private twinkles: Twinkle[] = [];
  private fireflies: Firefly[] = [];
  private bubbles: Bubble[] = [];
  private drops: Drop[] = [];
  private ripples: Ripple[] = [];
  private falls: Fall[] = [];
  private lanterns: [number, number][] = [];
  private spawnIn = 1;
  private logIn = 12;
  private rockIn = 5;
  private padIn = 2;
  private floatIn = 2;
  private streamIn = 25;
  private bubbleIn = 0;
  rain = 0;
  private rainTarget = 0;
  private rainIn = rand(120, 200);
  private rainFor = 0;

  constructor(private events: GameEvents) {
    for (let i = 0; i < 20; i++) {
      this.fireflies.push({ x: rand(0, 600), y: rand(0, 600), phase: rand(0, 6.28), sx: rand(0.2, 0.5), sy: rand(0.2, 0.5) });
    }
  }

  get otterY() {
    return Math.round(this.vh * 0.64);
  }

  private get D() {
    return Math.floor(this.dist);
  }

  resize(vw: number, vh: number) {
    this.vw = vw;
    this.vh = vh;
    this.river.vw = vw;
    if (!this.playing) {
      const c = this.river.center(this.otterY - this.D);
      this.otter.x = this.otter.targetX = c;
    }
  }

  welcome() {
    const oy = this.otterY;
    for (let i = 0; i < 8; i++) {
      const wy = oy - 60 - i * 24 - this.D;
      const c = this.river.center(wy);
      this.pickups.push({ kind: i === 7 ? 'gold' : 'shell', x: c + Math.sin(i * 0.6) * this.river.width() * 0.22, wy, phase: i });
    }
    this.spawnIn = 0.5;
  }

  // ---------- Update ----------
  update(dt: number) {
    this.t += dt;
    this.dist += this.speed * dt;
    const D = this.D;
    const o = this.otter;
    const oy = this.otterY;
    const owy = oy - D;

    if (this.playing) {
      const dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      if (dir) o.targetX += dir * 150 * dt;
      if (this.pointerX !== null) o.targetX = this.pointerX;
    } else {
      o.targetX = this.river.center(owy) + Math.sin(this.t * 0.35) * this.river.width() * 0.2;
    }
    o.targetX += o.push * dt;
    o.push *= Math.exp(-dt * 3);

    // Banks & islands: the otter always stays in a channel
    const free = this.river.freeRange(o.x, owy - 34, owy + 20, OTTER_HALF);
    o.targetX = clamp(o.targetX, free.lo, free.hi);
    const prev = o.x;
    o.x += (o.targetX - o.x) * (1 - Math.exp(-dt * 4.5));
    if (o.x < free.lo || o.x > free.hi) o.x += (clamp(o.x, free.lo, free.hi) - o.x) * (1 - Math.exp(-dt * 10));

    this.resolveRocks(D);
    o.vx = (o.x - prev) / Math.max(dt, 1e-4);

    o.blinkIn -= dt;
    if (o.blinkIn <= 0) { o.blinkT = 0.14; o.blinkIn = rand(2.5, 5.5); }
    o.blinkT = Math.max(0, o.blinkT - dt);
    o.happyT = Math.max(0, o.happyT - dt);
    o.bumpT = Math.max(0, o.bumpT - dt);

    this.updateFollowers(dt);
    this.updateWeather(dt);
    if (this.playing) this.spawn(dt, D);
    this.updateThings(dt, D, o.x, oy);
    this.fauna.update(dt, this.river, D, this.vw, this.vh, oy);
  }

  private resolveRocks(D: number) {
    const o = this.otter;
    const oy = this.otterY;
    for (const r of this.rocks) {
      const [rx, ry] = ROCK_R[r.size];
      const sy = r.wy + D;
      const cy = clamp(sy, oy - 34, oy + 18);
      const dy = (sy - cy) * (rx / ry);
      const R = rx + 13;
      if (Math.abs(dy) >= R) { r.touching = false; continue; }
      const need = Math.sqrt(R * R - dy * dy);
      const dx = o.x - r.x;
      if (Math.abs(dx) >= need) { r.touching = false; continue; }
      if (!r.touching) {
        // pick the side with more room (and remember it)
        const e = this.river.freeRange(r.x, r.wy - 4, r.wy + 4, 0);
        const roomL = r.x - rx - e.lo;
        const roomR = e.hi - (r.x + rx);
        r.side = dx === 0 ? (roomR >= roomL ? 1 : -1) : Math.sign(dx);
        if (r.side < 0 && roomL < OTTER_HALF * 2 + 2) r.side = 1;
        if (r.side > 0 && roomR < OTTER_HALF * 2 + 2) r.side = -1;
        if (this.playing && Math.abs(dy) > R * 0.5) { o.bumpT = 0.5; this.events.bump(); }
        r.touching = true;
      }
      const nx = r.x + r.side * need;
      o.x = nx;
      o.targetX = r.side > 0 ? Math.max(o.targetX, nx) : Math.min(o.targetX, nx);
    }
  }

  private updateFollowers(dt: number) {
    const followers = this.outfit.pets.map((id) => itemById(id)).filter((d) => d?.pet === 'follow');
    if (this.ghost?.pet === 'follow') followers.push(this.ghost);
    while (this.followers.length < followers.length) {
      const last = this.followers[this.followers.length - 1] ?? { x: this.otter.x, y: this.otterY + 30 };
      this.followers.push({ x: last.x, y: last.y + 14 });
    }
    this.followers.length = followers.length;
    let lead = { x: this.otter.x, y: this.otterY + 30 };
    let leadHalf = 0;
    const k = 1 - Math.exp(-dt * 2.2);
    this.followers.forEach((f, i) => {
      const half = (followers[i]?.frames[0].h ?? 12) / 2;
      const tx = lead.x + Math.sin(this.t * 0.9 + i) * 4;
      const ty = lead.y + leadHalf + half + 5;
      leadHalf = half;
      f.x += (tx - f.x) * k;
      f.y += (ty - f.y) * k;
      const wy = Math.round(f.y) - this.D;
      const free = this.river.freeRange(f.x, wy - 4, wy + 4, 6);
      f.x = clamp(f.x, free.lo, free.hi);
      lead = f;
    });
  }

  private updateWeather(dt: number) {
    if (this.reducedMotion) { this.rain = 0; return; }
    this.rainIn -= dt;
    if (this.rainIn <= 0 && this.rainTarget === 0) {
      this.rainTarget = 1;
      this.rainFor = rand(22, 34);
    }
    if (this.rainTarget > 0) {
      this.rainFor -= dt;
      if (this.rainFor <= 0) { this.rainTarget = 0; this.rainIn = rand(160, 260); }
    }
    this.rain += (this.rainTarget - this.rain) * (1 - Math.exp(-dt * 0.5));
    if (this.rain < 0.01 && this.rainTarget === 0) this.rain = 0;

    const want = Math.round(90 * this.rain * (this.vw / 320));
    while (this.drops.length < want) this.drops.push({ x: rand(0, this.vw + 40), y: rand(-this.vh, 0) });
    if (this.drops.length > want) this.drops.length = want;
    for (const d of this.drops) {
      d.x -= 40 * dt;
      d.y += 260 * dt;
      if (d.y > this.vh) {
        if (Math.random() < 0.5) this.ripples.push({ x: d.x, y: d.y - rand(0, this.vh * 0.9), life: 0.7 });
        d.y = rand(-40, 0);
        d.x = rand(0, this.vw + 40);
      }
    }
    for (const r of this.ripples) r.life -= dt;
    this.ripples = this.ripples.filter((r) => r.life > 0);

    // petals / leaves drifting through their biomes
    const biome = this.river.biome(Math.round(this.vh * 0.4) - this.D);
    if (biome.particles && !this.reducedMotion && Math.random() < dt * 2.2) {
      this.falls.push({
        x: rand(-20, this.vw), y: -6, vx: rand(8, 18), vy: rand(12, 20), phase: rand(0, 6),
        kind: biome.particles === 'petals' ? 'petal' : 'leaf', tint: Math.floor(rand(0, 3)),
      });
    }
    for (const f of this.falls) {
      f.x += (f.vx + Math.sin(this.t * 1.5 + f.phase) * 10) * dt;
      f.y += f.vy * dt;
    }
    this.falls = this.falls.filter((f) => f.y < this.vh + 8);
  }

  private hasIslandNear(wy: number) {
    return [-60, -30, 0, 30, 60].some((d) => this.river.channels(wy + d).length > 1);
  }

  private spawn(dt: number, D: number) {
    const wy = -16 - D;
    const chs = this.river.channels(wy);
    const pickChannel = () => chs[Math.floor(Math.random() * chs.length)];

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = rand(0.45, 0.95);
      const ch = pickChannel();
      const roll = Math.random();
      const kind: PickupKind = roll < 0.04 ? 'pearl' : roll < 0.12 ? 'gold' : roll < 0.3 ? 'fish' : 'shell';
      const x = rand(ch.l + 14, ch.r - 14);
      if (!this.rocks.some((r) => Math.abs(r.x - x) < 22 && Math.abs(r.wy - wy) < 20)) this.pickups.push({ kind, x, wy, phase: rand(0, 6.28) });
    }

    this.streamIn -= dt;
    if (this.streamIn <= 0 && chs.length === 1) {
      this.streamIn = rand(22, 36);
      const ch = chs[0];
      const cx = (ch.l + ch.r) / 2;
      const amp = (ch.r - ch.l) * 0.3;
      for (let i = 0; i < 10; i++) {
        this.pickups.push({ kind: i === 9 ? 'gold' : 'shell', x: cx + Math.sin(i * 0.6) * amp, wy: wy - i * 20, phase: i });
      }
    }

    this.rockIn -= dt;
    if (this.rockIn <= 0) {
      this.rockIn = rand(5, 10);
      if (!this.hasIslandNear(wy - 20)) {
        const size = Math.floor(Math.random() * 3);
        const [rx] = ROCK_R[size];
        const ch = chs[0];
        const x = Math.random() < 0.5 ? (Math.random() < 0.5 ? ch.l + rx - 2 : ch.r - rx + 2) : rand(ch.l + rx, ch.r - rx);
        const roomL = x - rx - ch.l;
        const roomR = ch.r - x - rx;
        if (Math.max(roomL, roomR) >= OTTER_HALF * 2 + 8) this.rocks.push({ x, wy: wy - 20, size, side: 1, touching: false });
      }
    }

    this.logIn -= dt;
    if (this.logIn <= 0) {
      this.logIn = rand(10, 18);
      if (!this.hasIslandNear(wy - 10)) {
        const ch = chs[0];
        if (ch.r - ch.l > 90) this.logs.push({ x: rand(ch.l + 24, ch.r - 24), wy: wy - 10, vx: rand(-5, 5), hit: false });
      }
    }

    const biome = this.river.biome(wy);
    this.padIn -= dt;
    if (this.padIn <= 0) {
      this.padIn = rand(2.5, 6) / biome.pads;
      const ch = pickChannel();
      const nearLeft = Math.random() < 0.5;
      this.pads.push({
        x: nearLeft ? ch.l + rand(6, 16) : ch.r - rand(6, 16),
        wy: wy - 10,
        flower: Math.random() < 0.45,
        frog: Math.random() < 0.3,
      });
    }

    this.floatIn -= dt;
    if (this.floatIn <= 0) {
      this.floatIn = rand(1.5, 4);
      const ch = pickChannel();
      const kind = biome.id === 'forest' ? 1 + Math.floor(Math.random() * 2) : biome.id === 'blossom' ? 3 : 0;
      this.floaters.push({ x: rand(ch.l + 6, ch.r - 6), wy: wy - 6, phase: rand(0, 6.28), kind });
    }
  }

  private updateThings(dt: number, D: number, ox: number, oy: number) {
    const cy = oy - 12;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const sy = p.wy + D;
      if (sy > this.vh + 20) { this.pickups.splice(i, 1); continue; }
      const dx = ox - p.x;
      const dy = cy - sy;
      const d = Math.hypot(dx, dy * 0.7);
      if (this.playing && d < 46 && d > 0) {
        const pull = (1 - d / 46) * 80 * dt;
        p.x += (dx / d) * pull;
        p.wy += (dy / d) * pull;
      }
      if (this.playing && d < 24) {
        this.pickups.splice(i, 1);
        this.collect(p, sy);
      }
    }

    for (let i = this.logs.length - 1; i >= 0; i--) {
      const lg = this.logs[i];
      lg.x += lg.vx * dt;
      lg.wy += 6 * dt;
      const sy = lg.wy + D;
      const e = this.river.freeRange(lg.x, lg.wy - 6, lg.wy + 6, 20);
      lg.x = clamp(lg.x, e.lo, e.hi);
      if (sy > this.vh + 30) { this.logs.splice(i, 1); continue; }
      const nx = clamp(ox, lg.x - 19, lg.x + 19);
      const ny = clamp(cy, sy - 5, sy + 5);
      const hit = Math.abs(ox - nx) < 15 && Math.abs(cy - ny) < 26;
      if (hit && !lg.hit && this.playing) {
        const dir = Math.sign(ox - lg.x) || 1;
        this.otter.push = dir * 120;
        this.otter.bumpT = 0.7;
        lg.vx = -dir * 10;
        this.events.bump();
      }
      lg.hit = hit;
    }

    this.rocks = this.rocks.filter((r) => r.wy + D < this.vh + 30);
    this.pads = this.pads.filter((p) => p.wy + D < this.vh + 30);
    this.floaters = this.floaters.filter((l) => l.wy + D < this.vh + 20);
    for (const l of this.floaters) l.x += Math.sin(this.t * 0.8 + l.phase) * 5 * dt;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 3);
      p.vy *= Math.exp(-dt * 3);
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const tx of this.texts) { tx.y -= 20 * dt; tx.life -= dt; }
    this.texts = this.texts.filter((tx) => tx.life > 0);

    if (!this.reducedMotion && Math.random() < dt * 6) {
      const y = rand(0, this.vh);
      const chs = this.river.channels(y - D);
      const ch = chs[Math.floor(Math.random() * chs.length)];
      this.twinkles.push({ x: rand(ch.l + 6, ch.r - 6), y, life: 0.5 });
    }
    for (const tw of this.twinkles) tw.life -= dt;
    this.twinkles = this.twinkles.filter((tw) => tw.life > 0);

    for (const f of this.fireflies) {
      f.x += Math.sin(this.t * f.sx + f.phase) * 10 * dt;
      f.y += Math.cos(this.t * f.sy + f.phase) * 8 * dt + this.speed * dt * 0.2;
      if (f.y > this.vh + 5) { f.y = -5; f.x = rand(0, this.vw); }
      if (f.x < -5 || f.x > this.vw + 5) f.x = rand(0, this.vw);
    }

    // bubble wand
    const held = itemById(this.outfit.equipped.held);
    if (held?.special === 'bubbles' && !this.reducedMotion) {
      this.bubbleIn -= dt;
      if (this.bubbleIn <= 0) {
        this.bubbleIn = rand(0.25, 0.6);
        const [px, py] = anchors(Math.round(ox), oy, this.pose()).pawR;
        this.bubbles.push({ x: px + rand(-2, 2), y: py - 14, vx: rand(-6, 10), life: rand(1.6, 2.8) });
      }
    }
    for (const b of this.bubbles) {
      b.x += (b.vx + Math.sin(this.t * 3 + b.life) * 6) * dt;
      b.y -= 16 * dt;
      b.life -= dt;
      if (b.life <= 0) this.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.25, max: 0.25 });
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0);
  }

  private collect(p: Pickup, sy: number) {
    const v = VALUE[p.kind];
    this.texts.push({ x: p.x, y: sy - 10, text: `+${v}`, life: 1 });
    const n = v >= 5 ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.particles.push({ x: p.x, y: sy, vx: Math.cos(a) * 46, vy: Math.sin(a) * 46, life: 0.5, max: 0.5 });
    }
    if (v >= 5) this.otter.happyT = 0.9;
    this.events.collect(v);
  }

  pose(): Pose {
    const t = this.t;
    const o = this.otter;
    const rm = this.reducedMotion;
    const breath = Math.sin((t * Math.PI * 2) / 2.8);
    const moving = Math.abs(o.vx) > 10;
    const paddle = Math.floor(t * 5) % 2;
    return {
      bob: rm ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 3.4) * 1.5),
      hb: breath > 0.35 ? 1 : 0,
      lean: Math.abs(o.vx) > 25 ? Math.sign(o.vx) : 0,
      pawL: moving && o.vx > 0 ? -paddle * 2 : breath < -0.35 ? -1 : 0,
      pawR: moving && o.vx < 0 ? -paddle * 2 : breath < -0.35 ? -1 : 0,
      tail: rm ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 2.2) * 1.4),
      eyes: o.bumpT > 0 || o.blinkT > 0 ? 'closed' : o.happyT > 0 ? 'happy' : 'open',
    };
  }

  dayPhase() {
    return ((this.t / DAY_LENGTH) + this.dayOffset) % 1;
  }

  sky() {
    const p = this.dayPhase();
    for (let i = 1; i < SKY.length; i++) {
      if (p <= SKY[i][0]) {
        const a = SKY[i - 1];
        const b = SKY[i];
        const k = (p - a[0]) / (b[0] - a[0]);
        const mix = (j: number) => a[j] + (b[j] - a[j]) * k;
        return { r: mix(1), g: mix(2), b: mix(3), a: mix(4), night: mix(5), phase: p };
      }
    }
    return { r: 255, g: 255, b: 255, a: 0, night: 0, phase: p };
  }

  // ---------- Render ----------
  render(ctx: CanvasRenderingContext2D) {
    const art = worldArt();
    const D = this.D;
    const { vw, vh, t } = this;
    const sky = this.sky();
    const golden = sky.phase > 0.5 && sky.phase < 0.64;

    ctx.fillStyle = WORLD.water;
    ctx.fillRect(0, 0, vw, vh);
    this.renderTerrain(ctx, D);
    this.lanterns = [];
    this.renderDecor(ctx, D);

    // water level
    for (const r of this.ripples) {
      ctx.globalAlpha = r.life;
      ctx.strokeStyle = WORLD.foam;
      const rr = Math.round((0.7 - r.life) * 8) + 1;
      ctx.strokeRect(Math.round(r.x) - rr, Math.round(r.y), rr * 2, 1);
      ctx.globalAlpha = 1;
    }
    for (const l of this.floaters) {
      const s = l.kind === 3 ? art.petal : art.leaves[l.kind === 0 ? 0 : l.kind];
      draw(ctx, s, l.x, l.wy + D + Math.round(Math.sin(t + l.phase)));
    }
    for (const p of this.pads) {
      const y = p.wy + D;
      draw(ctx, art.lilyPad, p.x, y);
      if (p.flower) draw(ctx, art.lilyFlower, p.x - 2, y - 1);
      else if (p.frog) draw(ctx, art.frog, p.x, y - 2 - (Math.sin(t * 2 + p.x) > 0.95 ? 2 : 0));
    }
    for (const tw of this.twinkles) {
      if (sky.night > 0.5) draw(ctx, art.star, tw.x, tw.y);
      else draw(ctx, art.sparkle[tw.life > 0.25 ? 1 : 0], tw.x, tw.y);
    }
    if (golden) {
      ctx.fillStyle = '#ffe9a0';
      for (const tw of this.twinkles) ctx.fillRect(Math.round(tw.x) + 3, Math.round(tw.y) + 2, 2, 1);
    }
    this.fauna.renderLow(ctx, D);
    for (const r of this.rocks) {
      const y = r.wy + D;
      const [rx, ry] = ROCK_R[r.size];
      this.ring(ctx, r.x, y + 2, rx + 3, ry + 1, 0.35, WORLD.waterDeep);
      if (!this.reducedMotion && Math.floor(t * 2 + r.x) % 2 === 0) this.foamArc(ctx, r.x, y - ry - 1, rx);
      draw(ctx, art.rocks[r.size], r.x, y);
    }
    for (const lg of this.logs) {
      const y = lg.wy + D;
      this.ring(ctx, lg.x, y + 1, 22, 8, 0.35, WORLD.waterDeep);
      draw(ctx, art.log, lg.x, y);
    }
    for (const p of this.pickups) {
      const y = p.wy + D + Math.round(Math.sin(t * 2 + p.phase));
      this.ring(ctx, p.x, y + 3, 8, 3, 0.25, WORLD.waterDeep);
      draw(ctx, this.pickupSprite(p.kind), p.x, y);
      if (p.kind === 'pearl' && Math.sin(t * 5 + p.phase) > 0.6) draw(ctx, art.sparkle[0], p.x + 5, y - 5);
    }

    // otter + friends
    const ox = Math.round(this.otter.x);
    const oy = this.otterY;
    const pose = this.pose();
    const ghostAlpha = 0.55 + Math.sin(t * 4) * 0.2;
    const followDefs = this.outfit.pets.map((id) => itemById(id)).filter((d): d is ItemDef => d?.pet === 'follow');
    if (this.ghost?.pet === 'follow') followDefs.push(this.ghost);
    this.followers.forEach((f, i) => {
      const def = followDefs[i];
      if (!def) return;
      if (def === this.ghost) ctx.globalAlpha = ghostAlpha;
      this.drawFollower(ctx, def, f.x, f.y, i);
      ctx.globalAlpha = 1;
    });
    this.otterWake(ctx, ox, oy + pose.bob);
    drawOtter(ctx, ox, oy, pose, this.outfit, t, this.ghost ?? undefined);
    const flyers = this.outfit.pets.map((id) => itemById(id)).filter((d): d is ItemDef => d?.pet === 'fly');
    if (this.ghost?.pet === 'fly') flyers.push(this.ghost);
    flyers.forEach((def, i) => {
      const ph = i * 2.4;
      const bx = ox + Math.round(Math.sin(t * 0.9 + ph) * 26);
      const by = oy - 52 + Math.round(Math.sin(t * 1.7 + ph) * 8);
      if (def === this.ghost) ctx.globalAlpha = ghostAlpha;
      draw(ctx, itemFrame(def, t + i * 0.1), bx, by);
      ctx.globalAlpha = 1;
    });

    for (const b of this.bubbles) draw(ctx, art.bubble, b.x, b.y);
    for (const p of this.particles) draw(ctx, art.sparkle[p.life > p.max / 2 ? 0 : 1], p.x, p.y);
    this.fauna.renderHigh(ctx);
    for (const f of this.falls) {
      const s = f.kind === 'petal' ? art.petal : art.leaves[1 + (f.tint % 2)];
      draw(ctx, s, f.x, f.y);
    }
    for (const tx of this.texts) {
      ctx.globalAlpha = Math.min(1, tx.life * 2);
      this.drawText(ctx, tx.text, tx.x, tx.y);
      ctx.globalAlpha = 1;
    }

    // rain
    if (this.rain > 0.01) {
      ctx.globalAlpha = 0.75 * this.rain;
      ctx.fillStyle = '#f4fbff';
      for (const d of this.drops) { ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 6); ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y) + 6, 1, 2); }
      ctx.globalAlpha = 1;
    }

    // time of day (+ a little gloom when raining)
    const gloom = this.rain * 0.18;
    if (sky.a > 0.001 || gloom > 0.001) {
      ctx.globalCompositeOperation = 'multiply';
      const a = Math.min(0.6, sky.a + gloom);
      const mixc = (c: number, g: number) => Math.round(c * (1 - gloom) + g * gloom);
      ctx.fillStyle = `rgba(${mixc(sky.r, 170)},${mixc(sky.g, 185)},${mixc(sky.b, 215)},${a})`;
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = 'source-over';
    }
    // dawn mist
    if (sky.phase > 0.9 || sky.phase < 0.04) {
      const m = sky.phase > 0.9 ? (sky.phase - 0.9) / 0.1 : 1 - sky.phase / 0.04;
      const s = Math.sin(Math.PI * Math.min(1, m));
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) {
        const y = Math.round(((i * 71 + t * 6) % (vh + 40)) - 20);
        ctx.globalAlpha = 0.1 * s;
        ctx.fillRect(Math.round(Math.sin(t * 0.2 + i) * 30) - 40, y, vw + 80, 6 + (i % 3) * 3);
      }
      ctx.globalAlpha = 1;
    }
    if (sky.night > 0.02) {
      for (const [lx, ly] of this.lanterns) this.glow(ctx, lx, ly, sky.night, '#ffe3a0', 9);
      for (const f of this.fireflies) {
        const g = sky.night * (0.5 + 0.5 * Math.sin(t * 2 + f.phase * 3));
        if (g < 0.1) continue;
        this.glow(ctx, f.x, f.y, g, '#fff3a0', 2);
      }
    }
  }

  private glow(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, color: string, r: number) {
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillStyle = color;
    ctx.globalAlpha = a * 0.18;
    ctx.fillRect(x - r, y - 1, r * 2 + 1, 3);
    ctx.fillRect(x - 1, y - r, 3, r * 2 + 1);
    ctx.fillRect(x - r + 2, y - r + 2, r * 2 - 3, r * 2 - 3);
    ctx.globalAlpha = a * 0.35;
    ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fffbe6';
    ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
  }

  private renderTerrain(ctx: CanvasRenderingContext2D, D: number) {
    const { vw, vh, t } = this;
    for (let y = 0; y < vh; y++) {
      const wy = y - D;
      const chs = this.river.channels(wy);
      const biome = this.river.biome(wy);
      const h = hash(wy);
      const sand = biome.sand;

      for (const ch of chs) {
        const w = ch.r - ch.l;
        if (h % 9 === 0 && w > 16) {
          const x = ch.l + 6 + ((h >>> 9) % (w - 12)) + Math.round(Math.sin(t * 0.7 + wy) * 2);
          ctx.fillStyle = WORLD.waterLight;
          ctx.fillRect(x, y, 3 + ((h >>> 5) % 7), 1);
        } else if (h % 11 === 0 && w > 16) {
          ctx.fillStyle = WORLD.waterDeep;
          ctx.fillRect(ch.l + 6 + ((h >>> 9) % (w - 12)), y, 4 + ((h >>> 4) % 6), 1);
        }
        ctx.fillStyle = WORLD.waterLight;
        ctx.fillRect(ch.l, y, 3, 1);
        ctx.fillRect(ch.r - 3, y, 3, 1);
        if (Math.sin(t * 1.6 + wy * 0.25) > 0.3) {
          ctx.fillStyle = WORLD.foam;
          ctx.fillRect(ch.l, y, 1, 1);
          ctx.fillRect(ch.r - 1, y, 1, 1);
        }
      }

      const L = chs[0].l;
      const R = chs[chs.length - 1].r;
      this.bankRow(ctx, y, 0, L, biome, sand, h, 'right');
      this.bankRow(ctx, y, R, vw, biome, sand, h >>> 3, 'left');
      if (chs.length > 1) this.bankRow(ctx, y, chs[0].r, chs[1].l, biome, 3, h >>> 5, 'both');
    }
  }

  /** One row of land between x0 and x1 with sand on its water side(s). */
  private bankRow(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number, b: Biome, sand: number, h: number, water: 'left' | 'right' | 'both') {
    const w = x1 - x0;
    if (w <= 0) return;
    const sl = water !== 'right' ? Math.min(sand, Math.floor(w / 2)) : 0;
    const sr = water !== 'left' ? Math.min(sand, Math.ceil(w / 2)) : 0;
    ctx.fillStyle = WORLD.sand;
    if (sl) ctx.fillRect(x0, y, sl, 1);
    if (sr) ctx.fillRect(x1 - sr, y, sr, 1);
    ctx.fillStyle = WORLD.sandDark;
    if (sl) ctx.fillRect(x0, y, 1, 1);
    if (sr) ctx.fillRect(x1 - 1, y, 1, 1);
    const g0 = x0 + sl;
    const gw = w - sl - sr;
    if (gw <= 0) return;
    ctx.fillStyle = b.grass;
    ctx.fillRect(g0, y, gw, 1);
    if (h % 3 === 0) {
      ctx.fillStyle = b.grassLight;
      ctx.fillRect(g0 + ((h >>> 4) % gw), y, 2, 1);
    } else if (h % 4 === 1) {
      ctx.fillStyle = b.grassDark;
      ctx.fillRect(g0 + ((h >>> 4) % gw), y, 1, 1);
    }
    if (gw > 20 && h % 5 === 2) {
      ctx.fillStyle = b.grassDark;
      ctx.fillRect(g0 + ((h >>> 12) % gw), y, 2, 1);
    }
  }

  private decorSprite(kind: DecorKind, b: Biome, h: number): Sprite {
    const art = worldArt();
    switch (kind) {
      case 'flower': return art.flowers[b.flowers[h % b.flowers.length]];
      case 'tuft': return art.tuft;
      case 'bush': return art.bush;
      case 'berryBush': return art.berryBush;
      case 'round': return art.trees.round;
      case 'pine': return art.trees.pine;
      case 'cherry': return art.trees.cherry;
      case 'mushroom': return art.mushroom;
      case 'rock': return art.rocks[h % 2];
      case 'bench': return art.bench;
      case 'lantern': return art.lantern;
      case 'fence': return art.fence;
      case 'reeds': return art.reeds;
      case 'shell': return h % 3 ? art.shell : art.goldShell;
    }
  }

  private pickDecor(b: Biome, h: number): DecorKind {
    const total = b.decor.reduce((s, [, w]) => s + w, 0);
    let r = h % total;
    for (const [k, w] of b.decor) { if (r < w) return k; r -= w; }
    return 'tuft';
  }

  private renderDecor(ctx: CanvasRenderingContext2D, D: number) {
    const art = worldArt();
    for (let y = -24; y < this.vh + 44; y++) {
      const wy = y - D;
      const h = hash(wy * 31 + 7);
      const b = this.river.biome(wy);
      const chs = this.river.channels(wy);
      const L = chs[0].l;
      const R = chs[chs.length - 1].r;

      // reeds hugging the water's edge
      if (h % 23 === 0) {
        const left = (h >>> 7) % 2 === 0;
        if (b.id === 'marsh' || h % 3 === 0) draw(ctx, art.reeds, left ? L - 2 : R + 2, y);
        continue;
      }
      // island decor
      if (chs.length > 1 && h % 5 === 1) {
        const iw = chs[1].l - chs[0].r;
        if (iw > 14) {
          const k = this.pickDecor(b, h >>> 6);
          const s = this.decorSprite(k === 'fence' || k === 'bench' ? 'flower' : k, b, h >>> 11);
          if (s.w + 6 < iw) {
            const x = chs[0].r + 3 + s.px + ((h >>> 14) % Math.max(1, iw - s.w - 6));
            draw(ctx, s, x, y);
            if (k === 'lantern') this.lanterns.push([x, y - 16]);
          }
        }
        continue;
      }
      if (h % 4 !== 0) continue;
      const left = (h >>> 3) % 2 === 0;
      const bank = left ? L - b.sand : this.vw - R - b.sand;
      const k = this.pickDecor(b, h >>> 6);
      const s = this.decorSprite(k, b, h >>> 11);
      if (s.w + 4 > bank) continue;
      const pos = ((h >>> 13) % 1000) / 1000;
      // shells sit on the sand; everything else on the grass
      let x: number;
      if (k === 'shell') x = left ? L - b.sand / 2 : R + b.sand / 2;
      else x = left ? 2 + s.px + pos * (bank - s.w - 4) : R + b.sand + 2 + s.px + pos * (bank - s.w - 4);
      draw(ctx, s, x, y);
      if (k === 'lantern') this.lanterns.push([Math.round(x), y - 16]);
    }
  }

  private pickupSprite(kind: PickupKind): Sprite {
    const a = worldArt();
    return kind === 'shell' ? a.shell : kind === 'gold' ? a.goldShell : kind === 'fish' ? a.fish : a.pearl;
  }

  private ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, alpha: number, color: string) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let dy = -ry; dy <= ry; dy++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  private foamArc(ctx: CanvasRenderingContext2D, cx: number, y: number, rx: number) {
    ctx.fillStyle = WORLD.foam;
    ctx.globalAlpha = 0.8;
    for (let i = -rx; i <= rx; i += 2) ctx.fillRect(Math.round(cx + i), Math.round(y + (i * i) / (rx * 3)), 1, 1);
    ctx.globalAlpha = 1;
  }

  private otterWake(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
    this.ring(ctx, ox + 2, oy - 8, 19, 30, 0.28, WORLD.waterDeep);
    if (this.reducedMotion) return;
    const rx = 23;
    const ry = 36;
    const step = Math.floor(this.t * 3);
    ctx.fillStyle = WORLD.foam;
    for (let i = 0; i < 44; i++) {
      if ((i + step) % 4 === 0) continue;
      const a = (i / 44) * Math.PI * 2;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(Math.round(ox + Math.cos(a) * rx), Math.round(oy - 8 + Math.sin(a) * ry), i % 7 === 0 ? 2 : 1, 1);
    }
    ctx.fillStyle = WORLD.waterLight;
    for (let i = 0; i < 12; i++) {
      if ((i + step) % 3 === 0) continue;
      ctx.globalAlpha = 0.8 - i * 0.06;
      ctx.fillRect(ox - 7 - i, oy + 28 + i * 2, 2, 1);
      ctx.fillRect(ox + 6 + i, oy + 28 + i * 2, 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  private drawFollower(ctx: CanvasRenderingContext2D, pet: ItemDef, fx: number, fy: number, i: number) {
    const x = Math.round(fx);
    const y = Math.round(fy + Math.sin(this.t * 2.4 + i));
    this.ring(ctx, x, y + 5, 9, 3, 0.3, WORLD.waterDeep);
    if (!this.reducedMotion && Math.floor(this.t * 3 + i) % 2 === 0) {
      ctx.fillStyle = WORLD.waterLight;
      ctx.fillRect(x - 8, y + 7, 3, 1);
      ctx.fillRect(x + 6, y + 7, 3, 1);
    }
    draw(ctx, itemFrame(pet, this.t), x, y);
  }

  private drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    const digits = worldArt().digits;
    const sprites = [...text].map((c) => digits[c]).filter(Boolean);
    const w = sprites.reduce((s, sp) => s + sp.w - 1, 0);
    let cx = Math.round(x - w / 2);
    for (const s of sprites) {
      draw(ctx, s, cx, Math.round(y));
      cx += s.w - 1;
    }
  }
}
