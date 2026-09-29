import { PALETTE } from './palette';

// A sprite is a text grid (one character = one pixel) baked once into an
// offscreen canvas. `px`/`py` is the pivot pixel used for placement.
export interface Sprite {
  name: string;
  w: number;
  h: number;
  px: number;
  py: number;
  canvas: HTMLCanvasElement;
}

export type Grid = string[];

export function bake(
  name: string,
  rows: Grid,
  pivot: [number, number] = [0, 0],
  swap: Record<string, string> = {},
): Sprite {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d')!;
  rows.forEach((row, y) => {
    if (row.length !== w) {
      throw new Error(`sprite "${name}": row ${y} has ${row.length} px, expected ${w}`);
    }
    for (let x = 0; x < w; x++) {
      const ch = swap[row[x]] ?? row[x];
      if (ch === '.') continue;
      const color = PALETTE[ch];
      if (!color) throw new Error(`sprite "${name}": unknown palette letter "${ch}" at ${x},${y}`);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return { name, w, h, px: pivot[0], py: pivot[1], canvas };
}

export function draw(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number) {
  ctx.drawImage(s.canvas, Math.round(x) - s.px, Math.round(y) - s.py);
}

/** Mutable char grid helpers for sprites composed in code. */
export function blank(w: number, h: number): string[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
}

export function stamp(grid: string[][], rows: Grid, ox: number, oy: number) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      const gy = oy + y;
      const gx = ox + x;
      if (gy >= 0 && gy < grid.length && gx >= 0 && gx < grid[0].length) grid[gy][gx] = row[x];
    }
  });
}

export function line(grid: string[][], x0: number, y0: number, x1: number, y1: number, ch: string) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (grid[y0]?.[x0] !== undefined) grid[y0][x0] = ch;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function toRows(grid: string[][]): Grid {
  return grid.map((r) => r.join(''));
}

/** Adds a 1px outline of `ch` around every filled pixel. */
export function outline(rows: Grid, ch = 'O'): Grid {
  const h = rows.length + 2;
  const w = rows[0].length + 2;
  const g = blank(w, h);
  stamp(g, rows, 1, 1);
  const out = g.map((r) => r.slice());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const v = g[y + dy]?.[x + dx];
        return v !== undefined && v !== '.';
      });
      if (near) out[y][x] = ch;
    }
  }
  return toRows(out);
}

export function mirror(rows: Grid): Grid {
  return rows.map((r) => r.split('').reverse().join(''));
}

/** A data URL of a sprite scaled up crisply, for use in DOM <img> tags. */
export function spriteURL(s: Sprite, scale = 4): string {
  const c = document.createElement('canvas');
  c.width = s.w * scale;
  c.height = s.h * scale;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s.canvas, 0, 0, c.width, c.height);
  return c.toDataURL();
}
