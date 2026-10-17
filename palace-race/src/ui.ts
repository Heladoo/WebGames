// Shared bits for the screens: painted pictures of animals, children, items, tracks and the map (cached), the hold button
// for grown-up controls, coins that fly to where they are spent, and the coin jar that shows how close a price is.

import { drawAnimal, type AnimalId, type PoseId } from './art/animals';
import { drawKid, HIP_H, type KidId, type Outfit, type RiderPose } from './art/riders';
import { saddle } from './art/runner';
import { LAYERS, STAGE_H, STAGE_W, trackLayer, type TrackId } from './art/tracks';
import { paint } from './art/sprite';
import { ICONS } from './art/icons';

const dpr = () => Math.min(2.5, window.devicePixelRatio || 1);
const cache = new Map<string, Promise<HTMLCanvasElement>>();
function once(key: string, make: () => Promise<HTMLCanvasElement>) {
  let p = cache.get(key);
  if (!p) {
    p = make();
    cache.set(key, p);
  }
  return p;
}

/** A canvas shown at `css` px wide is painted with enough device pixels; a copy is returned so it can be placed anywhere. */
function copy(src: HTMLCanvasElement, cssW: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d')!.drawImage(src, 0, 0);
  c.style.width = `${cssW}px`;
  c.style.height = `${(cssW * src.height) / src.width}px`;
  c.className = 'pic';
  return c;
}

export const ANIMAL_BOX = { x: -235, y: -400, w: 490, h: 420 };
export const KID_BOX = { x: -80, y: -178, w: 160, h: 196 };

export async function animalPic(animal: AnimalId, saddleId: Outfit['saddle'], pose: PoseId, cssW: number) {
  const k = (cssW / ANIMAL_BOX.w) * dpr();
  const key = `a:${animal}:${saddleId}:${pose}:${k.toFixed(2)}`;
  const pic = await once(key, () => {
    const a = drawAnimal(animal, pose);
    const sd = saddle(saddleId, a.anchors.seat, a.anchors.seatAngle);
    return paint(`<ellipse cx="0" cy="4" rx="170" ry="16" fill="#3a2410" opacity=".18"/>` + a.svg + sd.under, ANIMAL_BOX, k);
  });
  return copy(pic, cssW);
}

export async function kidPic(kid: KidId, outfit: Outfit, pose: RiderPose, cssW: number, head = false) {
  const box = head ? { x: -76, y: -190, w: 150, h: 136 } : KID_BOX;
  const k = (cssW / box.w) * dpr();
  const key = `k:${kid}:${outfit.helmet}:${outfit.hair}:${pose}:${head}:${k.toFixed(2)}`;
  const pic = await once(key, () => {
    const art = drawKid(kid, pose, outfit, { x: 0, y: -HIP_H });
    return paint(`<ellipse cx="0" cy="3" rx="40" ry="7" fill="#3a2410" opacity=".18"/>` + art.back + art.front, box, k);
  });
  return copy(pic, cssW);
}

export async function trackPic(track: TrackId, cssW: number) {
  const k = (cssW / STAGE_W) * dpr();
  const key = `t:${track}:${k.toFixed(2)}`;
  const pic = await once(key, async () => {
    const c = document.createElement('canvas');
    c.width = Math.round(STAGE_W * k);
    c.height = Math.round(STAGE_H * k);
    const g = c.getContext('2d')!;
    for (const l of LAYERS) g.drawImage(await paint(trackLayer(track, l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, k), 0, 0);
    return c;
  });
  return copy(pic, cssW);
}

/** The map's background: the garden sky with the palace standing on rolling meadows. */
export async function mapPic(cssW: number) {
  const k = (cssW / STAGE_W) * Math.min(1.5, dpr());
  const meadow =
    `<path d="M0 640 C300 600 520 690 800 676 C1080 662 1300 600 1600 640 V900 H0Z" fill="#8fcf6a"/>` +
    `<path d="M0 720 C260 680 560 740 820 730 C1100 720 1340 690 1600 720 V900 H0Z" fill="#6cbf5a"/>` +
    `<path d="M0 810 C320 780 620 830 900 820 C1180 810 1400 790 1600 806 V900 H0Z" fill="#5aae52"/>` +
    Array.from({ length: 40 }, (_, i) => {
      const x = (i * 397) % 1600;
      const y = 700 + ((i * 131) % 190);
      return `<circle cx="${x}" cy="${y}" r="5" fill="${['#ff8fc8', '#fff', '#ffd43b', '#c9a0ff'][i % 4]}"/><circle cx="${x}" cy="${y}" r="2" fill="#ffb02e"/>`;
    }).join('');
  const pic = await once(`m:${k.toFixed(2)}`, () => paint(trackLayer('garden', 'sky') + meadow, { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, k));
  return copy(pic, cssW);
}

/** Put a painted picture into a slot once it is ready (slots show a soft placeholder until then). */
export function fill(slot: HTMLElement, pic: Promise<HTMLCanvasElement>) {
  void pic.then((c) => {
    slot.replaceChildren(c);
    slot.classList.add('ready');
  });
}

/**
 * A grown-ups button: it acts only after a press and hold (a ring fills while holding), so children don't open it
 * by accident. A short tap just wobbles. Enter or Space on the keyboard acts at once.
 */
export function holdButton(el: HTMLElement, ms: number, onHold: () => void) {
  let timer = 0;
  el.style.setProperty('--hold', `${ms}ms`);
  const cancel = () => {
    clearTimeout(timer);
    el.classList.remove('holding');
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.classList.add('holding');
    timer = window.setTimeout(() => {
      el.classList.remove('holding');
      onHold();
    }, ms);
  });
  el.addEventListener('pointerup', () => {
    if (el.classList.contains('holding')) {
      el.classList.remove('wobble');
      void el.offsetWidth;
      el.classList.add('wobble');
    }
    cancel();
  });
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('click', (e) => {
    if (e.detail === 0) onHold();
  });
}

/** Coins fly from one element to another (spending or earning). */
export function flyCoins(from: Element, to: Element, n = 6, onEach?: (i: number) => void): Promise<void> {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return new Promise((done) => {
    if (reduced) {
      onEach?.(0);
      done();
      return;
    }
    let left = n;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'fly-coin';
      c.innerHTML = ICONS.coin;
      c.style.left = `${a.left + a.width / 2 - 20}px`;
      c.style.top = `${a.top + a.height / 2 - 20}px`;
      document.body.appendChild(c);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const anim = c.animate(
        [
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: `translate(${dx * 0.4 + (i - n / 2) * 18}px, ${dy * 0.4 - 60}px) scale(1.1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${dx}px, ${dy}px) scale(.7)`, opacity: 0.9 },
        ],
        { duration: 650, delay: i * 70, easing: 'ease-in-out', fill: 'forwards' },
      );
      anim.onfinish = () => {
        c.remove();
        onEach?.(i);
        if (--left === 0) done();
      };
    }
  });
}

/** A coin jar that fills to show how many coins there are out of a price ("not yet" without words). */
export function jar(have: number, price: number): string {
  const p = Math.max(0, Math.min(1, have / price));
  return `<div class="jar" role="img" aria-label="${have} מתוך ${price} מטבעות"><svg viewBox="0 0 64 80" width="64" height="80" aria-hidden="true">
    <defs><clipPath id="jarc"><path d="M14 22 Q8 30 8 46 V66 Q8 74 18 74 H46 Q56 74 56 66 V46 Q56 30 50 22Z"/></clipPath></defs>
    <path d="M14 22 Q8 30 8 46 V66 Q8 74 18 74 H46 Q56 74 56 66 V46 Q56 30 50 22Z" fill="#eaf6ff" stroke="#4a2a4a" stroke-width="4"/>
    <g clip-path="url(#jarc)"><rect x="0" y="${74 - 52 * p}" width="64" height="${52 * p + 2}" fill="#ffcf3a"/>${Array.from({ length: 6 }, (_, i) => `<circle cx="${14 + (i % 3) * 18}" cy="${70 - Math.floor(i / 3) * 10}" r="6" fill="#ffe27a" stroke="#c8861a" stroke-width="1.5" opacity="${p > i / 6 ? 1 : 0}"/>`).join('')}</g>
    <rect x="12" y="12" width="40" height="11" rx="4" fill="#c98a5a" stroke="#4a2a4a" stroke-width="3"/>
  </svg></div>`;
}

export const coinTag = (n: number) => `<span class="coin-tag">${ICONS.coin}<b>${n}</b></span>`;
