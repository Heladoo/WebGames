import { C, ell, eye, flat, line, piece, shade } from './paper';
import { carryArt, wearBack, wearBackTop, wearBody, wearFace, wearFeet, wearHead, wearNeck } from './wearables';

// Every hero is a small rig: named paper parts plus anchor points, facing
// right in a 3/4 view, in a 200×200 box with the ground at y=192.
//
// The 3/4 view rules are shared by all animals: the far eye sits nearer the
// snout and is drawn smaller and a little narrower; the near eye is bigger
// and nearer the middle of the head; both sit on one eye line, above the snout.
// tests/anatomy.spec.ts checks these rules (and many more) for every hero.

export type HeroId = 'dog' | 'cat' | 'fox' | 'bear' | 'duck' | 'pig' | 'frog' | 'owl';
export type Pt = [number, number];

export interface Anchors {
  headTop: Pt; // where hats sit
  bow: Pt; // where a bow is pinned
  neck: Pt; // centre of the scarf
  back: Pt; // top of the back (bags and capes)
  pack: Pt; // rear of the back, where carried things rest (clear of head and ears)
  eyeNear: [number, number, number];
  eyeFar: [number, number, number];
  legs: { part: string; x: number; near: boolean }[];
  tail: Pt; // where the tail meets the body
}

export interface Look {
  worn?: Partial<Record<string, string>>;
  carry?: string | null; // a thing resting on the back
  air?: string | null; // a kite or balloon on a string
  seated?: boolean;
}

interface Spec {
  fur: string;
  deep: string; // far-side / shadow colour
  light: string; // muzzle, belly
  accent: string; // ears, nose details
  anchors: Anchors;
  body: string;
  head: string;
  legs: 'paw' | 'bird' | 'frog';
  earFar?: string; // behind the head
  earNear?: string; // in front of the head
  tail?: string;
  tailTip?: string; // a lighter tip that moves with the tail
  muzzle?: string; // snout / beak
  nose?: string;
  noseColor?: string;
  mouth?: string;
  extras?: (s: Spec) => string; // markings drawn on top of body/head
  back?: (s: Spec) => string; // markings under the head (belly, wings)
  face?: (s: Spec) => string; // extra face detail after the eyes (whiskers, discs)
  underEyes?: (s: Spec) => string; // drawn before the eyes (facial discs)
  eyesOnTop?: boolean; // frogs
}

// ---------- shared shapes ----------

const BODY = 'M70 136C68 112 90 98 114 100C138 102 150 118 148 140C146 160 128 170 106 169C84 168 71 156 70 136 Z';
const HEAD = 'M84 76 C82 50 102 34 124 35 C148 36 162 54 160 78 C158 100 140 114 120 114 C100 114 86 100 84 76 Z';
const PAW_LEGS = [
  { part: 'legBackFar', x: 84, near: false },
  { part: 'legFrontFar', x: 130, near: false },
  { part: 'legBackNear', x: 95, near: true },
  { part: 'legFrontNear', x: 141, near: true },
];
const quadAnchors = (o: Partial<Anchors> = {}): Anchors => ({
  headTop: [122, 38],
  bow: [102, 44],
  neck: [114, 112],
  back: [96, 102],
  pack: [72, 116],
  eyeNear: [118, 70, 7.4],
  eyeFar: [143, 68, 6.6],
  legs: PAW_LEGS,
  tail: [74, 126],
  ...o,
});

const SPECS: Record<HeroId, Spec> = {
  dog: {
    fur: '#dfa36b', deep: '#c4844f', light: '#fbe8cf', accent: '#9a5f3f',
    anchors: quadAnchors({ bow: [104, 46] }),
    body: BODY, head: HEAD, legs: 'paw',
    earFar: 'M140 42 C150 32 166 36 168 50 C169 60 162 68 154 64 Z',
    earNear: 'M100 44 C86 42 76 56 78 78 C80 96 90 104 98 96 C106 88 110 62 108 52 C107 47 104 44 100 44 Z',
    tail: 'M76 130C62 124 54 110 57 96C58 91 64 90 66 95C68 106 74 116 82 120 Z',
    muzzle: 'M128 96 C128 84 146 78 158 85 C167 91 166 104 154 108 C141 112 128 107 128 96 Z',
    nose: 'M156 84 C160 80 170 81 171 87 C171 93 164 96 160 95 C156 94 153 89 156 84 Z',
    mouth: 'M145 104 C148 109 155 109 158 103',
    back: (s) => piece('M122 122C134 118 146 126 146 142C146 156 134 164 122 162C114 154 112 134 122 122 Z', s.light, { lift: 0.8 }),
    extras: (s) => flat('M116 38 C122 34 132 34 138 38 C132 42 122 42 116 38 Z', s.deep, 'opacity="0.35"'),
  },
  cat: {
    fur: '#b9b0c9', deep: '#978cad', light: '#f3eef8', accent: '#f0a3b4',
    anchors: quadAnchors({ headTop: [124, 38], bow: [108, 40] }),
    body: 'M72 138C70 116 92 104 114 104C138 104 148 120 146 140C144 160 126 168 106 167C86 166 73 156 72 138 Z',
    head: HEAD, legs: 'paw',
    earFar: 'M134 42 C140 32 150 24 158 20 C160 34 158 46 152 54 Z',
    earNear: 'M94 58 C92 44 96 30 102 22 C112 30 120 38 122 44 Z',
    tail: 'M74 134C56 130 48 114 52 98C54 88 62 80 70 82C74 84 72 89 68 90C62 92 60 102 62 110C64 120 72 124 82 126 Z',
    muzzle: 'M132 96 C134 86 150 82 158 88 C164 94 160 104 150 106 C140 107 132 103 132 96 Z',
    nose: 'M155 86 L165 86 L160 92 Z', noseColor: '#e98c9c',
    mouth: 'M150 97 C152 101 156 101 158 97',
    back: (s) => flat('M100 112 C104 118 104 126 100 132 M90 114 C94 122 94 130 90 136', 'none', `stroke="${s.deep}" stroke-width="4" stroke-linecap="round" opacity="0.6"`),
    extras: (s) => flat('M118 38 L122 50 L126 38 Z M108 42 L114 52 L116 40 Z', s.deep, 'opacity="0.5"') +
      piece('M104 26 L108 34 L114 38 Z', s.accent, { lift: 0 }),
    face: () => line('M150 100 L170 96 M150 103 L170 104', C.ink, 1.3, 'opacity="0.55"'),
  },
  fox: {
    fur: '#e0874a', deep: '#c26a33', light: '#fbf1e6', accent: '#4a3334',
    anchors: quadAnchors({ headTop: [120, 38] }),
    body: BODY, head: HEAD, legs: 'paw',
    earFar: 'M136 42 C140 28 148 16 156 10 C160 26 158 40 152 52 Z',
    earNear: 'M92 58 C88 40 92 22 98 12 C110 22 118 32 122 42 Z',
    tail: 'M78 134C56 140 32 126 34 104C36 90 50 86 56 94C60 108 70 118 86 122 Z',
    muzzle: 'M128 94 C130 82 150 80 172 90 C162 100 146 108 134 106 C130 104 128 100 128 94 Z',
    nose: 'M166 86 C170 84 176 87 175 91 C174 95 168 95 166 93 Z',
    mouth: 'M150 101 C154 104 158 103 161 100',
    tailTip: 'M34 104C36 90 50 86 56 94C54 102 50 106 44 106C40 106 36 106 34 104 Z',
    back: (s) => piece('M124 118C136 114 148 124 146 142C144 154 134 160 124 158C116 148 114 130 124 118 Z', s.light, { lift: 0.8 }),
    extras: (s) => flat('M96 16 L98 12 L106 20 Z M152 12 L156 10 L157 22 Z', s.accent) +
      piece('M104 84 C108 98 120 108 134 106 C130 100 128 94 128 90 C120 92 110 90 104 84 Z', s.light, { lift: 0.6 }),
  },
  bear: {
    fur: '#a8744f', deep: '#8a5b3c', light: '#ead0ae', accent: '#6f4630',
    anchors: quadAnchors({ bow: [100, 44] }),
    body: 'M66 136C64 108 88 94 114 96C140 98 154 116 152 140C150 162 130 172 106 171C82 170 67 158 66 136 Z',
    head: HEAD, legs: 'paw',
    earFar: ell(148, 42, 12, 12),
    earNear: ell(100, 44, 14, 14),
    tail: ell(68, 124, 9, 9),
    muzzle: ell(146, 95, 19, 14),
    nose: ell(160, 88, 7, 5),
    mouth: 'M146 101 C149 106 155 106 158 101',
    extras: (s) => flat(ell(100, 44, 7, 7), s.light) + flat(ell(148, 42, 5.5, 5.5), shade(s.light, -0.15)),
  },
  duck: {
    fur: '#f3cf5a', deep: '#d8ae3c', light: '#fff3c4', accent: '#e8883c',
    anchors: {
      headTop: [128, 48], bow: [112, 52], neck: [126, 106], back: [96, 106], pack: [78, 104],
      eyeNear: [124, 74, 6.4], eyeFar: [146, 72, 5.6],
      legs: [{ part: 'legFar', x: 100, near: false }, { part: 'legNear', x: 114, near: true }],
      tail: [70, 120],
    },
    body: 'M64 124 C56 104 70 96 84 106 C100 116 120 108 138 112 C158 118 160 142 150 160 C138 178 104 182 86 172 C70 164 64 146 64 124 Z',
    head: ell(128, 80, 30, 29), legs: 'bird',
    muzzle: 'M152 82 C160 78 174 80 179 86 C173 94 160 96 150 92 Z',
    mouth: 'M154 88 C162 90 170 89 177 86',
    earNear: 'M120 52 C118 42 124 38 128 44 C130 38 138 40 134 50 Z',
    back: (s) => piece('M84 126 C100 116 124 122 128 138 C118 150 96 150 84 140 C80 134 80 130 84 126 Z', s.deep, { part: 'wing', lift: 1.2 }),
  },
  pig: {
    fur: '#f2a9b5', deep: '#d88796', light: '#fcd5dc', accent: '#c96f82',
    anchors: quadAnchors({ bow: [104, 44] }),
    body: 'M68 136C66 110 90 98 114 100C140 102 152 118 150 140C148 160 130 170 106 169C84 168 69 156 68 136 Z',
    head: HEAD, legs: 'paw',
    earFar: 'M136 40 C144 30 156 30 162 36 C158 46 150 52 144 52 Z',
    earNear: 'M98 54 C94 40 98 30 104 26 C114 32 122 40 122 48 C114 50 104 54 98 54 Z',
    tail: 'M76 128C66 130 60 124 62 118C64 112 72 114 70 120C68 124 62 122 64 118',
    muzzle: ell(151, 92, 11, 13),
    nose: ell(160, 92, 6.5, 11.5), noseColor: '#f7bfc9',
    mouth: 'M140 106 C144 110 150 110 153 106',
    extras: () => flat(ell(158, 88, 1.8, 3), '#c96f82') + flat(ell(161.5, 96, 1.8, 3), '#c96f82'),
  },
  frog: {
    fur: '#7fb87a', deep: '#5f9a5c', light: '#dcefc6', accent: '#4f8a52',
    anchors: {
      headTop: [128, 46], bow: [112, 50], neck: [120, 118], back: [98, 118], pack: [80, 132],
      eyeNear: [113, 60, 6.6], eyeFar: [143, 57, 5.8],
      legs: [
        { part: 'legBackFar', x: 86, near: false }, { part: 'legFrontFar', x: 128, near: false },
        { part: 'legBackNear', x: 98, near: true }, { part: 'legFrontNear', x: 140, near: true },
      ],
      tail: [76, 146],
    },
    body: 'M72 150 C70 126 92 116 116 118 C140 120 152 134 150 154 C148 172 130 180 108 179 C86 178 73 168 72 150 Z',
    head: `M86 90 C84 72 98 62 110 60 C106 50 110 44 114 46 C118 46 126 48 128 58 C132 50 138 44 144 44 C152 46 156 54 154 62 C162 70 166 80 164 92 C162 110 144 120 124 120 C102 120 88 108 86 90 Z`,
    legs: 'frog',
    mouth: 'M112 96 C126 106 146 104 158 90',
    back: (s) => piece('M100 124 C116 118 138 124 144 142 C140 160 120 166 104 160 C96 150 94 134 100 124 Z', s.light, { lift: 0.8 }),
    underEyes: () => flat(ell(113, 60, 10.5, 10.5), '#fffdf6') + flat(ell(143, 57, 8.6, 9.4), '#fffdf6'),
    eyesOnTop: true,
  },
  owl: {
    fur: '#b58a62', deep: '#93693f', light: '#f4e6cc', accent: '#e8a93c',
    anchors: {
      headTop: [120, 42], bow: [100, 50], neck: [120, 120], back: [96, 112], pack: [70, 150],
      eyeNear: [113, 82, 8.2], eyeFar: [140, 80, 7.2],
      legs: [{ part: 'legFar', x: 108, near: false }, { part: 'legNear', x: 124, near: true }],
      tail: [78, 160],
    },
    body: 'M72 142 C68 108 88 84 116 84 C146 84 164 108 160 142 C157 170 138 186 116 186 C94 186 75 170 72 142 Z',
    head: 'M78 90 C74 60 94 40 120 40 C148 40 166 60 162 90 C160 112 142 124 120 124 C98 124 80 112 78 90 Z',
    legs: 'bird',
    earFar: 'M138 50 C144 40 152 32 160 30 C162 42 158 54 150 60 Z',
    earNear: 'M86 64 C80 50 82 36 88 28 C96 38 104 46 108 52 Z',
    tail: 'M84 160 L62 174 L68 162 L58 158 L80 150 Z',
    muzzle: 'M127 90 C133 88 139 91 138 97 C137 103 132 107 129 103 C126 99 125 93 127 90 Z',
    back: (s) => piece(ell(126, 152, 23, 27), s.light, { lift: 0.8 }) +
      flat('M112 140 q5 5 10 0 M126 140 q5 5 10 0 M118 153 q5 5 10 0 M132 153 q5 5 10 0 M120 166 q5 5 10 0', 'none', `stroke="${shade(s.light, -0.25)}" stroke-width="2" stroke-linecap="round"`) +
      piece('M86 116 C76 128 74 152 84 172 C98 166 106 146 104 126 C102 116 92 112 86 116 Z', s.deep, { part: 'wing', lift: 1.4 }) +
      flat('M88 132 q6 4 12 0 M86 146 q7 4 14 0 M88 160 q6 4 11 0', 'none', `stroke="${shade(s.deep, -0.2)}" stroke-width="1.6" stroke-linecap="round"`),
    underEyes: (s) => piece(`${ell(113, 83, 17, 18)} ${ell(140, 81, 14, 16.5)}`, shade(s.light, 0.3), { lift: 0.8 }) +
      line('M98 66 C104 62 112 62 118 66 M130 64 C136 61 144 61 150 65', s.deep, 3),
  },
};

export const HEROES = Object.keys(SPECS) as HeroId[];
export const heroColor = (id: HeroId) => SPECS[id].fur;
export const anchorsOf = (id: HeroId): Anchors => SPECS[id].anchors;
export const eyesOnTop = (id: HeroId) => !!SPECS[id].eyesOnTop;

function leg(s: Spec, l: Anchors['legs'][number], boots: string | undefined) {
  const x = l.x;
  const fill = l.near ? s.fur : s.deep;
  let d: string;
  let hip: Pt;
  if (s.legs === 'bird') {
    d = `M${x - 3} 164 L${x + 3} 164 L${x + 3} 185 L${x + 11} 189 L${x + 11} 192 L${x - 8} 192 L${x - 3} 187 Z`;
    hip = [x, 164];
    return `<g class="leg ${l.part}" style="transform-origin:${hip[0]}px ${hip[1]}px">
      ${piece(d, l.near ? s.accent : shade(s.accent, -0.15), { part: l.part, lift: 0.8 })}${boots ?? ''}</g>`;
  }
  if (s.legs === 'frog') {
    d = `M${x - 9} 156 L${x + 8} 156 L${x + 7} 184 L${x + 14} 187 C${x + 15} 191 ${x + 12} 192 ${x + 10} 192 L${x - 10} 192 C${x - 12} 192 ${x - 12} 188 ${x - 9} 186 Z`;
  } else {
    d = `M${x - 8} 142 L${x + 8} 142 L${x + 7.5} 185 C${x + 7.5} 190 ${x + 4} 192 ${x} 192 C${x - 5} 192 ${x - 8} 190 ${x - 8} 185 Z`;
  }
  hip = [x, 146];
  const paw = s.legs === 'paw' ? flat(`M${x - 3} 189 L${x - 3} 192 M${x + 2} 189 L${x + 2} 192`, 'none', `stroke="${shade(fill, -0.25)}" stroke-width="1.4" stroke-linecap="round"`) : '';
  return `<g class="leg ${l.part}" style="transform-origin:${hip[0]}px ${hip[1]}px">
    ${piece(d, fill, { part: l.part, lift: l.near ? 1.4 : 0.8 })}${paw}${boots ?? ''}</g>`;
}

/** The hero's drawing (an SVG fragment in the 200×200 box). */
export function heroArt(id: HeroId, look: Look = {}): string {
  const s = SPECS[id];
  const a = s.anchors;
  const w = look.worn ?? {};
  const legs = look.seated ? [] : a.legs;
  const boots = (l: Anchors['legs'][number]) => (w.feet ? wearFeet(w.feet, l.x, s.legs === 'bird') : undefined);
  const [nx, ny, nr] = a.eyeNear;
  const [fx, fy, fr] = a.eyeFar;
  const tail = s.tail
    ? (id === 'pig' ? `<g data-part="tail" class="tail" style="transform-origin:${a.tail[0]}px ${a.tail[1]}px">${line(s.tail, s.deep, 4.5)}</g>`
      : `<g class="tail" style="transform-origin:${a.tail[0]}px ${a.tail[1]}px">${piece(s.tail, s.fur, { part: 'tail', lift: 1 })}${s.tailTip ? piece(s.tailTip, s.light, { lift: 0.6 }) : ''}</g>`)
    : '';
  return `<g class="hero" data-word="${id}" data-hero="${id}">
    ${w.back === 'cape' ? wearBack(w.back, a, 'under') : ''}
    ${legs.filter((l) => !l.near).map((l) => leg(s, l, boots(l))).join('')}
    ${tail}
    ${s.earFar ? piece(s.earFar, shade(s.fur, -0.12), { part: 'earFar', lift: 0.8 }) : ''}
    ${piece(s.body, s.fur, { part: 'body', lift: 1.2 })}
    ${s.back ? s.back(s) : ''}
    ${w.body ? wearBody(w.body, s.body, a) : ''}
    ${legs.filter((l) => l.near).map((l) => leg(s, l, boots(l))).join('')}
    ${w.back ? wearBack(w.back, a, 'over') : ''}
    ${look.air ? carryArt(look.air, a.pack) : ''}
    ${look.carry ? carryArt(look.carry, w.back === 'bag' ? [a.pack[0], a.pack[1] - 8] : a.pack) : ''}
    ${w.neck ? wearNeck(w.neck, a) : ''}
    ${piece(s.head, s.fur, { part: 'head', lift: 1.6 })}
    ${s.extras ? s.extras(s) : ''}
    ${s.muzzle ? piece(s.muzzle, id === 'duck' || id === 'owl' ? s.accent : s.light, { part: 'muzzle', lift: 1 }) : ''}
    ${s.nose ? piece(s.nose, s.noseColor ?? C.ink, { part: 'nose', lift: 0.6 }) : ''}
    ${s.mouth ? line(s.mouth, id === 'duck' ? shade(s.accent, -0.3) : C.ink, 1.8) : ''}
    ${s.underEyes ? s.underEyes(s) : ''}
    ${flat(ell(nx + 8, ny + 20, 7, 4.4), C.blush, 'data-part="cheek" opacity="0.85"')}
    ${eye(nx, ny, nr, 'eyeNear')}
    ${eye(fx, fy, fr, 'eyeFar', 0.9)}
    ${s.face ? s.face(s) : ''}
    ${s.earNear ? piece(s.earNear, id === 'duck' ? s.fur : shade(s.fur, id === 'dog' ? -0.3 : -0.06), { part: 'earNear', lift: 1.2 }) : ''}
    ${w.face ? wearFace(w.face, a) : ''}
    ${w.head ? wearHead(w.head, a) : ''}
    ${w.back ? wearBackTop(w.back, a) : ''}
  </g>`;
}
