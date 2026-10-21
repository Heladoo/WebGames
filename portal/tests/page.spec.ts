// The homepage in a real browser: shelf layout, the ideas board and the idea form.
import { expect, test, type Page } from '@playwright/test';
import { COMING_SOON, GAMES, SITE } from '../src/games';

const SIZES = [
  { name: 'small phone', width: 360, height: 740, perRow: 2, boardOpen: false },
  { name: 'phone', width: 390, height: 844, perRow: 2, boardOpen: false },
  { name: 'tablet portrait', width: 768, height: 1024, perRow: 3, boardOpen: false },
  { name: 'tablet landscape', width: 1024, height: 768, perRow: 3, boardOpen: true },
  { name: 'desktop', width: 1440, height: 900, perRow: 3, boardOpen: true },
];

const IDEAS = [
  { id: 'a1b2c3d4e5', pic: 'dino', text: 'דינוזאור שאופה עוגות ליום הולדת, ואפשר להזמין חברים', name: 'נועה', hearts: 12 },
  { id: 'b1b2c3d4e5', pic: 'robot', text: '<img src=x onerror="window.__xss=1">', name: '', hearts: 2 },
  { id: 'c1b2c3d4e5', pic: 'grow', text: '', name: 'מיה', hearts: 0 },
  { id: 'd1b2c3d4e5', pic: null, text: 'רעיון רביעי', name: '', hearts: 0 },
  { id: 'e1b2c3d4e5', pic: 'cat', text: 'רעיון חמישי', name: '', hearts: 0 },
];

/** Fake /api/ideas; returns the bodies the page POSTed. */
async function fakeApi(page: Page, opts: { ideas?: unknown[]; status?: number; postStatus?: number; postBody?: object } = {}) {
  const posts: any[] = [];
  await page.route('**/api/ideas', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      posts.push(req.postDataJSON());
      return route.fulfill({ status: opts.postStatus ?? 201, json: opts.postBody ?? { ok: true } });
    }
    if (opts.status) return route.fulfill({ status: opts.status, body: '' });
    return route.fulfill({ json: { ideas: opts.ideas ?? IDEAS } });
  });
  return posts;
}

for (const s of SIZES) {
  test(`shelf and board fit a ${s.name}`, async ({ page }) => {
    await page.setViewportSize({ width: s.width, height: s.height });
    await fakeApi(page);
    await page.goto('/');
    const boxes = page.locator('#tiles > .cell');
    await expect(boxes).toHaveCount(GAMES.length + 1 + COMING_SOON);
    // boxes per shelf row
    const tops = await boxes.evaluateAll((els) => els.map((e) => (e as HTMLElement).offsetTop));
    expect(tops.filter((t) => t === tops[0]).length).toBe(s.perRow);
    // every row's plank is rounded at both ends
    expect(await page.locator('.cell.row-start').count()).toBe(Math.ceil(tops.length / s.perRow));
    // nothing sticks out sideways
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // the board is folded on phones and open beside the shelf on wide screens
    expect(await page.locator('#board').evaluate((d) => (d as HTMLDetailsElement).open)).toBe(s.boardOpen);
    // box names stay on one line inside their box
    for (const name of await page.locator('.box-name').all()) {
      const fits = await name.evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().height < 40);
      expect(fits).toBe(true);
    }
  });
}

test('game boxes are links with pictures, and the newest has a badge', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/');
  for (const g of GAMES) {
    const box = page.locator(`a.box[data-game="${g.id}"]`);
    await expect(box).toHaveAttribute('href', g.url);
    await expect(box.locator('.box-name')).toHaveText(g.name);
    await expect(box.locator('.badge')).toHaveCount(g.isNew ? 1 : 0);
    const loaded = await box.locator('img').evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0);
    expect(loaded).toBe(true);
  }
});

test('the page works and is described without JavaScript', async ({ request }) => {
  const html = await (await request.get('/')).text();
  for (const g of GAMES) {
    expect(html).toContain(`href="${g.url}"`);
    expect(html).toContain(g.about); // the tooltip text is in the page
  }
  expect(html).toContain('לגילאי 4 עד 99');
  for (const f of SITE.facts) expect(html).toContain(f);
  expect(html).toContain('משחקים רגועים, מילדים לילדים');
  const ld = JSON.parse(html.split('<script type="application/ld+json">')[1].split('</script>')[0]);
  const list = ld['@graph'].find((x: { '@type': string }) => x['@type'] === 'ItemList');
  expect(list.itemListElement.map((i: { item: { name: string } }) => i.item.name)).toEqual(GAMES.map((g) => g.name));
});

test('under the shelf there is one quiet line and nothing else', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/');
  await expect(page.locator('footer p')).toHaveCount(1);
  await expect(page.locator('footer .facts')).toHaveText('לגילאי 4–99 · חינם · בלי פרסומות · בלי הרשמה · בלי עוגיות · בטוח ורגוע');
  // no game descriptions or counting note are printed on the page
  await expect(page.locator('footer')).not.toContainText('סופרים');
  for (const g of GAMES) expect(await page.locator('footer').innerText()).not.toContain(g.about);
});

test('the logo is the page heading, and games open in a new tab', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/');
  const logo = page.locator('h1 img');
  await expect(logo).toHaveAttribute('alt', 'משחקי דורותי');
  expect(await logo.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await expect(page.locator('.tagline')).toHaveText('משחקים רגועים, מילדים לילדים');
  for (const g of GAMES) {
    const a = page.locator(`a.box[data-game="${g.id}"]`);
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', /noopener/);
  }
  // the logo's background is transparent, so the picture has no visible box on the page
  const alpha = await page.evaluate(() => {
    const img = document.querySelector<HTMLImageElement>('h1 img')!;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return [ctx.getImageData(3, 3, 1, 1).data[3], ctx.getImageData(img.naturalWidth - 4, img.naturalHeight - 4, 1, 1).data[3], ctx.getImageData(img.naturalWidth >> 1, img.naturalHeight >> 1, 1, 1).data[3]];
  });
  expect(alpha).toEqual([0, 0, 255]);
});

test('each game box has an (i) button whose tooltip shows on hover, focus and tap', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await fakeApi(page);
  await page.goto('/');
  const g = GAMES[0];
  const tip = page.locator(`#tip-${g.id}`);
  const info = page.locator(`.cell:has(a[data-game="${g.id}"]) .info`);
  await expect(info).toHaveAttribute('aria-label', `על ${g.name}`);
  await expect(tip).toBeHidden();
  await info.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText(g.about);
  await page.mouse.move(5, 5);
  await expect(tip).toBeHidden();
  await info.focus();
  await expect(tip).toBeVisible();
  await page.locator('h1').click();
  await info.blur();
  await expect(tip).toBeHidden();
  // a tap opens it, another tap on the page or Escape closes it, and opening one closes the others
  await info.click();
  await page.mouse.move(5, 5);
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
  await info.click();
  await page.locator(`.cell:has(a[data-game="${GAMES[1].id}"]) .info`).click();
  await expect(tip).toBeHidden();
  await expect(page.locator(`#tip-${GAMES[1].id}`)).toBeVisible();
  // tapping the (i) doesn't open the game, and it is a big enough target
  expect(page.url()).toBe('http://localhost:5199/');
  const r = (await info.boundingBox())!;
  expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44);
  // the idea and coming-soon boxes have none
  await expect(page.locator('.info')).toHaveCount(GAMES.length);
});

test('ideas show as notes; player text stays text', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await fakeApi(page);
  await page.goto('/');
  const notes = page.locator('#ideas .note');
  await expect(notes).toHaveCount(IDEAS.length);
  await expect(page.locator('#ideas .note:visible')).toHaveCount(4);
  await expect(page.locator('#board-count')).toHaveText(String(IDEAS.length));
  await expect(notes.nth(0).locator('.note-by')).toHaveText('מאת נועה');
  await expect(notes.nth(0).locator('.note-text')).toHaveText(IDEAS[0].text);
  await expect(notes.nth(1).locator('.note-by')).toHaveText('');
  await expect(notes.nth(2).locator('.note-by')).toHaveText('מאת מיה');
  await expect(notes.nth(1).locator('.note-text')).toHaveText(IDEAS[1].text);
  expect(await notes.nth(1).locator('img').count()).toBe(0);
  expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
  await page.click('#more');
  await expect(page.locator('#ideas .note:visible')).toHaveCount(IDEAS.length);
  await expect(page.locator('#more')).toBeHidden();
});

test('a heart counts once per browser and can be taken back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const posts = await fakeApi(page, { postStatus: 200, postBody: { changed: true } });
  await page.goto('/');
  const heart = page.locator('#ideas .note').first().locator('.heart');
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect(heart).toContainText('13');
  await page.reload();
  await expect(page.locator('#ideas .note').first().locator('.heart')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#ideas .note').first().locator('.heart').click();
  await expect(page.locator('#ideas .note').first().locator('.heart')).toHaveAttribute('aria-pressed', 'false');
  expect(posts.map((p) => [p.type, p.idea, p.on])).toEqual([['heart', 'a1b2c3d4e5', true], ['heart', 'a1b2c3d4e5', false]]);
});

test('an empty or unreachable board says so', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await fakeApi(page, { ideas: [] });
  await page.goto('/');
  await expect(page.locator('.board-empty')).toContainText('עוד אין כאן רעיונות');
  await page.unrouteAll();
  await fakeApi(page, { status: 502 });
  await page.reload();
  await expect(page.locator('.board-empty')).toContainText('לא נטען');
});

test('sending an idea: one icon, a description and a sender name', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const posts = await fakeApi(page);
  await page.goto('/');
  await page.click('.idea-box');
  const dialog = page.locator('#idea-dialog');
  await expect(dialog).toBeVisible();
  const send = page.locator('#idea-send');
  await expect(send).toBeDisabled();
  await expect(page.locator('label[for="idea-text"]')).toHaveText('תיאור המשחק');
  await expect(page.locator('#idea-text')).toHaveAttribute('placeholder', /כמה שיותר/);
  await expect(page.locator('label[for="idea-name"]')).toContainText('שם השולח');
  // there is a single name box and no "add another name"
  await expect(page.locator('input.name')).toHaveCount(1);
  await expect(page.getByText('עוד שם')).toHaveCount(0);

  // only one icon at a time; tapping again unpicks it
  await page.click('[data-pic="dog"]');
  await page.click('[data-pic="cat"]');
  await expect(page.locator('.pic[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('[data-pic="cat"]')).toHaveAttribute('aria-pressed', 'true');
  await page.click('[data-pic="cat"]');
  await expect(page.locator('.pic[aria-pressed="true"]')).toHaveCount(0);
  await expect(send).toBeDisabled();
  await page.click('[data-pic="snow"]');
  await expect(send).toBeEnabled();

  const long = 'חתול שמחליק על הקרח '.repeat(20).trim();
  await page.fill('#idea-text', long);
  await page.fill('#idea-name', 'נועה כהן, בת 7');
  await send.click();
  await expect(page.locator('#idea-done')).toBeVisible();
  expect(posts).toEqual([{ type: 'idea', id: expect.stringMatching(/^[a-z0-9]{8,32}$/), pic: 'snow', text: long, name: 'נועה כהן, בת 7' }]);

  // closing and opening again starts a fresh form
  await page.locator('#idea-done [data-close]').click();
  await expect(dialog).toBeHidden();
  await page.click('.idea-box');
  await expect(page.locator('#idea-step')).toBeVisible();
  await expect(page.locator('.pic[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('#idea-name')).toHaveValue('');
});

test('a description alone is enough, and the name can stay empty', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const posts = await fakeApi(page);
  await page.goto('/');
  await page.click('.idea-box');
  await page.fill('#idea-text', 'משחק על חלל');
  await page.click('#idea-send');
  await expect(page.locator('#idea-done')).toBeVisible();
  expect(posts[0]).toMatchObject({ pic: null, text: 'משחק על חלל', name: '' });
});

test('a refused idea explains why and keeps what was written', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fakeApi(page, { postStatus: 429, postBody: { error: 'too-many' } });
  await page.goto('/');
  await page.click('.idea-box');
  await page.fill('#idea-text', 'עוד רעיון');
  await page.click('#idea-send');
  await expect(page.locator('#idea-error')).toHaveText('שלחתם הרבה רעיונות היום. אפשר לשלוח עוד מחר!');
  await expect(page.locator('#idea-text')).toHaveValue('עוד רעיון');
  await expect(page.locator('#idea-send')).toBeEnabled();
});

test('the idea form fits a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await fakeApi(page);
  await page.goto('/');
  await page.click('.idea-box');
  const box = await page.locator('#idea-dialog').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  // every picture button is big enough to tap
  for (const b of await page.locator('.pic').all()) {
    const r = await b.boundingBox();
    expect(Math.min(r!.width, r!.height)).toBeGreaterThanOrEqual(44);
  }
});
