import { INK, OUT, THIN } from './palette';

// Vehicles wrap around a seated hero drawn in the same 200×200 box.
// `under` is drawn before the hero, `over` after it; `dy` lifts the hero.

export interface Ride {
  under: string;
  over: string;
  dy: number;
}

const wheel = (x: number, y: number, r = 15) => `<g class="wheel" style="transform-origin:${x}px ${y}px">
  <circle cx="${x}" cy="${y}" r="${r}" fill="#6b5a70" ${OUT}/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#e9e3ef"/>
  <path d="M${x - r * 0.45} ${y} L${x + r * 0.45} ${y}" stroke="${INK}" stroke-width="2"/></g>`;

export const RIDES: Record<string, Ride> = {
  car: {
    dy: -4,
    under: '',
    over: `<g data-word="car">
      <path d="M150 124 L166 102 L172 104 L160 128" fill="#dff3ff" fill-opacity="0.8" ${THIN}/>
      <path d="M18 150 Q20 128 44 128 L150 128 Q176 128 188 146 Q196 150 194 170 Q194 184 180 184 L26 184 Q14 184 16 170 Z" fill="#ff7a7a" ${OUT}/>
      <path d="M26 148 L186 148" stroke="#ffb0a8" stroke-width="4"/>
      <circle cx="186" cy="160" r="6" fill="#fff4b0" ${THIN}/>
      ${wheel(54, 186)}${wheel(158, 186)}</g>`,
  },
  bus: {
    dy: -6,
    under: `<rect x="4" y="18" width="192" height="168" rx="22" fill="#fff3c4"/>`,
    over: `<g data-word="bus">
      <path fill-rule="evenodd" d="M4 40 Q4 16 28 16 L172 16 Q196 16 196 40 L196 172 Q196 184 184 184 L16 184 Q4 184 4 172 Z M52 30 L148 30 L148 132 L52 132 Z" fill="#ffd45c" ${OUT}/>
      <rect x="12" y="34" width="30" height="36" rx="7" fill="#dff3ff" ${THIN}/><rect x="158" y="34" width="30" height="36" rx="7" fill="#dff3ff" ${THIN}/>
      <path d="M4 148 L196 148" stroke="#f0a830" stroke-width="5"/>
      <circle cx="188" cy="160" r="6" fill="#fff" ${THIN}/>
      ${wheel(44, 186, 16)}${wheel(156, 186, 16)}</g>`,
  },
  boat: {
    dy: -2,
    under: `<g data-word="boat"><path d="M40 150 L40 22" stroke="#a8744f" stroke-width="5" stroke-linecap="round"/>
      <path d="M44 26 Q70 70 44 132 Z" fill="#fff8ee" ${OUT}/><path d="M40 22 L20 30 L40 38 Z" fill="#ff8fb0" ${THIN}/></g>`,
    over: `<g data-word="boat">
      <path d="M12 142 L192 142 Q180 186 150 188 L52 188 Q22 186 12 142 Z" fill="#7fb8f0" ${OUT}/>
      <path d="M20 156 L186 156" stroke="#fff" stroke-width="5"/>
      <circle cx="160" cy="170" r="6" fill="#fff" ${THIN}/>
      <path class="waves" d="M-20 190 q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#7fd0f0" stroke-width="6" stroke-linecap="round"/></g>`,
  },
  train: {
    dy: -6,
    under: `<g data-word="train"><path d="M50 24 L50 134 M150 24 L150 134" stroke="#8a5c42" stroke-width="6" stroke-linecap="round"/>
      <rect x="40" y="14" width="120" height="16" rx="6" fill="#ff7a7a" ${OUT}/>
      <circle class="smoke" cx="186" cy="60" r="10" fill="#fff" opacity="0.8"/><circle class="smoke s2" cx="176" cy="40" r="13" fill="#fff" opacity="0.7"/></g>`,
    over: `<g data-word="train">
      <rect x="150" y="100" width="46" height="62" rx="12" fill="#7cc9a8" ${OUT}/>
      <rect x="170" y="70" width="16" height="32" rx="4" fill="#6b5a70" ${OUT}/>
      <rect x="40" y="132" width="122" height="44" rx="8" fill="#ff7a7a" ${OUT}/>
      <path d="M40 150 L196 150" stroke="#ffd45c" stroke-width="5"/>
      ${wheel(66, 180, 14)}${wheel(118, 180, 14)}${wheel(172, 176, 18)}</g>`,
  },
  bike: {
    dy: -14,
    under: '',
    over: `<g data-word="bike">
      ${wheel(44, 172, 22)}${wheel(162, 172, 22)}
      <path d="M44 172 L84 136 L128 136 L162 172 M84 136 L100 172 L128 136 M100 172 L96 128 M150 120 L128 136" fill="none" stroke="#ff8fb0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M86 126 L108 126" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M142 116 L160 112" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="172" r="7" fill="#6b5a70"/></g>`,
  },
};

export const RIDE_IDS = Object.keys(RIDES);

/** Card picture: the vehicle with nobody in it. */
export function rideIcon(id: string): string {
  const r = RIDES[id];
  if (!r) return '';
  if (id === 'bus') return r.under + r.over.replace('fill-rule="evenodd"', '').replace(/ M52 30 L148 30 L148 132 L52 132 Z/, '') +
    `<rect x="54" y="34" width="92" height="40" rx="8" fill="#dff3ff" ${THIN}/>`;
  return r.under + r.over;
}
