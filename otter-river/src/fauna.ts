import { worldArt } from './art/world';
import { draw, drawFlip, Sprite } from './art/sprite';
import type { River } from './river';

// Occasional passing animals. Purely decorative: they never interact with the otter.

type Kind = 'ducks' | 'heron' | 'kingfisher' | 'bunny' | 'deer' | 'fish' | 'dragonflies';

interface Visitor {
  kind: Kind;
  x: number;
  y: number; // world row (wy) for grounded animals, screen y for flyers
  dir: 1 | -1;
  age: number;
  state: 'in' | 'pause' | 'out';
  wait: number;
  homeX: number;
  stopX: number;
  ox?: number; // fish arc origin
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Fauna {
  private list: Visitor[] = [];
  private next = rand(8, 14);
  /** Force the next visitor (debug). */
  force: Kind | null = null;

  update(dt: number, river: River, D: number, vw: number, vh: number, otterY: number) {
    this.next -= dt;
    if (this.next <= 0 || this.force) {
      this.next = rand(18, 34);
      this.spawn(river, D, vw, vh, otterY);
      this.force = null;
    }
    for (const v of this.list) {
      v.age += dt;
      switch (v.kind) {
        case 'ducks':
          v.x += v.dir * 13 * dt;
          break;
        case 'heron':
          v.x += v.dir * 42 * dt;
          v.y += 6 * dt;
          break;
        case 'kingfisher':
          v.x += v.dir * 85 * dt;
          v.y += Math.sin(v.age * 3) * 10 * dt;
          break;
        case 'bunny':
        case 'deer': {
          const speed = v.kind === 'bunny' ? 26 : 11;
          if (v.state === 'in') {
            v.x += v.dir * speed * dt;
            if ((v.dir > 0 && v.x >= v.stopX) || (v.dir < 0 && v.x <= v.stopX)) { v.state = 'pause'; v.wait = rand(1.6, 3.5); }
          } else if (v.state === 'pause') {
            v.wait -= dt;
            if (v.wait <= 0) { v.state = 'out'; v.dir = v.dir > 0 ? -1 : 1; }
          } else {
            v.x += v.dir * speed * 1.2 * dt;
          }
          break;
        }
        case 'dragonflies':
          break;
        case 'fish':
          break;
      }
    }
    this.list = this.list.filter((v) => {
      const grounded = v.kind === 'ducks' || v.kind === 'bunny' || v.kind === 'deer' || v.kind === 'fish';
      const sy = grounded ? v.y + D : v.y;
      if (sy > vh + 40) return false;
      if (v.kind === 'fish') return v.age < 1.6;
      if (v.kind === 'dragonflies') return v.age < 9;
      if (v.state === 'out' && (v.x < -30 || v.x > vw + 30)) return false;
      if ((v.kind === 'heron' || v.kind === 'kingfisher' || v.kind === 'ducks') && (v.x < -60 || v.x > vw + 60)) return false;
      return true;
    });
  }

  private spawn(river: River, D: number, vw: number, vh: number, otterY: number) {
    const kinds: Kind[] = this.force ? [this.force] : ['ducks', 'heron', 'kingfisher', 'bunny', 'deer', 'fish', 'dragonflies', 'fish', 'ducks'];
    for (let tries = 0; tries < 6; tries++) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const base: Visitor = { kind, x: 0, y: 0, dir, age: 0, state: 'in', wait: 0, homeX: 0, stopX: 0 };
      if (kind === 'ducks') {
        const wy = -30 - D;
        const e = river.edges(wy);
        this.list.push({ ...base, y: wy, x: dir > 0 ? e.l - 10 : e.r + 10 });
        return;
      }
      if (kind === 'heron' || kind === 'kingfisher') {
        this.list.push({ ...base, x: dir > 0 ? -40 : vw + 40, y: rand(vh * 0.1, vh * 0.45) });
        return;
      }
      if (kind === 'fish') {
        const sy = rand(vh * 0.15, otterY - 60);
        const wy = sy - D;
        const chs = river.channels(wy);
        const ch = chs[Math.floor(Math.random() * chs.length)];
        if (ch.r - ch.l < 40) continue;
        const x = rand(ch.l + 12, ch.r - 30);
        this.list.push({ ...base, dir: 1, x, ox: x, y: wy });
        return;
      }
      if (kind === 'dragonflies') {
        const e = river.edges(vh * 0.4 - D);
        this.list.push({ ...base, x: rand(e.l + 20, e.r - 20), y: vh * rand(0.2, 0.5) });
        return;
      }
      // grounded bank walkers need room on a bank
      const wy = -40 - D;
      const e = river.edges(wy);
      const leftRoom = e.l;
      const rightRoom = vw - e.r;
      const need = kind === 'bunny' ? 34 : 50;
      const side = leftRoom >= rightRoom ? -1 : 1;
      const room = Math.max(leftRoom, rightRoom);
      if (room < need) continue;
      if (side < 0) {
        this.list.push({ ...base, dir: 1, y: wy, x: -14, homeX: -14, stopX: e.l - 16 });
      } else {
        this.list.push({ ...base, dir: -1, y: wy, x: vw + 14, homeX: vw + 14, stopX: e.r + 16 });
      }
      return;
    }
  }

  /** The kind of visitor currently on screen, if any. */
  visible(vh: number, D: number): Kind | null {
    for (const v of this.list) {
      const sy = this.grounded(v) ? v.y + D : v.y;
      if (sy > 10 && sy < vh - 10 && v.x > 0) return v.kind;
    }
    return null;
  }

  private grounded(v: Visitor) {
    return v.kind === 'ducks' || v.kind === 'bunny' || v.kind === 'deer' || v.kind === 'fish';
  }

  snapshot(vh: number, D: number): Visitor | null {
    const k = this.visible(vh, D);
    const v = k && this.list.find((x) => x.kind === k);
    return v ? { ...v } : null;
  }

  inject(v: unknown) {
    if (v && typeof v === 'object' && 'kind' in v) this.list = [{ ...(v as Visitor) }];
  }

  private put(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, dir: number) {
    if (dir < 0) drawFlip(ctx, s, x, y);
    else draw(ctx, s, x, y);
  }

  /** Animals at water/ground level (under the otter). */
  renderLow(ctx: CanvasRenderingContext2D, D: number) {
    const a = worldArt().animals;
    const art = worldArt();
    for (const v of this.list) {
      const f = Math.floor(v.age / 0.3) % 2;
      if (v.kind === 'ducks') {
        const y = v.y + D;
        this.put(ctx, a.duck[f], v.x, y + (f ? 1 : 0), v.dir);
        for (let i = 1; i <= 3; i++) {
          const g = (f + i) % 2;
          this.put(ctx, a.duckling[g], v.x - v.dir * (12 + i * 11), y + 3 + Math.round(Math.sin(v.age * 3 + i)), v.dir);
        }
      } else if (v.kind === 'bunny' || v.kind === 'deer') {
        const moving = v.state !== 'pause';
        if (v.kind === 'deer') {
          const fr = moving ? [0, 1, 0, 2][Math.floor(v.age / 0.3) % 4] : 3;
          this.put(ctx, a.deer[fr], v.x, v.y + D, v.dir);
        } else {
          const fr = moving ? Math.floor(v.age / 0.16) % 2 : 0;
          this.put(ctx, a.bunny[fr], v.x, v.y + D + (moving && fr === 1 ? -2 : 0), v.dir);
        }
      } else if (v.kind === 'fish') {
        const t = Math.min(1, v.age / 0.9);
        const y = v.y + D;
        if (v.age < 0.35) draw(ctx, art.splash[1], v.ox!, y + 2);
        if (v.age < 0.9) {
          const x = v.ox! + t * 18;
          const h = Math.sin(t * Math.PI) * 16;
          draw(ctx, art.fish, x, y - h);
        } else {
          draw(ctx, art.splash[Math.floor(v.age * 6) % 2], v.ox! + 18, y + 2);
        }
      }
    }
  }

  /** Flying animals and their shadows (over the otter). */
  renderHigh(ctx: CanvasRenderingContext2D) {
    const a = worldArt().animals;
    for (const v of this.list) {
      if (v.kind === 'heron' || v.kind === 'kingfisher') {
        const f = Math.floor(v.age / (v.kind === 'heron' ? 0.45 : 0.12)) % 2;
        const s = (v.kind === 'heron' ? a.heron : a.kingfisher)[f];
        const off = v.kind === 'heron' ? 22 : 10;
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#2e4b5a';
        ctx.beginPath();
        ctx.ellipse(Math.round(v.x + off * 0.5), Math.round(v.y + off), s.w * 0.35, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        this.put(ctx, s, v.x, v.y, v.dir);
      } else if (v.kind === 'dragonflies') {
        for (let i = 0; i < 2; i++) {
          const t = v.age * (1.3 + i * 0.4) + i * 2;
          const x = v.x + Math.sin(t) * 26 + Math.sin(t * 2.7) * 8;
          const y = v.y + Math.cos(t * 0.8) * 14 + Math.sin(t * 3.1) * 4;
          const dir = Math.cos(t) >= 0 ? 1 : -1;
          this.put(ctx, a.dragonfly[Math.floor(v.age * 14 + i) % 2], x, y, dir);
        }
      }
    }
  }
}
