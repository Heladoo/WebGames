import { blank, Grid, toRows } from './sprite';

// Procedural shape helpers for building smooth, consistently shaded pixel art.
// Light always comes from the top-left.

export type Pix = string[][];

export interface ShapeOpts {
  fill: string;
  shade?: string; // bottom-right rim
  light?: string; // top-left highlight spot
  outline?: string | null; // null = no outline (blend into what's below)
  power?: number; // superellipse exponent (2 = ellipse, higher = squarer)
  shadeAt?: number; // threshold for shading (default 0.45)
  lightAt?: number; // threshold for light (default 0.55)
}

export function grid(w: number, h: number): Pix {
  return blank(w, h);
}

export function put(g: Pix, x: number, y: number, ch: string) {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch;
}

export function get(g: Pix, x: number, y: number) {
  return g[y]?.[x];
}

/** Filled, shaded, outlined (super)ellipse inside the box x0,y0,w,h. */
export function ellipse(g: Pix, x0: number, y0: number, w: number, h: number, o: ShapeOpts) {
  const p = o.power ?? 2;
  const inside = (x: number, y: number) => {
    const nx = (x + 0.5 - w / 2) / (w / 2);
    const ny = (y + 0.5 - h / 2) / (h / 2);
    return Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p) <= 1;
  };
  shape(g, x0, y0, w, h, inside, o);
}

/** Generic shape fill with shading + outline from an inside() test in local coords. */
export function shape(
  g: Pix,
  x0: number,
  y0: number,
  w: number,
  h: number,
  inside: (x: number, y: number) => boolean,
  o: ShapeOpts,
) {
  const outline = o.outline === undefined ? 'O' : o.outline;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1) ||
        x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let ch = o.fill;
      const nx = (x + 0.5 - w / 2) / (w / 2);
      const ny = (y + 0.5 - h / 2) / (h / 2);
      const dot = nx * 0.55 + ny * 0.8;
      if (o.shade && dot > (o.shadeAt ?? 0.45)) ch = o.shade;
      if (o.light && -dot > (o.lightAt ?? 0.55) && Math.abs(nx + 0.35) < 0.35) ch = o.light;
      if (edge && outline) ch = outline;
      put(g, x0 + x, y0 + y, ch);
    }
  }
}

export function rect(g: Pix, x0: number, y0: number, w: number, h: number, ch: string) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(g, x0 + x, y0 + y, ch);
}

/** Stamp a hand-drawn grid ('.' is transparent). */
export function stampRows(g: Pix, rows: Grid, ox: number, oy: number) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') put(g, ox + x, oy + y, row[x]);
  });
}

/** Adds an outline around all filled pixels (in place). */
export function outlineAll(g: Pix, ch = 'O') {
  const h = g.length;
  const w = g[0].length;
  const add: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const v = get(g, x + dx, y + dy);
        return v !== undefined && v !== '.' && v !== ch;
      })) add.push([x, y]);
    }
  }
  for (const [x, y] of add) g[y][x] = ch;
}

export function done(g: Pix): Grid {
  return toRows(g);
}

/** Replace characters in a grid (palette swap at grid level). */
export function recolor(rows: Grid, map: Record<string, string>): Grid {
  return rows.map((r) => r.replace(/./g, (c) => map[c] ?? c));
}
