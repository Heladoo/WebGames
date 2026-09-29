import type { Recipe } from './game';

// Photo album: postcards are kept in IndexedDB (plenty of room for images),
// with an in-memory fallback when storage is unavailable.

export interface Photo {
  id: string;
  png: string; // data URL of the framed postcard
  recipe: Recipe;
  caption: string;
  at: number;
}

const DB = 'otter-river';
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

// ---------- sharing ----------
export function encodeRecipe(r: Recipe): string {
  const json = JSON.stringify(r);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ANIMALS = new Set(['ducks', 'heron', 'kingfisher', 'bunny', 'deer', 'fish', 'dragonflies']);
const num = (v: unknown, lo: number, hi: number, dflt = lo) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt;

/**
 * Decode a shared postcard link. Links come from strangers, so everything is
 * validated: numbers are clamped, only known item ids survive, the animal is a
 * whitelisted kind with numeric fields, and any caption text is ignored (the
 * page rebuilds it from the place and time instead).
 */
export function decodeRecipe(s: string, knownIds: Set<string>): Recipe | null {
  if (!s || s.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const r = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    if (!r || typeof r !== 'object') return null;
    const e: Record<string, string> = {};
    if (r.e && typeof r.e === 'object') {
      for (const [k, v] of Object.entries(r.e as Record<string, unknown>)) {
        if (/^[a-z]{3,6}$/.test(k) && typeof v === 'string' && knownIds.has(v)) e[k] = v;
      }
    }
    const pets = Array.isArray(r.pets) ? r.pets.filter((p): p is string => typeof p === 'string' && knownIds.has(p)).slice(0, 12) : [];
    let a: Recipe['a'];
    const ra = r.a as Record<string, unknown> | undefined;
    if (ra && typeof ra === 'object' && typeof ra.kind === 'string' && ANIMALS.has(ra.kind)) {
      a = {
        kind: ra.kind, x: num(ra.x, -100, 1000), y: num(ra.y, -100000000, 100000000), dir: ra.dir === -1 ? -1 : 1,
        age: num(ra.age, 0, 60), state: ra.state === 'pause' || ra.state === 'out' ? ra.state : 'in',
        wait: num(ra.wait, 0, 10), homeX: num(ra.homeX, -100, 1000), stopX: num(ra.stopX, -100, 1000),
        ox: num(ra.ox, -100, 1000),
      };
    }
    const w = Math.round(num(r.w, 120, 900, 320));
    const h = Math.round(num(r.h, 120, 900, 400));
    return {
      d: Math.round(num(r.d, 0, 1e8)), x: num(r.x, 0, w, w / 2), w, h, oy: Math.round(num(r.oy, 40, h - 20, h * 0.64)),
      p: num(r.p, 0, 1), r: r.r === 1 ? 1 : 0, e, pets, a, at: num(r.at, 0, 4e12, Date.now()),
    };
  } catch {
    return null;
  }
}

export function photoLink(p: Photo) {
  // captions are rebuilt by the recipient, so they're left out of the link
  return `${location.origin}${location.pathname}?photo=${encodeRecipe({ ...p.recipe, c: undefined })}`;
}

async function pngFile(p: Photo) {
  const blob = await (await fetch(p.png)).blob();
  return new File([blob], `otter-river-${new Date(p.at).toISOString().slice(0, 10)}.png`, { type: 'image/png' });
}

export function download(p: Photo) {
  const a = document.createElement('a');
  a.href = p.png;
  a.download = `otter-river-${p.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Share the picture itself (falls back to a download). */
export async function shareImage(p: Photo): Promise<'shared' | 'downloaded'> {
  try {
    const file = await pngFile(p);
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Otter River', text: p.caption });
      return 'shared';
    }
  } catch {
    // user cancelled or sharing unsupported
  }
  download(p);
  return 'downloaded';
}

/** Share a link that re-creates the postcard (falls back to copying it). */
export async function shareLink(p: Photo): Promise<'shared' | 'copied' | 'failed'> {
  const url = photoLink(p);
  try {
    if (navigator.share) {
      await navigator.share({ url, title: 'A postcard from Otter River', text: p.caption });
      return 'shared';
    }
  } catch {
    // fall through to copying
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    window.prompt('Copy this link:', url);
    return 'failed';
  }
}
