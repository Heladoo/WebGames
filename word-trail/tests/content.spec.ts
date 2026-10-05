import { expect, test } from '@playwright/test';
import { ALL_WORDS } from '../src/content';
import { LOWER, UPPER } from '../src/glyphs';
import { BADGES, caption } from '../src/rewards';
import { newTrip } from '../src/state';

// Small content checks: every badge medal has a picture (the 50-words medal
// was once blank), and captions use "an" before a vowel ("a owl" once).

test('every badge icon is a word with a picture', () => {
  const missing = BADGES.filter((b) => !ALL_WORDS.includes(b.icon)).map((b) => `${b.id}: ${b.icon}`);
  expect(missing, missing.join(', ')).toEqual([]);
});

test('captions say "an" before a vowel, for things and friends', () => {
  const t = { ...newTrip(), hero: 'dog', place: 'park', friends: ['owl', 'bee'], carry: 'umbrella' };
  const c = caption(t);
  expect(c).toContain('an owl');
  expect(c).toContain('a bee');
  expect(c).not.toMatch(/\ba [aeiou]/);
});

test('captions name the place and the sky', () => {
  const t = { ...newTrip(), hero: 'cat', place: 'sand', sky: 'rainbow' };
  expect(caption(t)).toBe('The cat in the desert under a rainbow');
  expect(caption({ ...t, place: 'snow', sky: 'moon', worn: { head: 'hat' } })).toBe('The cat in the snow under the moon, with a hat');
  expect(caption({ ...t, ride: 'bike' })).toBe('The cat on a bike in the desert under a rainbow');
  expect(caption({ ...t, ride: 'car' })).toBe('The cat in a car in the desert under a rainbow');
});

// Some letters were never practised (no word had J, Q, V, Y or Z).
test('every letter from A to Z is in some word, and can be traced', () => {
  for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
    expect(ALL_WORDS.some((w) => w.includes(ch)), `no word uses ${ch.toUpperCase()}`).toBe(true);
    expect(UPPER[ch.toUpperCase()]?.strokes.length, `no trace strokes for ${ch.toUpperCase()}`).toBeGreaterThan(0);
    expect(LOWER[ch]?.strokes.length, `no trace strokes for ${ch}`).toBeGreaterThan(0);
  }
});
