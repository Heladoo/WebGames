import type { Anchors, Pt } from './characters';
import { C, ell, flat, line, piece, shade } from './paper';

// Wearables and carried things, placed from each hero's anchor points so
// every item fits every animal. Carried things ride on the hero's back.

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

const rot = (a: number, [x, y]: Pt) => `rotate(${a} ${x} ${y})`;

export function wearHead(id: string, a: Anchors): string {
  const [hx, hy] = a.headTop;
  switch (id) {
    case 'hat': {
      const t = rot(-5, [hx, hy]);
      return `<g data-item="hat" data-word="hat" transform="${t}">
        ${piece(ell(hx + 2, hy + 7, 43, 8.5), C.butter, { lift: 1.4 })}
        ${piece(`M${hx - 22} ${hy + 8} C${hx - 24} ${hy - 14} ${hx - 10} ${hy - 24} ${hx + 2} ${hy - 24} C${hx + 18} ${hy - 24} ${hx + 28} ${hy - 12} ${hx + 25} ${hy + 6} C${hx + 10} ${hy + 12} ${hx - 10} ${hy + 12} ${hx - 22} ${hy + 8} Z`, shade(C.butter, 0.12), { lift: 1.2 })}
        ${piece(`M${hx - 23} ${hy + 1} C${hx - 8} ${hy + 6} ${hx + 12} ${hy + 5} ${hx + 26} ${hy - 1} L${hx + 25} ${hy + 6} C${hx + 10} ${hy + 12} ${hx - 10} ${hy + 12} ${hx - 22} ${hy + 8} Z`, C.coral, { lift: 0.6 })}
        ${piece(ell(hx - 12, hy + 5, 6, 6), C.white, { lift: 0.8 })}${flat(ell(hx - 12, hy + 5, 2.4, 2.4), C.mustard)}</g>`;
    }
    case 'cap':
      return `<g data-item="cap" data-word="cap">
        ${piece(`M${hx + 16} ${hy + 6} C${hx + 34} ${hy + 1} ${hx + 50} ${hy + 5} ${hx + 55} ${hy + 12} C${hx + 40} ${hy + 16} ${hx + 24} ${hy + 15} ${hx + 14} ${hy + 13} Z`, shade(C.teal, -0.15), { lift: 1.2 })}
        ${piece(`M${hx - 25} ${hy + 12} C${hx - 26} ${hy - 16} ${hx + 20} ${hy - 22} ${hx + 26} ${hy + 8} C${hx + 10} ${hy + 14} ${hx - 10} ${hy + 16} ${hx - 25} ${hy + 12} Z`, C.teal, { lift: 1.4 })}
        ${piece(`M${hx - 12} ${hy - 6} C${hx - 4} ${hy - 12} ${hx + 8} ${hy - 12} ${hx + 14} ${hy - 6} L${hx + 14} ${hy + 2} C${hx + 6} ${hy - 2} ${hx - 4} ${hy - 2} ${hx - 12} ${hy + 2} Z`, C.butter, { lift: 0.5 })}
        ${piece(ell(hx, hy - 12, 4, 3), C.coral, { lift: 0.5 })}</g>`;
    case 'crown':
      return `<g data-item="crown" data-word="crown">
        ${piece(`M${hx - 22} ${hy + 10} L${hx - 24} ${hy - 16} L${hx - 12} ${hy - 4} L${hx} ${hy - 22} L${hx + 12} ${hy - 4} L${hx + 24} ${hy - 16} L${hx + 22} ${hy + 10} Z`, C.mustard, { lift: 1.4 })}
        ${piece(`M${hx - 22} ${hy + 2} L${hx + 22} ${hy + 2} L${hx + 22} ${hy + 10} L${hx - 22} ${hy + 10} Z`, shade(C.mustard, -0.12), { lift: 0.4 })}
        ${piece(ell(hx, hy - 2, 4, 4.4), C.coral, { lift: 0.5 })}
        ${piece(ell(hx - 13, hy + 1, 2.8, 3), C.teal, { lift: 0.4 })}${piece(ell(hx + 13, hy + 1, 2.8, 3), C.indigo, { lift: 0.4 })}</g>`;
    case 'bow': {
      const [bx, by] = a.bow;
      return `<g data-item="bow" data-word="bow">
        ${piece(`M${bx} ${by} C${bx - 8} ${by - 16} ${bx - 22} ${by - 12} ${bx - 20} ${by} C${bx - 22} ${by + 12} ${bx - 8} ${by + 14} ${bx} ${by} Z`, C.coral, { lift: 1.2 })}
        ${piece(`M${bx} ${by} C${bx + 8} ${by - 16} ${bx + 22} ${by - 12} ${bx + 20} ${by} C${bx + 22} ${by + 12} ${bx + 8} ${by + 14} ${bx} ${by} Z`, C.coral, { lift: 1.2 })}
        ${flat(`M${bx - 14} ${by - 4} C${bx - 10} ${by - 2} ${bx - 6} ${by} ${bx - 4} ${by} M${bx + 14} ${by - 4} C${bx + 10} ${by - 2} ${bx + 6} ${by} ${bx + 4} ${by}`, 'none', `stroke="${shade(C.coral, -0.2)}" stroke-width="1.5" stroke-linecap="round"`)}
        ${piece(ell(bx, by, 5, 5.5), shade(C.coral, -0.12), { lift: 0.8 })}</g>`;
    }
  }
  return '';
}

export function wearNeck(id: string, a: Anchors): string {
  if (id !== 'scarf') return '';
  const [nx, ny] = a.neck;
  const rib = shade(C.teal, -0.2);
  return `<g data-item="scarf" data-word="scarf">
    ${piece(`M${nx + 10} ${ny + 4} L${nx + 6} ${ny + 36} C${nx + 8} ${ny + 40} ${nx + 18} ${ny + 41} ${nx + 20} ${ny + 37} L${nx + 22} ${ny + 6} Z`, C.teal, { lift: 1.2 })}
    ${line(`M${nx + 7} ${ny + 20} L${nx + 21} ${ny + 21} M${nx + 7} ${ny + 28} L${nx + 20} ${ny + 29}`, C.butter, 3)}
    ${line(`M${nx + 9} ${ny + 38} L${nx + 8} ${ny + 44} M${nx + 14} ${ny + 39} L${nx + 14} ${ny + 45} M${nx + 19} ${ny + 38} L${nx + 19} ${ny + 44}`, C.teal, 2)}
    ${piece(`M${nx - 26} ${ny - 8} C${nx - 10} ${ny + 3} ${nx + 14} ${ny + 3} ${nx + 30} ${ny - 10} L${nx + 32} ${ny + 4} C${nx + 16} ${ny + 16} ${nx - 12} ${ny + 16} ${nx - 28} ${ny + 4} Z`, C.teal, { lift: 1.4 })}
    ${line(`M${nx - 16} ${ny - 1} L${nx - 17} ${ny + 10} M${nx - 4} ${ny + 2} L${nx - 4} ${ny + 13} M${nx + 8} ${ny + 2} L${nx + 9} ${ny + 13} M${nx + 20} ${ny - 3} L${nx + 22} ${ny + 8}`, rib, 1.6)}</g>`;
}

/** One boot, drawn inside a leg group so it swings with the leg. */
export function wearFeet(id: string, x: number, bird = false): string {
  if (id !== 'boots') return '';
  const d = bird
    ? `M${x - 6} 176 L${x + 6} 176 L${x + 6} 186 C${x + 12} 186 ${x + 13} 190 ${x + 13} 193 L${x - 7} 193 Z`
    : `M${x - 9.5} 174 L${x + 9} 174 L${x + 9} 185 C${x + 14} 185 ${x + 16} 189 ${x + 16} 193 L${x - 9.5} 193 Z`;
  return `<g data-item="boots" data-word="boots">${piece(d, C.coral, { lift: 1 })}${line(`M${x - 9} 179 L${x + 9} 179`, C.white, 2.2)}</g>`;
}

export function wearBack(id: string, a: Anchors, layer: 'under' | 'over'): string {
  if (layer === 'under') return '';
  const [bx, by] = a.back;
  const [nx, ny] = a.neck;
  if (id === 'cape')
    return `<g data-item="cape" data-word="cape" class="cape" style="transform-origin:${nx}px ${ny}px">
      ${piece(`M${nx - 4} ${ny - 8} C${bx - 6} ${by - 10} ${bx - 30} ${by + 2} ${bx - 34} ${by + 38} C${bx - 16} ${by + 48} ${bx + 16} ${by + 46} ${nx + 6} ${ny + 14} Z`, C.indigo, { lift: 1.6 })}
      ${line(`M${bx - 30} ${by + 36} C${bx - 12} ${by + 44} ${bx + 12} ${by + 42} ${nx + 2} ${ny + 12}`, C.butter, 2.4)}
      ${piece(ell(nx - 2, ny - 2, 4, 4), C.mustard, { lift: 0.6 })}</g>`;
  if (id === 'bag')
    return `<g data-item="bag" data-word="bag">
      ${line(`M${bx + 2} ${by - 2} C${bx + 16} ${by + 14} ${bx + 20} ${by + 36} ${bx + 18} ${by + 58}`, shade(C.coral, -0.2), 5)}
      ${piece(`M${bx - 20} ${by - 8} C${bx - 20} ${by - 14} ${bx + 18} ${by - 14} ${bx + 18} ${by - 8} L${bx + 18} ${by + 18} C${bx + 18} ${by + 24} ${bx - 20} ${by + 24} ${bx - 20} ${by + 18} Z`, C.coral, { lift: 1.6 })}
      ${piece(`M${bx - 20} ${by - 8} C${bx - 20} ${by - 14} ${bx + 18} ${by - 14} ${bx + 18} ${by - 8} L${bx + 18} ${by + 4} C${bx + 6} ${by + 8} ${bx - 8} ${by + 8} ${bx - 20} ${by + 4} Z`, shade(C.coral, 0.15), { lift: 0.8 })}
      ${piece(ell(bx - 1, by + 5, 3, 3), C.butter, { lift: 0.4 })}</g>`;
  return '';
}

/** (Reserved for back items with parts in front of the head.) */
export const wearBackTop = (_id: string, _a: Anchors) => '';

export function wearFace(id: string, a: Anchors): string {
  if (id !== 'glasses') return '';
  const [nx, ny, nr] = a.eyeNear;
  const [fx, fy, fr] = a.eyeFar;
  const frame = C.coral;
  const lens = (x: number, y: number, rx: number, ry: number, part: string) =>
    `<g data-item="${part}">${flat(ell(x, y, rx, ry), '#e9f5f4', 'opacity="0.55"')}${flat(ell(x, y, rx, ry), 'none', `stroke="${frame}" stroke-width="3"`)}</g>`;
  return `<g data-item="glasses" data-word="glasses">
    ${line(`M${nx - nr - 5} ${ny - 2} L${nx - nr - 18} ${ny - 6}`, frame, 2.6)}
    ${line(`M${nx + nr + 4} ${ny - 1} C${(nx + fx) / 2} ${Math.min(ny, fy) - 5} ${(nx + fx) / 2 + 2} ${Math.min(ny, fy) - 5} ${fx - fr - 3} ${fy - 1}`, frame, 2.6)}
    ${lens(nx, ny, nr + 4.5, nr + 4, 'glasses-near')}
    ${lens(fx, fy, (fr + 3.6) * 0.86, fr + 3.6, 'glasses-far')}</g>`;
}

export const CARRY = ['ball', 'kite', 'balloon', 'cake', 'apple', 'egg', 'pie', 'star'];

/** A carried thing resting on the hero's back at `at`. */
export function carryArt(id: string, at: Pt): string {
  const [x, y] = at;
  const g = (inner: string, cls = '') => `<g data-item="carry" data-word="${id}"${cls ? ` class="${cls}"` : ''}>${inner}</g>`;
  switch (id) {
    case 'ball':
      return g(`${piece(ell(x, y - 12, 12.5, 12.5), C.coral, { lift: 1.4 })}
        ${flat(`M${x - 12} ${y - 15} C${x - 4} ${y - 9} ${x + 4} ${y - 9} ${x + 12} ${y - 15}`, 'none', `stroke="${C.white}" stroke-width="3"`)}
        ${flat(`M${x - 2} ${y - 24} C${x + 3} ${y - 16} ${x + 3} ${y - 8} ${x - 2} ${y}`, 'none', `stroke="${C.butter}" stroke-width="3"`)}`);
    case 'balloon':
      return g(`${line(`M${x} ${y} C${x - 6} ${y - 24} ${x - 20} ${y - 44} ${x - 26} ${y - 70}`, C.ink, 1.4)}
        ${piece(`M${x - 26} ${y - 70} L${x - 30} ${y - 64} L${x - 22} ${y - 64} Z`, C.rose, { lift: 0.4 })}
        ${piece(ell(x - 28, y - 92, 18, 22), C.rose, { lift: 2 })}${flat(ell(x - 34, y - 100, 4, 7), '#fff', 'opacity="0.5"')}`, 'float');
    case 'kite':
      return g(`${line(`M${x} ${y} C${x - 10} ${y - 30} ${x - 30} ${y - 56} ${x - 44} ${y - 96}`, C.ink, 1.4)}
        ${piece(`M${x - 44} ${y - 140} L${x - 24} ${y - 118} L${x - 44} ${y - 96} L${x - 64} ${y - 118} Z`, C.teal, { lift: 2 })}
        ${piece(`M${x - 44} ${y - 140} L${x - 24} ${y - 118} L${x - 44} ${y - 118} Z M${x - 44} ${y - 118} L${x - 44} ${y - 96} L${x - 64} ${y - 118} Z`, C.butter, { lift: 0.4 })}
        ${line(`M${x - 44} ${y - 96} C${x - 50} ${y - 84} ${x - 36} ${y - 78} ${x - 42} ${y - 66}`, C.ink, 1.2)}
        ${piece(`M${x - 46} ${y - 82} l7 -3 l1 7 Z M${x - 44} ${y - 72} l7 -3 l1 7 Z`, C.coral, { lift: 0.4 })}`, 'float');
    case 'cake':
      return g(`${piece(ell(x, y - 2, 18, 4), C.white, { lift: 1 })}
        ${piece(`M${x - 14} ${y - 3} L${x - 14} ${y - 20} L${x + 14} ${y - 26} L${x + 14} ${y - 3} Z`, '#f7dfb8', { lift: 1.4 })}
        ${piece(`M${x - 14} ${y - 20} L${x + 14} ${y - 26} L${x + 14} ${y - 18} C${x + 8} ${y - 14} ${x + 4} ${y - 20} ${x} ${y - 16} C${x - 4} ${y - 12} ${x - 10} ${y - 18} ${x - 14} ${y - 14} Z`, C.rose, { lift: 0.5 })}
        ${piece(ell(x + 6, y - 28, 4, 4), C.coral, { lift: 0.5 })}`);
    case 'apple':
      return g(`${piece(`M${x} ${y - 20} C${x - 12} ${y - 28} ${x - 16} ${y - 12} ${x - 13} ${y - 6} C${x - 10} ${y + 1} ${x - 4} ${y + 1} ${x} ${y - 1} C${x + 4} ${y + 1} ${x + 10} ${y + 1} ${x + 13} ${y - 6} C${x + 16} ${y - 12} ${x + 12} ${y - 28} ${x} ${y - 20} Z`, C.coral, { lift: 1.4 })}
        ${line(`M${x} ${y - 20} C${x} ${y - 25} ${x + 2} ${y - 28} ${x + 4} ${y - 29}`, C.bark, 2.2)}
        ${piece(`M${x + 3} ${y - 25} C${x + 8} ${y - 32} ${x + 15} ${y - 30} ${x + 15} ${y - 26} C${x + 10} ${y - 22} ${x + 6} ${y - 23} ${x + 3} ${y - 25} Z`, C.leafLight, { lift: 0.5 })}
        ${flat(ell(x - 6, y - 12, 2.4, 4.4), '#fff', 'opacity="0.45"')}`);
    case 'egg':
      return g(`${piece(`M${x} ${y - 28} C${x - 12} ${y - 28} ${x - 14} ${y - 10} ${x - 12} ${y - 5} C${x - 9} ${y + 1} ${x + 9} ${y + 1} ${x + 12} ${y - 5} C${x + 14} ${y - 10} ${x + 12} ${y - 28} ${x} ${y - 28} Z`, '#fff8ea', { lift: 1.4 })}
        ${flat(ell(x + 5, y - 10, 2, 2), '#efd8b2')}${flat(ell(x - 4, y - 6, 1.6, 1.6), '#efd8b2')}`);
    case 'pie':
      return g(`${piece(`M${x - 20} ${y - 8} C${x - 20} ${y + 1} ${x + 20} ${y + 1} ${x + 20} ${y - 8} Z`, '#d9985c', { lift: 1.2 })}
        ${piece(`M${x - 20} ${y - 8} C${x - 18} ${y - 20} ${x + 18} ${y - 20} ${x + 20} ${y - 8} C${x + 8} ${y - 4} ${x - 8} ${y - 4} ${x - 20} ${y - 8} Z`, '#f0c882', { lift: 0.8 })}
        ${line(`M${x - 8} ${y - 13} L${x - 4} ${y - 10} M${x + 1} ${y - 15} L${x + 1} ${y - 10} M${x + 9} ${y - 13} L${x + 6} ${y - 10}`, '#b87744', 2.2)}`);
    case 'star':
      return g(piece(`M${x} ${y - 30} L${x + 6} ${y - 18} L${x + 19} ${y - 17} L${x + 9} ${y - 8} L${x + 12} ${y + 3} L${x} ${y - 3} L${x - 12} ${y + 3} L${x - 9} ${y - 8} L${x - 19} ${y - 17} L${x - 6} ${y - 18} Z`, C.butter, { lift: 1.6 }));
  }
  return '';
}

// ---------- card pictures ----------

// Items drawn on their own use a neutral skeleton, framed by these boxes.
const CARD_ANCHORS: Anchors = {
  headTop: [100, 60], bow: [100, 60], neck: [100, 60], back: [100, 70],
  eyeNear: [82, 60, 7.4], eyeFar: [112, 60, 7.4],
  legs: [], tail: [0, 0],
};

export const ITEM_BOX: Record<string, string> = {
  hat: '50 22 102 60',
  cap: '70 30 90 50',
  crown: '72 32 56 44',
  bow: '76 42 48 36',
  scarf: '64 44 72 64',
  boots: '78 170 44 28',
  cape: '52 44 72 72',
  bag: '74 50 52 50',
  glasses: '56 44 78 34',
  ball: '84 40 32 34',
  kite: '30 -76 76 150',
  balloon: '60 -30 48 104',
  cake: '80 38 40 36',
  apple: '84 38 34 36',
  egg: '84 38 32 36',
  pie: '76 50 48 24',
  star: '78 36 44 42',
};

/** Card picture for a wearable or carried thing on its own. */
export function itemArt(id: string): string {
  const a = CARD_ANCHORS;
  if (id === 'boots') return wearFeet('boots', 94);
  if (id in WEAR_SLOT) {
    const slot = WEAR_SLOT[id];
    if (slot === 'head') return wearHead(id, a);
    if (slot === 'neck') return wearNeck(id, a);
    if (slot === 'back') return wearBack(id, { ...a, neck: [112, 60], back: id === 'bag' ? [100, 70] : [100, 64] }, 'over');
    return wearFace(id, { ...a, eyeNear: [82, 60, 7.4], eyeFar: [110, 60, 7.4] });
  }
  return carryArt(id, a.back);
}
