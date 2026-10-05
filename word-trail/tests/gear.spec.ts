import { expect, test } from '@playwright/test';
import { takeItem } from '../src/gear';
import { newTrip } from '../src/state';
import { distractors } from '../src/findWord';
import { ALL_WORDS } from '../src/content';

// Children felt bad losing things: an item the hero swaps away goes to an
// animal friend who has that spot free.

test('a swapped item goes to the newest animal friend with a free spot', () => {
  const t = { ...newTrip(), hero: 'dog', friends: ['cat', 'bee', 'fox'], worn: { head: 'hat' } };
  const r = takeItem(t, 'crown');
  expect(t.worn.head).toBe('crown');
  expect(r).toEqual({ old: 'hat', to: 'fox' }); // the fox walks closest; the bee can't wear things
  expect(t.gear.fox.worn.head).toBe('hat');
  // the next swapped hat-like item goes to the cat: the fox's head is taken
  takeItem(t, 'cap');
  expect(t.gear.cat.worn.head).toBe('crown');
  // carried things and kites have their own spots
  t.carry = 'ball';
  expect(takeItem(t, 'drum').to).toBe('fox');
  expect(t.gear.fox.carry).toBe('ball');
});

test('nothing is handed down when no friend can take it', () => {
  const t = { ...newTrip(), hero: 'dog', friends: ['bee', 'hen'], worn: { head: 'hat' } };
  expect(takeItem(t, 'cap')).toEqual({ old: 'hat', to: null });
  const u = { ...newTrip(), hero: 'dog', friends: [], carry: null };
  expect(takeItem(u, 'ball')).toEqual({ old: null, to: null });
});

test('find the word offers other words, clearly different at first', () => {
  for (const word of ALL_WORDS) {
    const easy = distractors(word, 0);
    expect(easy.length).toBe(2);
    expect(easy).not.toContain(word);
    for (const w of easy) expect(w[0], `${word}: ${w}`).not.toBe(word[0]);
    const hard = distractors(word, 2);
    expect(hard.length).toBe(3);
    expect(new Set(hard).size).toBe(3);
    expect(hard).not.toContain(word);
  }
});
