import { expect, test, type Page } from '@playwright/test';
import type { RigCase } from '../src/rig';
import { checkCase } from './rules';

// Anatomy tests: every hero, alone and with every item and ride, must keep
// its parts in sensible places (see tests/rules.ts for the rules).

let page: Page;
let cases: RigCase[] = [];

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/?debug=rig');
  await page.waitForFunction(() => (window as unknown as { __rig?: unknown }).__rig);
  cases = await page.evaluate(() => (window as unknown as { __rig: RigCase[] }).__rig);
});

test.afterAll(async () => page?.close());

test('every hero and item combination keeps its anatomy', () => {
  expect(cases.length).toBeGreaterThan(100);
  const errors = cases.flatMap(checkCase);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the rules catch a forward-facing face on a turned head', () => {
  // the bug that started these tests: the bigger eye drawn nearer the snout
  const dog = structuredClone(cases.find((c) => c.id === 'dog')!);
  const { eyeNear, eyeFar } = dog.parts;
  dog.parts.eyeNear = { ...eyeFar, x: eyeNear.x, y: eyeNear.y };
  dog.parts.eyeFar = { ...eyeNear, x: eyeFar.x, y: eyeFar.y };
  const errors = checkCase(dog);
  expect(errors.some((e) => e.includes('far eye must be smaller'))).toBe(true);
});

test('the rules catch a hat floating above the head', () => {
  const c = structuredClone(cases.find((x) => x.id === 'cat+hat')!);
  c.items.hat = c.items.hat.map((b) => ({ ...b, y: b.y - 40 }));
  expect(checkCase(c).some((e) => e.includes('rest on top of the head'))).toBe(true);
});

test('scenery tiles repeat without a seam', async () => {
  await page.goto('/?debug=tiles');
  await page.waitForFunction(() => (window as unknown as { __tiles?: unknown }).__tiles, null, { timeout: 30_000 });
  const res = await page.evaluate(() => (window as unknown as { __tiles: { place: string; layer: string; diff: number }[] }).__tiles);
  const bad = res.filter((r) => r.diff > 40).map((r) => `${r.place} ${r.layer}: ${r.diff} mismatched pixels at the seam`);
  expect(bad, bad.join('\n')).toEqual([]);
});

test('every card picture fits inside its frame (nothing is cut off)', async () => {
  await page.goto('/?debug=frames');
  await page.waitForFunction(() => (window as unknown as { __frames?: unknown }).__frames);
  const frames = await page.evaluate(() => (window as unknown as { __frames: { word: string; over: number; box: string; drawn: string }[] }).__frames);
  expect(frames.length).toBeGreaterThan(40);
  const cut = frames.filter((f) => f.over > 1.5).map((f) => `${f.word}: drawing (${f.drawn}) reaches ${f.over} past its frame (${f.box})`);
  expect(cut, cut.join('\n')).toEqual([]);
});

test('the rules catch a part that does not move with its group', () => {
  const fox = structuredClone(cases.find((c) => c.id === 'fox')!);
  fox.detached = ['a shape at (34, 86) sits on the tail tail but doesn\'t move with it'];
  expect(checkCase(fox).length).toBeGreaterThan(0);
});
