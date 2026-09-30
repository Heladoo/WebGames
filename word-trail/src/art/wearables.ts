import { INK, OUT, THIN } from './palette';

// Wearables are drawn straight onto the shared hero skeleton (see characters.ts),
// and carried things sit in the right hand at about (140,150).

export type Slot = 'head' | 'neck' | 'feet' | 'back' | 'face';

export const WEAR_SLOT: Record<string, Slot> = {
  hat: 'head',
  cap: 'head',
  crown: 'head',
  bow: 'head',
  scarf: 'neck',
  boots: 'feet',
  cape: 'back',
  bag: 'back',
  glasses: 'face',
};

export function wearHead(id: string): string {
  switch (id) {
    case 'hat':
      return `<g data-word="hat">
        <ellipse cx="100" cy="46" rx="58" ry="11" fill="#f7d98e" ${OUT}/>
        <path d="M70 46 Q70 12 100 12 Q130 12 130 46 Z" fill="#f7d98e" ${OUT}/>
        <path d="M71 38 Q100 44 129 38 L130 46 Q100 51 70 46 Z" fill="#ff9fb2"/>
        <circle cx="122" cy="40" r="6" fill="#fff4f7" ${THIN}/></g>`;
    case 'cap':
      return `<g data-word="cap">
        <path d="M66 50 Q66 14 100 14 Q134 14 134 50 Z" fill="#7fb8f0" ${OUT}/>
        <path d="M126 46 Q156 42 164 50 Q150 56 124 54 Z" fill="#5a9be0" ${OUT}/>
        <path d="M100 14 L100 50 M82 18 Q86 34 84 50 M118 18 Q114 34 116 50" fill="none" stroke="#5a9be0" stroke-width="2"/>
        <circle cx="100" cy="14" r="5" fill="#ffd86b" ${THIN}/></g>`;
    case 'crown':
      return `<g data-word="crown">
        <path d="M70 48 L68 16 L86 32 L100 10 L114 32 L132 16 L130 48 Z" fill="#ffd45c" ${OUT}/>
        <circle cx="100" cy="36" r="5" fill="#ff7fa0" ${THIN}/>
        <circle cx="82" cy="40" r="3.5" fill="#7fc8f0" ${THIN}/><circle cx="118" cy="40" r="3.5" fill="#9ee09a" ${THIN}/>
        <circle cx="68" cy="16" r="3.5" fill="#fff6d0" ${THIN}/><circle cx="100" cy="10" r="3.5" fill="#fff6d0" ${THIN}/><circle cx="132" cy="16" r="3.5" fill="#fff6d0" ${THIN}/></g>`;
    case 'bow':
      return `<g data-word="bow">
        <path d="M124 40 L100 24 Q92 36 100 52 Z" fill="#ff8fb0" ${OUT}/>
        <path d="M124 40 L148 24 Q156 36 148 52 Z" fill="#ff8fb0" ${OUT}/>
        <circle cx="124" cy="40" r="7" fill="#ff6f98" ${OUT}/></g>`;
  }
  return '';
}

export function wearNeck(id: string): string {
  if (id !== 'scarf') return '';
  return `<g data-word="scarf">
    <path d="M112 116 L118 154 L132 150 L124 114 Z" fill="#ff8a7a" ${OUT}/>
    <path d="M118 154 L132 150 M117 142 L130 138 M115 130 L128 126" fill="none" stroke="#fff4ec" stroke-width="3"/>
    <rect x="68" y="108" width="68" height="16" rx="8" fill="#ff8a7a" ${OUT}/>
    <path d="M80 110 L80 122 M94 110 L94 122 M108 110 L108 122 M122 110 L122 122" stroke="#fff4ec" stroke-width="3"/></g>`;
}

/** Boots are drawn inside each leg group so they move with the legs. */
export function wearFeet(id: string): [string, string] {
  if (id !== 'boots') return ['', ''];
  const boot = (x: number) => `<g data-word="boots">
    <path d="M${x - 3} 170 L${x + 23} 170 L${x + 23} 186 Q${x + 30} 186 ${x + 30} 194 L${x - 3} 194 Z" fill="#ffd45c" ${OUT}/>
    <path d="M${x - 3} 176 L${x + 23} 176" stroke="#f0a830" stroke-width="3"/></g>`;
  return [boot(78), boot(104)];
}

export function wearBack(id: string): string {
  if (id === 'cape')
    return `<g data-word="cape" class="cape">
      <path d="M72 108 Q50 150 44 186 Q100 198 156 186 Q150 150 128 108 Z" fill="#c77dd9" ${OUT}/>
      <path d="M58 180 Q100 190 142 180" fill="none" stroke="#e2b0ee" stroke-width="3"/></g>`;
  if (id === 'bag')
    return `<g data-word="bag">
      <rect x="44" y="112" width="34" height="48" rx="11" fill="#7cc9a8" ${OUT}/>
      <rect x="48" y="134" width="26" height="18" rx="6" fill="#a3dcc2" ${THIN}/></g>`;
  return '';
}

/** Parts of back items that show in front of the body (bag straps). */
export function wearFront(id: string): string {
  if (id === 'bag')
    return `<path d="M72 110 Q96 130 110 168" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M72 110 Q96 130 110 168" fill="none" stroke="#5fb08c" stroke-width="5" stroke-linecap="round"/>`;
  return '';
}

export function wearFace(id: string): string {
  if (id !== 'glasses') return '';
  return `<g data-word="glasses">
    <circle cx="88" cy="77" r="12" fill="#dff3ff" fill-opacity="0.45" stroke="#ff6f98" stroke-width="3.5"/>
    <circle cx="118" cy="77" r="12" fill="#dff3ff" fill-opacity="0.45" stroke="#ff6f98" stroke-width="3.5"/>
    <path d="M100 76 Q103 72 106 76 M76 74 L62 70 M130 74 L142 70" fill="none" stroke="#ff6f98" stroke-width="3.5" stroke-linecap="round"/></g>`;
}

export const CARRY = ['ball', 'kite', 'balloon', 'cake', 'apple', 'egg', 'pie', 'star'];

/** A carried thing, held at the right hand (140,150). */
export function carryArt(id: string): string {
  const hand = `<circle cx="140" cy="152" r="8" fill="none"/>`;
  switch (id) {
    case 'ball':
      return `<g data-word="ball">${hand}
        <circle cx="150" cy="156" r="17" fill="#ff8a7a" ${OUT}/>
        <path d="M134 150 Q150 160 166 150 M142 141 Q148 156 144 171" fill="none" stroke="#fff4ec" stroke-width="4"/></g>`;
    case 'kite':
      return `<g data-word="kite" class="float">
        <path d="M142 150 Q170 110 168 58" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <path d="M168 58 Q178 76 168 96 Q184 102 192 96" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <path d="M168 10 L194 38 L168 64 L142 38 Z" fill="#7fc8f0" ${OUT}/>
        <path d="M168 10 L168 64 M142 38 L194 38" stroke="${INK}" stroke-width="2"/>
        <path d="M168 10 L194 38 L168 38 Z" fill="#ffd45c"/><path d="M168 38 L168 64 L142 38 Z" fill="#ffd45c"/>
        <path d="M168 10 L194 38 L168 64 L142 38 Z" fill="none" ${OUT}/>
        <path d="M172 98 l6 -4 l2 8 Z M184 100 l6 -4 l2 8 Z" fill="#ff8fb0"/></g>`;
    case 'balloon':
      return `<g data-word="balloon" class="float">
        <path d="M142 150 Q150 110 160 78" fill="none" stroke="${INK}" stroke-width="1.8"/>
        <ellipse cx="162" cy="50" rx="24" ry="29" fill="#ff8fb0" ${OUT}/>
        <path d="M156 79 L168 79 L162 72 Z" fill="#ff8fb0" ${THIN}/>
        <ellipse cx="153" cy="40" rx="6" ry="9" fill="#fff" opacity="0.5"/></g>`;
    case 'cake':
      return `<g data-word="cake">
        <ellipse cx="152" cy="168" rx="24" ry="6" fill="#fff" ${THIN}/>
        <path d="M134 164 L134 144 L170 136 L170 164 Z" fill="#fbe0b5" ${OUT}/>
        <path d="M134 144 L170 136 L170 146 Q160 152 152 146 Q144 154 134 150 Z" fill="#ff9fc0" ${THIN}/>
        <path d="M134 156 L170 152" stroke="#ff9fc0" stroke-width="3"/>
        <circle cx="160" cy="134" r="5" fill="#ff5a6e" ${THIN}/></g>`;
    case 'apple':
      return `<g data-word="apple">
        <path d="M150 140 Q136 132 132 146 Q128 170 150 172 Q172 170 168 146 Q164 132 150 140 Z" fill="#ff7070" ${OUT}/>
        <path d="M150 140 Q150 130 154 126" fill="none" ${THIN}/>
        <path d="M152 132 Q162 124 166 132 Q158 138 152 132 Z" fill="#8ed081" ${THIN}/>
        <ellipse cx="141" cy="150" rx="3" ry="6" fill="#fff" opacity="0.55"/></g>`;
    case 'egg':
      return `<g data-word="egg">
        <path d="M152 132 Q136 134 136 156 Q138 172 152 172 Q166 172 168 156 Q168 134 152 132 Z" fill="#fff8ea" ${OUT}/>
        <ellipse cx="146" cy="148" rx="3" ry="6" fill="#fff" opacity="0.8"/>
        <circle cx="158" cy="158" r="2.5" fill="#f5d7a8"/><circle cx="148" cy="164" r="2" fill="#f5d7a8"/></g>`;
    case 'pie':
      return `<g data-word="pie">
        <path d="M128 158 Q128 170 152 172 Q176 170 176 158 Z" fill="#e8a66a" ${OUT}/>
        <path d="M128 158 Q130 144 152 142 Q174 144 176 158 Q152 164 128 158 Z" fill="#f7cf8e" ${OUT}/>
        <path d="M140 150 L146 154 M152 148 L152 155 M162 150 L158 154" stroke="#c9783f" stroke-width="3" stroke-linecap="round"/></g>`;
    case 'star':
      return `<g data-word="star">
        <path d="M142 152 L160 108" stroke="#b58ad9" stroke-width="5" stroke-linecap="round"/>
        <path d="M162 84 L168 98 L183 99 L171 108 L175 123 L162 115 L149 123 L153 108 L141 99 L156 98 Z" fill="#ffd45c" ${OUT}/></g>`;
  }
  return '';
}

/** A viewBox that frames a wearable or carried thing on its own (for cards). */
export const ITEM_BOX: Record<string, string> = {
  hat: '36 0 128 64',
  cap: '56 4 116 58',
  crown: '58 0 84 58',
  bow: '90 14 68 48',
  scarf: '58 100 88 62',
  boots: '66 160 76 40',
  cape: '36 100 128 104',
  bag: '38 104 80 70',
  glasses: '56 60 92 34',
  ball: '126 132 46 46',
  kite: '136 4 64 108',
  balloon: '134 16 56 140',
  cake: '124 124 54 54',
  apple: '124 118 52 60',
  egg: '130 126 44 52',
  pie: '122 136 60 42',
  star: '136 78 54 80',
};

/** Card picture for a wearable/carried thing on its own. */
export function itemArt(id: string): string {
  if (id in WEAR_SLOT) {
    const slot = WEAR_SLOT[id];
    if (slot === 'head') return wearHead(id);
    if (slot === 'neck') return wearNeck(id);
    if (slot === 'feet') return wearFeet(id).join('');
    if (slot === 'back') return wearBack(id) + (id === 'bag' ? wearFront(id).replace(/M72 110 Q96 130 110 168/g, 'M52 114 Q60 100 70 114') : '');
    return wearFace(id);
  }
  return carryArt(id);
}
