// River geometry: a meandering river that sometimes splits around an island,
// flowing through a sequence of biomes. Everything is a pure function of the
// world row `wy`, so the scenery is deterministic and scrolls perfectly.

export function hash(n: number): number {
  n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35);
  n ^= n >>> 16;
  return n >>> 0;
}

export interface Channel { l: number; r: number }

export type DecorKind =
  | 'flower' | 'tuft' | 'bush' | 'berryBush' | 'round' | 'pine' | 'cherry' | 'mushroom'
  | 'rock' | 'bench' | 'lantern' | 'fence' | 'reeds' | 'starfish' | 'pebbles' | 'sandcastle';

export interface Biome {
  id: string;
  name: string;
  grass: string;
  grassDark: string;
  grassLight: string;
  sand: number; // sand strip width
  decor: [DecorKind, number][];
  flowers: number[]; // indices into worldArt().flowers
  particles?: 'petals' | 'leaves';
  pads: number; // lily pad frequency multiplier
}

export const BIOMES: Biome[] = [
  {
    id: 'meadow', name: 'Sunny Meadow', grass: '#a3dc8e', grassDark: '#86c985', grassLight: '#c3eba2', sand: 4,
    decor: [['flower', 30], ['tuft', 14], ['bush', 10], ['berryBush', 5], ['round', 12], ['fence', 5], ['bench', 3], ['mushroom', 4], ['rock', 4], ['lantern', 2]],
    flowers: [0, 1, 2, 3, 4], pads: 1,
  },
  {
    id: 'blossom', name: 'Blossom Grove', grass: '#b3e3a3', grassDark: '#93cf92', grassLight: '#d2f0bb', sand: 4,
    decor: [['cherry', 22], ['flower', 30], ['bench', 4], ['lantern', 6], ['tuft', 10], ['bush', 6]],
    flowers: [0, 0, 1, 2], particles: 'petals', pads: 1,
  },
  {
    id: 'forest', name: 'Pine Woods', grass: '#8fcf86', grassDark: '#6fb477', grassLight: '#abdf99', sand: 3,
    decor: [['pine', 30], ['round', 8], ['mushroom', 12], ['bush', 12], ['rock', 8], ['tuft', 12], ['lantern', 2]],
    flowers: [1, 3], particles: 'leaves', pads: 0.6,
  },
  {
    id: 'marsh', name: 'Reedy Marsh', grass: '#9fd6a0', grassDark: '#82c28f', grassLight: '#bfe6b5', sand: 2,
    decor: [['reeds', 34], ['tuft', 24], ['flower', 10], ['rock', 4], ['bush', 6]],
    flowers: [2, 4], pads: 2.5,
  },
  {
    id: 'cove', name: 'Shell Cove', grass: '#ade29a', grassDark: '#8fcf8a', grassLight: '#cbefb2', sand: 9,
    decor: [['rock', 14], ['starfish', 8], ['pebbles', 8], ['sandcastle', 3], ['tuft', 10], ['flower', 10], ['round', 6], ['bench', 4], ['lantern', 3]],
    flowers: [3, 0], pads: 0.8,
  },
];

const BIOME_LEN = 2600; // world px per biome (~65 s)
const BIOME_START = 800; // so the journey begins in the meadow
const ISLAND_SEG = 1100;
const ISLAND_LEN = 520;
const MARGIN = 23; // room each side of the otter inside a channel

const DAM_FUNNEL = 170; // rows over which the dam walls guide the otter to the gap
const DAM_CREST = 8;
export const DAM_GAP = 50;

export interface Dam {
  pos: number; // position within the dam zone (0 = funnel mouth)
  f: number; // 0..1 how far the walls have closed in
  crest: boolean; // on the dam's top wall
  gapL: number;
  gapR: number;
  seg: number;
}

export class River {
  vw = 320;
  forceIsland = false;
  forceDam = false;

  /** River width: leaves real banks on narrow (phone) screens. */
  width() {
    return Math.max(110, Math.min(260, Math.round(Math.min(this.vw * 0.66, this.vw - 50))));
  }

  private kind(seg: number): 'island' | 'dam' | null {
    if (seg < 1) return null;
    if (this.forceDam) return 'dam';
    if (this.forceIsland) return 'island';
    const h = hash(seg * 977) % 5;
    if (h <= 1) return 'island';
    if (h === 2 && seg >= 2) return 'dam';
    return null;
  }

  /** Beaver dam at this row (if any): a V of stick walls funnelling into one gap. */
  dam(wy: number): Dam | null {
    const seg = Math.floor(-wy / ISLAND_SEG);
    if (this.kind(seg) !== 'dam') return null;
    const start = seg * ISLAND_SEG + 380;
    const pos = -wy - start;
    if (pos < 0 || pos > DAM_FUNNEL + DAM_CREST) return null;
    const crestWy = -(start + DAM_FUNNEL);
    const c = this.center(crestWy);
    const w = this.width();
    const off = ((hash(seg * 31) % 100) / 100 - 0.5) * Math.max(0, w - DAM_GAP - 24) * 0.7;
    const gc = Math.round(c + off);
    const t = Math.min(1, pos / DAM_FUNNEL);
    return { pos, f: t * t * (3 - 2 * t), crest: pos >= DAM_FUNNEL, gapL: gc - DAM_GAP / 2, gapR: gc + DAM_GAP / 2, seg };
  }

  /** extra width + island half-width around wy (0 when no island). */
  private island(wy: number): { extra: number; half: number } {
    const seg = Math.floor(-wy / ISLAND_SEG);
    if (this.kind(seg) !== 'island') return { extra: 0, half: 0 };
    const start = seg * ISLAND_SEG + 300;
    const pos = -wy - start; // 0..ISLAND_LEN runs downstream→upstream
    const ramp = 120;
    if (pos < -ramp || pos > ISLAND_LEN + ramp) return { extra: 0, half: 0 };
    const w = this.width();
    const extra = Math.max(0, Math.min(56, this.vw - w - 14));
    const smooth = (v: number) => v * v * (3 - 2 * v);
    const e = pos < 0 ? smooth(1 + pos / ramp) : pos > ISLAND_LEN ? smooth(1 - (pos - ISLAND_LEN) / ramp) : 1;
    const maxHalf = Math.min(64, (w + extra) / 2 - MARGIN * 2 - 4);
    if (maxHalf < 10) return { extra: extra * e, half: 0 };
    const t = pos / ISLAND_LEN;
    const half = t <= 0 || t >= 1 ? 0 : maxHalf * (1 - (2 * t - 1) ** 2) ** 0.8;
    return { extra: extra * e, half: half < 2 ? 0 : half };
  }

  center(wy: number) {
    const w = this.width();
    const amp = Math.max(0, Math.min(18, (this.vw - w) / 2 - 14));
    return this.vw / 2 + Math.round(Math.sin(wy * 0.0055) * amp);
  }

  /** Where the otter can swim (dam walls narrow it to the gap). */
  channels(wy: number): Channel[] {
    const d = this.dam(wy);
    const water = this.water(wy);
    if (!d) return water;
    const e = water[0];
    return [{ l: Math.round(e.l + (d.gapL - e.l) * d.f), r: Math.round(e.r + (d.gapR - e.r) * d.f) }];
  }

  /** True when an island or dam is within `m` rows of wy. */
  featureNear(wy: number, m = 80) {
    for (let d = -m; d <= m; d += 20) {
      if (this.water(wy + d).length > 1 || this.dam(wy + d)) return true;
    }
    return false;
  }

  /** Visible water (islands split it into two channels). */
  water(wy: number): Channel[] {
    const { extra, half } = this.island(wy);
    const c = this.center(wy);
    const w = this.width() + extra;
    const l = Math.round(c - w / 2 + Math.sin(wy * 0.03) * 2 + Math.sin(wy * 0.08 + 1.3));
    const r = Math.round(c + w / 2 + Math.sin(wy * 0.028 + 2) * 2 + Math.sin(wy * 0.07));
    if (half <= 0) return [{ l, r }];
    const ic = c + Math.round(Math.sin(wy * 0.02) * 2);
    return [{ l, r: Math.round(ic - half) }, { l: Math.round(ic + half), r }];
  }

  edges(wy: number): Channel {
    const ch = this.water(wy);
    return { l: ch[0].l, r: ch[ch.length - 1].r };
  }

  /** The biome for a row, dithered near borders so they blend softly. */
  biome(wy: number): Biome {
    const f = (-wy + BIOME_START) / BIOME_LEN;
    const seg = Math.floor(f);
    const frac = f - seg;
    const cur = BIOMES[((seg % BIOMES.length) + BIOMES.length) % BIOMES.length];
    const prev = BIOMES[(((seg - 1) % BIOMES.length) + BIOMES.length) % BIOMES.length];
    const blend = 0.05;
    if (frac < blend && hash(wy * 13) % 1000 > (frac / blend) * 1000) return prev;
    return cur;
  }

  biomeName(wy: number) {
    const seg = Math.floor((-wy + BIOME_START) / BIOME_LEN);
    return BIOMES[((seg % BIOMES.length) + BIOMES.length) % BIOMES.length].name;
  }

  /** Free horizontal range for a body of half-width `m` spanning rows wy0..wy1, starting near x. */
  freeRange(x: number, wy0: number, wy1: number, m: number): { lo: number; hi: number; pushTo?: number } {
    let lo = -Infinity;
    let hi = Infinity;
    for (let wy = wy0; wy <= wy1; wy += 6) {
      const chs = this.channels(wy);
      let best = chs[0];
      let bestD = Infinity;
      for (const ch of chs) {
        const d = x < ch.l ? ch.l - x : x > ch.r ? x - ch.r : 0;
        if (d < bestD) { bestD = d; best = ch; }
      }
      lo = Math.max(lo, best.l + m);
      hi = Math.min(hi, best.r - m);
    }
    if (lo > hi) return { lo: hi, hi: hi, pushTo: hi };
    return { lo, hi };
  }
}
