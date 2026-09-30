import { Category, WORDS } from './content';
import type { SaveData } from './state';
import { WEAR_SLOT } from './art/wearables';

// Picks the next decision without end: categories take turns, recent words
// rest for a while, and longer words arrive as the child learns more.

export interface Decision {
  cat: Category;
  options: string[];
}

const shuffle = <T>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export function maxLength(learned: number) {
  if (learned < 10) return 4;
  if (learned < 20) return 5;
  return 7;
}

function candidates(cat: Category, s: SaveData): string[] {
  const t = s.trip;
  const max = maxLength(Object.keys(s.learned).length);
  let list = WORDS[cat].filter((w) => w.length <= max);
  switch (cat) {
    case 'wear': list = list.filter((w) => t.worn[WEAR_SLOT[w]] !== w); break;
    case 'place': list = list.filter((w) => w !== t.place); break;
    case 'sky': list = list.filter((w) => w !== t.sky); break;
    case 'carry': list = list.filter((w) => w !== t.carry); break;
    case 'ride': list = list.filter((w) => w !== t.ride); break;
    case 'friend': list = list.filter((w) => w !== t.hero && !t.friends.includes(w)); break;
  }
  return list;
}

function chooseCategory(s: SaveData): Category {
  const t = s.trip;
  const last = t.lastCats;
  const sinceLastPlace = last.length - 1 - last.lastIndexOf('place');
  if (last.length >= 3 && (last.lastIndexOf('place') === -1 || sinceLastPlace >= 3)) return 'place';
  const weights: [Category, number][] = [
    ['wear', 3],
    ['friend', 2],
    ['carry', 2],
    ['sky', 1.5],
    ['ride', last.includes('ride') ? 0.6 : 1],
    ['place', 1],
  ];
  const pool = weights.filter(([c]) => c !== last[last.length - 1] && candidates(c, s).length >= 2);
  const total = pool.reduce((n, [, w]) => n + w, 0);
  let r = Math.random() * total;
  for (const [c, w] of pool) if ((r -= w) <= 0) return c;
  return pool[0]?.[0] ?? 'wear';
}

export function nextDecision(s: SaveData, forceCat?: Category): Decision {
  const cat: Category = !s.trip.hero ? 'hero' : forceCat ?? chooseCategory(s);
  const count = cat === 'hero' ? 4 : s.decisions < 6 ? 2 : 3;
  const all = candidates(cat, s);
  const fresh = all.filter((w) => !s.trip.recent.includes(w));
  const pool = shuffle(fresh.length >= count ? fresh : all);
  // favour words the child hasn't learned yet, but keep some familiar ones
  pool.sort((a, b) => (s.learned[a] ?? 0) - (s.learned[b] ?? 0) + (Math.random() - 0.5) * 2);
  return { cat, options: shuffle(pool.slice(0, count)) };
}
