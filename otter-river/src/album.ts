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

export function decodeRecipe(s: string): Recipe | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const r = JSON.parse(new TextDecoder().decode(bytes)) as Recipe;
    if (typeof r.d !== 'number' || typeof r.w !== 'number' || typeof r.h !== 'number') return null;
    r.w = Math.max(80, Math.min(900, r.w));
    r.h = Math.max(80, Math.min(900, r.h));
    return r;
  } catch {
    return null;
  }
}

export function photoLink(p: Photo) {
  return `${location.origin}${location.pathname}?photo=${encodeRecipe(p.recipe)}`;
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
