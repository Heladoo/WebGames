import { HEROES } from './art/characters';
import { AIR, WEAR_SLOT, type Slot } from './art/wearables';
import type { Trip } from './state';

// Hand-me-downs: when the hero swaps an item for a new one, the old one isn't
// lost. It goes to a friend who can wear it (an animal friend, like the
// heroes) and has that spot free, so children don't feel they lost something.

export interface Gear {
  worn: Partial<Record<Slot, string>>;
  carry: string | null;
  air: string | null;
}

export const emptyGear = (): Gear => ({ worn: {}, carry: null, air: null });

/** Friends that can wear things: the animal friends that are drawn like heroes. */
export const canWear = (friend: string) => (HEROES as string[]).includes(friend);

/** Where an item goes: a clothes slot, the back, or the string. */
const spotOf = (item: string): { slot?: Slot; air?: boolean } => (WEAR_SLOT[item] ? { slot: WEAR_SLOT[item] } : AIR.includes(item) ? { air: true } : {});

const isFree = (g: Gear, item: string) => {
  const s = spotOf(item);
  return s.slot ? !g.worn[s.slot] : s.air ? !g.air : !g.carry;
};

/**
 * Gives an item the hero no longer has to the nearest friend (the newest)
 * who can wear it and has that spot free. Returns that friend, or null when
 * nobody can take it.
 */
export function handDown(t: Trip, item: string): string | null {
  for (const f of t.friends.slice().reverse()) {
    if (!canWear(f)) continue;
    const g = (t.gear[f] ??= emptyGear());
    if (!isFree(g, item)) continue;
    const s = spotOf(item);
    if (s.slot) g.worn[s.slot] = item;
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
