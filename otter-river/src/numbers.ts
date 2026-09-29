import { worldArt } from './art/world';

/** Paints a number with the game's bold pixel digits into a canvas (crisp at any size). */
export function paintNumber(c: HTMLCanvasElement, value: number | string, scale: number, light = false) {
  const set = light ? worldArt().digits : worldArt().digitsDark;
  const sprites = [...String(value)].map((ch) => set[ch]).filter(Boolean);
  const gap = light ? -1 : 1;
  const w = Math.max(1, sprites.reduce((s, sp) => s + sp.w + gap, -gap));
  const h = Math.max(...sprites.map((s) => s.h), 1);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  let x = 0;
  for (const s of sprites) {
    ctx.drawImage(s.canvas, x, 0);
    x += s.w + gap;
  }
  c.style.width = `${w * scale}px`;
  c.style.height = `${h * scale}px`;
  c.setAttribute('aria-label', String(value));
  c.setAttribute('role', 'img');
}

export function numberCanvas(value: number | string, scale: number, light = false) {
  const c = document.createElement('canvas');
  c.className = 'num';
  paintNumber(c, value, scale, light);
  return c;
}
