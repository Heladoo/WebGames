import { expect, test, type Page } from '@playwright/test';
import { decodeRecipe, encodeRecipe } from '../src/album';

// No voice in the test browser: the game must work with only the chime.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { value: undefined }));
  page.on('pageerror', (e) => { throw e; });
});

const beads = (page: Page) => page.locator('#table g.bead');

async function openPlace(page: Page, id: string) {
  await page.goto('/');
  await page.click('#btn-start');
  await page.click(`#map-grid [data-place="${id}"]`);
  await expect(page.locator('#workshop')).toBeVisible();
}

test('locked places stay locked, open places open', async ({ page }) => {
  await page.goto('/');
  await page.click('#btn-start');
  await expect(page.locator('#map-grid .place-card')).toHaveCount(6);
  await expect(page.locator('#map-grid [data-place="beach"]')).not.toHaveClass(/locked/);
  await expect(page.locator('#map-grid [data-place="woods"]')).not.toHaveClass(/locked/);
  await expect(page.locator('#map-grid [data-place="ball"]')).toHaveClass(/locked/);
  await page.click('#map-grid [data-place="ball"]');
  await expect(page.locator('#map')).toBeVisible(); // still on the map
});

test('choose a shape and a color, see the word, place the bead', async ({ page }) => {
  await openPlace(page, 'beach');
  await page.click('#tabs [data-shape="flower"]');
  await page.click('#designs [data-design="pink"]');
  await expect(page.locator('#word-text')).toHaveText('pink flower');
  await expect(beads(page)).toHaveCount(0);
  await page.click('#btn-place');
  await expect(beads(page)).toHaveCount(1);
  await page.click('#designs [data-design="blue"]');
  await expect(page.locator('#word-text')).toHaveText('blue flower');
  await page.click('#table .slot-hit[data-slot="5"]'); // any empty slot works
  await expect(beads(page)).toHaveCount(2);
  // saving is debounced a moment, so wait for it
  await expect
    .poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bead-box-save-v1') ?? '{"learned":{}}').learned)))
    .toEqual(expect.arrayContaining(['pink', 'blue', 'flower']));
});

test('a placed bead can be replaced, and an unfinished bracelet is kept', async ({ page }) => {
  await openPlace(page, 'woods');
  await page.click('#designs [data-design="green"]');
  await page.click('#btn-place');
  await page.click('#designs [data-design="red"]');
  await page.click('#table .slot-hit[data-slot="0"]'); // replace the first bead
  await expect(beads(page)).toHaveCount(1);
  await page.click('#btn-place');
  await expect(beads(page)).toHaveCount(2);
  await page.click('#btn-back');
  await page.click('#map-grid [data-place="woods"]');
  await expect(beads(page)).toHaveCount(2);
});

test('finishing a bracelet saves a picture, opens the next place and keeps the old ones', async ({ page }) => {
  await openPlace(page, 'beach');
  const designs = ['blue', 'pink', 'yellow', 'purple', 'green', 'white'] as const;
  for (let i = 0; i < 12; i++) {
    await page.click(`#designs [data-design="${designs[i % designs.length]}"]`);
    await page.click('#btn-place');
  }
  await expect(page.locator('#finish')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#finish-img')).toHaveAttribute('src', /^data:image\/png/);
  await expect(page.locator('#finish-new')).toContainText('Night Ball');
  await page.click('#finish-map');
  await expect(page.locator('#map-grid [data-place="ball"]')).not.toHaveClass(/locked/);
  await expect(page.locator('#map-grid [data-place="beach"]')).toBeVisible(); // earlier places stay playable
  await page.click('#map-album');
  await expect(page.locator('#album-body img')).toHaveCount(1);
  await page.reload();
  await page.waitForTimeout(600);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bead-box-save-v1')!));
  expect(saved.unlocked).toContain('ball');
  expect(saved.finished.beach).toBe(1);
});

test('a shared link shows the bracelet and invites to play', async ({ page }) => {
  const code = encodeRecipe({ place: 'snow', beads: [{ shape: 'snowflake', design: 'white' }, { shape: 'star', design: 'gold' }] });
  expect(decodeRecipe(code)?.place).toBe('snow');
  await page.goto(`/?bracelet=${code}`);
  await expect(page.locator('#gift')).toBeVisible();
  await expect(page.locator('#gift-img')).toHaveAttribute('src', /^data:image\/png/);
  await page.click('#gift-play');
  await expect(page.locator('#title')).toBeVisible();
});
