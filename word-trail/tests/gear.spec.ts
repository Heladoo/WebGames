import { expect, test } from '@playwright/test';
import { takeItem } from '../src/gear';
import { newTrip } from '../src/state';
import { distractors } from '../src/findWord';
import { ALL_WORDS } from '../src/content';

// Children felt bad losing things: an item the hero swaps away goes to an
// animal friend who has that spot free.

test('a swapped item goes to the newest friend with room for it', () => {
  const t = { ...newTrip(), hero: 'dog', friends: ['cat', 'bee', 'fox'], worn: { head: 'hat' } };
  const r = takeItem(t, 'crown');
  expect(t.worn.head).toBe('crown');
  expect(r).toEqual({ old: 'hat', to: 'fox' }); // the fox walks closest
  expect(t.gear.fox.worn.head).toBe('hat');
  // the fox's head is taken, so the next hat-like item goes on the bee's head
  expect(takeItem(t, 'cap').to).toBe('bee');
  expect(t.gear.bee.worn.head).toBe('crown');
  // carried things have their own spot on friends drawn like heroes
  t.carry = 'ball';
  expect(takeItem(t, 'drum').to).toBe('fox');
  expect(t.gear.fox.carry).toBe('ball');
});

// The owner saw shoes vanish when the hero put on boots while a squirrel and a
// monkey walked along: small friends could not take anything then.
test('small friends hold one swapped thing each (shoes swapped for boots)', () => {
  const t = { ...newTrip(), hero: 'dog', friends: ['squirrel', 'monkey'], worn: { feet: 'shoes' } };
  expect(takeItem(t, 'boots')).toEqual({ old: 'shoes', to: 'monkey' });
  expect(t.gear.monkey.hold).toBe('shoes');
  expect(t.gear.monkey.worn.feet).toBeUndefined();
  // the monkey's hands are full: the next thing goes to the squirrel
  t.worn.neck = 'scarf';
  expect(takeItem(t, 'tie').to).toBe('squirrel');
  expect(t.gear.squirrel.hold).toBe('scarf');
  // both hold something now, and nobody has room for another pair of shoes
  expect(takeItem(t, 'socks')).toEqual({ old: 'boots', to: null });
});

test('nothing is handed down without friends', () => {
  const u = { ...newTrip(), hero: 'dog', friends: [], worn: { head: 'hat' } };
  expect(takeItem(u, 'cap')).toEqual({ old: 'hat', to: null });
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
