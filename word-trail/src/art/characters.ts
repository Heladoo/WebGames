import { BLUSH, INK, OUT, THIN } from './palette';
import { carryArt, wearBack, wearFace, wearFeet, wearFront, wearHead, wearNeck } from './wearables';

// Every hero shares one skeleton in a 200×200 box, so any wearable fits any hero:
//   head centre (100,78) · top of head y≈42 · eyes (90,76) (116,76)
//   neck y≈108 · body centre (100,142) · feet bottom y≈192 · right hand (140,150)

export type HeroId = 'dog' | 'cat' | 'fox' | 'bear' | 'duck' | 'pig' | 'frog' | 'owl';

export interface Look {
  worn?: Partial<Record<string, string>>; // slot -> wearable id
  carry?: string | null;
  seated?: boolean; // riding: hide the legs
}

interface Spec {
  fur: string;
  light: string;
  dark: string;
  head?: (s: Spec) => string; // replaces the default round head
  behindHead?: (s: Spec) => string;
  ears?: (s: Spec) => string;
  face: (s: Spec) => string;
  tail?: (s: Spec) => string;
  wings?: boolean;
  legColor?: string;
}

const eyes = (lx = 90, rx = 116, y = 76) => `
  <ellipse cx="${lx}" cy="${y}" rx="4.6" ry="5.6" fill="${INK}"/><circle cx="${lx + 1.6}" cy="${y - 2}" r="1.7" fill="#fff"/>
  <ellipse cx="${rx}" cy="${y}" rx="4.6" ry="5.6" fill="${INK}"/><circle cx="${rx + 1.6}" cy="${y - 2}" r="1.7" fill="#fff"/>`;
const blush = (y = 90) => `
  <ellipse cx="78" cy="${y}" rx="7" ry="4.5" fill="${BLUSH}" opacity="0.7"/>
  <ellipse cx="128" cy="${y}" rx="7" ry="4.5" fill="${BLUSH}" opacity="0.7"/>`;
const smile = (x = 104, y = 97, w = 6) => `<path d="M${x - w} ${y} Q${x} ${y + 5} ${x + w} ${y}" fill="none" ${THIN}/>`;
const strokeTail = (d: string, fill: string) =>
  `<g class="tail"><path d="${d}" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="9" stroke-linecap="round"/></g>`;

const SPECS: Record<HeroId, Spec> = {
  dog: {
    fur: '#eab98b',
    light: '#fbe6cf',
    dark: '#a8744f',
    ears: (s) => `
      <ellipse cx="62" cy="82" rx="12" ry="25" transform="rotate(18 62 82)" fill="${s.dark}" ${OUT}/>
      <ellipse cx="142" cy="82" rx="12" ry="25" transform="rotate(-18 142 82)" fill="${s.dark}" ${OUT}/>`,
    face: (s) => `${eyes()}${blush()}
      <ellipse cx="104" cy="92" rx="16" ry="11" fill="${s.light}" ${THIN}/>
      <ellipse cx="104" cy="87" rx="6" ry="4.4" fill="${INK}"/>
      <path d="M104 91 L104 95 M98 96 Q104 101 110 96" fill="none" ${THIN}/>`,
    tail: (s) => strokeTail('M70 146 Q48 140 46 114', s.fur),
  },
  cat: {
    fur: '#cfc6dd',
    light: '#f4f0fa',
    dark: '#ffc2d1',
    ears: (s) => `
      <path d="M64 62 L68 28 L92 44 Z" fill="${s.fur}" ${OUT}/><path d="M70 54 L72 38 L84 46 Z" fill="${s.dark}"/>
      <path d="M110 44 L134 28 L138 62 Z" fill="${s.fur}" ${OUT}/><path d="M118 46 L131 38 L132 54 Z" fill="${s.dark}"/>`,
    face: (s) => `${eyes()}${blush()}
      <path d="M100 87 L108 87 L104 92 Z" fill="${s.dark}" ${THIN}/>
      <path d="M97 95 Q100.5 99 104 95 Q107.5 99 111 95" fill="none" ${THIN}/>
      <path d="M86 90 L70 87 M86 94 L71 96 M122 90 L138 87 M122 94 L137 96" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
    tail: (s) => strokeTail('M68 160 Q40 152 42 124 Q44 106 56 104', s.fur),
  },
  fox: {
    fur: '#f5965a',
    light: '#fff3e6',
    dark: '#6b4a5a',
    ears: (s) => `
      <path d="M62 64 L64 22 L92 44 Z" fill="${s.fur}" ${OUT}/><path d="M66 38 L64 22 L76 30 Z" fill="${s.dark}"/>
      <path d="M110 44 L138 20 L140 64 Z" fill="${s.fur}" ${OUT}/><path d="M131 26 L138 20 L139 36 Z" fill="${s.dark}"/>`,
    face: (s) => `
      <path d="M62 84 Q80 82 100 100 Q104 106 108 100 Q126 82 142 84 Q138 112 104 116 Q66 112 62 84 Z" fill="${s.light}"/>
      ${eyes()}${blush(92)}
      <ellipse cx="104" cy="96" rx="5.5" ry="4" fill="${INK}"/>${smile(104, 104, 5)}`,
    tail: (s) => `<g class="tail">
      <path d="M72 158 Q30 170 24 128 Q24 110 36 104 Q50 130 74 140 Z" fill="${s.fur}" ${OUT}/>
      <path d="M24 128 Q24 110 36 104 Q40 116 44 122 Q32 124 24 128 Z" fill="${s.light}"/></g>`,
  },
  bear: {
    fur: '#b88462',
    light: '#efd3b8',
    dark: '#8a5c42',
    behindHead: (s) => `
      <circle cx="66" cy="46" r="14" fill="${s.fur}" ${OUT}/><circle cx="66" cy="46" r="7" fill="${s.light}"/>
      <circle cx="136" cy="46" r="14" fill="${s.fur}" ${OUT}/><circle cx="136" cy="46" r="7" fill="${s.light}"/>`,
    face: (s) => `${eyes()}${blush()}
      <ellipse cx="104" cy="93" rx="17" ry="12" fill="${s.light}" ${THIN}/>
      <ellipse cx="104" cy="88" rx="6.5" ry="4.6" fill="${INK}"/>
      <path d="M104 92 L104 96 M98 97 Q104 102 110 97" fill="none" ${THIN}/>`,
    tail: (s) => `<circle cx="66" cy="164" r="9" fill="${s.fur}" ${OUT}/>`,
  },
  duck: {
    fur: '#ffd86b',
    light: '#fff1b8',
    dark: '#ff9f45',
    legColor: '#ff9f45',
    wings: true,
    ears: () => `<path d="M94 44 Q98 28 104 40 Q110 30 112 44" fill="#ffd86b" ${OUT}/>`,
    face: (s) => `${eyes(88, 118, 74)}${blush(88)}
      <ellipse cx="104" cy="92" rx="18" ry="8.5" fill="${s.dark}" ${OUT}/>
      <path d="M88 92 Q104 96 120 92" fill="none" ${THIN}/>`,
    tail: (s) => `<path d="M68 150 L50 140 L60 160 Z" fill="${s.fur}" ${OUT}/>`,
  },
  pig: {
    fur: '#f9b8c9',
    light: '#ffdbe4',
    dark: '#f08ea9',
    ears: (s) => `
      <path d="M64 58 L64 32 L88 46 Z" fill="${s.fur}" ${OUT}/><path d="M69 50 L69 39 L80 46 Z" fill="${s.dark}"/>
      <path d="M114 46 L138 32 L138 58 Z" fill="${s.fur}" ${OUT}/><path d="M122 46 L133 39 L133 50 Z" fill="${s.dark}"/>`,
    face: (s) => `${eyes(88, 118, 74)}${blush(92)}
      <ellipse cx="104" cy="92" rx="15" ry="10.5" fill="${s.dark}" ${OUT}/>
      <ellipse cx="99" cy="92" rx="2.6" ry="3.6" fill="${INK}"/><ellipse cx="109" cy="92" rx="2.6" ry="3.6" fill="${INK}"/>
      ${smile(104, 106, 5)}`,
    tail: () => `<path class="tail" d="M68 152 Q56 150 58 142 Q62 134 67 142 Q70 150 60 154" fill="none" ${OUT}/>`,
  },
  frog: {
    fur: '#9ad48f',
    light: '#e8f7d8',
    dark: '#6fb566',
    head: (s) => `
      <ellipse cx="100" cy="82" rx="48" ry="34" fill="${s.fur}" ${OUT}/>
      <circle cx="80" cy="54" r="15" fill="${s.fur}" ${OUT}/><circle cx="122" cy="54" r="15" fill="${s.fur}" ${OUT}/>`,
    face: () => `
      <circle cx="80" cy="54" r="9" fill="#fff"/><circle cx="122" cy="54" r="9" fill="#fff"/>
      ${eyes(82, 124, 55)}${blush(90)}
      <path d="M78 92 Q102 108 126 92" fill="none" ${OUT}/>`,
  },
  owl: {
    fur: '#b9a3d6',
    light: '#efe6fa',
    dark: '#ffb45e',
    wings: true,
    legColor: '#ffb45e',
    ears: (s) => `
      <path d="M62 56 L62 30 L82 46 Z" fill="${s.fur}" ${OUT}/>
      <path d="M120 46 L140 30 L140 56 Z" fill="${s.fur}" ${OUT}/>`,
    face: (s) => `
      <circle cx="88" cy="76" r="15" fill="${s.light}" ${THIN}/><circle cx="118" cy="76" r="15" fill="${s.light}" ${THIN}/>
      ${eyes(90, 120, 76)}
      <path d="M98 88 L110 88 L104 98 Z" fill="${s.dark}" ${THIN}/>`,
    tail: (s) => `<path d="M72 164 L56 172 L60 160 L52 158 L70 150 Z" fill="${s.fur}" ${OUT}/>`,
  },
};

export const HEROES = Object.keys(SPECS) as HeroId[];
export const heroColor = (id: HeroId) => SPECS[id].fur;

function legs(s: Spec, look: Look) {
  if (look.seated) return '';
  const c = s.legColor ?? s.fur;
  const boots = look.worn?.feet ? wearFeet(look.worn.feet) : ['', ''];
  const leg = (x: number, cls: string, boot: string) => `<g class="${cls}">
      <rect x="${x}" y="158" width="20" height="34" rx="10" fill="${c}" ${OUT}/>${boot}</g>`;
  return leg(78, 'leg-l', boots[0]) + leg(104, 'leg-r', boots[1]);
}

function arms(s: Spec) {
  const c = s.fur;
  if (s.wings)
    return `<path d="M68 122 Q50 140 60 162 Q70 150 72 132 Z" fill="${c}" ${OUT}/>
      <path d="M132 122 Q152 138 142 160 Q132 150 130 132 Z" fill="${c}" ${OUT}/>`;
  return `<ellipse cx="68" cy="140" rx="10" ry="17" transform="rotate(16 68 140)" fill="${c}" ${OUT}/>
    <ellipse cx="134" cy="140" rx="10" ry="17" transform="rotate(-24 134 140)" fill="${c}" ${OUT}/>`;
}

/** The hero's drawing (an SVG fragment in the 200×200 box). */
export function heroArt(id: HeroId, look: Look = {}): string {
  const s = SPECS[id];
  const w = look.worn ?? {};
  const head = s.head ? s.head(s) : `<ellipse cx="100" cy="78" rx="43" ry="38" fill="${s.fur}" ${OUT}/>`;
  const belly = id === 'owl'
    ? `<ellipse cx="102" cy="148" rx="23" ry="25" fill="${s.light}"/>
       <path d="M90 140 q4 4 8 0 M104 140 q4 4 8 0 M96 152 q4 4 8 0 M110 152 q4 4 8 0" fill="none" ${THIN}/>`
    : `<ellipse cx="102" cy="150" rx="22" ry="24" fill="${s.light}"/>`;
  return `<g class="hero" data-word="${id}">
    ${w.back ? wearBack(w.back) : ''}
    ${s.tail ? s.tail(s) : ''}
    ${legs(s, look)}
    <ellipse cx="100" cy="142" rx="36" ry="38" fill="${s.fur}" ${OUT}/>
    ${belly}
    ${arms(s)}
    ${s.behindHead ? s.behindHead(s) : ''}
    ${head}
    ${s.ears ? s.ears(s) : ''}
    ${w.neck ? wearNeck(w.neck) : ''}
    ${s.face(s)}
    ${w.face ? wearFace(w.face) : ''}
    ${w.head ? wearHead(w.head) : ''}
    ${look.carry ? carryArt(look.carry) : ''}
    ${w.back ? wearFront(w.back) : ''}
  </g>`;
}



