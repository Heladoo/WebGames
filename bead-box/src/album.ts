// The album: framed pictures of finished bracelets (IndexedDB, with an in-memory fallback), sharing, and the
// tiny "recipe" that lets another browser redraw the same bracelet from a link.

import { SLOTS, PLACE_IDS, isDesign, isShape, type Bead } from './content';

export interface Photo {
  id: string;
  png: string;
  caption: string;
  recipe: string; // see encodeRecipe
  at: number;
}

const DB = 'bead-box';
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

// ---------- recipe: a bracelet as a short link ----------

export interface Recipe {
  place: string;
  beads: Bead[];
}

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function encodeRecipe(r: Recipe): string {
  return b64(JSON.stringify({ p: r.place, b: r.beads.map((x) => [x.shape, x.design]) }));
}

/** Links come from strangers: cap the length, accept only base64url, and keep only whitelisted ids. */
export function decodeRecipe(s: string): Recipe | null {
  if (typeof s !== 'string' || s.length === 0 || s.length > 1500 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const pad = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))) as { p?: unknown; b?: unknown };
    if (typeof o.p !== 'string' || !PLACE_IDS.includes(o.p) || !Array.isArray(o.b)) return null;
    const beads: Bead[] = [];
    for (const item of o.b.slice(0, SLOTS)) {
      if (Array.isArray(item) && isShape(item[0]) && isDesign(item[1])) beads.push({ shape: item[0], design: item[1] });
    }
    return beads.length ? { place: o.p, beads } : null;
  } catch {
    return null;
  }
}

export const linkFor = (recipe: string) => `${location.origin}/?bracelet=${recipe}`;

// ---------- saving and sharing ----------

export function download(png: string, name: string) {
  const link = document.createElement('a');
  link.href = png;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** The address of the game itself (what a shared picture points to). */
export const gameLink = () => `${location.origin}/`;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Share a picture together with a link to the game. The link goes in the message text as well as in the link
 * field, because some apps drop the link when a file is attached. Without file sharing (most desktops) the
 * picture is saved and the link is copied instead.
 */
export async function sharePng(png: string, name: string, text: string, url: string = gameLink()): Promise<'shared' | 'saved+copied' | 'saved'> {
  const message = `${text} ${url}`;
  try {
    const blob = await (await fetch(png)).blob();
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Bead Box', text: message, url });
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return 'shared';
        await navigator.share({ files: [file], title: 'Bead Box', text: message }); // some systems refuse a file plus a link field
      }
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'shared';
  }
  download(png, name);
  return (await copyText(url)) ? 'saved+copied' : 'saved';
}

/** Share a link to one bracelet (it opens the game showing that bracelet): share sheet, else the clipboard. */
export async function shareLink(url: string, text: string): Promise<'shared' | 'copied'> {
  try {
    if (navigator.share) {
      await navigator.share({ url, title: 'Bead Box', text });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'shared';
  }
  if (!(await copyText(url))) window.prompt('Copy this link', url);
  return 'copied';
}
