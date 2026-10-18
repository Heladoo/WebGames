// Icons a player can pick to describe a game idea, drawn in code (64×64).
// The ids are a whitelist shared with api/ideas.js (PICTURE_IDS there); the
// tests check that the two lists match.

export const PICTURES: { id: string; label: string }[] = [
  { id: 'dog', label: 'כלב' },
  { id: 'cat', label: 'חתול' },
  { id: 'dino', label: 'דינוזאור' },
  { id: 'robot', label: 'רובוט' },
  { id: 'fish', label: 'דג' },
  { id: 'bird', label: 'ציפור' },
  { id: 'sea', label: 'ים' },
  { id: 'forest', label: 'יער' },
  { id: 'space', label: 'חלל' },
  { id: 'city', label: 'עיר' },
  { id: 'farm', label: 'חווה' },
  { id: 'snow', label: 'שלג' },
  { id: 'build', label: 'בונים' },
  { id: 'cook', label: 'מבשלים' },
  { id: 'drive', label: 'נוסעים' },
  { id: 'fly', label: 'עפים' },
  { id: 'grow', label: 'מגדלים' },
  { id: 'music', label: 'מנגנים' },
];

export const PICTURE_IDS = PICTURES.map((i) => i.id);

export function pictureLabel(id: string): string {
  return PICTURES.find((i) => i.id === id)?.label ?? '';
}

const INK = '#3A2E2A';
const O = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x: number, y: number, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const bg = (fill: string) => `<rect x="5" y="5" width="54" height="54" rx="13" fill="${fill}" ${O}/>`;

const ART: Record<string, string> = {
  dog: `<ellipse cx="17" cy="29" rx="6" ry="11" transform="rotate(20 17 29)" fill="#8A5A3B" ${O}/>
    <ellipse cx="47" cy="29" rx="6" ry="11" transform="rotate(-20 47 29)" fill="#8A5A3B" ${O}/>
    <circle cx="32" cy="36" r="16" fill="#D9A066" ${O}/>
    <ellipse cx="32" cy="43" rx="8" ry="6" fill="#F3D9B5"/>
    ${eye(25, 33)}${eye(39, 33)}<ellipse cx="32" cy="40" rx="3.4" ry="2.4" fill="${INK}"/>
    <path d="M28 45 Q32 48 36 45" fill="none" ${O}/>`,
  cat: `<path d="M17 30 L19 11 L31 22 Z M47 30 L45 11 L33 22 Z" fill="#F0A35E" ${O}/>
    <path d="M20 23 L21 16 L26 21 Z M44 23 L43 16 L38 21 Z" fill="#F6B8C4"/>
    <circle cx="32" cy="36" r="16" fill="#F0A35E" ${O}/>
    ${eye(25, 34)}${eye(39, 34)}<path d="M30 40 H34 L32 42.5 Z" fill="#E8708A"/>
    <path d="M14 40 H23 M14 44 L23 42 M50 40 H41 M50 44 L41 42" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
  dino: `<path d="M9 45 Q15 31 31 33 Q39 33 41 25 L41 17 Q43 10 50 11 Q57 12 56 18 Q55 23 48 23 L48 35 Q50 49 40 50 L15 50 Q5 50 9 45 Z" fill="#7BC47F" ${O}/>
    <path d="M20 33 L23 27 L26 32 M27 32 L30 26 L33 32" fill="#F2C14E" ${O}/>
    <rect x="18" y="48" width="6" height="8" rx="2" fill="#7BC47F" ${O}/><rect x="34" y="48" width="6" height="8" rx="2" fill="#7BC47F" ${O}/>
    <circle cx="27" cy="42" r="2.4" fill="#A6DCA6"/><circle cx="35" cy="40" r="1.8" fill="#A6DCA6"/>
    ${eye(50, 16, 1.8)}`,
  robot: `<path d="M32 18 V10" ${O}/><circle cx="32" cy="9" r="3.2" fill="#E8684A" ${O}/>
    <rect x="11" y="27" width="5" height="11" rx="2" fill="#7D93A8" ${O}/><rect x="48" y="27" width="5" height="11" rx="2" fill="#7D93A8" ${O}/>
    <rect x="16" y="18" width="32" height="30" rx="7" fill="#9DB4C8" ${O}/>
    <circle cx="25" cy="30" r="4.5" fill="#FFFFFF" ${O}/><circle cx="39" cy="30" r="4.5" fill="#FFFFFF" ${O}/>
    ${eye(25, 30, 1.8)}${eye(39, 30, 1.8)}<rect x="24" y="39" width="16" height="4" rx="2" fill="${INK}"/>
    <rect x="22" y="48" width="20" height="8" rx="3" fill="#7D93A8" ${O}/>`,
  fish: `<path d="M45 32 L58 21 L57 43 Z" fill="#F2C14E" ${O}/>
    <ellipse cx="29" cy="32" rx="19" ry="13" fill="#5FB0E5" ${O}/>
    <path d="M30 20 Q35 13 41 21" fill="#F2C14E" ${O}/>
    <path d="M33 22 Q30 32 33 42 M39 24 Q36 32 39 40" fill="none" stroke="#3E8CC0" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="19" cy="29" r="3.6" fill="#FFFFFF" ${O}/>${eye(19, 29, 1.7)}`,
  bird: `<path d="M28 21 Q27 14 33 13 M31 21 Q33 15 38 16" fill="none" ${O}/>
    <circle cx="32" cy="36" r="15" fill="#F2C14E" ${O}/>
    <path d="M18 33 L9 37 L18 41 Z" fill="#E8684A" ${O}/>
    <ellipse cx="37" cy="39" rx="9" ry="6.5" fill="#E0A93B" ${O}/>
    ${eye(24, 31)}<path d="M28 51 V57 M36 51 V57" ${O}/>`,

  sea: `${bg('#BFE6FB')}<circle cx="45" cy="19" r="6" fill="#F7D774" ${O}/>
    <path d="M26 35 V17 L37 35 Z" fill="#FFFFFF" ${O}/><path d="M18 35 H42 L38 41 H22 Z" fill="#C9764A" ${O}/>
    <path d="M5 42 Q12 37 19 42 T33 42 T47 42 T59 42 V46 Q59 59 46 59 H18 Q5 59 5 46 Z" fill="#5FB0E5" ${O}/>`,
  forest: `${bg('#DDF0D5')}<rect x="17" y="38" width="5" height="12" fill="#8A5A3B"/><rect x="41" y="40" width="5" height="12" fill="#8A5A3B"/>
    <path d="M20 12 L32 39 L8 39 Z" fill="#4F9A5A" ${O}/><path d="M43 16 L55 42 L31 42 Z" fill="#6BB36F" ${O}/>
    <path d="M5 50 H59 V46" fill="none"/><path d="M6 51 Q32 45 58 51" fill="none" ${O}/>`,
  space: `${bg('#2B3A67')}<circle cx="34" cy="34" r="12" fill="#E8A0BF" ${O}/>
    <ellipse cx="34" cy="34" rx="21" ry="6" fill="none" stroke="#F7D774" stroke-width="3" transform="rotate(-18 34 34)"/>
    <circle cx="15" cy="16" r="1.8" fill="#FFFFFF"/><circle cx="49" cy="13" r="1.6" fill="#FFFFFF"/><circle cx="14" cy="48" r="1.4" fill="#FFFFFF"/><circle cx="52" cy="50" r="1.8" fill="#FFFFFF"/>`,
  city: `${bg('#DDEBF7')}<rect x="10" y="26" width="13" height="32" fill="#8FA7C2" ${O}/><rect x="24" y="14" width="15" height="44" fill="#6E8BB0" ${O}/><rect x="40" y="29" width="14" height="29" fill="#A9BCD3" ${O}/>
    <g fill="#FFF4C8"><rect x="13" y="31" width="3" height="4"/><rect x="18" y="31" width="3" height="4"/><rect x="13" y="40" width="3" height="4"/><rect x="18" y="40" width="3" height="4"/>
    <rect x="28" y="19" width="3" height="4"/><rect x="33" y="19" width="3" height="4"/><rect x="28" y="28" width="3" height="4"/><rect x="33" y="28" width="3" height="4"/><rect x="28" y="37" width="3" height="4"/><rect x="33" y="37" width="3" height="4"/>
    <rect x="44" y="34" width="3" height="4"/><rect x="49" y="34" width="3" height="4"/><rect x="44" y="43" width="3" height="4"/><rect x="49" y="43" width="3" height="4"/></g>`,
  farm: `${bg('#FDF1D8')}<path d="M5 50 H59 V54 Q59 59 54 59 H10 Q5 59 5 54 Z" fill="#8CC56B"/>
    <path d="M14 51 V30 L32 16 L50 30 V51 Z" fill="#D2553F" ${O}/>
    <rect x="25" y="36" width="14" height="15" fill="#FFFFFF" ${O}/><path d="M25 36 L39 51 M39 36 L25 51" ${O}/>
    <circle cx="32" cy="27" r="3.5" fill="#FFFFFF" ${O}/>`,
  snow: `${bg('#E6F2FB')}<circle cx="32" cy="44" r="12" fill="#FFFFFF" ${O}/><circle cx="32" cy="25" r="8.5" fill="#FFFFFF" ${O}/>
    <rect x="25" y="12" width="14" height="6" rx="1.5" fill="${INK}"/><rect x="22" y="17" width="20" height="2.6" rx="1.3" fill="${INK}"/>
    ${eye(29, 24, 1.5)}${eye(35, 24, 1.5)}<path d="M32 27 L39 28.5 L32 30 Z" fill="#F08A3E"/>
    <circle cx="13" cy="15" r="1.8" fill="#9CC3E2"/><circle cx="51" cy="19" r="1.8" fill="#9CC3E2"/><circle cx="50" cy="38" r="1.6" fill="#9CC3E2"/><circle cx="12" cy="36" r="1.6" fill="#9CC3E2"/>`,

  build: `<rect x="9" y="37" width="20" height="19" rx="3" fill="#E8684A" ${O}/><rect x="31" y="37" width="20" height="19" rx="3" fill="#5FB0E5" ${O}/>
    <rect x="20" y="16" width="20" height="20" rx="3" fill="#F2C14E" ${O}/>
    <circle cx="19" cy="46" r="3" fill="#F6A08C"/><circle cx="41" cy="46" r="3" fill="#A6D3F2"/><circle cx="30" cy="26" r="3" fill="#F8DC8C"/>`,
  cook: `<path d="M24 22 Q21 17 24 13 M32 22 Q29 17 32 12 M40 22 Q37 17 40 13" fill="none" stroke="#9AA9B6" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M7 33 H13 M51 33 H57" ${O}/>
    <path d="M12 29 H52 V43 Q52 54 41 54 H23 Q12 54 12 43 Z" fill="#E8684A" ${O}/>
    <path d="M10 29 H54" ${O}/><circle cx="32" cy="25" r="2.6" fill="${INK}"/>`,
  drive: `<path d="M8 44 V38 Q8 32 15 32 L22 21 H42 L50 32 Q57 32 57 38 V44 Z" fill="#E8684A" ${O}/>
    <path d="M24 24 H31 V32 H19 Z M34 24 H41 L46 32 H34 Z" fill="#CFE9F7" ${O}/>
    <circle cx="20" cy="45" r="6.5" fill="${INK}"/><circle cx="45" cy="45" r="6.5" fill="${INK}"/>
    <circle cx="20" cy="45" r="2.4" fill="#D8D8D8"/><circle cx="45" cy="45" r="2.4" fill="#D8D8D8"/>`,
  fly: `<path d="M22 37 L27 47 M42 37 L37 47" ${O}/>
    <path d="M32 7 C 15 7 13 26 22 36 Q27 41 32 41 Q37 41 42 36 C 51 26 49 7 32 7 Z" fill="#F2C14E" ${O}/>
    <path d="M32 7 C 25 14 25 32 32 41 C 39 32 39 14 32 7 Z" fill="#E8684A" ${O}/>
    <rect x="25" y="47" width="14" height="10" rx="2" fill="#A0703F" ${O}/>`,
  grow: `<path d="M32 42 V25" stroke="#4F9A5A" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="25" cy="35" rx="6" ry="3.2" transform="rotate(-30 25 35)" fill="#6BB36F" ${O}/>
    <ellipse cx="39" cy="33" rx="6" ry="3.2" transform="rotate(30 39 33)" fill="#6BB36F" ${O}/>
    <g fill="#F29BB5" ${O}><circle cx="32" cy="11" r="5"/><circle cx="39.5" cy="17" r="5"/><circle cx="36.5" cy="25" r="5"/><circle cx="27.5" cy="25" r="5"/><circle cx="24.5" cy="17" r="5"/></g>
    <circle cx="32" cy="18.5" r="4" fill="#F7D774" ${O}/>
    <path d="M19 42 H45 L41 57 H23 Z" fill="#C9764A" ${O}/>`,
  music: `<path d="M24 46 V17 L49 11 V40" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 17 L49 11 V18 L24 24 Z" fill="${INK}"/>
    <ellipse cx="18" cy="47" rx="7.5" ry="6" transform="rotate(-20 18 47)" fill="#8A6FC8" ${O}/>
    <ellipse cx="43" cy="41" rx="7.5" ry="6" transform="rotate(-20 43 41)" fill="#8A6FC8" ${O}/>`,
};

/** Inline SVG for a picture id ('' for an unknown id, which the server never stores). */
export function pictureSVG(id: string, size = 64): string {
  const art = ART[id];
  if (!art) return '';
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false">${art}</svg>`;
}
