// The table and the bracelet. Both are pure functions of the beads placed so far, so the workshop screen,
// the album picture and a shared link all draw exactly the same thing.

import { SLOTS, type Bead } from './content';
import { beadInner } from './art/beads';
import { placeArt as rawArt } from './art/places';
import { tableArt } from './art/tables';
import { canvasURL, svgToCanvas } from './raster';

export const BW = 400; // bracelet layer size
export const BH = 330;
const CX = 200;
const CY = 150;
const RX = 126;
const RY = 64;

/** Centre, size and tilt of each slot, filling left to right along the lower arc. */
export function slotGeometry(): { x: number; y: number; size: number; tilt: number }[] {
  // equal spacing along the curve (not equal angles), so beads never bunch up where the ellipse bends
  const from = 220;
  const to = -40;
  const N = 400;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const deg = from + ((to - from) * i) / N;
    const a = (deg * Math.PI) / 180;
    return { deg, x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) };
  });
  const len = [0];
  for (let i = 1; i <= N; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return Array.from({ length: SLOTS }, (_, k) => {
    const target = (len[N] * k) / (SLOTS - 1);
    let i = 1;
    while (i < N && len[i] < target) i++;
    const p = pts[i];
    const s = Math.sin((p.deg * Math.PI) / 180);
    return { x: p.x, y: p.y, size: 40 + s * 3, tilt: (p.deg - 90) * -0.28 };
  });
}

export interface BraceletOpts {
  /** slot to highlight as the next free place (screen only) */
  next?: number | null;
  /** slot that was just filled, for the drop-in animation (screen only) */
  fresh?: number | null;
  /** draw empty-slot rings and clickable areas (screen only) */
  interactive?: boolean;
}

/** Gold spacer ring (like the mockup) sitting on the string just outside the first and last bead. */
function spacer(x: number, y: number, tilt: number): string {
  return (
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)})">` +
    `<ellipse cx="0.8" cy="1.6" rx="4.4" ry="8.4" fill="#3a2208" opacity=".28"/>` +
    `<ellipse cx="0" cy="0" rx="4.6" ry="8.4" fill="#e7b43a"/><ellipse cx="0" cy="0" rx="4.6" ry="8.4" fill="none" stroke="#a8730e" stroke-width="1.2"/>` +
    `<ellipse cx="-1" cy="-1" rx="2.2" ry="6" fill="#fff4b4" opacity=".75"/><ellipse cx="0.6" cy="0" rx="1.5" ry="5" fill="#1c1006" opacity=".55"/></g>`
  );
}

/** The live part of the bracelet (a 400 x 330 box): beads, empty-slot rings and touch targets. */
export function braceletInner(beads: (Bead | null)[], o: BraceletOpts = {}): string {
  const geo = slotGeometry();
  let s = '';
  const tangent = (i: number) => {
    const a = geo[Math.max(0, i - 1)];
    const b = geo[Math.min(SLOTS - 1, i + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  };
  const first = beads[0] ? 0 : -1;
  const last = beads[SLOTS - 1] ? SLOTS - 1 : -1;
  if (first === 0) {
    const t = tangent(0);
    s += spacer(geo[0].x - Math.cos(t) * (geo[0].size / 2 + 3.5), geo[0].y - Math.sin(t) * (geo[0].size / 2 + 3.5), (t * 180) / Math.PI);
  }
  if (last === SLOTS - 1) {
    const t = tangent(SLOTS - 1);
    s += spacer(geo[SLOTS - 1].x + Math.cos(t) * (geo[SLOTS - 1].size / 2 + 3.5), geo[SLOTS - 1].y + Math.sin(t) * (geo[SLOTS - 1].size / 2 + 3.5), (t * 180) / Math.PI);
  }
  geo.forEach((g, i) => {
    const b = beads[i];
    if (b) {
      const k = g.size / 100;
      s +=
        `<g class="bead" data-slot="${i}" transform="translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) rotate(${g.tilt.toFixed(1)}) scale(${k.toFixed(3)}) translate(-50 -50)"><g class="${o.fresh === i ? 'drop' : ''}">${beadInner(b.shape, b.design, true, 'side')}</g></g>`;
    } else if (o.interactive) {
      s += `<circle class="slot-ring${o.next === i ? ' next' : ''}" cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="${(g.size / 2 - 3).toFixed(1)}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/>`;
    }
  });
  if (o.interactive) {
    // generous touch targets, drawn last so they sit on top
    geo.forEach((g, i) => {
      s += `<circle class="slot-hit" data-slot="${i}" cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="${(g.size / 2 + 2).toFixed(1)}" fill="transparent"/>`;
    });
  }
  return s;
}

/** The bracelet layer on screen: the painted table picture (when ready) with the live beads on top. */
export function braceletSVG(beads: (Bead | null)[], o: BraceletOpts = {}, tableUrl: string | null = null): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BW} ${BH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your bracelet">${tableUrl ? `<image href="${tableUrl}" x="0" y="0" width="${BW}" height="${BH}"/>` : ''}${braceletInner(beads, o)}</svg>`;
}

/** Just the beads, as a standalone svg, for drawing into the album picture. */
export function beadsSVG(beads: (Bead | null)[], scale = 2): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BW} ${BH}" width="${BW * scale}" height="${BH * scale}">${braceletInner(beads)}</svg>`;
}

/** Where the table layer starts in the album picture (it ends exactly at the bottom edge). */
export const PHOTO_TABLE_Y = 370;
export const PHOTO_W = 400;
export const PHOTO_H = 700;

// ---------- scenery pictures: painted once, cached ----------

export interface Picture {
  canvas: HTMLCanvasElement;
  url: string;
}
const pictures = new Map<string, Promise<Picture>>();

/** The scenery of a place as a picture (a canvas plus a URL for <img>). Painted once per place and scale. */
export function scenePicture(place: string, scale = 2): Promise<Picture> {
  const key = `${place}@${scale}`;
  let p = pictures.get(key);
  if (!p) {
    p = (async () => {
      const w = PHOTO_W * scale;
      const h = PHOTO_H * scale;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" width="${w}" height="${h}">${rawArt(place)}</svg>`;
      const canvas = await svgToCanvas(svg, w, h);
      return { canvas, url: await canvasURL(canvas) };
    })();
    pictures.set(key, p);
    p.catch(() => pictures.delete(key));
  }
  return p;
}

/** The table, rope and clasp of a place as a picture (png with transparency). */
export function tablePicture(place: string, scale = 2): Promise<Picture> {
  const key = `table:${place}@${scale}`;
  let p = pictures.get(key);
  if (!p) {
    p = (async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BW} ${BH}" width="${BW * scale}" height="${BH * scale}">${tableArt(place)}</svg>`;
      const canvas = await svgToCanvas(svg, BW * scale, BH * scale);
      return { canvas, url: await canvasURL(canvas, 'image/png') };
    })();
    pictures.set(key, p);
    p.catch(() => pictures.delete(key));
  }
  return p;
}
