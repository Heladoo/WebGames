import { ALL_WORDS, WORDS } from './content';
import { AIR, PACK, WEAR_SLOT, type Slot } from './art/wearables';
import { canWear, type Gear } from './gear';

export interface Settings {
  letterCase: 'upper' | 'lower';
  activity: 'mix' | 'tap' | 'trace' | 'find';
  rate: number; // speech speed 0.5..1.2
  voice: string; // voice name ('' = automatic)
  sound: boolean;
  music: boolean;
}

export interface Trip {
  hero: string | null;
  worn: Partial<Record<Slot, string>>;
  friends: string[]; // at most 3, oldest first
  place: string;
  sky: string;
  carry: string | null; // a thing resting on the back
  air: string | null; // a kite or balloon on a string
  ride: string | null; // ridden until the next new place
  gear: Record<string, Gear>; // what each friend has been handed down (see gear.ts)
  deck: string[]; // upcoming kinds of choice (a shuffled deck, so every kind comes up evenly)
  recent: string[]; // recently offered/chosen words, to vary the choices
  lastCats: string[];
}

export interface SaveData {
  trip: Trip;
  learned: Record<string, number>; // word -> times completed
  letters: string[]; // letters heard/traced (lowercase)
  places: string[]; // places visited
  badges: string[];
  decisions: number;
  rounds: number; // activities finished (drives the tap/trace mix)
  settings: Settings;
}

const KEY = 'word-trail-save-v1';

export function newTrip(): Trip {
  return { hero: null, worn: {}, friends: [], place: 'park', sky: 'sun', carry: null, air: null, ride: null, gear: {}, deck: [], recent: [], lastCats: [] };
}

export function defaults(): SaveData {
  return {
    trip: newTrip(),
    learned: {},
    letters: [],
    places: [],
    badges: [],
    decisions: 0,
    rounds: 0,
    settings: { letterCase: 'upper', activity: 'mix', rate: 0.8, voice: '', sound: true, music: true },
  };
}

const known = new Set(ALL_WORDS);
const strings = (v: unknown, ok: (s: string) => boolean = () => true) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && ok(x)) : [];
const pick = <T extends string>(v: unknown, options: readonly T[], d: T): T => (options.includes(v as T) ? (v as T) : d);
const numIn = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);

export function load(): SaveData {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw) as Partial<SaveData>;
    const t = (s.trip ?? {}) as Partial<Trip>;
    const worn: Trip['worn'] = {};
    for (const [slot, id] of Object.entries(t.worn ?? {})) if (typeof id === 'string' && WORDS.wear.includes(id)) worn[slot as Slot] = id;
    const friends = strings(t.friends, (f) => WORDS.friend.includes(f)).slice(-3);
    const gear: Trip['gear'] = {};
    for (const f of friends) {
      const g = (t.gear as Record<string, Partial<Gear>> | undefined)?.[f];
      if (!g || !canWear(f)) continue;
      const fw: Gear['worn'] = {};
      for (const [slot, id] of Object.entries(g.worn ?? {})) if (typeof id === 'string' && WEAR_SLOT[id] === slot) fw[slot as Slot] = id;
      gear[f] = {
        worn: fw,
        carry: typeof g.carry === 'string' && PACK.includes(g.carry) ? g.carry : null,
        air: typeof g.air === 'string' && AIR.includes(g.air) ? g.air : null,
      };
    }
    const learned: Record<string, number> = {};
    for (const [w, n] of Object.entries(s.learned ?? {})) if (known.has(w)) learned[w] = numIn(n, 0, 1e6, 1);
    const ss = (s.settings ?? {}) as Partial<Settings>;
    return {
      trip: {
        hero: typeof t.hero === 'string' && WORDS.hero.includes(t.hero) ? t.hero : null,
        worn,
        friends,
        place: pick(t.place, WORDS.place, 'park'),
        sky: pick(t.sky, WORDS.sky, 'sun'),
        carry: typeof t.carry === 'string' && PACK.includes(t.carry) ? t.carry : null,
        air: typeof t.air === 'string' && AIR.includes(t.air) ? t.air : null,
        ride: typeof t.ride === 'string' && WORDS.ride.includes(t.ride) ? t.ride : null,
        gear,
        deck: strings(t.deck, (c) => c in WORDS).slice(0, 20),
        recent: strings(t.recent, (w) => known.has(w)).slice(-20),
        lastCats: strings(t.lastCats).slice(-6),
      },
      learned,
      letters: strings(s.letters, (l) => /^[a-z]$/.test(l)),
      places: strings(s.places, (p) => WORDS.place.includes(p)),
      badges: strings(s.badges),
      decisions: numIn(s.decisions, 0, 1e7, 0),
      rounds: numIn(s.rounds, 0, 1e7, 0),
      settings: {
        letterCase: pick(ss.letterCase, ['upper', 'lower'] as const, 'upper'),
        activity: pick(ss.activity, ['mix', 'tap', 'trace', 'find'] as const, 'mix'),
        rate: numIn(ss.rate, 0.5, 1.2, 0.8),
        voice: typeof ss.voice === 'string' ? ss.voice.slice(0, 200) : '',
        sound: typeof ss.sound === 'boolean' ? ss.sound : true,
        music: typeof ss.music === 'boolean' ? ss.music : true,
      },
    };
  } catch {
    return d;
  }
}

let saving = true;
/** Scene and debug URLs set up a pretend trip: it must never replace the real save. */
export function stopSaving() {
  saving = false;
}

export function save(s: SaveData) {
  if (!saving) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode etc.): the game still works for this session
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export const wordCount = (s: SaveData) => Object.keys(s.learned).length;
