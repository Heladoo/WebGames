import { expect, test } from '@playwright/test';
import { DECK, nextDecision } from '../src/director';
import { WEAR_SLOT, AIR } from '../src/art/wearables';
import { defaults } from '../src/state';
import type { Category } from '../src/content';

// The choices must stay varied over a long play: every kind of question
// comes up regularly (a new friend is never far away) and never twice in a row.

test('every kind of choice comes up evenly over a long trip', () => {
  const s = defaults();
  s.trip.hero = 'dog';
  for (const w of ['dog', 'cat', 'hat', 'sun', 'bee', 'park', 'cap', 'bow', 'bug', 'car', 'bus', 'hen', 'fox', 'owl', 'pig', 'rain', 'moon', 'sand', 'sea', 'hill', 'pond', 'farm', 'snow', 'kite', 'ball'])
    s.learned[w] = 1;
  const seen: Category[] = [];
  for (let i = 0; i < 360; i++) {
    const d = nextDecision(s);
    expect(d.options.length).toBeGreaterThanOrEqual(2);
    const w = d.options[0];
    // apply the choice the way the game does
    const t = s.trip;
    if (d.cat === 'wear') t.worn[WEAR_SLOT[w]] = w;
    if (d.cat === 'place') { t.place = w; t.ride = null; }
    if (d.cat === 'sky') t.sky = w;
    if (d.cat === 'ride') t.ride = w;
    if (d.cat === 'carry') { if (AIR.includes(w)) t.air = w; else t.carry = w; }
    if (d.cat === 'friend') { t.friends.push(w); if (t.friends.length > 3) t.friends.shift(); }
    t.lastCats = [...t.lastCats, d.cat].slice(-6);
    t.recent = [...t.recent, ...d.options].slice(-14);
    s.decisions++;
    seen.push(d.cat);
  }
  const share = (c: Category) => seen.filter((x) => x === c).length / seen.length;
  for (const c of new Set(DECK)) {
    const expected = DECK.filter((x) => x === c).length / DECK.length;
    expect(Math.abs(share(c) - expected), `${c} came up ${(share(c) * 100).toFixed(0)}% of the time`).toBeLessThan(0.06);
  }
  for (let i = 1; i < seen.length; i++) expect(seen[i], `same kind twice in a row at ${i}`).not.toBe(seen[i - 1]);
  let gap = 0, worst = 0;
  for (const c of seen) { gap = c === 'friend' ? 0 : gap + 1; worst = Math.max(worst, gap); }
  expect(worst, 'longest stretch without a friend question').toBeLessThanOrEqual(DECK.length * 2);
});

test('a boat is only offered by the sea', () => {
  const s = defaults();
  s.trip.hero = 'cat';
  for (let i = 0; i < 60; i++) {
    s.trip.place = i % 2 ? 'sea' : 'park';
    const d = nextDecision(s, 'ride');
    if (s.trip.place !== 'sea') expect(d.options).not.toContain('boat');
  }
});
