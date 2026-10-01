import { anchorsOf, eyesOnTop, heroArt, HEROES, HeroId } from './art/characters';
import { installDefs, FILTER_DEFS } from './art/paper';
import { placeLayers, PLACE_IDS, PlaceId, TILE } from './art/places';
import { RIDES } from './art/rides';
import { CARRY, WEAR_SLOT } from './art/wearables';

// ?debug=rig — renders every hero alone, with each wearable, with each
// carried thing and on each ride, and measures every named part. The
// anatomy tests (tests/anatomy.spec.ts) read the result from window.__rig.

export interface Box { x: number; y: number; w: number; h: number; order: number }
export interface RigCase {
  id: string;
  hero: HeroId;
  wear?: string;
  carry?: string;
  ride?: string;
  parts: Record<string, Box>;
  items: Record<string, Box[]>;
  anchors: ReturnType<typeof anchorsOf>;
  eyesOnTop: boolean;
}

export const rigCases = () => {
  const out: { id: string; hero: HeroId; wear?: string; carry?: string; ride?: string }[] = [];
  for (const hero of HEROES) {
    out.push({ id: `${hero}`, hero });
    for (const w of Object.keys(WEAR_SLOT)) out.push({ id: `${hero}+${w}`, hero, wear: w });
    for (const c of CARRY) out.push({ id: `${hero}+${c}`, hero, carry: c });
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
    const hero = heroArt(c.hero, { worn, carry: c.carry ?? null, seated: !!ride });
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
    results.push({ ...c, parts, items, anchors: anchorsOf(c.hero), eyesOnTop: eyesOnTop(c.hero) });
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
