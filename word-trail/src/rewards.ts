import { picture, WORDS } from './content';
import { sceneMarkup } from './scene';
import { GROUND } from './art/places';
import { FILTER_DEFS } from './art/paper';
import type { SaveData, Trip } from './state';

// Badges, trip postcards (kept in IndexedDB) and sharing.

export interface Badge {
  id: string;
  label: string;
  say: string;
  icon: string; // a word whose picture is the badge
  party?: boolean; // a milestone: celebrate with a full paper party
}

export const BADGES: Badge[] = [
  { id: 'words-1', label: 'First word', say: 'Your first word!', icon: 'star' },
  { id: 'words-5', label: '5 words', say: 'Wow! Five words!', icon: 'balloon' },
  { id: 'words-10', label: '10 words', say: 'Ten words! Amazing!', icon: 'crown', party: true },
  { id: 'words-25', label: '25 words', say: 'Twenty-five words! Super star!', icon: 'rainbow', party: true },
  { id: 'words-50', label: '50 words', say: 'Fifty words! Hooray!', icon: 'gift', party: true },
  { id: 'words-all', label: 'Every word', say: 'You found every word!', icon: 'sun', party: true },
  { id: 'letters-10', label: '10 letters', say: 'Ten different letters!', icon: 'book' },
  { id: 'letters-20', label: '20 letters', say: 'Twenty different letters!', icon: 'ball' },
  { id: 'letters-26', label: 'A to Z', say: 'Every letter from A to Z! Wow!', icon: 'star', party: true },
  { id: 'places-4', label: '4 places', say: 'Four places visited!', icon: 'boat' },
  { id: 'places-all', label: 'Every place', say: 'You went everywhere!', icon: 'train', party: true },
];

const ALL_COUNT = new Set(Object.values(WORDS).flat()).size;

/** Badges the child has just earned (and adds them to the save). */
export function checkBadges(s: SaveData): Badge[] {
  const words = Object.keys(s.learned).length;
  const want: Record<string, boolean> = {
    'words-1': words >= 1,
    'words-5': words >= 5,
    'words-10': words >= 10,
    'words-25': words >= 25,
    'words-50': words >= 50,
    'words-all': words >= ALL_COUNT,
    'letters-10': s.letters.length >= 10,
    'letters-20': s.letters.length >= 20,
    'letters-26': s.letters.length >= 26,
    'places-4': s.places.length >= 4,
    'places-all': s.places.length >= WORDS.place.length,
  };
  const fresh = BADGES.filter((b) => want[b.id] && !s.badges.includes(b.id));
  s.badges.push(...fresh.map((b) => b.id));
  return fresh;
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const a = (w: string) => (['boots', 'glasses', 'shoes', 'socks'].includes(w) ? w : `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`);

/** "The dog in the snow with a hat and a bee" */
export function caption(t: Trip): string {
  if (!t.hero) return 'Word Trail';
  const things = [...Object.values(t.worn), t.carry, t.air].filter((x): x is string => !!x).map(a);
  const all = [...things, ...t.friends.map(a)];
  let s = `The ${t.hero} ${t.place === 'sea' ? 'by the sea' : t.place === 'snow' ? 'in the snow' : t.place === 'sand' ? 'in the sand' : `in the ${t.place}`}`;
  if (all.length) s += ` with ${list(all)}`;
  return s;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// rasterized pictures carry their own copy of the paper filters
const svgUrl = (inner: string, viewBox: string, w: number, h: number) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}"><defs>${FILTER_DEFS}</defs>${inner}</svg>`);

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const FONT = "'Andika', 'Nunito', ui-rounded, system-ui, sans-serif";

/** A framed postcard of the trip right now, as a PNG data URL. */
export async function makePostcard(t: Trip): Promise<{ png: string; caption: string }> {
  const W = 1200;
  const IH = 675;
  const pad = 36;
  const foot = 110;
  const heroX = 520;
  const view = { x0: heroX - 520, y0: GROUND + 80 - 450, w: 800, h: 450 };
  const img = await loadImage(svgUrl(sceneMarkup(t, view, heroX), `${view.x0} ${view.y0} ${view.w} ${view.h}`, W - pad * 2, IH - pad * 2));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = IH + foot - pad;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fbf5ea';
  ctx.fillRect(0, 0, c.width, c.height);
  // scalloped stamp edge
  ctx.fillStyle = '#e6dccb';
  for (let x = 12; x < c.width; x += 24) {
    ctx.beginPath(); ctx.arc(x, 0, 8, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x, c.height, 8, Math.PI, 0); ctx.fill();
  }
  ctx.save();
  roundRect(ctx, pad, pad, W - pad * 2, IH - pad * 2, 28);
  ctx.clip();
  ctx.drawImage(img, pad, pad, W - pad * 2, IH - pad * 2);
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#3f3238';
  roundRect(ctx, pad, pad, W - pad * 2, IH - pad * 2, 28);
  ctx.stroke();
  const text = caption(t);
  ctx.fillStyle = '#3f3238';
  ctx.textBaseline = 'middle';
  let size = 38;
  do {
    ctx.font = `700 ${size}px ${FONT}`;
    size -= 2;
  } while (ctx.measureText(text).width > W - pad * 2 - 230 && size > 18);
  ctx.fillText(text, pad + 6, IH - pad + foot / 2 - 4);
  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = '#e3685b';
  const brand = 'Word Trail';
  ctx.fillText(brand, W - pad - ctx.measureText(brand).width, IH - pad + foot / 2 - 4);
  return { png: c.toDataURL('image/png'), caption: text };
}

/** A picture of the sticker book: every word learned so far. */
export async function makeStickerSheet(s: SaveData, upper: boolean): Promise<string> {
  const words = Object.keys(s.learned).sort();
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(words.length))));
  const cell = 180;
  const head = 120;
  const rows = Math.max(1, Math.ceil(words.length / cols));
  const c = document.createElement('canvas');
  c.width = cols * cell + 60;
  c.height = head + rows * cell + 60;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fbf5ea';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#3f3238';
  ctx.font = `700 44px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(`My ${words.length} English words!`, c.width / 2, head / 2 + 10);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const x = 30 + (i % cols) * cell;
    const y = head + Math.floor(i / cols) * cell;
    ctx.fillStyle = ['#f8e1d8', '#dcecea', '#f7ead0', '#e3e6f4', '#e6efd9'][i % 5];
    roundRect(ctx, x + 8, y + 8, cell - 16, cell - 16, 24);
    ctx.fill();
    const svg = picture(w);
    const box = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 200 200';
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    try {
      const img = await loadImage(svgUrl(inner, box, 110, 110));
      ctx.drawImage(img, x + (cell - 110) / 2, y + 16, 110, 110);
    } catch {
      // skip a picture that fails to draw
    }
    ctx.fillStyle = '#3f3238';
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText(upper ? w.toUpperCase() : w, x + cell / 2, y + cell - 34);
  }
  ctx.textAlign = 'start';
  return c.toDataURL('image/png');
}

// ---------- album (IndexedDB, with an in-memory fallback) ----------

export interface Photo {
  id: string;
  png: string;
  caption: string;
  at: number;
}

const DB = 'word-trail';
const STORE = 'photos';
const MAX = 60;
let memory: Photo[] = [];

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return open().then((db) => new Promise((resolve) => {
    if (!db) return resolve(null);
    try {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  }));
}

export async function listPhotos(): Promise<Photo[]> {
  const all = await tx<Photo[]>('readonly', (s) => s.getAll() as IDBRequest<Photo[]>);
  return (all ?? memory).slice().sort((a, b) => b.at - a.at);
}

export async function addPhoto(p: Photo) {
  const ok = await tx('readwrite', (s) => s.put(p));
  if (ok === null) memory.push(p);
  const all = await listPhotos();
  for (const old of all.slice(MAX)) await deletePhoto(old.id);
}

export async function deletePhoto(id: string) {
  memory = memory.filter((p) => p.id !== id);
  await tx('readwrite', (s) => s.delete(id));
}

export function download(png: string, name: string) {
  const link = document.createElement('a');
  link.href = png;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Share a picture with the system share sheet, or download it. */
export async function sharePng(png: string, name: string, text: string): Promise<'shared' | 'downloaded'> {
  try {
    const blob = await (await fetch(png)).blob();
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Word Trail', text });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'shared';
  }
  download(png, name);
  return 'downloaded';
}
