import { Category, WORDS } from './content';
import type { SaveData } from './state';
import { WEAR_SLOT } from './art/wearables';

// Picks the next decision without end. Kinds of choice come from a shuffled
// deck, so every kind turns up evenly (a new friend is never far away), and
// recent words rest for a while. Longer words arrive as the child learns more.

export interface Decision {
  cat: Category;
  options: string[];
}

/** One round of the deck: clothes, friends and things come up most often. */
export const DECK: Category[] = ['wear', 'wear', 'friend', 'friend', 'carry', 'carry', 'sky', 'place', 'ride'];

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

export function candidates(cat: Category, s: SaveData): string[] {
  const t = s.trip;
  const max = maxLength(Object.keys(s.learned).length);
  let list = WORDS[cat].filter((w) => w.length <= max);
  switch (cat) {
    case 'wear': list = list.filter((w) => t.worn[WEAR_SLOT[w]] !== w); break;
    case 'place': list = list.filter((w) => w !== t.place); break;
    case 'sky': list = list.filter((w) => w !== t.sky); break;
    case 'carry': list = list.filter((w) => w !== t.carry && w !== t.air); break;
    // a boat needs water: it is only offered by the sea
    case 'ride': list = list.filter((w) => w !== t.ride && (w !== 'boat' || t.place === 'sea')); break;
    case 'friend': list = list.filter((w) => w !== t.hero && !t.friends.includes(w)); break;
  }
  return list;
}

function nextCategory(s: SaveData): Category {
  const t = s.trip;
  const last = t.lastCats[t.lastCats.length - 1];
  for (let tries = 0; tries < 40; tries++) {
    if (!t.deck.length) t.deck = shuffle(DECK);
    const c = t.deck.shift() as Category;
    // never the same kind twice in a row
    if (c === last) {
      // put it back for later (with a fresh round behind it if nothing else is left)
      if (!t.deck.some((x) => x !== c)) t.deck.push(...shuffle(DECK));
      t.deck.push(c);
      continue;
    }
    if (candidates(c, s).length >= 2) return c;
  }
  return 'wear';
}

export function nextDecision(s: SaveData, forceCat?: Category): Decision {
  const cat: Category = !s.trip.hero ? 'hero' : forceCat ?? nextCategory(s);
  const count = cat === 'hero' ? 4 : s.decisions < 6 ? 2 : 3;
  const all = candidates(cat, s);
  const fresh = all.filter((w) => !s.trip.recent.includes(w));
  const pool = shuffle(fresh.length >= count ? fresh : all);
  // favour words the child hasn't learned yet, but keep some familiar ones
  pool.sort((a, b) => (s.learned[a] ?? 0) - (s.learned[b] ?? 0) + (Math.random() - 0.5) * 2);
  return { cat, options: shuffle(pool.slice(0, count)) };
}
