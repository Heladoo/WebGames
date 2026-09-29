import type { Equipped } from './otterDraw';

export interface Settings {
  muted: boolean;
  music: boolean;
  sfx: boolean;
  volume: number; // 0..1
}

export interface SaveData {
  shells: number;
  total: number;
  owned: string[];
  equipped: Equipped;
  pets: string[]; // friends that come along (several at once)
  fresh: string[]; // newly unlocked items not yet looked at ("NEW" badges)
  announced: string[] | null; // items already announced with a NEW banner (null = old save, seed it)
  dockOpen: boolean;
  settings: Settings;
}

const KEY = 'otter-river-save-v1';

export function defaults(): SaveData {
  return {
    shells: 0,
    total: 0,
    owned: [],
    equipped: {},
    pets: [],
    fresh: [],
    announced: [],
    dockOpen: true,
    settings: { muted: false, music: true, sfx: true, volume: 0.7 },
  };
}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function load(): SaveData {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw) as Partial<SaveData> & { equipped?: Record<string, string> };
    const equipped: Record<string, string> = s.equipped && typeof s.equipped === 'object' ? { ...s.equipped } : {};
    const pets = strings(s.pets);
    // v1 saves kept a single friend in equipped.pet
    if (typeof equipped.pet === 'string') {
      if (!pets.includes(equipped.pet)) pets.push(equipped.pet);
      delete equipped.pet;
    }
    return {
      shells: Number.isFinite(s.shells) ? Number(s.shells) : 0,
      total: Number.isFinite(s.total) ? Number(s.total) : 0,
      owned: strings(s.owned),
      equipped: equipped as Equipped,
      pets,
      fresh: strings(s.fresh),
      announced: Array.isArray(s.announced) ? strings(s.announced) : null,
      dockOpen: typeof s.dockOpen === 'boolean' ? s.dockOpen : true,
      settings: { ...d.settings, ...(s.settings ?? {}) },
    };
  } catch {
    return d;
  }
}

export function save(s: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode etc.) — the game still works for this session
  }
}
