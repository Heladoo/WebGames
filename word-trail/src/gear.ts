import { HEROES } from './art/characters';
import { AIR, WEAR_SLOT, type Slot } from './art/wearables';
import type { Trip } from './state';

// Hand-me-downs: when the hero swaps an item for a new one, the old one isn't
// lost. It goes to the newest friend with room for it, so children don't feel
// they lost something. Every friend can take things:
// - friends drawn like the heroes (dog, cat, fox, ...) wear them like the hero;
// - small friends (bee, squirrel, monkey, ...) put a hat-like item on their
//   head and hold one other thing (shown as a small picture beside them).

export interface Gear {
  worn: Partial<Record<Slot, string>>;
  carry: string | null;
  air: string | null;
  hold?: string | null; // small friends: the one thing they hold
}

export const emptyGear = (): Gear => ({ worn: {}, carry: null, air: null, hold: null });

/** Friends that wear things the way the hero does: those drawn like heroes. */
export const canWear = (friend: string) => (HEROES as string[]).includes(friend);

/** Where an item goes: a clothes slot, the back, or the string. */
const spotOf = (item: string): { slot?: Slot; air?: boolean } => (WEAR_SLOT[item] ? { slot: WEAR_SLOT[item] } : AIR.includes(item) ? { air: true } : {});

const isFree = (f: string, g: Gear, item: string) => {
  const s = spotOf(item);
  if (!canWear(f)) return s.slot === 'head' ? !g.worn.head : !g.hold;
  return s.slot ? !g.worn[s.slot] : s.air ? !g.air : !g.carry;
};

/**
 * Gives an item the hero no longer has to the nearest friend (the newest)
 * who can wear it and has that spot free. Returns that friend, or null when
 * nobody can take it.
 */
export function handDown(t: Trip, item: string): string | null {
  for (const f of t.friends.slice().reverse()) {
    const g = (t.gear[f] ??= emptyGear());
    if (!isFree(f, g, item)) continue;
    const s = spotOf(item);
    if (!canWear(f) && s.slot !== 'head') g.hold = item;
    else if (s.slot) g.worn[s.slot] = item;
    else if (s.air) g.air = item;
    else g.carry = item;
    return f;
  }
  return null;
}

/** Puts on a new item, handing the one it replaces down to a friend. */
export function takeItem(t: Trip, item: string): { old: string | null; to: string | null } {
  const s = spotOf(item);
  let old: string | null;
  if (s.slot) {
    old = t.worn[s.slot] ?? null;
    t.worn[s.slot] = item;
  } else if (s.air) {
    old = t.air;
    t.air = item;
  } else {
    old = t.carry;
    t.carry = item;
  }
  return { old, to: old && old !== item ? handDown(t, old) : null };
}
