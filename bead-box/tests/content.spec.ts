import { expect, test } from '@playwright/test';
import { ALL_WORDS, DESIGN_WORD, PLACES, PLACE_IDS, SHAPE_WORD, SLOTS, START_OPEN, designsOf, phrase, wordsOf } from '../src/content';
import { decodeRecipe, encodeRecipe } from '../src/album';

test('every place offers a round tab first, 8 colors and 4 patterns (a full two-row grid)', () => {
  for (const p of PLACES) {
    expect(p.shapes[0], p.id).toBe('round');
    expect(p.shapes.length, p.id).toBe(5);
    expect(new Set(p.shapes).size, p.id).toBe(p.shapes.length);
    expect(new Set(p.colors).size, p.id).toBe(8);
    expect(designsOf(p).length, p.id).toBe(12);
    for (const s of p.shapes) expect(SHAPE_WORD[s], `${p.id} ${s}`).toBeTruthy();
    for (const d of designsOf(p)) expect(DESIGN_WORD[d], `${p.id} ${d}`).toBeTruthy();
  }
});

test('every shape is used by at least one place and every word is learnable', () => {
  const used = new Set(PLACES.flatMap((p) => p.shapes));
  for (const s of Object.keys(SHAPE_WORD)) expect(used.has(s as never), s).toBe(true);
  for (const p of PLACES) for (const s of p.shapes) for (const d of designsOf(p)) {
    for (const w of wordsOf({ shape: s, design: d })) expect(ALL_WORDS, `${s} ${d}`).toContain(w);
    expect(phrase({ shape: s, design: d }).length).toBeGreaterThan(3);
  }
});

test('two places are open at the start and the rest unlock in order', () => {
  expect(START_OPEN).toHaveLength(2);
  for (const p of START_OPEN) expect(PLACE_IDS).toContain(p);
  expect(PLACE_IDS.length - START_OPEN.length).toBeGreaterThanOrEqual(3);
  expect(PLACE_IDS.slice(0, 2)).toEqual(START_OPEN);
});

test('a bracelet recipe survives a round trip', () => {
  const beads = Array.from({ length: SLOTS }, (_, i) => ({ shape: PLACES[1].shapes[i % 5], design: designsOf(PLACES[1])[i % 12] }));
  const r = decodeRecipe(encodeRecipe({ place: 'woods', beads }));
  expect(r).toEqual({ place: 'woods', beads });
});

test('links from strangers are rejected or cleaned', () => {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  expect(decodeRecipe('')).toBeNull();
  expect(decodeRecipe('a'.repeat(2000))).toBeNull();
  expect(decodeRecipe('not base64!')).toBeNull();
  expect(decodeRecipe('bm90IGpzb24')).toBeNull(); // "not json"
  expect(decodeRecipe(enc({ p: 'mars', b: [['round', 'blue']] }))).toBeNull();
  expect(decodeRecipe(enc({ p: 'beach', b: [] }))).toBeNull();
  // unknown beads are dropped, extra beads beyond the slots are ignored, and no text is kept
  const r = decodeRecipe(enc({ p: 'beach', caption: '<img src=x>', b: [['round', 'blue'], ['dragon', 'blue'], ['star', 'lava'], ...Array(30).fill(['star', 'pink'])] }));
  expect(r).not.toBeNull();
  expect(r!.beads.length).toBeLessThanOrEqual(SLOTS);
  expect(r!.beads.every((b) => b.shape === 'round' || b.shape === 'star')).toBe(true);
  expect(JSON.stringify(r)).not.toContain('img');
});
