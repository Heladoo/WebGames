// A paper towel that drinks drops: the water wicks through the fibres, the
// dye goes with it, colours mix where they meet, and the stain dries lighter
// with a darker rim (the "coffee ring"), as on a real kitchen towel.
//
// It is a grid of cells (about 0.8 world units each) holding water and three
// pigments. Each step, water flows from wetter cells to drier ones (with a
// little random resistance, like fibres) and carries its dye along; it slowly
// dries, and dried dye stays put. Lines of an embossed picture slow the flow
// between areas, so paint mostly stays inside them, with a soft bleed.
// The stain is drawn into a canvas the size of the grid, which the browser
// stretches smoothly over the towel; it only works while something is wet.

import { type Pig, pigToRgb, share, PIG } from './color';
import type { CupColor } from './levels';

export interface Shape { k: 'ellipse'; x: number; y: number; rx: number; ry: number; rot?: number; piece?: number }
/** An area of a picture: where it is (world units, relative to the towel's centre), its colour, and how much paint it wants. */
export interface Area { name: string; color: CupColor; need: number; shapes: Shape[] }
export interface TowelDef {
  x0: number; y0: number; x1: number; y1: number;
  /** the picture's size (its shapes are designed at 1) */
  scale?: number;
  /** a picture to colour (guided), or none (free colouring) */
  picture?: keyof typeof PICTURES;
}

// A picture is made of cut-out pieces of towel lying on the paper (like the
// coffee-filter crafts children make). Each shape is a piece, unless shapes share
// a `piece` number (a stem with its leaves). Paint stays in the piece it touched.
// Pieces have gaps between them, wide enough for a drop to be led through.
export const PICTURES = {
  dot: [
    { name: 'הנקודה', color: 'red', need: 1, shapes: [{ k: 'ellipse', x: 0, y: 0, rx: 7, ry: 7 }] },
  ],
  flower: [
    { name: 'עלי הכותרת', color: 'red', need: 4, shapes: [45, 135, 225, 315].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return { k: 'ellipse', x: Math.cos(a) * 15, y: -6 + Math.sin(a) * 15, rx: 5.2, ry: 5.2 } as Shape;
    }) },
    { name: 'מרכז הפרח', color: 'yellow', need: 1, shapes: [{ k: 'ellipse', x: 0, y: -6, rx: 6, ry: 6 }] },
    { name: 'הגבעול והעלים', color: 'green', need: 2, shapes: [
      { k: 'ellipse', x: 0, y: 12.5, rx: 1.7, ry: 11, piece: 0 },
      { k: 'ellipse', x: -5, y: 14, rx: 4.6, ry: 2.3, rot: -0.5, piece: 0 },
      { k: 'ellipse', x: 5, y: 18, rx: 4.6, ry: 2.3, rot: 0.5, piece: 0 },
    ] },
  ],
  sun: [
    { name: 'השמש', color: 'orange', need: 2, shapes: [{ k: 'ellipse', x: 0, y: 0, rx: 9, ry: 9 }] },
    { name: 'הקרניים', color: 'yellow', need: 6, shapes: [0, 1, 2, 3, 4, 5].map((i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      return { k: 'ellipse', x: Math.cos(a) * 24, y: Math.sin(a) * 24, rx: 3.8, ry: 2.3, rot: a } as Shape;
    }) },
  ],
  balloons: [
    { name: 'הבלון הכתום', color: 'orange', need: 2, shapes: [{ k: 'ellipse', x: -13.5, y: -5, rx: 6, ry: 7.5 }] },
    { name: 'הבלון הירוק', color: 'green', need: 2, shapes: [{ k: 'ellipse', x: 0, y: -10, rx: 6, ry: 7.5 }] },
    { name: 'הבלון הסגול', color: 'purple', need: 2, shapes: [{ k: 'ellipse', x: 13.5, y: -5, rx: 6, ry: 7.5 }] },
  ],
} satisfies Record<string, Area[]>;

/** Strings and such: lines drawn on the paper under a picture (not towel). Quadratic curves. */
export const DECOR: Partial<Record<keyof typeof PICTURES, [number, number, number, number, number, number][]>> = {
  balloons: [[-13.5, 2.5, -9, 12, -2, 21], [0, -2.5, 1.5, 9, -1, 21], [13.5, 2.5, 8, 12, 0.5, 21]],
};

const CELL = 0.8;     // world units per cell
const D = 18;         // how fast water spreads (cells² per second)
const DRY = 0.22;     // how fast it dries (per second)
const WATER = 2.4;    // water a drop brings per unit of paint (it carries the dye outward as it wicks)
const UP = 3;         // the stain is smoothed up this many times before the browser stretches it
const MIXD = 3.5;     // how fast dye blends between wet neighbours (so overlapping colours really mix)
const INK = 170;      // how dark a given amount of dye looks
const SEEN = 0.0012;  // dye in a cell that a child sees as coloured (about a fifth of full colour)

function inShape(s: Shape, x: number, y: number) {
  const c = Math.cos(-(s.rot ?? 0)), sn = Math.sin(-(s.rot ?? 0));
  const dx = x - s.x, dy = y - s.y;
  const u = dx * c - dy * sn, v = dx * sn + dy * c;
  return (u * u) / (s.rx * s.rx) + (v * v) / (s.ry * s.ry) <= 1;
}

export const TOWEL_UP = UP;

export class Towel {
  def: TowelDef;
  areas: Area[];
  gw: number; gh: number;
  w: Float32Array; p: [Float32Array, Float32Array, Float32Array];
  area: Int8Array;
  /** which piece of its area each cell is in */
  piece: Int8Array;
  /** flow factors to the right and downward neighbour (fibres and embossed lines) */
  fx: Float32Array; fy: Float32Array;
  grain: Float32Array;
  /** the visible layer (UP times the grid) and the grid-sized picture behind it */
  canvas: HTMLCanvasElement;
  small: HTMLCanvasElement;
  img: ImageData;
  /** a picture of cut-out pieces: only the pieces are towel (free colouring: the whole sheet) */
  cut: boolean;
  /** the picture's outer edges, in world units (for hints that go round it) */
  bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  /** something is wet (the simulation and the picture only run then) */
  wet = false;
  dirty = true;
  /** seconds since a drop last soaked in */
  quiet = 0;

  constructor(def: TowelDef) {
    this.def = def;
    this.areas = def.picture ? PICTURES[def.picture] : [];
    this.cut = !!def.picture;
    this.gw = Math.round((def.x1 - def.x0) / CELL);
    this.gh = Math.round((def.y1 - def.y0) / CELL);
    const n = this.gw * this.gh;
    this.w = new Float32Array(n);
    this.p = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    this.area = new Int8Array(n).fill(-1);
    this.piece = new Int8Array(n).fill(-1);
    this.fx = new Float32Array(n); this.fy = new Float32Array(n);
    this.grain = new Float32Array(n);
    const cx = (def.x0 + def.x1) / 2, cy = (def.y0 + def.y1) / 2;
    const sc = def.scale ?? 1;
    this.areas = this.areas.map((a) => ({ ...a, shapes: a.shapes.map((sh) => ({ ...sh, x: sh.x * sc, y: sh.y * sc, rx: sh.rx * sc, ry: sh.ry * sc })) }));
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let j = 0; j < this.gh; j++) for (let i = 0; i < this.gw; i++) {
      const k = j * this.gw + i;
      const x = def.x0 + (i + 0.5) * CELL - cx, y = def.y0 + (j + 0.5) * CELL - cy;
      this.area[k] = this.areas.findIndex((a) => a.shapes.some((s) => inShape(s, x, y)));
      if (this.area[k] >= 0) {
        const shapes = this.areas[this.area[k]].shapes;
        const si = shapes.findIndex((s) => inShape(s, x, y));
        this.piece[k] = shapes[si].piece ?? si;
      }
      this.grain[k] = rnd();
    }
    for (let j = 0; j < this.gh; j++) for (let i = 0; i < this.gw; i++) {
      const k = j * this.gw + i;
      const fib = () => 0.55 + rnd() * 0.9; // fibres: uneven flow, so stains get ragged edges
      // paint flows only within one piece of towel (or anywhere on a whole sheet)
      const same = (m: number) => !this.cut || (this.area[k] >= 0 && this.area[k] === this.area[m] && this.piece[k] === this.piece[m]);
      this.fx[k] = i + 1 < this.gw && same(k + 1) ? fib() : 0;
      this.fy[k] = j + 1 < this.gh && same(k + this.gw) ? fib() : 0;
    }
    // the picture's outer edges
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (let k = 0; k < n; k++) {
      if (this.cut && this.area[k] < 0) continue;
      const x = def.x0 + ((k % this.gw) + 0.5) * CELL, y = def.y0 + (Math.floor(k / this.gw) + 0.5) * CELL;
      bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y);
    }
    this.bounds = { x0: bx0, y0: by0, x1: bx1, y1: by1 };
    this.small = document.createElement('canvas');
    this.small.width = this.gw;
    this.small.height = this.gh;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.gw * UP;
    this.canvas.height = this.gh * UP;
    this.img = new ImageData(this.gw, this.gh);
  }

  /** Does this world point lie on the towel? */
  covers(x: number, y: number) {
    return this.cellAt(x, y) >= 0;
  }

  /** The towel cell at a world point (-1: no towel there). */
  cellAt(x: number, y: number): number {
    const d = this.def;
    if (!(x > d.x0 && x < d.x1 && y > d.y0 && y < d.y1)) return -1;
    const k = Math.floor((y - d.y0) / CELL) * this.gw + Math.floor((x - d.x0) / CELL);
    return this.cut && this.area[k] < 0 ? -1 : k;
  }

  /**
   * A drop soaks in: water and dye go into the towel cells within r of (x, y).
   * With `like` (a cell), only into that cell's piece: the piece the drop touched.
   */
  absorb(x: number, y: number, r: number, vol: number, pig: Pig, like = -1) {
    const d = this.def, s = share(pig);
    const ci = (x - d.x0) / CELL, cj = (y - d.y0) / CELL, rc = Math.max(1, r / CELL);
    const cells: number[] = [];
    for (let j = Math.floor(cj - rc); j <= Math.ceil(cj + rc); j++) for (let i = Math.floor(ci - rc); i <= Math.ceil(ci + rc); i++) {
      if (i < 0 || j < 0 || i >= this.gw || j >= this.gh) continue;
      const k = j * this.gw + i;
      if (this.cut && (this.area[k] < 0 || (like >= 0 && (this.area[k] !== this.area[like] || this.piece[k] !== this.piece[like])))) continue;
      if ((i - ci) ** 2 + (j - cj) ** 2 <= rc * rc) cells.push(k);
    }
    if (!cells.length) return;
    const each = vol / cells.length;
    for (const k of cells) {
      this.w[k] += each * WATER;
      for (let c = 0; c < 3; c++) this.p[c][k] += each * s[c];
    }
    this.wet = true;
    this.dirty = true;
    this.quiet = 0;
  }

  step(dt: number) {
    this.quiet += dt;
    if (!this.wet) return;
    const n = this.gw * this.gh, gw = this.gw;
    const w = this.w, [pr, py, pb] = this.p;
    const sub = 3, h = Math.min(dt, 0.05) / sub;
    let any = false;
    for (let s = 0; s < sub; s++) {
      for (let k = 0; k < n; k++) {
        const wk = w[k];
        // flow right and down (each pair once); water carries its dye
        for (let dir = 0; dir < 2; dir++) {
          const f = dir === 0 ? this.fx[k] : this.fy[k];
          if (!f) continue;
          const m = k + (dir === 0 ? 1 : gw);
          const wm = w[m];
          let q = (wk - wm) * D * (this.cut ? 1.7 : 1) * f * h;
          if (q === 0) continue;
          const src = q > 0 ? k : m;
          const ws = w[src];
          if (ws <= 1e-6) continue;
          q = Math.max(-wm * 0.25, Math.min(wk * 0.25, q));
          const a = Math.abs(q) / ws;
          const dr = pr[src] * a, dy = py[src] * a, db = pb[src] * a;
          const dst = src === k ? m : k;
          w[src] -= Math.abs(q); w[dst] += Math.abs(q);
          pr[src] -= dr; py[src] -= dy; pb[src] -= db;
          pr[dst] += dr; py[dst] += dy; pb[dst] += db;
        }
      }
      // dye blends where the towel is wet: overlapping stains mix instead of pushing each other aside
      for (let k = 0; k < n; k++) {
        const wk = w[k];
        if (wk <= 1e-5) continue;
        for (let dir = 0; dir < 2; dir++) {
          const f = dir === 0 ? this.fx[k] : this.fy[k];
          if (!f) continue;
          const m = k + (dir === 0 ? 1 : gw), wm = w[m];
          if (wm <= 1e-5) continue;
          const c = Math.min(wk, wm) * MIXD * f * h;
          for (const pc of this.p) {
            const q = (pc[k] / wk - pc[m] / wm) * c;
            pc[k] -= q; pc[m] += q;
          }
        }
      }
      // drying
      const e = Math.exp(-DRY * h);
      for (let k = 0; k < n; k++) {
        if (w[k] <= 0) continue;
        w[k] = w[k] * e - 0.00002;
        if (w[k] < 0) w[k] = 0; else any = true;
      }
    }
    this.wet = any;
    this.dirty = true;
  }

  /** Paint the stain into the small canvas (only when something changed). */
  render() {
    if (!this.dirty) return;
    this.dirty = false;
    const { gw, gh } = this, px = this.img.data, [pr, py, pb] = this.p;
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const k = j * gw + i, o = k * 4;
      const own = pr[k] + py[k] + pb[k];
      // the rim: dye gathers where the stain ends (darker than its neighbours' average)
      let nb = 0, cnt = 0;
      if (i > 0) { nb += pr[k - 1] + py[k - 1] + pb[k - 1]; cnt++; }
      if (i < gw - 1) { nb += pr[k + 1] + py[k + 1] + pb[k + 1]; cnt++; }
      if (j > 0) { nb += pr[k - gw] + py[k - gw] + pb[k - gw]; cnt++; }
      if (j < gh - 1) { nb += pr[k + gw] + py[k + gw] + pb[k + gw]; cnt++; }
      // a soft edge: the amount is averaged with the neighbours, so the grid's steps don't show
      const a = (own * 2 + nb) / (2 + cnt);
      if (a < 1e-5) { px[o + 3] = 0; continue; }
      const rim = own > 1e-5 ? Math.max(0, Math.min(1, (own - nb / cnt) / own)) * 0.22 : 0;
      // the colour of an empty edge cell comes from its neighbours
      let cr = pr[k], cyl = py[k], cb = pb[k];
      if (own < 1e-5) {
        if (i > 0) { cr += pr[k - 1]; cyl += py[k - 1]; cb += pb[k - 1]; }
        if (i < gw - 1) { cr += pr[k + 1]; cyl += py[k + 1]; cb += pb[k + 1]; }
        if (j > 0) { cr += pr[k - gw]; cyl += py[k - gw]; cb += pb[k - gw]; }
        if (j < gh - 1) { cr += pr[k + gw]; cyl += py[k + gw]; cb += pb[k + gw]; }
      }
      const rgb = pigToRgb([cr, cyl, cb]);
      const wet = Math.min(1, this.w[k] * 18);
      const dark = 1 - 0.22 * wet - 0.25 * rim;
      let alpha = 1 - Math.exp(-a * INK);
      alpha *= 0.93 + 0.14 * this.grain[k];
      px[o] = rgb[0] * 255 * dark; px[o + 1] = rgb[1] * 255 * dark; px[o + 2] = rgb[2] * 255 * dark;
      px[o + 3] = Math.min(235, alpha * 235 + rim * 20);
    }
    this.small.getContext('2d')!.putImageData(this.img, 0, 0);
    // smooth it up once here (the browser then stretches it smoothly again): no blocky cells
    const g = this.canvas.getContext('2d')!;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.drawImage(this.small, 0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * How each area of the picture looks: how much of it is coloured, how much
   * of that is clearly the wrong colour, and its colour on average. This is
   * what a child sees, so it is what the level checks (not exact amounts).
   */
  areaLook(): { covered: number; wrong: number; colour: Pig; pieces: number[] }[] {
    const n = this.areas.length;
    const cells = new Array(n).fill(0), cov = new Array(n).fill(0), bad = new Array(n).fill(0);
    const pc: number[][] = this.areas.map(() => new Array(16).fill(0)), pn: number[][] = this.areas.map(() => new Array(16).fill(0));
    const col: Pig[] = this.areas.map(() => [0, 0, 0]);
    const tg = this.areas.map((a) => share(PIG[a.color]));
    const [pr, py, pb] = this.p;
    for (let k = 0; k < this.area.length; k++) {
      const i = this.area[k];
      if (i < 0) continue;
      cells[i]++;
      pn[i][this.piece[k]]++;
      const a = pr[k] + py[k] + pb[k];
      if (a < SEEN) continue;
      col[i][0] += pr[k]; col[i][1] += py[k]; col[i][2] += pb[k];
      const t = tg[i];
      // coloured in only where the towel really shows the area's colour: yellow and blue
      // side by side don't make a green area, they have to meet and mix
      if (Math.hypot(pr[k] / a - t[0], py[k] / a - t[1], pb[k] / a - t[2]) < 0.3) { cov[i]++; pc[i][this.piece[k]]++; }
      // wrong: a good part of a colour this area doesn't use at all (red in the leaves);
      // yellow alone in a green area is not wrong, just not green yet
      if ((t[0] < 0.05 ? pr[k] : 0) + (t[1] < 0.05 ? py[k] : 0) + (t[2] < 0.05 ? pb[k] : 0) > a * 0.5) bad[i]++;
    }
    return this.areas.map((_, i) => ({
      covered: cells[i] ? cov[i] / cells[i] : 0,
      wrong: cells[i] ? bad[i] / cells[i] : 0,
      colour: col[i],
      pieces: pn[i].map((c, q) => (c ? pc[i][q] / c : -1)).filter((v) => v >= 0),
    }));
  }

  /** How much of each dye each area of the picture holds. */
  areaPaint(): Pig[] {
    const out: Pig[] = this.areas.map(() => [0, 0, 0]);
    const [pr, py, pb] = this.p;
    for (let k = 0; k < this.area.length; k++) {
      const a = this.area[k];
      if (a < 0) continue;
      out[a][0] += pr[k]; out[a][1] += py[k]; out[a][2] += pb[k];
    }
    return out;
  }

  /** Which area of the picture is at this world point (-1: none). */
  areaAt(x: number, y: number): number {
    const d = this.def;
    const i = Math.floor((x - d.x0) / CELL), j = Math.floor((y - d.y0) / CELL);
    if (i < 0 || j < 0 || i >= this.gw || j >= this.gh) return -1;
    return this.area[j * this.gw + i];
  }

  /**
   * Where in an area to put the next drop: its uncoloured spot farthest from
   * any colour already there, so a few drops fill even a big area.
   */
  areaCentre(i: number) {
    const d = this.def, [pr, py, pb] = this.p;
    const t = share(PIG[this.areas[i].color]);
    // coloured in its own colour (a bleed of another colour doesn't count, as in areaLook)
    const right = (k: number) => {
      const a = pr[k] + py[k] + pb[k];
      return a >= SEEN && Math.hypot(pr[k] / a - t[0], py[k] / a - t[1], pb[k] / a - t[2]) < 0.3;
    };
    // the piece with the least of its own colour so far
    const counts = new Map<number, [number, number]>();
    for (let k = 0; k < this.area.length; k++) {
      if (this.area[k] !== i) continue;
      const c = counts.get(this.piece[k]) ?? [0, 0];
      c[0]++; if (right(k)) c[1]++;
      counts.set(this.piece[k], c);
    }
    let pi = 0, lowest = Infinity;
    for (const [q, [n, c]] of counts) if (c / n < lowest) { lowest = c / n; pi = q; }
    if (this.cut) {
      // a cut-out piece: aim at its middle (the drop soaks in where it first touches)
      let sx = 0, sy = 0, n = 0;
      for (let k = 0; k < this.area.length; k++) if (this.area[k] === i && this.piece[k] === pi) { sx += k % this.gw; sy += Math.floor(k / this.gw); n++; }
      if (n) return { x: d.x0 + (sx / n + 0.5) * CELL, y: d.y0 + (sy / n + 0.5) * CELL };
    }
    const empty: number[] = [], coloured: number[] = [];
    for (let k = 0; k < this.area.length; k++) {
      if (this.area[k] !== i || this.piece[k] !== pi) continue;
      (right(k) ? coloured : empty).push(k);
    }
    const at = (k: number) => ({ x: d.x0 + ((k % this.gw) + 0.5) * CELL, y: d.y0 + (Math.floor(k / this.gw) + 0.5) * CELL });
    if (!empty.length) return at(coloured[Math.floor(coloured.length / 2)]);
    if (!coloured.length) {
      // nothing yet: the middle of the piece's first shape
      const s0 = this.areas[i].shapes.find((s, si) => (s.piece ?? si) === pi) ?? this.areas[i].shapes[0];
      return { x: (d.x0 + d.x1) / 2 + s0.x, y: (d.y0 + d.y1) / 2 + s0.y };
    }
    // the area's border (cells with a neighbour outside it): paint dropped near it bleeds out
    const gw = this.gw, edge: number[] = [];
    for (const k of [...empty, ...coloured]) {
      const x = k % gw;
      if ((x > 0 && this.area[k - 1] !== i) || (x < gw - 1 && this.area[k + 1] !== i) || this.area[k - gw] !== i || this.area[k + gw] !== i) edge.push(k);
    }
    // a sample of empty cells; keep the one farthest from colour, and well inside the border
    const pick = (a: number[], n: number) => (a.length <= n ? a : Array.from({ length: n }, (_, q) => a[Math.floor((q * a.length) / n)]));
    const cs = pick(coloured, 80).map(at), es = pick(edge, 80).map(at);
    const near = (p: { x: number; y: number }, list: { x: number; y: number }[]) => list.reduce((m, c) => Math.min(m, Math.hypot(p.x - c.x, p.y - c.y)), Infinity);
    let best = at(empty[0]), score = -1;
    for (const p of pick(empty, 80).map(at)) {
      const v = Math.min(near(p, cs), near(p, es) * 1.6);
      if (v > score) { score = v; best = p; }
    }
    return best;
  }
}

/** The colour an area wants, as shares (sum 1). */
export const areaTarget = (a: Area): Pig => share(PIG[a.color]);
