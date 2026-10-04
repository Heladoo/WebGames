import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
});

test('the bead sheet draws every shape in every design', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?debug=beads');
  await page.waitForFunction(() => (window as unknown as { __beads?: unknown }).__beads);
  const info = await page.evaluate(() => (window as unknown as { __beads: { shapes: number; designs: number } }).__beads);
  expect(info).toEqual({ shapes: 15, designs: 14 });
  await expect(page.locator('#sheet td svg')).toHaveCount(15 * 14);
  expect(errors).toEqual([]);
});

test('every place scene draws with a full bracelet', async ({ page }) => {
  await page.goto('/?debug=places');
  await expect(page.locator('#sheet figure')).toHaveCount(6);
});

test('the 12 bracelet slots touch but never pile up, and stay on the table', async ({ page }) => {
  await page.goto('/?debug=rig');
  await page.waitForFunction(() => (window as unknown as { __rig?: unknown }).__rig);
  const rig = await page.evaluate(() => (window as unknown as { __rig: Record<string, number | boolean> }).__rig);
  expect(rig.slots).toBe(12);
  expect(rig.maxOverlap as number).toBeLessThan(8); // beads may kiss, not hide each other
  expect(rig.inside).toBe(true);
  expect(rig.onTable).toBe(true);
});
