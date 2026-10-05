import { heroArt, HEROES, HeroId, type Look } from './characters';
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
  jellyfish: {
    fly: true,
    art: `
      ${line('M34 56 C30 66 38 72 34 82 C31 88 35 92 33 96', '#e88aae', 2.6)}
      ${line('M44 58 C40 68 48 74 44 84 C41 90 45 94 43 98', '#f0a3c0', 2.6)}
      ${line('M56 58 C52 68 60 74 56 84 C53 90 57 94 55 98', '#e88aae', 2.6)}
      ${line('M66 56 C62 66 70 72 66 82 C63 88 67 92 65 96', '#f0a3c0', 2.6)}
      ${piece('M22 56 C20 30 36 18 50 18 C66 18 80 30 78 56 C72 60 66 54 60 58 C54 62 46 56 40 60 C34 62 28 56 22 56 Z', '#f6a9c8', { lift: 1.4 })}
      ${flat('M30 40 C32 30 40 24 48 24 C40 28 34 34 32 44 Z', '#fff', 'opacity="0.55"')}
      ${flat(`${ell(36, 48, 3.4, 3.4)} ${ell(46, 52, 2.6, 2.6)}`, '#fbd3e2')}
      ${eye(62, 40, 4, 'eye')}${cheek(62, 49)}`,
  },
  squirrel: {
    art: `
      ${piece('M40 84 C18 84 8 66 14 48 C18 32 32 22 40 30 C46 36 36 42 30 46 C24 54 26 66 36 70 C44 74 48 80 40 84 Z', '#d6874a', { lift: 1.2 })}
      ${flat('M18 50 C22 38 30 30 36 32 C30 36 24 42 22 52 Z', '#efb27e', 'opacity="0.8"')}
      ${line('M48 86 L46 96 L40 96 M60 86 L62 96 L68 96', '#a95f2c', 3)}
      ${piece('M40 76 C38 60 46 52 56 52 C66 52 72 62 70 76 C68 88 62 92 54 92 C46 92 41 86 40 76 Z', '#c8743a', { lift: 1.4 })}
      ${piece('M50 70 C52 62 60 62 62 68 C62 78 56 84 52 82 C48 80 48 76 50 70 Z', '#f2d2ae', { lift: 0.4 })}
      ${line('M64 64 C68 68 68 74 64 76', '#a95f2c', 3.4)}
      ${piece(ell(64, 42, 12, 11), '#c8743a', { lift: 1.2 })}
      ${piece('M56 34 L58 22 L64 32 Z', '#c8743a', { lift: 0.5 })}${piece('M58 32 L59 26 L62 31 Z', '#efb27e', { lift: 0.2 })}
      ${piece('M70 46 C74 44 78 46 77 49 C74 51 71 50 70 46 Z', '#f2d2ae', { lift: 0.3 })}
      ${piece(ell(77, 46, 2, 1.8), C.ink, { lift: 0.2 })}
      ${eye(68, 40, 3.6, 'eye')}${cheek(64, 49)}`,
  },
  bunny: {
    art: `
      ${piece(ell(24, 74, 7, 7), '#ffffff', { lift: 0.8 })}
      ${piece('M28 80 C26 62 40 56 52 56 C66 56 74 66 72 80 C70 92 60 96 48 96 C36 96 29 90 28 80 Z', '#f6f1ea', { lift: 1.4 })}
      ${piece('M56 84 C54 92 60 96 66 96 C70 96 70 90 66 86 Z', '#ece4d8', { lift: 0.5 })}
      ${piece('M52 36 C46 18 48 6 54 6 C60 6 62 20 60 36 Z', '#f6f1ea', { lift: 1 })}${flat('M54 32 C51 20 52 12 55 12 C58 13 58 22 57 32 Z', '#f4b8c8')}
      ${piece('M62 38 C62 20 68 10 74 12 C80 14 76 28 70 40 Z', '#ece4d8', { lift: 1 })}${flat('M66 36 C66 24 70 16 73 17 C76 19 73 28 69 37 Z', '#f4b8c8')}
      ${piece('M50 50 C50 38 60 34 68 36 C78 38 82 48 80 56 C78 64 70 66 62 66 C54 66 50 60 50 50 Z', '#f6f1ea', { lift: 1.2 })}
      ${piece(ell(80, 52, 2.6, 2.2), '#e98c9c', { lift: 0.3 })}
      ${line('M80 55 C80 58 78 59 76 58', C.ink, 1.4)}
      ${eye(70, 47, 3.8, 'eye')}${cheek(68, 56)}`,
  },
  monkey: {
    art: `
      ${line('M30 82 C14 84 10 70 18 62 C24 56 30 62 26 66', '#8a5a3c', 3.4)}
      ${line('M42 86 L40 96 L34 96 M58 86 L60 96 L66 96', '#7a4e33', 3.4)}
      ${piece('M32 80 C30 64 40 56 52 56 C64 56 70 66 68 80 C66 92 58 94 50 94 C40 94 33 90 32 80 Z', '#9a6a4a', { lift: 1.4 })}
      ${piece('M42 78 C42 68 50 64 56 66 C62 68 62 80 56 86 C50 90 42 86 42 78 Z', '#e7c6a0', { lift: 0.4 })}
      ${line('M62 66 C70 70 74 78 72 86', '#8a5a3c', 4)}
      ${piece(ell(40, 40, 8, 8), '#9a6a4a', { lift: 0.8 })}${flat(ell(40, 40, 4.5, 4.5), '#e7c6a0')}
      ${piece(ell(58, 42, 17, 16), '#9a6a4a', { lift: 1.2 })}
      ${piece('M52 40 C52 32 60 30 66 34 C72 30 78 34 76 42 C80 46 78 56 70 58 C62 60 52 56 52 48 Z', '#e7c6a0', { lift: 0.5 })}
      ${line('M66 52 C69 54 72 53 74 51', C.ink, 1.6)}
      ${flat(`${ell(70, 48, 1.2, 1)} ${ell(73, 48, 1.2, 1)}`, C.ink)}
      ${eye(62, 41, 3.4, 'eye')}${eye(71, 41, 3, 'eye')}${cheek(60, 50)}`,
  },
  zebra: {
    // drawn a little left of the box middle so its head fits the card
    art: `<g transform="translate(-6 0)">
      ${line('M24 60 C16 64 14 72 16 80', '#4a3f47', 2.6)}${piece(ell(16, 82, 3, 4.4), '#4a3f47', { lift: 0.3 })}
      ${piece('M30 70 L28 94 L35 94 L37 72 Z M46 72 L46 94 L53 94 L53 72 Z', '#ece6dc', { lift: 0.8 })}
      ${piece('M60 72 L60 94 L67 94 L67 72 Z M72 70 L74 94 L81 94 L79 70 Z', '#f7f3ec', { lift: 0.8 })}
      ${flat('M27 92 L36 92 L36 96 L27 96 Z M45 92 L54 92 L54 96 L45 96 Z M59 92 L68 92 L68 96 L59 96 Z M73 92 L82 92 L82 96 L73 96 Z', '#4a3f47')}
      ${piece('M22 64 C22 52 36 48 52 48 C68 48 80 52 82 62 C84 72 72 78 52 78 C34 78 22 74 22 64 Z', '#f7f3ec', { lift: 1.4 })}
      ${flat('M34 50 C30 58 32 68 36 76 L40 77 C36 68 36 58 39 49 Z M48 48 C45 58 46 68 50 78 L55 78 C50 68 50 58 53 48 Z M62 49 C60 58 61 68 65 77 L69 76 C66 68 66 58 67 50 Z', '#4a3f47')}
      ${piece('M72 58 C72 44 76 34 82 28 L92 34 C88 40 86 50 84 62 Z', '#f7f3ec', { lift: 1.2 })}
      ${flat('M76 46 L84 44 L84 48 L75 50 Z M78 38 L87 37 L86 41 L77 42 Z', '#4a3f47')}
      ${piece('M80 22 C86 18 96 20 98 28 C100 36 96 42 90 42 C84 42 80 38 79 32 C78 28 78 24 80 22 Z', '#f7f3ec', { lift: 1.2 })}
      ${piece(ell(95, 36, 4.6, 5), '#5a4a55', { lift: 0.4 })}
      ${piece('M82 22 L82 12 L88 20 Z', '#f7f3ec', { lift: 0.4 })}
      ${flat('M80 22 C74 26 72 34 72 44 L76 40 C76 32 78 28 82 25 Z', '#4a3f47')}
      ${eye(88, 28, 3.2, 'eye')}</g>`,
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

/** A friend drawn in the 100×100 box (animal friends can wear hand-me-downs). */
export function friendArt(id: string, look?: Look): string {
  const s = SMALL[id];
  if (s) return `<g data-word="${id}" class="friend ${s.fly ? 'fly' : 'hop'}" filter="url(#pc)">${s.art}</g>`;
  if ((HEROES as string[]).includes(id))
    return `<g data-word="${id}" class="friend hop"><g transform="translate(0 0) scale(0.5)" filter="url(#pc)">${heroArt(id as HeroId, look)}</g></g>`;
  return '';
}

/** Card picture (200×200) for a small friend. */
export function friendIcon(id: string): string {
  if ((HEROES as string[]).includes(id)) return `<g filter="url(#pc)">${heroArt(id as HeroId)}</g>`;
  return `<g transform="translate(0 -4) scale(2)" filter="url(#pc)">${SMALL[id]?.art ?? ''}</g>`;
}
