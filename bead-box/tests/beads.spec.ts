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

for (const place of ['beach', 'woods', 'ball', 'city', 'snow', 'garden']) {
  test(`the ${place} scenery paints quickly and is full of detail`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`/?debug=scene&place=${place}&scale=2`);
    await page.waitForFunction(() => (window as unknown as { __scene?: unknown }).__scene, null, { timeout: 30000 });
    const s = await page.evaluate(() => (window as unknown as { __scene: { ms: number; w: number; h: number; colors: number; dominant: number } }).__scene);
    expect(s.w).toBe(800);
    expect(s.h).toBe(1400);
    expect(s.ms).toBeLessThan(4000); // painted once, not every frame
    expect(s.colors).toBeGreaterThan(180); // a flat or blank picture has only a handful of colours (snow is the plainest at about 220)
    expect(s.dominant).toBeLessThan(0.35); // and no single colour fills the picture
    expect(errors).toEqual([]);
  });
}

test('the workshop shows the painted background and table, and the ambient layer', async ({ page }) => {
  await page.goto('/?debug=play&place=woods&beads=round:green,leaf:green');
  await expect(page.locator('#bg')).toHaveAttribute('src', /^blob:/, { timeout: 15000 });
  await expect(page.locator('#table image')).toHaveAttribute('href', /^blob:/, { timeout: 15000 });
  await expect(page.locator('#table g.bead')).toHaveCount(2);
  await expect(page.locator('#ambient svg')).toHaveCount(1);
});

test('the ambient layer is left out when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?debug=play&place=beach');
  await expect(page.locator('#bg')).toHaveAttribute('src', /^blob:/, { timeout: 15000 });
  await expect(page.locator('#ambient svg')).toHaveCount(0);
});
