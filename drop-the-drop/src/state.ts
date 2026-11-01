// One versioned localStorage key. Only settings are kept for now.
const KEY = 'drop-the-drop:v1';

export interface Save { v: 1; muted: boolean; done: string[] }

export function load(): Save {
  const fresh: Save = { v: 1, muted: false, done: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const o = JSON.parse(raw) as Partial<Save>;
    return { v: 1, muted: !!o.muted, done: Array.isArray(o.done) ? o.done.filter((x) => typeof x === 'string').slice(0, 100) : [] };
  } catch {
    return fresh;
  }
}

export function save(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}
