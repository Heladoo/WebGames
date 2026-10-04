// The table and the bracelet. Both are pure functions of the beads placed so far, so the workshop screen,
// the album picture and a shared link all draw exactly the same thing.

import { SLOTS, type Bead } from './content';
import { beadInner } from './art/beads';
import { TABLES, placeArt as rawArt } from './art/places';

let sid = 0;
/** Scenery with its own gradient ids, so several copies on one page never share (or lose) a gradient. */
export function placeArt(id: string): string {
  const svg = rawArt(id);
  const n = ++sid;
  const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  let out = svg;
  for (const i of ids) out = out.split(`id="${i}"`).join(`id="${i}_${n}"`).split(`url(#${i})`).join(`url(#${i}_${n})`);
  return out;
}

export const BW = 400; // bracelet layer size
export const BH = 290;
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

let gid = 0;

function table(place: string): string {
  const t = TABLES[place] ?? TABLES.beach;
  const id = `tb${++gid}`;
  const rings = t.rings
    ? [0.9, 0.72, 0.54, 0.36, 0.2].map((k) => `<ellipse cx="200" cy="182" rx="${178 * k}" ry="${80 * k}" fill="none" stroke="${t.grain}" stroke-width="2" opacity=".28"/>`).join('')
    : [0, 1, 2, 3, 4].map((i) => `<path d="M${46 + i * 12} ${150 + i * 14} Q200 ${118 + i * 22} ${354 - i * 12} ${150 + i * 14}" fill="none" stroke="${t.grain}" stroke-width="2" opacity=".16"/>`).join('');
  const sparkle = t.sparkle ? [[90, 170], [140, 214], [250, 200], [310, 168], [200, 236], [60, 200]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".7"/>`).join('') : '';
  return (
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.top[0]}"/><stop offset="1" stop-color="${t.top[1]}"/></linearGradient></defs>` +
    `<ellipse cx="200" cy="248" rx="188" ry="30" fill="#000" opacity=".12"/>` +
    `<path d="M12 190 A188 86 0 0 0 388 190 L388 220 A188 86 0 0 1 12 220Z" fill="${t.edge}"/>` +
    `<ellipse cx="200" cy="190" rx="188" ry="86" fill="url(#${id})"/>` +
    `<ellipse cx="200" cy="190" rx="188" ry="86" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>` +
    rings + sparkle
  );
}

function rope(): string {
  return (
    `<ellipse cx="${CX}" cy="${CY + 5}" rx="${RX}" ry="${RY}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="8"/>` +
    `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="#b9854d" stroke-width="8"/>` +
    `<ellipse cx="${CX}" cy="${CY - 1.5}" rx="${RX}" ry="${RY}" fill="none" stroke="#e0b57a" stroke-width="3" stroke-dasharray="7 5"/>`
  );
}

function knot(): string {
  const y = CY - RY;
  return (
    `<rect x="${CX - 17}" y="${y - 11}" width="34" height="22" rx="10" fill="#b9854d"/><rect x="${CX - 17}" y="${y - 11}" width="34" height="22" rx="10" fill="none" stroke="#8a5e30" stroke-width="2"/>` +
    [-8, 0, 8].map((dx) => `<path d="M${CX + dx} ${y - 9} L${CX + dx} ${y + 9}" stroke="#8a5e30" stroke-width="2" stroke-linecap="round"/>`).join('') +
    `<ellipse cx="${CX - 6}" cy="${y - 5}" rx="8" ry="3" fill="#fff" opacity=".35"/>`
  );
}

export interface BraceletOpts {
  /** slot to highlight as the next free place (screen only) */
  next?: number | null;
  /** slot that was just filled, for the drop-in animation (screen only) */
  fresh?: number | null;
  /** draw empty-slot rings and clickable areas (screen only) */
  interactive?: boolean;
}

/** The inside of the bracelet layer: table, rope, clasp and beads (a 400 x 290 box). */
export function braceletInner(place: string, beads: (Bead | null)[], o: BraceletOpts = {}): string {
  const geo = slotGeometry();
  let s = table(place) + rope();
  geo.forEach((g, i) => {
    const b = beads[i];
    if (b) {
      const k = g.size / 100;
      s +=
        `<g class="bead" data-slot="${i}" transform="translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) rotate(${g.tilt.toFixed(1)}) scale(${k.toFixed(3)}) translate(-50 -50)"><g class="${o.fresh === i ? 'drop' : ''}">${beadInner(b.shape, b.design, false)}</g></g>`;
    } else if (o.interactive) {
      s += `<circle class="slot-ring${o.next === i ? ' next' : ''}" cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="${(g.size / 2 - 3).toFixed(1)}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" opacity=".6"/>`;
    }
  });
  s += knot();
  if (o.interactive) {
    // generous touch targets, drawn last so they sit on top
    geo.forEach((g, i) => {
      s += `<circle class="slot-hit" data-slot="${i}" cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="${(g.size / 2 + 2).toFixed(1)}" fill="transparent"/>`;
    });
  }
  return s;
}

export function braceletSVG(place: string, beads: (Bead | null)[], o: BraceletOpts = {}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BW} ${BH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your bracelet">${braceletInner(place, beads, o)}</svg>`;
}

/** The whole album picture as an svg string: scenery with the table and bracelet in front. */
export const PHOTO_W = 400;
export const PHOTO_H = 700;
export function photoSVG(place: string, beads: (Bead | null)[]): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" width="${PHOTO_W * 2}" height="${PHOTO_H * 2}">` +
    placeArt(place) +
    `<g transform="translate(0 400)">${braceletInner(place, beads)}</g></svg>`
  );
}
