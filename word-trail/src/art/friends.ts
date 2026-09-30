import { heroArt, HEROES, HeroId } from './characters';
import { C, ell, eye, flat, line, piece, shade } from './paper';

// Small friends in the paper style, facing right like the hero, drawn in a
// 100×100 box standing on y≈96. Other heroes can come along too (half size).

const cheek = (x: number, y: number) => flat(ell(x, y, 4, 2.6), C.blush, 'opacity="0.85"');

const SMALL: Record<string, { art: string; fly?: boolean }> = {
  bee: {
    fly: true,
    art: `
      <g class="wing">${piece('M40 40 C30 22 42 12 50 24 C54 30 50 40 44 42 Z', '#f4fbfa', { lift: 0.6 })}${piece('M52 36 C52 16 68 14 68 28 C68 36 60 42 54 42 Z', '#f4fbfa', { lift: 0.6 })}</g>
      ${piece('M22 60 C22 42 44 36 60 42 C76 48 80 64 70 74 C58 84 30 82 22 60 Z', C.butter, { lift: 1.4 })}
      ${flat('M36 42 C32 54 32 68 38 79 L46 80 C40 68 40 54 44 40 Z M52 40 C48 54 49 68 56 80 L63 78 C57 66 56 54 60 42 Z', C.ink)}
      ${flat('M18 60 L24 57 L24 63 Z', C.ink)}
      ${eye(68, 57, 4.4, 'eye')}${cheek(66, 66)}
      ${line('M64 44 C64 34 68 28 74 27', C.ink, 2)}`,
  },
  bird: {
    fly: true,
    art: `
      ${piece('M26 62 L10 52 L14 70 Z', shade(C.indigo, -0.1), { lift: 0.8 })}
      ${piece('M22 62 C22 46 38 40 52 44 C66 48 70 62 64 72 C56 82 30 82 22 62 Z', C.indigo, { lift: 1.4 })}
      ${piece('M36 66 C44 60 58 62 62 70 C56 78 42 78 36 66 Z', '#e7ecfb', { lift: 0.5 })}
      <g class="wing">${piece('M30 56 C38 40 52 44 52 56 C46 60 38 60 30 56 Z', shade(C.indigo, -0.15), { lift: 0.8 })}</g>
      ${piece(ell(60, 44, 13, 12.5), C.indigo, { lift: 1.2 })}
      ${piece('M70 42 L82 46 L70 50 Z', C.mustard, { lift: 0.5 })}
      ${eye(64, 42, 4, 'eye')}${cheek(62, 50)}`,
  },
  bug: {
    art: `
      ${line('M36 90 L30 97 M50 92 L50 98 M64 90 L70 97', C.ink, 2)}
      ${piece('M26 78 C26 62 40 56 52 56 C66 56 76 66 74 80 C72 92 58 96 48 96 C36 96 26 90 26 78 Z', C.coral, { lift: 1.4 })}
      ${line('M50 57 L48 95', shade(C.coral, -0.35), 2)}
      ${flat(ell(38, 70, 4.5, 4.5), C.ink)}${flat(ell(60, 70, 4.5, 4.5), C.ink)}${flat(ell(40, 84, 3.6, 3.6), C.ink)}${flat(ell(60, 84, 3.6, 3.6), C.ink)}
      ${piece(ell(76, 70, 11, 10.5), '#5a4a55', { lift: 1 })}
      ${eye(80, 68, 3.4, 'eye')}
      ${line('M76 60 C78 50 84 48 86 48 M72 60 C70 50 72 46 74 44', C.ink, 1.8)}`,
  },
  fish: {
    fly: true,
    art: `
      ${flat(ell(50, 56, 34, 34), '#dff1f3', 'opacity="0.55"')}${flat(ell(50, 56, 34, 34), 'none', `stroke="#a9d7dc" stroke-width="3"`)}
      ${flat(ell(38, 36, 8, 4), '#fff', 'opacity="0.8" transform="rotate(-30 38 36)"')}
      <g class="tailfin">${piece('M32 58 L18 46 L18 70 Z', shade(C.mustard, -0.1), { lift: 0.8 })}</g>
      ${piece('M30 58 C32 46 46 42 58 44 C70 46 74 56 70 64 C64 72 44 74 30 58 Z', C.mustard, { lift: 1.4 })}
      ${piece('M44 46 C48 38 56 38 60 45 Z', shade(C.mustard, -0.18), { lift: 0.5 })}
      ${eye(62, 54, 3.8, 'eye')}${cheek(58, 62)}
      ${flat(ell(78, 38, 3, 3), 'none', 'stroke="#a9d7dc" stroke-width="2"')}${flat(ell(82, 28, 2, 2), 'none', 'stroke="#a9d7dc" stroke-width="2"')}`,
  },
  mouse: {
    art: `
      ${line('M26 84 C12 84 8 74 12 64', '#c9a6b0', 3)}
      ${piece('M24 80 C24 64 38 60 52 62 C66 64 70 76 66 86 C60 96 30 96 24 80 Z', '#c5bdd3', { lift: 1.4 })}
      ${piece(ell(62, 50, 10, 10), '#c5bdd3', { lift: 1 })}${flat(ell(62, 50, 5.5, 5.5), C.rose)}
      ${piece('M56 66 C54 54 62 46 72 48 C82 50 90 58 88 66 C84 74 60 76 56 66 Z', '#c5bdd3', { lift: 1.2 })}
      ${piece(ell(80, 48, 9, 9), shade('#c5bdd3', -0.1), { lift: 0.8 })}${flat(ell(80, 48, 4.6, 4.6), C.rose)}
      ${eye(72, 60, 3.6, 'eye')}
      ${piece(ell(89, 64, 3, 3), '#e98c9c', { lift: 0.4 })}${cheek(76, 68)}
      ${line('M38 94 L38 97 M54 94 L54 97', C.ink, 2)}`,
  },
  hen: {
    art: `
      ${line('M42 88 L42 97 L36 97 M56 88 L56 97 L62 97', C.mustard, 3)}
      ${piece('M24 64 C14 50 20 40 28 44 C30 52 34 58 36 60 Z', '#f5ece0', { lift: 0.8 })}
      ${piece('M24 70 C24 54 42 48 56 52 C72 56 78 70 72 82 C64 94 32 94 24 70 Z', '#fff7ec', { lift: 1.4 })}
      ${piece('M36 70 C46 62 58 66 60 74 C52 82 40 80 36 70 Z', '#efe3d2', { lift: 0.6 })}
      ${piece(ell(66, 44, 13, 13), '#fff7ec', { lift: 1.2 })}
      ${piece('M58 32 C58 24 64 22 66 28 C68 20 76 22 74 30 C78 28 80 34 76 36 Z', C.coral, { lift: 0.6 })}
      ${piece('M78 42 L88 46 L78 50 Z', C.mustard, { lift: 0.5 })}
      ${piece('M78 52 C80 58 76 60 74 58 C73 56 74 54 78 52 Z', C.coral, { lift: 0.4 })}
      ${eye(70, 42, 3.6, 'eye')}${cheek(66, 51)}`,
  },
};

export const SMALL_FRIENDS = Object.keys(SMALL);

export const isFlying = (id: string) => !!SMALL[id]?.fly;

/** A friend drawn in the 100×100 box. */
export function friendArt(id: string): string {
  const s = SMALL[id];
  if (s) return `<g data-word="${id}" class="friend ${s.fly ? 'fly' : 'hop'}" filter="url(#pc)">${s.art}</g>`;
  if ((HEROES as string[]).includes(id))
    return `<g data-word="${id}" class="friend hop"><g transform="translate(0 0) scale(0.5)" filter="url(#pc)">${heroArt(id as HeroId)}</g></g>`;
  return '';
}

/** Card picture (200×200) for a small friend. */
export function friendIcon(id: string): string {
  if ((HEROES as string[]).includes(id)) return `<g filter="url(#pc)">${heroArt(id as HeroId)}</g>`;
  return `<g transform="translate(0 -4) scale(2)" filter="url(#pc)">${SMALL[id]?.art ?? ''}</g>`;
}
