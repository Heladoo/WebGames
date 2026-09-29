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
  settings: Settings;
}

const KEY = 'otter-river-save-v1';

export function defaults(): SaveData {
  return {
    shells: 0,
    total: 0,
    owned: [],
    equipped: {},
    settings: { muted: false, music: true, sfx: true, volume: 0.7 },
  };
}

export function load(): SaveData {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw) as Partial<SaveData>;
    return {
      shells: Number.isFinite(s.shells) ? Number(s.shells) : 0,
      total: Number.isFinite(s.total) ? Number(s.total) : 0,
      owned: Array.isArray(s.owned) ? s.owned.filter((x) => typeof x === 'string') : [],
      equipped: s.equipped && typeof s.equipped === 'object' ? s.equipped : {},
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
