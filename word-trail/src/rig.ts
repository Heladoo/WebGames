import { anchorsOf, eyesOnTop, heroArt, HEROES, HeroId } from './art/characters';
import { installDefs, FILTER_DEFS } from './art/paper';
import { placeLayers, PLACE_IDS, PlaceId, TILE } from './art/places';
import { RIDES } from './art/rides';
import { AIR, CARRY, WEAR_SLOT } from './art/wearables';

// ?debug=rig — renders every hero alone, with each wearable, with each
// carried thing and on each ride, and measures every named part. The
// anatomy tests (tests/anatomy.spec.ts) read the result from window.__rig.

export interface Box { x: number; y: number; w: number; h: number; order: number }
export interface RigCase {
  id: string;
  hero: HeroId;
  wear?: string;
  carry?: string;
  air?: string;
  ride?: string;
  parts: Record<string, Box>;
  items: Record<string, Box[]>;
  anchors: ReturnType<typeof anchorsOf>;
  eyesOnTop: boolean;
  /** shapes that sit on a moving part (tail, leg, cape) but don't move with it */
  detached: string[];
  /** how much of the thing on the back is covered by parts drawn after it (0–1) */
  packHidden: number;
}

export const rigCases = () => {
  const out: { id: string; hero: HeroId; wear?: string; carry?: string; air?: string; ride?: string }[] = [];
  for (const hero of HEROES) {
    out.push({ id: `${hero}`, hero });
    for (const w of Object.keys(WEAR_SLOT)) out.push({ id: `${hero}+${w}`, hero, wear: w });
    for (const c of CARRY) out.push({ id: `${hero}+${c}`, hero, carry: c });
    out.push({ id: `${hero}+kite+star+bag`, hero, carry: 'star', air: 'kite', wear: 'bag' });
    for (const r of Object.keys(RIDES)) out.push({ id: `${hero}@${r}`, hero, ride: r });
  }
  return out;
};

const NS = 'http://www.w3.org/2000/svg';

/** Bounding box of an element's own drawing (cast shadows left out), in the svg's coordinates. */
function measure(svg: SVGSVGElement, el: Element, order: number): Box {
  const toRoot = svg.getScreenCTM()!.inverse();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const shapes = el.matches('path,ellipse,circle,rect,polygon') ? [el] : [...el.querySelectorAll('path,ellipse,circle,rect,polygon')];
  for (const s of shapes as SVGGraphicsElement[]) {
    if (s.closest('[data-shadow]')) continue;
    const b = s.getBBox();
    const m = toRoot.multiply(s.getScreenCTM()!);
    for (const [px, py] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]) {
      const p = new DOMPoint(px, py).matrixTransform(m);
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }
  }
  const r = (v: number) => Math.round(v * 10) / 10;
  return { x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0), order };
}

/** Is the root-space point (x, y) inside the filled shape `el`? */
function inside(svg: SVGSVGElement, el: SVGGeometryElement, x: number, y: number) {
  const m = svg.getScreenCTM()!.inverse().multiply(el.getScreenCTM()!).inverse();
  const p = new DOMPoint(x, y).matrixTransform(m);
  return el.isPointInFill(p);
}

/** Share of a shape that is covered by hero shapes drawn after it (sampled on a grid). */
function hiddenFraction(svg: SVGSVGElement, item: Element | null): number {
  if (!item) return 0;
  const all = [...svg.querySelectorAll('path,ellipse,circle,rect')] as SVGGeometryElement[];
  const own = all.filter((e) => item.contains(e) && !e.closest('[data-shadow]') && e.getAttribute('fill') !== 'none');
  const lastOwn = all.indexOf(own[own.length - 1]);
  const later = all.slice(lastOwn + 1).filter((e) => !e.closest('[data-shadow], [data-item]') && e.getAttribute('fill') !== 'none' && e.getAttribute('opacity') === null);
  const b = measure(svg, item, 0);
  let inItem = 0, hidden = 0;
  for (let i = 0; i < 14; i++)
    for (let j = 0; j < 14; j++) {
      const x = b.x + ((i + 0.5) / 14) * b.w, y = b.y + ((j + 0.5) / 14) * b.h;
      if (!own.some((e) => inside(svg, e, x, y))) continue;
      inItem++;
      if (later.some((e) => inside(svg, e, x, y))) hidden++;
    }
  return inItem ? Math.round((hidden / inItem) * 100) / 100 : 0;
}

/**
 * Anything that sits on a moving part (a tail, a leg, a cape) must be inside
 * that part's group, or it stays still while the part moves — like a fox's
 * white tail tip that didn't wag with the tail.
 */
function detachedFromMovers(svg: SVGSVGElement): string[] {
  const out: string[] = [];
  const all = [...svg.querySelectorAll('*')];
  for (const mover of svg.querySelectorAll('.tail, .leg, .cape, .wheel')) {
    const mb = measure(svg, mover, 0);
    const name = mover.getAttribute('class')!.split(' ').slice(0, 2).join(' ');
    const after = all.slice(all.indexOf(mover) + 1);
    for (const sh of after) {
      if (!sh.matches('path,ellipse,circle,rect') || sh.closest('[data-shadow]') || mover.contains(sh)) continue;
      if (sh.closest('.tail, .leg, .cape, .wheel, [data-item]')) continue;
      const b = measure(svg, sh, 0);
      const area = b.w * b.h;
      if (area < 6) continue;
      const ix = Math.max(0, Math.min(b.x + b.w, mb.x + mb.w) - Math.max(b.x, mb.x));
      const iy = Math.max(0, Math.min(b.y + b.h, mb.y + mb.h) - Math.max(b.y, mb.y));
      if ((ix * iy) / area >= 0.85 && area < mb.w * mb.h * 0.9) out.push(`a shape at (${b.x}, ${b.y}) sits on the ${name} but doesn't move with it`);
    }
  }
  return out;
}

/**
 * ?debug=frames — measures every card picture and records how far its
 * drawing reaches past the picture's frame (its viewBox). Results go to window.__frames.
 */
export function runFrames(words: string[], picture: (w: string) => string) {
  document.body.className = 'debug';
  document.body.innerHTML = '';
  installDefs();
  const out: { word: string; over: number; box: string; drawn: string }[] = [];
  for (const w of words) {
    const holder = document.createElement('div');
    holder.innerHTML = picture(w);
    const svg = holder.querySelector('svg')!;
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    document.body.appendChild(holder);
    const [vx, vy, vw, vh] = (svg.getAttribute('viewBox') ?? '0 0 200 200').split(/[ ,]+/).map(Number);
    // the drawing itself (cast shadows and clipped-away scenery left out)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const sh of svg.querySelectorAll('path,ellipse,circle,rect,polygon')) {
      if (sh.closest('[data-shadow], clipPath, [clip-path]')) continue;
      const b = measure(svg, sh, 0);
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
    }
    const X0 = x0, Y0 = y0, X1 = x1, Y1 = y1; // measure() already works in viewBox units
    const over = Math.max(vx - X0, vy - Y0, X1 - (vx + vw), Y1 - (vy + vh), 0);
    out.push({ word: w, over: Math.round(over * 10) / 10, box: `${vx} ${vy} ${vw} ${vh}`, drawn: `${X0.toFixed(0)} ${Y0.toFixed(0)} ${(X1 - X0).toFixed(0)} ${(Y1 - Y0).toFixed(0)}` });
  }
  (window as unknown as { __frames: typeof out }).__frames = out;
}

export function runRig() {
  document.body.className = 'debug';
  document.body.innerHTML = '';
  installDefs();
  const results: RigCase[] = [];
  for (const c of rigCases()) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-40 -80 280 290');
    svg.setAttribute('width', '140');
    svg.setAttribute('height', '145');
    svg.dataset.case = c.id;
    const ride = c.ride ? RIDES[c.ride] : null;
    const worn = c.wear ? { [WEAR_SLOT[c.wear]]: c.wear } : {};
    const air = c.air ?? (c.carry && AIR.includes(c.carry) ? c.carry : null);
    const pack = c.carry && !AIR.includes(c.carry) ? c.carry : null;
    const hero = heroArt(c.hero, { worn, carry: pack, air, seated: !!ride });
    svg.innerHTML = ride ? `${ride.under}<g transform="translate(0 ${ride.dy})">${hero}</g>${ride.over}` : hero;
    document.body.appendChild(svg);
    const parts: Record<string, Box> = {};
    const items: Record<string, Box[]> = {};
    svg.querySelectorAll('*').forEach((el, i) => {
      const part = el.getAttribute('data-part');
      const item = el.getAttribute('data-item');
      if (part) parts[part] = measure(svg, el, i);
      if (item) (items[item] ??= []).push(measure(svg, el, i));
    });
    results.push({ ...c, parts, items, anchors: anchorsOf(c.hero), eyesOnTop: eyesOnTop(c.hero), detached: detachedFromMovers(svg), packHidden: hiddenFraction(svg, svg.querySelector('[data-item="carry"]')) });
  }
  (window as unknown as { __rig: RigCase[] }).__rig = results;
}

/**
 * ?debug=tiles — checks that every scenery tile repeats seamlessly: a strip
 * of copies is drawn and each pixel column is compared with the one 800 units
 * to its right. Results go to window.__tiles.
 */
export async function runTiles() {
  document.body.className = 'debug';
  document.body.innerHTML = '';
  const out: { place: PlaceId; layer: string; diff: number }[] = [];
  for (const place of PLACE_IDS) {
    const l = placeLayers(place);
    for (const layer of ['far', 'mid', 'ground'] as const) {
      const copies = [-1, 0, 1, 2].map((i) => `<g transform="translate(${i * TILE} 0)">${l[layer]}</g>`).join('');
      const src = `<svg xmlns="${NS}" viewBox="0 150 ${TILE * 2} 300" width="${TILE}" height="150"><defs>${FILTER_DEFS}</defs>${copies}</svg>`;
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
      await img.decode();
      const c = document.createElement('canvas');
      c.width = TILE;
      c.height = 150;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, TILE, 150).data;
      const half = TILE / 2;
      let diff = 0;
      for (let y = 0; y < 150; y++)
        for (let x = 0; x < half; x++) {
          const a = (y * TILE + x) * 4, b = (y * TILE + x + half) * 4;
          if (Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2]) > 24) diff++;
        }
      out.push({ place, layer, diff });
    }
  }
  (window as unknown as { __tiles: typeof out }).__tiles = out;
}
