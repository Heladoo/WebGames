import { worldArt } from './art/world';
import { itemById, ItemDef } from './art/items';
import { draw, Sprite } from './art/sprite';
import { WORLD } from './art/palette';
import { drawOtter, Equipped, itemFrame, Pose } from './otterDraw';

type PickupKind = 'shell' | 'gold' | 'fish' | 'pearl';
const VALUE: Record<PickupKind, number> = { shell: 1, gold: 5, fish: 3, pearl: 10 };

interface Pickup { kind: PickupKind; x: number; wy: number; phase: number }
interface Log { x: number; wy: number; vx: number; hit: boolean }
interface Pad { x: number; wy: number; flower: boolean; frog: boolean }
interface Leaf { x: number; wy: number; phase: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number }
interface FloatText { x: number; y: number; text: string; life: number }
interface Twinkle { x: number; y: number; life: number }
interface Firefly { x: number; y: number; phase: number; sx: number; sy: number }

export interface GameEvents {
  collect(value: number): void;
  bump(): void;
}

function hash(n: number): number {
  n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35);
  n ^= n >>> 16;
  return n >>> 0;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Day → sunset → night → dawn tint keyframes: [pos, r, g, b, alpha, night]
const SKY: [number, number, number, number, number, number][] = [
  [0, 255, 255, 255, 0, 0],
  [0.5, 255, 255, 255, 0, 0],
  [0.6, 255, 170, 130, 0.3, 0],
  [0.68, 130, 120, 210, 0.42, 0.8],
  [0.88, 110, 110, 200, 0.46, 1],
  [0.95, 255, 195, 175, 0.2, 0.15],
  [1, 255, 255, 255, 0, 0],
];
const DAY_LENGTH = 300;

export class Game {
  vw = 180;
  vh = 280;
  t = 0;
  dist = 0;
  speed = 24;
  playing = false;
  reducedMotion = false;
  equipped: Equipped = {};

  keys = { left: false, right: false };
  pointerX: number | null = null;

  otter = {
    x: 90, targetX: 90, vx: 0, push: 0,
    blinkIn: 3, blinkT: 0, happyT: 0, bumpT: 0,
  };
  pet = { x: 70, y: 200 };

  private pickups: Pickup[] = [];
  private logs: Log[] = [];
  private pads: Pad[] = [];
  private leaves: Leaf[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private twinkles: Twinkle[] = [];
  private fireflies: Firefly[] = [];
  private spawnIn = 1;
  private logIn = 10;
  private padIn = 3;
  private leafIn = 2;
  private streamIn = 25;

  constructor(private events: GameEvents) {
    for (let i = 0; i < 16; i++) {
      this.fireflies.push({ x: rand(0, 400), y: rand(0, 400), phase: rand(0, 6.28), sx: rand(0.2, 0.5), sy: rand(0.2, 0.5) });
    }
  }

  get otterY() {
    return Math.round(this.vh * 0.66);
  }

  resize(vw: number, vh: number) {
    this.vw = vw;
    this.vh = vh;
    const c = this.centerAt(this.otterY - Math.floor(this.dist));
    if (!this.playing) {
      this.otter.x = this.otter.targetX = c;
      this.pet.x = c - 16;
      this.pet.y = this.otterY + 14;
    }
  }

  /** A friendly trail of shells so there is something to collect right away. */
  welcome() {
    const D = this.D;
    const oy = this.otterY;
    for (let i = 0; i < 8; i++) {
      const sy = oy - 34 - i * 14;
      const wy = sy - D;
      const c = this.centerAt(wy);
      this.pickups.push({ kind: i === 7 ? 'gold' : 'shell', x: c + Math.sin(i * 0.6) * this.riverWidth() * 0.25, wy, phase: i });
    }
    this.spawnIn = 0.5;
  }

  // ---------- River shape ----------
  riverWidth() {
    return clamp(this.vw - 34, 96, 156);
  }

  centerAt(wy: number) {
    const amp = Math.max(0, Math.min(12, (this.vw - this.riverWidth()) / 2 - 10));
    return this.vw / 2 + Math.round(Math.sin(wy * 0.009) * amp);
  }

  edgeL(wy: number) {
    return Math.round(this.centerAt(wy) - this.riverWidth() / 2 + Math.sin(wy * 0.05) * 2 + Math.sin(wy * 0.13 + 1.3));
  }

  edgeR(wy: number) {
    return Math.round(this.centerAt(wy) + this.riverWidth() / 2 + Math.sin(wy * 0.047 + 2) * 2 + Math.sin(wy * 0.12));
  }

  private get D() {
    return Math.floor(this.dist);
  }

  // ---------- Update ----------
  update(dt: number) {
    this.t += dt;
    this.dist += this.speed * dt;
    const D = this.D;
    const o = this.otter;
    const oy = this.otterY;
    const owy = oy - D;

    // Steering
    if (this.playing) {
      const dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      if (dir) o.targetX += dir * 80 * dt;
      if (this.pointerX !== null) o.targetX = this.pointerX;
    } else {
      o.targetX = this.centerAt(owy) + Math.sin(this.t * 0.35) * this.riverWidth() * 0.22;
    }
    o.targetX += o.push * dt;
    o.push *= Math.exp(-dt * 3);
    o.targetX = clamp(o.targetX, this.edgeL(owy) + 14, this.edgeR(owy) - 14);
    const prev = o.x;
    o.x += (o.targetX - o.x) * (1 - Math.exp(-dt * 4.5));
    o.vx = (o.x - prev) / Math.max(dt, 1e-4);

    // Face
    o.blinkIn -= dt;
    if (o.blinkIn <= 0) {
      o.blinkT = 0.14;
      o.blinkIn = rand(2.5, 5.5);
    }
    o.blinkT = Math.max(0, o.blinkT - dt);
    o.happyT = Math.max(0, o.happyT - dt);
    o.bumpT = Math.max(0, o.bumpT - dt);

    // Pet follows gently
    const side = o.x > this.centerAt(owy) ? -1 : 1;
    const px = o.x + side * 18;
    const py = oy + 14;
    const k = 1 - Math.exp(-dt * 1.8);
    this.pet.x += (px - this.pet.x) * k;
    this.pet.y += (py - this.pet.y) * k;

    if (this.playing) this.spawn(dt, D);
    this.updateThings(dt, D, o.x, oy);
  }

  private spawn(dt: number, D: number) {
    const wy = -12 - D;
    const l = this.edgeL(wy) + 10;
    const r = this.edgeR(wy) - 10;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = rand(0.55, 1.1);
      const roll = Math.random();
      const kind: PickupKind = roll < 0.04 ? 'pearl' : roll < 0.12 ? 'gold' : roll < 0.3 ? 'fish' : 'shell';
      this.pickups.push({ kind, x: rand(l, r), wy, phase: rand(0, 6.28) });
    }

    this.streamIn -= dt;
    if (this.streamIn <= 0) {
      this.streamIn = rand(25, 40);
      const cx = (l + r) / 2;
      const amp = (r - l) * 0.35;
      for (let i = 0; i < 9; i++) {
        this.pickups.push({ kind: i === 8 ? 'gold' : 'shell', x: cx + Math.sin(i * 0.7) * amp, wy: wy - i * 12, phase: i });
      }
    }

    this.logIn -= dt;
    if (this.logIn <= 0) {
      this.logIn = rand(9, 16);
      this.logs.push({ x: rand(l + 6, r - 6), wy: wy - 6, vx: rand(-4, 4), hit: false });
    }

    this.padIn -= dt;
    if (this.padIn <= 0) {
      this.padIn = rand(3, 7);
      const nearLeft = Math.random() < 0.5;
      this.pads.push({
        x: nearLeft ? l + rand(0, 10) : r - rand(0, 10),
        wy: wy - 8,
        flower: Math.random() < 0.5,
        frog: Math.random() < 0.25,
      });
    }

    this.leafIn -= dt;
    if (this.leafIn <= 0) {
      this.leafIn = rand(2, 5);
      this.leaves.push({ x: rand(l, r), wy: wy - 4, phase: rand(0, 6.28) });
    }
  }

  private updateThings(dt: number, D: number, ox: number, oy: number) {
    const cy = oy - 7; // otter body centre
    // Pickups: gentle magnet + collect
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const sy = p.wy + D;
      if (sy > this.vh + 20) { this.pickups.splice(i, 1); continue; }
      const dx = ox - p.x;
      const dy = cy - sy;
      const d = Math.hypot(dx, dy);
      if (this.playing && d < 26 && d > 0) {
        const pull = (1 - d / 26) * 45 * dt;
        p.x += (dx / d) * pull;
        p.wy += (dy / d) * pull;
      }
      if (this.playing && d < 14) {
        this.pickups.splice(i, 1);
        this.collect(p, sy);
      }
    }

    for (let i = this.logs.length - 1; i >= 0; i--) {
      const lg = this.logs[i];
      lg.x += lg.vx * dt;
      lg.wy += 4 * dt; // drifts a little slower than the otter
      const sy = lg.wy + D;
      const wy = lg.wy;
      lg.x = clamp(lg.x, this.edgeL(wy) + 11, this.edgeR(wy) - 11);
      if (sy > this.vh + 20) { this.logs.splice(i, 1); continue; }
      const nx = clamp(ox, lg.x - 10, lg.x + 10);
      const ny = clamp(cy, sy - 3, sy + 3);
      const hit = Math.hypot(ox - nx, cy - ny) < 12;
      if (hit && !lg.hit && this.playing) {
        const dir = Math.sign(ox - lg.x) || 1;
        this.otter.push = dir * 70;
        this.otter.bumpT = 0.7;
        lg.vx = -dir * 6;
        this.events.bump();
      }
      lg.hit = hit;
    }

    this.pads = this.pads.filter((p) => p.wy + D < this.vh + 20);
    this.leaves = this.leaves.filter((l) => l.wy + D < this.vh + 20);
    for (const l of this.leaves) l.x += Math.sin(this.t * 0.8 + l.phase) * 3 * dt;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 3);
      p.vy *= Math.exp(-dt * 3);
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const tx of this.texts) {
      tx.y -= 12 * dt;
      tx.life -= dt;
    }
    this.texts = this.texts.filter((tx) => tx.life > 0);

    if (!this.reducedMotion && Math.random() < dt * 4) {
      const y = rand(0, this.vh);
      const wy = y - D;
      this.twinkles.push({ x: rand(this.edgeL(wy) + 4, this.edgeR(wy) - 4), y, life: 0.5 });
    }
    for (const tw of this.twinkles) tw.life -= dt;
    this.twinkles = this.twinkles.filter((tw) => tw.life > 0);

    for (const f of this.fireflies) {
      f.x += Math.sin(this.t * f.sx + f.phase) * 6 * dt;
      f.y += Math.cos(this.t * f.sy + f.phase) * 5 * dt + this.speed * dt * 0.2;
      if (f.y > this.vh + 5) { f.y = -5; f.x = rand(0, this.vw); }
      if (f.x < -5 || f.x > this.vw + 5) f.x = rand(0, this.vw);
    }
  }

  private collect(p: Pickup, sy: number) {
    const v = VALUE[p.kind];
    this.texts.push({ x: p.x, y: sy - 6, text: `+${v}`, life: 0.9 });
    const n = v >= 5 ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.particles.push({ x: p.x, y: sy, vx: Math.cos(a) * 28, vy: Math.sin(a) * 28, life: 0.5, max: 0.5 });
    }
    if (v >= 5) this.otter.happyT = 0.8;
    this.events.collect(v);
  }

  pose(): Pose {
    const t = this.t;
    const o = this.otter;
    const rm = this.reducedMotion;
    const breath = Math.sin((t * Math.PI * 2) / 2.8);
    const moving = Math.abs(o.vx) > 6;
    const paddle = Math.floor(t * 5) % 2;
    return {
      bob: rm ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 3.4) * 1.2),
      hb: breath > 0.35 ? 1 : 0,
      lean: Math.abs(o.vx) > 14 ? Math.sign(o.vx) : 0,
      pawL: moving && o.vx > 0 ? -paddle : breath < -0.35 ? -1 : 0,
      pawR: moving && o.vx < 0 ? -paddle : breath < -0.35 ? -1 : 0,
      tail: rm ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 2.2)),
      eyes: o.bumpT > 0 || o.blinkT > 0 ? 'closed' : o.happyT > 0 ? 'happy' : 'open',
    };
  }

  sky() {
    const p = ((this.t / DAY_LENGTH) + 0.05) % 1;
    for (let i = 1; i < SKY.length; i++) {
      if (p <= SKY[i][0]) {
        const a = SKY[i - 1];
        const b = SKY[i];
        const k = (p - a[0]) / (b[0] - a[0]);
        const mix = (j: number) => a[j] + (b[j] - a[j]) * k;
        return { r: mix(1), g: mix(2), b: mix(3), a: mix(4), night: mix(5) };
      }
    }
    return { r: 255, g: 255, b: 255, a: 0, night: 0 };
  }

  // ---------- Render ----------
  render(ctx: CanvasRenderingContext2D) {
    const art = worldArt();
    const D = this.D;
    const { vw, vh, t } = this;

    ctx.fillStyle = WORLD.water;
    ctx.fillRect(0, 0, vw, vh);

    // Water ripples + banks, row by row (world-anchored so they scroll together)
    for (let y = 0; y < vh; y++) {
      const wy = y - D;
      const L = this.edgeL(wy);
      const R = this.edgeR(wy);
      const h = hash(wy);

      if (h % 9 === 0) {
        const len = 2 + ((h >>> 5) % 5);
        const x = L + 5 + ((h >>> 9) % Math.max(1, R - L - 10)) + Math.round(Math.sin(t * 0.7 + wy) * 1.5);
        ctx.fillStyle = WORLD.waterLight;
        ctx.fillRect(x, y, len, 1);
      } else if (h % 13 === 0) {
        const x = L + 5 + ((h >>> 9) % Math.max(1, R - L - 10));
        ctx.fillStyle = WORLD.waterDeep;
        ctx.fillRect(x, y, 3 + ((h >>> 4) % 4), 1);
      }

      // shallows + foam
      ctx.fillStyle = WORLD.waterLight;
      ctx.fillRect(L, y, 2, 1);
      ctx.fillRect(R - 2, y, 2, 1);
      if (Math.sin(t * 1.6 + wy * 0.4) > 0.3) {
        ctx.fillStyle = WORLD.foam;
        ctx.fillRect(L, y, 1, 1);
        ctx.fillRect(R - 1, y, 1, 1);
      }

      // sand + grass
      ctx.fillStyle = WORLD.sand;
      ctx.fillRect(L - 3, y, 3, 1);
      ctx.fillRect(R, y, 3, 1);
      ctx.fillStyle = WORLD.sandDark;
      ctx.fillRect(L - 1, y, 1, 1);
      ctx.fillRect(R, y, 1, 1);
      ctx.fillStyle = WORLD.grass;
      ctx.fillRect(0, y, L - 3, 1);
      ctx.fillRect(R + 3, y, vw - R - 3, 1);
      if (h % 3 === 0) {
        ctx.fillStyle = WORLD.grassLight;
        ctx.fillRect((h >>> 3) % Math.max(1, L - 4), y, 2, 1);
        ctx.fillRect(R + 4 + ((h >>> 11) % Math.max(1, vw - R - 4)), y, 2, 1);
      } else if (h % 5 === 0) {
        ctx.fillStyle = WORLD.grassDark;
        ctx.fillRect((h >>> 3) % Math.max(1, L - 4), y, 1, 1);
        ctx.fillRect(R + 4 + ((h >>> 11) % Math.max(1, vw - R - 4)), y, 1, 1);
      }
    }

    this.renderBankDecor(ctx, D);

    // River things (below otter)
    for (const l of this.leaves) draw(ctx, art.leaf, l.x, l.wy + D + Math.round(Math.sin(t + l.phase)));
    for (const p of this.pads) {
      const y = p.wy + D;
      draw(ctx, art.lilyPad, p.x, y);
      if (p.flower) draw(ctx, art.lilyFlower, p.x - 1, y - 1);
      else if (p.frog) draw(ctx, art.frog, p.x, y - 1 - (Math.sin(t * 2 + p.x) > 0.95 ? 1 : 0));
    }
    for (const tw of this.twinkles) draw(ctx, art.sparkle[tw.life > 0.25 ? 1 : 0], tw.x, tw.y);
    for (const lg of this.logs) {
      const y = lg.wy + D;
      this.ring(ctx, lg.x, y, 12, 5, 0.35);
      draw(ctx, art.log, lg.x, y);
    }
    for (const p of this.pickups) {
      const y = p.wy + D + Math.round(Math.sin(t * 2 + p.phase));
      const s = this.pickupSprite(p.kind);
      this.ring(ctx, p.x, y + 1, 5, 2, 0.25);
      draw(ctx, s, p.x, y);
      if (p.kind === 'pearl' && Math.sin(t * 5 + p.phase) > 0.6) draw(ctx, art.sparkle[0], p.x + 3, y - 3);
    }

    // Otter + friends
    const ox = Math.round(this.otter.x);
    const oy = this.otterY;
    const pose = this.pose();
    const pet = itemById(this.equipped.pet);
    if (pet?.pet === 'follow') this.drawFollower(ctx, pet);
    this.otterWake(ctx, ox, oy + pose.bob);
    drawOtter(ctx, ox, oy, pose, this.equipped, t);
    if (pet?.pet === 'fly') {
      const bx = ox + Math.round(Math.sin(t * 0.9) * 16);
      const by = oy - 32 + Math.round(Math.sin(t * 1.7) * 5);
      draw(ctx, itemFrame(pet, t), bx, by);
    }

    // Effects
    for (const p of this.particles) draw(ctx, art.sparkle[p.life > p.max / 2 ? 0 : 1], p.x, p.y);
    for (const tx of this.texts) {
      ctx.globalAlpha = Math.min(1, tx.life * 2);
      this.drawText(ctx, tx.text, tx.x, tx.y);
      ctx.globalAlpha = 1;
    }

    // Time of day
    const sky = this.sky();
    if (sky.a > 0.001) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(${sky.r | 0},${sky.g | 0},${sky.b | 0},${sky.a})`;
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (sky.night > 0.02) {
      for (const f of this.fireflies) {
        const glow = sky.night * (0.5 + 0.5 * Math.sin(t * 2 + f.phase * 3));
        if (glow < 0.1) continue;
        const x = Math.round(f.x);
        const y = Math.round(f.y);
        ctx.globalAlpha = glow * 0.35;
        ctx.fillStyle = '#fff3a0';
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
        ctx.globalAlpha = glow;
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  private pickupSprite(kind: PickupKind): Sprite {
    const a = worldArt();
    return kind === 'shell' ? a.shell : kind === 'gold' ? a.goldShell : kind === 'fish' ? a.fish : a.pearl;
  }

  private renderBankDecor(ctx: CanvasRenderingContext2D, D: number) {
    const art = worldArt();
    for (let y = -20; y < this.vh + 24; y++) {
      const wy = y - D;
      const h = hash(wy * 31 + 7);
      if (h % 5 !== 0) continue;
      const left = (h >>> 3) % 2 === 0;
      const L = this.edgeL(wy);
      const R = this.edgeR(wy);
      const bank = left ? L - 3 : this.vw - R - 3;
      const pick = (h >>> 5) % 100;
      const pos = (h >>> 12) % 1000 / 1000;
      const bx = (w: number) => (left ? 2 + pos * Math.max(0, bank - w - 2) : R + 3 + 2 + pos * Math.max(0, bank - w - 2));

      if (pick < 22) {
        // reeds right at the water's edge
        draw(ctx, art.reeds, left ? L - 3 : R + 2, y);
      } else if (pick < 50) {
        draw(ctx, art.flowers[(h >>> 20) % art.flowers.length], bx(3) + 1, y);
      } else if (pick < 65) {
        draw(ctx, art.tuft, bx(5) + 2, y);
      } else if (pick < 75 && bank > 10) {
        draw(ctx, art.rock, bx(8) + 4, y);
      } else if (pick < 82 && bank > 8) {
        draw(ctx, art.mushroom, bx(5) + 2, y);
      } else if (pick < 92 && bank > 14) {
        draw(ctx, art.bush, bx(11) + 5, y);
      } else if (bank > 22) {
        draw(ctx, art.tree, bx(16) + 8, y);
      }
    }
  }

  private ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, alpha: number) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = WORLD.waterDeep;
    for (let dy = -ry; dy <= ry; dy++) {
      const half = Math.round(rx * Math.sqrt(1 - (dy / (ry + 0.5)) ** 2));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  private otterWake(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
    // soft shadow under the body
    this.ring(ctx, ox + 1, oy - 5, 12, 17, 0.3);
    if (this.reducedMotion) return;
    // shimmering ring
    const rx = 15;
    const ry = 21;
    const step = Math.floor(this.t * 3);
    ctx.fillStyle = WORLD.foam;
    for (let i = 0; i < 28; i++) {
      if ((i + step) % 4 === 0) continue;
      const a = (i / 28) * Math.PI * 2;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(Math.round(ox + Math.cos(a) * rx), Math.round(oy - 5 + Math.sin(a) * ry), (i % 7 === 0 ? 2 : 1), 1);
    }
    // trailing V wake behind the feet
    ctx.fillStyle = WORLD.waterLight;
    for (let i = 0; i < 9; i++) {
      if ((i + step) % 3 === 0) continue;
      ctx.globalAlpha = 0.8 - i * 0.08;
      ctx.fillRect(ox - 5 - i, oy + 14 + i * 2, 2, 1);
      ctx.fillRect(ox + 4 + i, oy + 14 + i * 2, 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  private drawFollower(ctx: CanvasRenderingContext2D, pet: ItemDef) {
    const x = Math.round(this.pet.x);
    const y = Math.round(this.pet.y + Math.sin(this.t * 2.4));
    this.ring(ctx, x, y + 3, 6, 2, 0.3);
    if (!this.reducedMotion && Math.floor(this.t * 3) % 2 === 0) {
      ctx.fillStyle = WORLD.waterLight;
      ctx.fillRect(x - 5, y + 5, 2, 1);
      ctx.fillRect(x + 4, y + 5, 2, 1);
    }
    draw(ctx, itemFrame(pet, this.t), x, y);
  }

  private drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    const digits = worldArt().digits;
    const w = text.length * 4 + 1;
    let cx = Math.round(x - w / 2);
    for (const ch of text) {
      const s = digits[ch];
      if (s) draw(ctx, s, cx, Math.round(y));
      cx += 4;
    }
  }
}
