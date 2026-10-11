import { expect, test, type Page } from '@playwright/test';

// Text must never spill out of its box: MONKEY once overflowed a narrow choice
// card on a phone. Words shrink to fit instead (but stay readable).

const SIZES = {
  'small phone': { width: 360, height: 640 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  'phone landscape': { width: 844, height: 390 },
};

/** For each text element, its box and its container's box; returns what spills out. */
async function spills(page: Page, textSel: string, boxSel: string, minFont: number) {
  return page.evaluate(([textSel, boxSel, minFont]) => {
    const out: string[] = [];
    for (const t of document.querySelectorAll<HTMLElement>(textSel as string)) {
      const box = t.closest(boxSel as string)!;
      const a = t.getBoundingClientRect(), b = box.getBoundingClientRect();
      const label = `"${t.textContent}"`;
      if (a.left < b.left - 1 || a.right > b.right + 1 || a.top < b.top - 1 || a.bottom > b.bottom + 1) out.push(`${label} spills out of its box`);
      if (t.scrollWidth > t.clientWidth + 1) out.push(`${label} is wider than its line`);
      const fs = parseFloat(getComputedStyle(t).fontSize);
      if (fs < (minFont as number)) out.push(`${label} is too small (${fs.toFixed(0)}px)`);
    }
    return out;
  }, [textSel, boxSel, minFont] as const);
}

const CHOICES = ['fish,monkey,zebra', 'jellyfish,squirrel,monkey', 'jellyfish,squirrel', 'jellyfish,squirrel,rainbow,glasses'];

for (const [name, viewport] of Object.entries(SIZES)) {
  test(`${name}: words fit their boxes`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const words of CHOICES) {
      await page.goto(`/?debug=choose&words=${words}&hero=dog`);
      await page.waitForTimeout(500);
      const bad = await spills(page, '.choice .word', '.choice', 18);
      const panelFits = await page.evaluate(() => document.querySelector('.panel.choose')!.getBoundingClientRect().bottom <= innerHeight + 1);
      expect(panelFits, `${name}, choice cards ${words}: the panel fits on screen`).toBe(true);
      expect(bad, `${name}, choice cards ${words}: ${bad.join('; ')}`).toEqual([]);
    }
    for (const [word, scene] of [['jellyfish', 'friends=jellyfish'], ['squirrel', 'friends=squirrel'], ['cat', 'friends=cat']]) {
      await page.goto(`/?debug=spot&word=${word}&hero=dog&${scene}`);
      await page.waitForTimeout(700);
      const bad = [...(await spills(page, '.spot-line', '.panel.spot', 20)), ...(await spills(page, '.spot-where', '.panel.spot', 14))];
      expect(bad, `${name}, spot ${word}: ${bad.join('; ')}`).toEqual([]);
      const panelInView = await page.evaluate(() => { const r = document.querySelector('.panel.spot')!.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
      expect(panelInView, `${name}, spot ${word}: the bubble fits the screen`).toBe(true);
    }
  });
}

test('sticker book labels fit their stickers', async ({ page }) => {
  for (const viewport of [SIZES['small phone'], SIZES.tablet]) {
    await page.setViewportSize(viewport);
    await page.goto('/?words=80&hero=dog');
    await page.click('#btn-start', { force: true });
    await page.waitForTimeout(400);
    await page.click('#btn-book', { force: true });
    await page.waitForSelector('.sticker');
    await page.waitForTimeout(300);
    const bad = await spills(page, '.sticker:not(.locked) span', '.sticker', 12);
    expect(bad, bad.join('; ')).toEqual([]);
  }
});
