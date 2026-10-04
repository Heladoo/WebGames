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

test('the bracelet is big: its beads are at least 50 screen pixels wide on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?debug=play&place=beach&beads=round:blue,round:pink,round:green');
  await expect(page.locator('#table g.bead')).toHaveCount(3);
  const w = await page.locator('#table g.bead').nth(1).evaluate((el) => el.getBoundingClientRect().width);
  expect(w).toBeGreaterThan(50);
  // and it still fits on a small phone, without being squeezed by the tray
  await page.setViewportSize({ width: 375, height: 667 });
  const box = await page.locator('#table svg').boundingBox();
  expect(box!.height).toBeGreaterThan(200);
});

test('the finished picture shows the bracelet on a wrist, with detail', async ({ page }) => {
  await page.goto('/?debug=photo&place=beach');
  await page.waitForFunction(() => (window as unknown as { __photo?: boolean }).__photo, null, { timeout: 30000 });
  const stats = await page.evaluate(async () => {
    const img = document.getElementById('photo') as HTMLImageElement;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    // skin-coloured pixels (warm, light) tell us an arm is in the picture
    let skin = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 13) {
      const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
      n++;
      if (r > 200 && g > 140 && g < 215 && b > 110 && b < 190 && r - b > 40 && r - g < 60) skin++;
    }
    return { skinShare: skin / n, w: c.width, h: c.height };
  });
  expect(stats.skinShare).toBeGreaterThan(0.04); // an arm and hand
  expect(stats.skinShare).toBeLessThan(0.5); // but still mostly the place behind it
});
