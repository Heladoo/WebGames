import { expect, test } from '@playwright/test';
import { ALL_WORDS } from '../src/content';
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
});
