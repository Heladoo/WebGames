// Soft pastel palette shared by every drawing.

export const INK = '#5a4658'; // soft outline colour (never pure black)
export const BLUSH = '#ff9fb2';
export const WHITE = '#fffaf4';

export const OUT = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
export const THIN = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

/** A 200×200 picture wrapped as a standalone SVG (cards, stickers, icons). */
export function svgBox(inner: string, box = '0 0 200 200', cls = 'pic'): string {
  return `<svg class="${cls}" viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

/** Small deterministic random generator so scenery looks the same every time. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
