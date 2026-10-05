import type { Anchors, Pt } from './characters';
import { C, ell, flat, line, piece, shade } from './paper';

// Wearables and carried things, placed from each hero's anchor points so
// every item fits every animal. Carried things ride on the hero's back.

export type Slot = 'head' | 'neck' | 'feet' | 'back' | 'face' | 'body';

export const WEAR_SLOT: Record<string, Slot> = {
  hat: 'head',
  cap: 'head',
  crown: 'head',
  bow: 'head',
  helmet: 'head',
  scarf: 'neck',
  tie: 'neck',
  coat: 'body',
  boots: 'feet',
  shoes: 'feet',
  socks: 'feet',
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
    case 'helmet':
      return `<g data-item="helmet" data-word="helmet">
        ${piece(`M${hx - 27} ${hy + 12} C${hx - 30} ${hy - 22} ${hx + 26} ${hy - 26} ${hx + 28} ${hy + 10} C${hx + 10} ${hy + 15} ${hx - 10} ${hy + 16} ${hx - 27} ${hy + 12} Z`, C.teal, { lift: 1.6 })}
        ${piece(`M${hx - 16} ${hy - 8} C${hx - 12} ${hy - 14} ${hx - 8} ${hy - 15} ${hx - 6} ${hy - 13} L${hx - 9} ${hy - 4} Z M${hx - 2} ${hy - 15} C${hx + 2} ${hy - 16} ${hx + 5} ${hy - 16} ${hx + 7} ${hy - 14} L${hx + 4} ${hy - 5} L${hx - 2} ${hy - 5} Z M${hx + 12} ${hy - 12} C${hx + 16} ${hy - 10} ${hx + 19} ${hy - 7} ${hx + 20} ${hy - 4} L${hx + 13} ${hy - 3} Z`, shade(C.teal, -0.35), { lift: 0 })}
        ${piece(`M${hx + 14} ${hy + 4} C${hx + 26} ${hy + 1} ${hx + 36} ${hy + 4} ${hx + 38} ${hy + 9} C${hx + 30} ${hy + 12} ${hx + 20} ${hy + 12} ${hx + 12} ${hy + 10} Z`, C.butter, { lift: 1 })}
        ${piece(`M${hx - 27} ${hy + 8} C${hx - 10} ${hy + 12} ${hx + 10} ${hy + 11} ${hx + 28} ${hy + 6} L${hx + 28} ${hy + 11} C${hx + 10} ${hy + 16} ${hx - 10} ${hy + 17} ${hx - 27} ${hy + 13} Z`, shade(C.teal, -0.2), { lift: 0.4 })}</g>`;
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
  if (id === 'tie') {
    const [nx, ny] = a.neck;
    const x = nx + 14;
    return `<g data-item="tie" data-word="tie">
      ${piece(`M${nx - 16} ${ny - 4} C${nx - 4} ${ny + 4} ${nx + 18} ${ny + 4} ${nx + 30} ${ny - 6} L${nx + 31} ${ny} C${nx + 18} ${ny + 10} ${nx - 4} ${ny + 10} ${nx - 17} ${ny + 2} Z`, C.white, { lift: 0.8 })}
      ${piece(`M${x - 5} ${ny + 2} L${x + 5} ${ny + 2} L${x + 4} ${ny + 9} L${x - 4} ${ny + 9} Z`, shade(C.indigo, -0.15), { lift: 0.8 })}
      ${piece(`M${x - 4} ${ny + 9} L${x + 4} ${ny + 9} L${x + 7} ${ny + 34} L${x} ${ny + 41} L${x - 7} ${ny + 34} Z`, C.indigo, { lift: 1.2 })}
      ${line(`M${x - 4} ${ny + 18} L${x + 5} ${ny + 15} M${x - 5} ${ny + 27} L${x + 6} ${ny + 24}`, C.butter, 2.2)}</g>`;
  }
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

/** One boot, shoe or sock, drawn inside a leg group so it swings with the leg. */
export function wearFeet(id: string, x: number, bird = false): string {
  const w = bird ? 6 : 9.5;
  if (id === 'boots') {
    const d = `M${x - w} ${bird ? 176 : 174} L${x + w - 0.5} ${bird ? 176 : 174} L${x + w - 0.5} 185 C${x + w + 5} 185 ${x + w + 6.5} 189 ${x + w + 6.5} 193 L${x - w} 193 Z`;
    return `<g data-item="boots" data-word="boots">${piece(d, C.coral, { lift: 1 })}${line(`M${x - w + 0.5} 179 L${x + w - 1} 179`, C.white, 2.2)}</g>`;
  }
  if (id === 'shoes') {
    const d = `M${x - w} 183 C${x - w} 181 ${x + w - 2} 181 ${x + w} 184 C${x + w + 5} 185 ${x + w + 7} 188 ${x + w + 7} 191 L${x + w + 7} 193 L${x - w} 193 Z`;
    return `<g data-item="shoes" data-word="shoes">${piece(d, C.teal, { lift: 1 })}${piece(`M${x - w} 190 L${x + w + 7} 190 L${x + w + 7} 193 L${x - w} 193 Z`, C.white, { lift: 0.3 })}
      ${flat(ell(x + 2, 185.5, 1.4, 1.4), C.white)}${flat(ell(x + 6, 186.5, 1.4, 1.4), C.white)}</g>`;
  }
  if (id === 'socks') {
    const d = `M${x - w + 0.5} 166 L${x + w - 1} 166 L${x + w - 1} 186 C${x + w + 3} 186 ${x + w + 4} 189 ${x + w + 4} 193 L${x - w + 0.5} 193 Z`;
    return `<g data-item="socks" data-word="socks">${piece(d, C.rose, { lift: 0.8 })}
      ${line(`M${x - w + 1} 171 L${x + w - 1.5} 171 M${x - w + 1} 177 L${x + w - 1.5} 177`, C.white, 2.4)}</g>`;
  }
  return '';
}

/** A coat cut from the hero's own body shape, with a collar and buttons. */
export function wearBody(id: string, body: string, a: Anchors): string {
  if (id !== 'coat') return '';
  const [nx, ny] = a.neck;
  const cid = `coat-${Math.round(nx)}-${Math.round(ny)}`;
  return `<g data-item="coat" data-word="coat">
    <clipPath id="${cid}"><path d="${body}"/></clipPath>
    ${piece(body, C.mustard, { lift: 1 })}
    <g clip-path="url(#${cid})">
      ${flat(`M${nx + 8} ${ny - 20} L${nx + 14} ${ny + 80}`, 'none', `stroke="${shade(C.mustard, -0.2)}" stroke-width="2.5"`)}
      ${[10, 24, 38].map((dy) => flat(ell(nx + 18, ny + dy, 2.6, 2.6), C.ink)).join('')}
      ${flat(`M${nx - 40} ${ny + 46} L${nx + 60} ${ny + 46}`, 'none', `stroke="${shade(C.mustard, -0.2)}" stroke-width="2" stroke-dasharray="3 4"`)}
    </g>
    ${piece(`M${nx - 20} ${ny - 6} C${nx - 6} ${ny + 6} ${nx + 14} ${ny + 6} ${nx + 26} ${ny - 6} L${nx + 22} ${ny + 8} C${nx + 10} ${ny + 16} ${nx - 6} ${ny + 16} ${nx - 18} ${ny + 6} Z`, shade(C.mustard, 0.25), { lift: 0.8 })}</g>`;
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

/** Things that float on a string above the hero. */
export const AIR = ['kite', 'balloon'];
/** Things that rest on the hero's back. */
export const PACK = ['ball', 'star', 'book', 'drum', 'flag', 'bell', 'gift', 'violin', 'key'];
export const CARRY = [...AIR, ...PACK];

/** A carried thing: pack items rest on the back at `at`, kites and balloons fly from it. */
export function carryArt(id: string, at: Pt): string {
  const [x, y] = at;
  const g = (inner: string, cls = '') => `<g data-item="${AIR.includes(id) ? 'air' : 'carry'}" data-word="${id}"${cls ? ` class="${cls}"` : ''}>${inner}</g>`;
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
    case 'star':
      return g(piece(`M${x} ${y - 30} L${x + 6} ${y - 18} L${x + 19} ${y - 17} L${x + 9} ${y - 8} L${x + 12} ${y + 3} L${x} ${y - 3} L${x - 12} ${y + 3} L${x - 9} ${y - 8} L${x - 19} ${y - 17} L${x - 6} ${y - 18} Z`, C.butter, { lift: 1.6 }));
    case 'book':
      return g(`${piece(`M${x - 16} ${y - 2} L${x - 16} ${y - 22} L${x + 16} ${y - 22} L${x + 16} ${y - 2} Z`, C.white, { lift: 1.2 })}
        ${piece(`M${x - 18} ${y - 6} L${x - 18} ${y - 26} L${x + 14} ${y - 28} L${x + 14} ${y - 8} Z`, C.indigo, { lift: 1.2 })}
        ${piece(`M${x - 10} ${y - 20} L${x + 6} ${y - 21} L${x + 6} ${y - 15} L${x - 10} ${y - 14} Z`, C.butter, { lift: 0.3 })}`);
    case 'drum':
      return g(`${piece(`M${x - 16} ${y - 22} L${x + 16} ${y - 22} L${x + 16} ${y - 4} C${x + 16} ${y + 1} ${x - 16} ${y + 1} ${x - 16} ${y - 4} Z`, C.coral, { lift: 1.4 })}
        ${line(`M${x - 16} ${y - 20} L${x - 6} ${y - 3} L${x + 4} ${y - 20} L${x + 14} ${y - 3}`, C.butter, 2)}
        ${piece(ell(x, y - 22, 16, 5), '#f7ecd8', { lift: 0.6 })}
        ${line(`M${x - 4} ${y - 26} L${x - 14} ${y - 38} M${x + 6} ${y - 26} L${x + 14} ${y - 40}`, C.bark, 2.6)}`);
    case 'flag':
      return g(`${line(`M${x} ${y} L${x} ${y - 46}`, C.bark, 3)}
        ${piece(`M${x - 1} ${y - 46} L${x - 26} ${y - 38} L${x - 1} ${y - 30} Z`, C.coral, { lift: 1.2 })}
        ${piece(ell(x, y - 47, 2.6, 2.6), C.mustard, { lift: 0.3 })}`, 'float');
    case 'bell':
      return g(`${piece(`M${x} ${y - 30} C${x - 12} ${y - 30} ${x - 12} ${y - 14} ${x - 14} ${y - 6} L${x + 14} ${y - 6} C${x + 12} ${y - 14} ${x + 12} ${y - 30} ${x} ${y - 30} Z`, C.mustard, { lift: 1.4 })}
        ${piece(ell(x, y - 3, 3.6, 3.6), shade(C.mustard, -0.3), { lift: 0.4 })}${piece(ell(x, y - 32, 3, 3), shade(C.mustard, -0.2), { lift: 0.4 })}
        ${flat(ell(x - 5, y - 20, 1.8, 5), '#fff', 'opacity="0.45"')}`);
    case 'violin':
      // a little violin across the back, its neck pointing up and back (away from the head), with its bow
      return g(`<g transform="translate(${2 * x} 0) scale(-1 1)"><g transform="rotate(-28 ${x} ${y - 12})">
        ${piece(`M${x - 22} ${y - 12} C${x - 22} ${y - 22} ${x - 14} ${y - 24} ${x - 10} ${y - 19} C${x - 6} ${y - 16} ${x - 2} ${y - 16} ${x + 2} ${y - 19} C${x + 6} ${y - 24} ${x + 14} ${y - 22} ${x + 14} ${y - 12} C${x + 14} ${y - 2} ${x + 6} ${y} ${x + 2} ${y - 5} C${x - 2} ${y - 8} ${x - 6} ${y - 8} ${x - 10} ${y - 5} C${x - 14} ${y} ${x - 22} ${y - 2} ${x - 22} ${y - 12} Z`, '#c06a32', { lift: 1.4 })}
        ${flat(`M${x - 4} ${y - 15} L${x + 4} ${y - 15} L${x + 4} ${y - 9} L${x - 4} ${y - 9} Z`, '#4a3f47')}
        ${piece(`M${x + 13} ${y - 14} L${x + 34} ${y - 14} L${x + 34} ${y - 10} L${x + 13} ${y - 10} Z`, '#4a3f47', { lift: 0.5 })}
        ${piece(ell(x + 37, y - 12, 3.6, 4), '#8a4a24', { lift: 0.5 })}
        ${line(`M${x - 18} ${y - 13} L${x + 34} ${y - 13} M${x - 18} ${y - 11} L${x + 34} ${y - 11}`, '#f3e6c8', 0.8)}
        ${flat(`M${x - 13} ${y - 17} c2 2 2 8 0 10 M${x + 5} ${y - 17} c-2 2 -2 8 0 10`, 'none', 'stroke="#5e3b26" stroke-width="1.4"')}</g>
        ${line(`M${x - 24} ${y + 2} L${x + 20} ${y - 30}`, C.bark, 2.2)}${line(`M${x - 22} ${y + 4} L${x + 22} ${y - 28}`, '#f3e6c8', 1)}</g>`);
    case 'key':
      return g(`${line(ell(x - 13, y - 12, 8, 8), '#e2a92e', 5.5)}
        ${piece(`M${x - 5} ${y - 15} L${x + 22} ${y - 15} L${x + 22} ${y - 9} L${x - 5} ${y - 9} Z`, '#e8b440', { lift: 1.2 })}
        ${piece(`M${x + 12} ${y - 9} L${x + 12} ${y - 2} L${x + 16} ${y - 2} L${x + 16} ${y - 9} Z M${x + 18} ${y - 9} L${x + 18} ${y - 4} L${x + 22} ${y - 4} L${x + 22} ${y - 9} Z`, '#e8b440', { lift: 0.8 })}
        ${flat(ell(x - 16, y - 16, 2, 2), '#fff6d8', 'opacity="0.8"')}`);
    case 'gift':
      return g(`${piece(`M${x - 14} ${y} L${x - 14} ${y - 20} L${x + 14} ${y - 20} L${x + 14} ${y} Z`, C.teal, { lift: 1.4 })}
        ${piece(`M${x - 16} ${y - 20} L${x - 16} ${y - 26} L${x + 16} ${y - 26} L${x + 16} ${y - 20} Z`, shade(C.teal, 0.2), { lift: 0.6 })}
        ${piece(`M${x - 3} ${y} L${x - 3} ${y - 26} L${x + 3} ${y - 26} L${x + 3} ${y} Z`, C.coral, { lift: 0.3 })}
        ${piece(`M${x} ${y - 26} C${x - 4} ${y - 36} ${x - 14} ${y - 34} ${x - 10} ${y - 28} Z M${x} ${y - 26} C${x + 4} ${y - 36} ${x + 14} ${y - 34} ${x + 10} ${y - 28} Z`, C.coral, { lift: 0.6 })}`);
  }
  return '';
}

// ---------- card pictures ----------

// Items drawn on their own use a neutral skeleton, framed by these boxes.
const CARD_ANCHORS: Anchors = {
  headTop: [100, 60], bow: [100, 60], neck: [100, 60], back: [100, 70], pack: [100, 70],
  eyeNear: [82, 60, 7.4], eyeFar: [112, 60, 7.4],
  legs: [], tail: [0, 0],
};

export const ITEM_BOX: Record<string, string> = {
  hat: '50 22 102 60',
  cap: '70 30 90 50',
  crown: '72 32 56 44',
  helmet: '68 32 74 50',
  bow: '76 42 48 36',
  scarf: '64 44 72 64',
  tie: '74 44 76 64',
  coat: '60 62 80 70',
  boots: '78 168 46 30',
  shoes: '78 172 46 26',
  socks: '78 160 44 38',
  cape: '52 44 72 72',
  bag: '72 52 54 80',
  glasses: '56 44 78 34',
  ball: '84 40 32 34',
  kite: '30 -76 76 150',
  balloon: '50 -48 54 122',
  star: '78 36 44 42',
  book: '78 38 42 38',
  drum: '80 26 40 48',
  flag: '68 18 40 56',
  bell: '82 34 36 40',
  gift: '80 30 40 44',
  violin: '56 26 74 58',
  key: '74 34 54 48',
};

/** Card picture for a wearable or carried thing on its own. */
export function itemArt(id: string): string {
  const a = CARD_ANCHORS;
  if (WEAR_SLOT[id] === 'feet') return wearFeet(id, 94);
  if (id === 'coat')
    return `<g data-item="coat" data-word="coat">
      ${piece('M84 70 C78 72 70 84 66 104 L74 108 L80 92 L82 126 L118 126 L120 92 L126 108 L134 104 C130 84 122 72 116 70 C110 76 90 76 84 70 Z', C.mustard, { lift: 1.6 })}
      ${piece('M84 70 C90 76 110 76 116 70 L112 80 C104 86 96 86 88 80 Z', shade(C.mustard, 0.25), { lift: 0.6 })}
      ${line('M100 84 L100 126', shade(C.mustard, -0.2), 2)}
      ${[92, 104, 116].map((y) => flat(ell(105, y, 2.4, 2.4), C.ink)).join('')}</g>`;
  if (id === 'coat-on-body') return wearBody('coat', 'M70 136C68 112 90 98 114 100C138 102 150 118 148 140C146 160 128 170 106 169C84 168 71 156 70 136 Z', { ...a, neck: [114, 112] });
  if (id in WEAR_SLOT) {
    const slot = WEAR_SLOT[id];
    if (slot === 'head') return wearHead(id, a);
    if (slot === 'neck') return wearNeck(id, a);
    if (slot === 'back') return wearBack(id, { ...a, neck: [112, 60], back: id === 'bag' ? [100, 70] : [100, 64] }, 'over');
    return wearFace(id, { ...a, eyeNear: [82, 60, 7.4], eyeFar: [110, 60, 7.4] });
  }
  return carryArt(id, a.pack);
}
