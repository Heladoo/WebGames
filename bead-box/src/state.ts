import { ALL_WORDS, PLACE_IDS, SLOTS, START_OPEN, isDesign, isShape, type Bead } from './content';

export interface Settings {
  rate: number; // speech speed 0.5..1.2
  voice: string; // voice name ('' = automatic)
  sound: boolean;
  music: boolean;
  volume: number; // 0..1
}

export interface SaveData {
  unlocked: string[]; // place ids that can be played
  finished: Record<string, number>; // bracelets finished per place
  learned: Record<string, number>; // word -> times heard on a placed bead
  drafts: Record<string, (Bead | null)[]>; // bracelets in progress, per place
  settings: Settings;
}

const KEY = 'bead-box-save-v1';

export function defaults(): SaveData {
  return { unlocked: [...START_OPEN], finished: {}, learned: {}, drafts: {}, settings: { rate: 0.8, voice: '', sound: true, music: true, volume: 0.8 } };
}

const known = new Set(ALL_WORDS);
const numIn = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);

export function load(): SaveData {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw) as Partial<SaveData>;
    const unlocked = Array.isArray(s.unlocked) ? s.unlocked.filter((p): p is string => PLACE_IDS.includes(p as string)) : [];
    for (const p of START_OPEN) if (!unlocked.includes(p)) unlocked.push(p);
    const finished: Record<string, number> = {};
    for (const [p, n] of Object.entries(s.finished ?? {})) if (PLACE_IDS.includes(p)) finished[p] = numIn(n, 0, 1e6, 0);
    const learned: Record<string, number> = {};
    for (const [w, n] of Object.entries(s.learned ?? {})) if (known.has(w)) learned[w] = numIn(n, 1, 1e6, 1);
    const drafts: SaveData['drafts'] = {};
    for (const [p, arr] of Object.entries(s.drafts ?? {})) {
      if (!PLACE_IDS.includes(p) || !Array.isArray(arr)) continue;
      const beads = Array.from({ length: SLOTS }, (_, i): Bead | null => {
        const b = arr[i] as Partial<Bead> | null | undefined;
        return b && isShape(b.shape) && isDesign(b.design) ? { shape: b.shape, design: b.design } : null;
      });
      if (beads.some(Boolean) && !beads.every(Boolean)) drafts[p] = beads;
    }
    const ss = (s.settings ?? {}) as Partial<Settings>;
    return {
      unlocked,
      finished,
      learned,
      drafts,
      settings: {
        rate: numIn(ss.rate, 0.5, 1.2, 0.8),
        voice: typeof ss.voice === 'string' ? ss.voice.slice(0, 200) : '',
        sound: typeof ss.sound === 'boolean' ? ss.sound : true,
        music: typeof ss.music === 'boolean' ? ss.music : true,
        volume: numIn(ss.volume, 0, 1, 0.8),
      },
    };
  } catch {
    return d;
  }
}

export function save(s: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode): the game still works for this session
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Open the next locked place (in order). Returns its id, or null when everything is open. */
export function unlockNext(s: SaveData): string | null {
  const next = PLACE_IDS.find((p) => !s.unlocked.includes(p));
  if (next) s.unlocked.push(next);
  return next ?? null;
}

export const wordCount = (s: SaveData) => Object.keys(s.learned).length;
