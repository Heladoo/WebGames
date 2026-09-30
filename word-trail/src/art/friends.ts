import { BLUSH, INK, OUT, THIN } from './palette';
import { heroArt, HEROES, HeroId } from './characters';

// Small friends drawn in a 100×100 box, standing on y≈96.
// Other heroes can also come along as friends (drawn at half size).

const eye = (x: number, y: number, r = 3.2) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + 1}" cy="${y - 1.2}" r="1.1" fill="#fff"/>`;
const cheek = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="${BLUSH}" opacity="0.75"/>`;

const SMALL: Record<string, { art: string; fly?: boolean }> = {
  bee: {
    fly: true,
    art: `
      <ellipse cx="44" cy="40" rx="12" ry="16" transform="rotate(-20 44 40)" fill="#e9f7ff" fill-opacity="0.85" ${THIN} class="wing"/>
      <ellipse cx="58" cy="38" rx="11" ry="15" transform="rotate(20 58 38)" fill="#e9f7ff" fill-opacity="0.85" ${THIN} class="wing"/>
      <ellipse cx="50" cy="60" rx="22" ry="17" fill="#ffd45c" ${OUT}/>
      <path d="M40 45 Q36 60 40 75 M52 43 Q48 60 52 77" fill="none" stroke="${INK}" stroke-width="6"/>
      <path d="M28 60 L22 60" ${OUT}/>
      ${eye(62, 56)}${cheek(66, 64)}
      <path d="M64 44 Q66 32 72 30 M60 44 Q58 32 62 28" fill="none" ${THIN}/>`,
  },
  bird: {
    fly: true,
    art: `
      <path d="M30 62 L14 54 L18 68 Z" fill="#7fc8f0" ${OUT}/>
      <ellipse cx="46" cy="60" rx="22" ry="18" fill="#7fc8f0" ${OUT}/>
      <ellipse cx="50" cy="66" rx="12" ry="9" fill="#e6f6ff"/>
      <path d="M36 56 Q44 40 56 54 Q46 58 36 56 Z" fill="#5ab0e0" ${THIN} class="wing"/>
      <circle cx="62" cy="46" r="13" fill="#7fc8f0" ${OUT}/>
      ${eye(66, 44)}${cheek(64, 52)}
      <path d="M74 44 L84 48 L74 52 Z" fill="#ffb45e" ${THIN}/>`,
  },
  bug: {
    art: `
      <path d="M34 92 L28 98 M50 94 L50 99 M66 92 L72 98" ${THIN}/>
      <ellipse cx="50" cy="76" rx="24" ry="18" fill="#ff7070" ${OUT}/>
      <path d="M50 58 L50 94" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="40" cy="72" r="4.5" fill="${INK}"/><circle cx="60" cy="72" r="4.5" fill="${INK}"/><circle cx="42" cy="85" r="3.5" fill="${INK}"/><circle cx="58" cy="85" r="3.5" fill="${INK}"/>
      <circle cx="74" cy="72" r="11" fill="#6b5a70" ${OUT}/>
      ${eye(78, 70, 2.6)}
      <path d="M74 62 Q76 52 82 50 M70 62 Q66 52 70 48" fill="none" ${THIN}/>`,
  },
  fish: {
    fly: true,
    art: `
      <circle cx="50" cy="56" r="34" fill="#dff3ff" fill-opacity="0.6" stroke="#9fd4f0" stroke-width="3"/>
      <ellipse cx="38" cy="36" rx="7" ry="4" fill="#fff" opacity="0.8" transform="rotate(-30 38 36)"/>
      <path d="M32 58 L20 48 L20 68 Z" fill="#ffab5e" ${OUT} class="tailfin"/>
      <ellipse cx="50" cy="58" rx="20" ry="13" fill="#ffab5e" ${OUT}/>
      <path d="M46 46 Q52 38 58 46" fill="#ff8a45" ${THIN}/>
      ${eye(60, 55)}${cheek(58, 63)}
      <circle cx="72" cy="40" r="3" fill="none" stroke="#9fd4f0" stroke-width="2"/><circle cx="76" cy="30" r="2" fill="none" stroke="#9fd4f0" stroke-width="2"/>`,
  },
  mouse: {
    art: `
      <path d="M26 84 Q10 82 12 66" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" class="tail"/>
      <ellipse cx="46" cy="78" rx="22" ry="17" fill="#d9d2e4" ${OUT}/>
      <circle cx="56" cy="48" r="11" fill="#d9d2e4" ${OUT}/><circle cx="56" cy="48" r="6" fill="#ffc2d1"/>
      <circle cx="80" cy="50" r="11" fill="#d9d2e4" ${OUT}/><circle cx="80" cy="50" r="6" fill="#ffc2d1"/>
      <ellipse cx="68" cy="66" rx="16" ry="14" fill="#d9d2e4" ${OUT}/>
      ${eye(66, 62)}${eye(76, 63)}
      <circle cx="84" cy="68" r="3" fill="#ff9fb2" ${THIN}/>${cheek(70, 72)}
      <path d="M40 94 L40 97 M54 94 L54 97" ${THIN}/>`,
  },
  hen: {
    art: `
      <path d="M40 92 L40 99 L34 99 M58 92 L58 99 L64 99" fill="none" stroke="#ffb45e" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 64 Q14 50 20 44 Q28 52 32 58 Z" fill="#fff8ee" ${OUT}/>
      <ellipse cx="48" cy="70" rx="26" ry="22" fill="#fff8ee" ${OUT}/>
      <path d="M36 66 Q46 58 56 68 Q46 76 36 66 Z" fill="#f2e6d6" ${THIN}/>
      <circle cx="66" cy="44" r="14" fill="#fff8ee" ${OUT}/>
      <path d="M58 32 Q60 22 66 28 Q70 20 74 30 Q78 26 76 36 Z" fill="#ff6f6f" ${THIN}/>
      ${eye(70, 42)}
      <path d="M79 44 L88 48 L79 52 Z" fill="#ffb45e" ${THIN}/>
      <path d="M78 54 Q80 62 76 62 Q74 58 78 54 Z" fill="#ff6f6f"/>`,
  },
};

export const SMALL_FRIENDS = Object.keys(SMALL);

export const isFlying = (id: string) => !!SMALL[id]?.fly;

/** A friend drawn in the 100×100 box. */
export function friendArt(id: string): string {
  const s = SMALL[id];
  if (s) return `<g data-word="${id}" class="friend ${s.fly ? 'fly' : 'hop'}">${s.art}</g>`;
  if ((HEROES as string[]).includes(id))
    return `<g data-word="${id}" class="friend hop"><g transform="scale(0.5)">${heroArt(id as HeroId)}</g></g>`;
  return '';
}

/** Card picture (200×200) for a small friend. */
export function friendIcon(id: string): string {
  if ((HEROES as string[]).includes(id)) return heroArt(id as HeroId);
  return `<g transform="translate(0 -4) scale(2)">${SMALL[id]?.art ?? ''}</g>`;
}
