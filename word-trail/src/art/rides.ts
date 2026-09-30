import { C, ell, flat, line, piece, shade } from './paper';

// Paper vehicles wrap around a seated hero drawn in the same 200×200 box
// (the hero faces right). `under` is drawn before the hero, `over` after it,
// and `dy` lifts the hero into its seat. Wheels and hulls sit on y≈192.

export interface Ride {
  under: string;
  over: string;
  dy: number;
}

const wheel = (x: number, y: number, r = 14) => `<g class="wheel" style="transform-origin:${x}px ${y}px" data-part="wheel">
  ${piece(ell(x, y, r, r), '#4a3f47', { lift: 1.2 })}${flat(ell(x, y, r * 0.5, r * 0.5), '#e9e2d6')}
  ${line(`M${x - r * 0.5} ${y} L${x + r * 0.5} ${y} M${x} ${y - r * 0.5} L${x} ${y + r * 0.5}`, '#4a3f47', 2)}</g>`;

export const RIDES: Record<string, Ride> = {
  car: {
    dy: -8,
    under: '',
    over: `<g data-word="car" data-item="vehicle">
      ${piece('M150 126 L162 104 L168 106 L160 130 Z', '#e9f5f4', { lift: 0.6 })}
      ${piece('M16 150 C18 130 40 128 56 128 L148 128 C172 128 184 138 190 150 C196 154 196 174 188 178 L22 178 C14 176 14 160 16 150 Z', C.coral, { lift: 2 })}
      ${piece('M22 150 L190 150 L190 158 L20 158 Z', shade(C.coral, 0.25), { lift: 0.4 })}
      ${piece(ell(186, 158, 5, 5), C.butter, { lift: 0.4 })}
      ${wheel(52, 178)}${wheel(156, 178)}</g>`,
  },
  bus: {
    dy: -10,
    under: piece('M8 44 C8 24 20 18 34 18 L170 18 C184 18 194 26 194 44 L194 176 L8 176 Z', '#f6ead3', { lift: 0 }),
    over: `<g data-word="bus" data-item="vehicle">
      ${piece('M8 44 C8 24 20 18 34 18 L170 18 C184 18 194 26 194 44 L194 170 C194 176 188 180 182 180 L20 180 C12 180 8 176 8 170 Z M56 34 L56 140 L160 140 L160 34 Z', C.mustard, { lift: 2 })}
      ${piece('M16 38 L46 38 L46 74 L16 74 Z', '#e9f5f4', { lift: 0.5 })}${piece('M168 38 L188 38 L188 74 L168 74 Z', '#e9f5f4', { lift: 0.5 })}
      ${piece('M8 150 L194 150 L194 158 L8 158 Z', shade(C.mustard, -0.18), { lift: 0.4 })}
      ${piece(ell(188, 166, 4.5, 4.5), C.white, { lift: 0.4 })}
      ${wheel(46, 180, 15)}${wheel(156, 180, 15)}</g>`,
  },
  boat: {
    dy: -6,
    under: `<g data-word="boat">${line('M40 146 L40 26', C.bark, 5)}
      ${piece('M44 30 C70 70 70 104 44 136 Z', C.white, { lift: 1.2 })}${piece('M40 26 L20 34 L40 42 Z', C.coral, { lift: 0.6 })}</g>`,
    over: `<g data-word="boat" data-item="vehicle">
      ${piece('M10 140 L194 140 C184 176 164 190 146 190 L56 190 C36 190 18 176 10 140 Z', C.teal, { lift: 2 })}
      ${piece('M16 152 L190 152 L187 160 L19 160 Z', C.butter, { lift: 0.4 })}
      ${piece(ell(160, 172, 5, 5), C.white, { lift: 0.4 })}
      <g class="waves">${piece('M-30 186 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 L230 198 L-30 198 Z', '#8ecfd6', { lift: 0.8 })}</g></g>`,
  },
  train: {
    dy: -10,
    under: `<g data-word="train">${line('M50 30 L50 134 M148 30 L148 134', C.bark, 6)}
      ${piece('M38 16 L160 16 L160 32 L38 32 Z', C.coral, { lift: 1.2 })}
      ${piece(ell(186, 58, 10, 10), C.white, { lift: 0, cls: 'smoke' })}${piece(ell(176, 38, 13, 13), C.white, { lift: 0, cls: 'smoke s2' })}</g>`,
    over: `<g data-word="train" data-item="vehicle">
      ${piece('M150 98 L196 98 L196 166 L150 166 Z', C.teal, { lift: 1.6 })}
      ${piece('M170 68 L186 68 L186 100 L170 100 Z', '#4a3f47', { lift: 1 })}
      ${piece('M38 130 L160 130 L160 174 L38 174 Z', C.coral, { lift: 2 })}
      ${piece('M38 146 L196 146 L196 154 L38 154 Z', C.butter, { lift: 0.4 })}
      ${wheel(64, 176, 13)}${wheel(116, 176, 13)}${wheel(172, 174, 18)}</g>`,
  },
  bike: {
    dy: -16,
    under: '',
    over: `<g data-word="bike" data-item="vehicle">
      ${wheel(44, 170, 22)}${wheel(162, 170, 22)}
      ${line('M44 170 L84 134 L128 134 L162 170 M84 134 L100 170 L128 134 M100 170 L96 124 M150 116 L128 134', C.rose, 6)}
      ${line('M86 122 L108 122', C.ink, 7)}${line('M142 112 L160 108', C.ink, 6)}
      ${flat(ell(100, 170, 7, 7), '#4a3f47')}</g>`,
  },
};

export const RIDE_IDS = Object.keys(RIDES);

/** Card picture: the vehicle with nobody in it. */
export function rideIcon(id: string): string {
  const r = RIDES[id];
  if (!r) return '';
  if (id === 'bus') return r.under + r.over.replace(' M56 34 L56 140 L160 140 L160 34 Z', '') + piece('M56 38 L160 38 L160 80 L56 80 Z', '#e9f5f4', { lift: 0.5 });
  return r.under + r.over;
}
