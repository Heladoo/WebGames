// The save: one versioned localStorage key, every field validated on load (a broken or old save never breaks the
// game), wrapped in try/catch for private mode. Debug and scene URLs turn saving off (`stopSaving`).

import { ANIMALS, type AnimalId } from './art/animals';
import { BRAIDS, HELMETS, KIDS, SADDLES, type KidId, type Outfit } from './art/riders';
import { TRACKS, type TrackId } from './art/tracks';
import { FREE_ITEMS, ITEMS, itemKey } from './content';

export interface Settings { music: boolean; sound: boolean; volume: number; help: boolean }

export interface SaveData {
  coins: number;
  unlocked: TrackId[];
  owned: string[]; // item keys, e.g. "helmet:stars"
  outfit: Outfit;
  animal: AnimalId;
  kid: KidId;
  track: TrackId;
  races: number;
  wins: number;
  settings: Settings;
}

const KEY = 'palace-race-save-v1';
let saving = true;

export function defaults(): SaveData {
  return {
    coins: 0,
    unlocked: ['forest'],
    owned: [...FREE_ITEMS],
    outfit: { helmet: 'basic', braids: 'none', saddle: 'basic' },
    animal: 'unicorn',
    kid: 'maya',
    track: 'forest',
    races: 0,
    wins: 0,
    settings: { music: true, sound: true, volume: 0.8, help: true },
  };
}

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d);
const pick = <T extends string>(v: unknown, all: readonly T[], d: T): T => (all.includes(v as T) ? (v as T) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const KNOWN = new Set(ITEMS.map(itemKey));

export function load(): SaveData {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw) as Omit<Partial<SaveData>, 'settings' | 'outfit'> & { settings?: Partial<Settings>; outfit?: Partial<Outfit> };
    const unlocked = Array.isArray(s.unlocked) ? TRACKS.filter((t) => (s.unlocked as unknown[]).includes(t)) : [];
    if (!unlocked.includes('forest')) unlocked.unshift('forest');
    const owned = [...new Set([...FREE_ITEMS, ...(Array.isArray(s.owned) ? s.owned.filter((k): k is string => typeof k === 'string' && KNOWN.has(k)) : [])])];
    const o: Partial<Outfit> = s.outfit ?? {};
    const outfit: Outfit = {
      helmet: pick(o.helmet, HELMETS, 'basic'),
      braids: pick(o.braids, BRAIDS, 'none'),
      saddle: pick(o.saddle, SADDLES, 'basic'),
    };
    // never wear something that isn't owned
    if (!owned.includes(`helmet:${outfit.helmet}`)) outfit.helmet = 'basic';
    if (!owned.includes(`braids:${outfit.braids}`)) outfit.braids = 'none';
    if (!owned.includes(`saddle:${outfit.saddle}`)) outfit.saddle = 'basic';
    const st: Partial<Settings> = s.settings ?? {};
    return {
      coins: num(s.coins, 0, 1e7, 0),
      unlocked,
      owned,
      outfit,
      animal: pick(s.animal, ANIMALS, d.animal),
      kid: pick(s.kid, KIDS, d.kid),
      track: unlocked.includes(s.track as TrackId) ? (s.track as TrackId) : 'forest',
      races: num(s.races, 0, 1e7, 0),
      wins: num(s.wins, 0, 1e7, 0),
      settings: {
        music: bool(st.music, true),
        sound: bool(st.sound, true),
        volume: typeof st.volume === 'number' && Number.isFinite(st.volume) ? Math.max(0, Math.min(1, st.volume)) : 0.8,
        help: bool(st.help, true),
      },
    };
  } catch {
    return d;
  }
}

let timer = 0;
/** Save soon (debounced 400 ms, so many quick changes write once). */
export function save(s: SaveData) {
  if (!saving) return;
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // private mode or full storage: play on without saving
    }
  }, 400);
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** A pretend game (debug or scene parameters) must never replace the real one. */
export function stopSaving() {
  saving = false;
}
