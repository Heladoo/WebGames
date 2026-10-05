// A light, always-moving layer over the painted scenery: gulls, glints, pollen, fireflies, snow, butterflies.
// It uses only simple shapes and CSS transforms (no filters), so it stays smooth on phones, and it is left
// out when the player prefers reduced motion. It is placed so it lines up with the background picture.

import { rng } from './art/paint';
import { $ } from './dom';

const f = (n: number) => n.toFixed(1);

/** Delay and duration as inline style, so each little thing moves on its own clock. */
const clock = (r: () => number, dur: [number, number]) => `animation-duration:${f(dur[0] + r() * (dur[1] - dur[0]))}s;animation-delay:${f(-r() * 14)}s`;

const dots = (r: () => number, n: number, x: [number, number], y: [number, number], rad: [number, number], fill: string, cls: string, dur: [number, number], op = 0.9) =>
  Array.from({ length: n }, () => `<circle class="${cls}" cx="${f(x[0] + r() * (x[1] - x[0]))}" cy="${f(y[0] + r() * (y[1] - y[0]))}" r="${f(rad[0] + r() * (rad[1] - rad[0]))}" fill="${fill}" opacity="${op}" style="${clock(r, dur)}"/>`).join('');

const gull = (r: () => number, y: number, s: number) =>
  `<g class="a-glide" style="${clock(r, [26, 44])};--gy:${f(y)}px"><path d="M0 0 q${f(6 * s)} ${f(-6 * s)} ${f(12 * s)} 0 q${f(6 * s)} ${f(-6 * s)} ${f(12 * s)} 0" stroke="#fff" stroke-width="${f(1.6 * s)}" fill="none" stroke-linecap="round" opacity=".9"/></g>`;

const butterflyBit = (r: () => number, x: number, y: number, c: string) =>
  `<g class="a-flit" style="${clock(r, [9, 16])};transform-origin:${f(x)}px ${f(y)}px"><g transform="translate(${f(x)} ${f(y)})"><path class="a-flap" d="M0 0 C-8 -12 -16 -6 -12 2 C-9 6 -3 4 0 0Z M0 0 C8 -12 16 -6 12 2 C9 6 3 4 0 0Z" fill="${c}" style="${clock(r, [0.5, 0.8])}"/></g></g>`;

const SCENES: Record<string, (r: () => number) => string> = {
  beach: (r) =>
    // glints twinkling on the sea, and a few gulls crossing the sky
    Array.from({ length: 34 }, () => `<rect class="a-twinkle" x="${f(r() * 380)}" y="${f(296 + r() * 90)}" width="${f(2 + r() * 8)}" height="1" rx=".5" fill="#fff" style="${clock(r, [2.4, 5])}"/>`).join('') +
    gull(r, 96, 1) + gull(r, 140, 0.8) + gull(r, 70, 0.7),
  woods: (r) =>
    // drifting pollen, a few fireflies and falling leaves
    dots(r, 26, [0, 400], [120, 560], [0.8, 2], '#fffbd0', 'a-float', [8, 16], 0.85) +
    dots(r, 8, [30, 370], [380, 600], [1.6, 2.8], '#e8ff8a', 'a-twinkle', [2, 4], 1) +
    Array.from({ length: 6 }, () => `<g transform="translate(${f(r() * 400)} -20)"><path class="a-leaf" d="M0 0 C4 -4 9 -4 12 0 C9 4 4 4 0 0Z" fill="${['#e8a23a', '#d9682b', '#f2c94a'][Math.floor(r() * 3)]}" style="${clock(r, [10, 18])}"/></g>`).join(''),
  ball: (r) =>
    dots(r, 22, [0, 400], [30, 640], [2, 6], '#ffe9a8', 'a-twinkle', [1.6, 3.6], 0.8) +
    dots(r, 10, [0, 400], [420, 680], [6, 13], '#ff9ed4', 'a-drift', [10, 18], 0.18) + dots(r, 10, [0, 400], [420, 680], [6, 13], '#8fe0ff', 'a-drift', [12, 20], 0.18) +
    Array.from({ length: 8 }, () => { const x = 70 + r() * 56; const y = 140 + r() * 56; return `<path class="a-twinkle" d="M${f(x)} ${f(y - 6)} l1.6 4.4 l4.4 1.6 l-4.4 1.6 l-1.6 4.4 l-1.6 -4.4 l-4.4 -1.6 l4.4 -1.6Z" fill="#fff" style="${clock(r, [1.2, 2.6])}"/>`; }).join(''),
  city: (r) =>
    gull(r, 110, 0.9) + gull(r, 170, 0.7) + gull(r, 60, 0.8) +
    Array.from({ length: 14 }, () => `<rect class="a-twinkle" x="${f(r() * 380)}" y="${f(250 + r() * 140)}" width="${f(2 + r() * 4)}" height="1.2" fill="#fff" style="${clock(r, [2, 4.5])}"/>`).join(''),
  snow: (r) =>
    dots(r, 26, [0, 400], [-10, 20], [1, 2.2], '#fff', 'a-snow', [9, 16], 0.9) + dots(r, 14, [0, 400], [-10, 20], [2.4, 4], '#fff', 'a-snow', [7, 12], 0.7) +
    dots(r, 24, [0, 400], [430, 690], [0.8, 1.6], '#fff', 'a-twinkle', [1.4, 3.2], 1),
  garden: (r) =>
    butterflyBit(r, 120, 300, '#ff9ac0') + butterflyBit(r, 290, 380, '#ffd24a') + butterflyBit(r, 210, 520, '#9ab0ff') +
    dots(r, 22, [0, 400], [380, 680], [0.8, 1.8], '#fffbd0', 'a-float', [8, 15], 0.85) + dots(r, 18, [0, 400], [450, 700], [0.8, 1.6], '#fff', 'a-twinkle', [1.6, 3.4], 1),
};

export function setAmbient(place: string) {
  const el = $('ambient');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.innerHTML = '';
    return;
  }
  const build = SCENES[place];
  el.innerHTML = build ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" aria-hidden="true">${build(rng(place.length * 977 + place.charCodeAt(0)))}</svg>` : '';
}
