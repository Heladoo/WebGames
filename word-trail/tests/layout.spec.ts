import { expect, test, type Page } from '@playwright/test';
import { ALL_WORDS } from '../src/content';

// The learning panel must fit every word on small phones and tablets: the big
// word stays on one line, slots and bubbles stay inside the panel, and on wide
// screens the panel leaves the top buttons uncovered. (It may cover the hero:
// the owner prefers big tracing letters.)
// (A 7-letter RAINBOW once wrapped as "RAINB / OW" on a phone.)

const SIZES = {
  'small phone': { width: 360, height: 640 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  'phone landscape': { width: 844, height: 390 },
};

const longest = [...ALL_WORDS].sort((a, b) => b.length - a.length).slice(0, 4);
const words = [...longest, 'cat'];

type Box = { x: number; y: number; w: number; h: number };
const inside = (a: Box, b: Box, slack = 1) =>
  a.x >= b.x - slack && a.y >= b.y - slack && a.x + a.w <= b.x + b.w + slack && a.y + a.h <= b.y + b.h + slack;
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (e: Element | null) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const word = document.querySelector('.big-word') as HTMLElement;
    return {
      view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
      panel: box(document.querySelector('.panel'))!,
      word: box(word)!,
      wordLines: word.getBoundingClientRect().height / parseFloat(getComputedStyle(word).fontSize),
      wordOverflow: word.scrollWidth - word.clientWidth,
      parts: [...document.querySelectorAll('.slot, .bubble, .trace-svg, .big-pic, .word-card')].map((e) => ({ cls: e.getAttribute('class'), ...box(e)! })),
      topbar: box(document.querySelector('#topbar')),
      logo: box(document.querySelector('#corner-logo')),
      cardFont: Math.min(99, ...[...document.querySelectorAll<HTMLElement>('.word-card')].map((c) => parseFloat(getComputedStyle(c).fontSize))),
      cardOverflow: Math.max(0, ...[...document.querySelectorAll<HTMLElement>('.word-card')].map((c) => c.scrollWidth - c.clientWidth)),
    };
  });
}

for (const [name, viewport] of Object.entries(SIZES)) {
  for (const mode of ['tap', 'trace', 'find'] as const) {
    test(`${name}: ${mode} panel fits ${words.join(', ')}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      // find the word shows 3 cards at level 0 and 4 at level 3
      for (const [word, level] of words.flatMap((w) => (mode === 'find' ? [[w, 0], [w, 3]] : [[w, 3]]) as [string, number][])) {
        await page.goto(`/?debug=learn&word=${word}&mode=${mode}&level=${level}&hero=dog`);
        await page.waitForSelector('.panel.learn');
        await page.waitForTimeout(500); // the panel's entrance animation
        const m = await measure(page);
        const what = `${name}, ${mode} (level ${level}), ${word.toUpperCase()}`;
        expect(m.wordLines, `${what}: the big word must stay on one line`).toBeLessThan(1.6);
        expect(m.wordOverflow, `${what}: the big word must not overflow`).toBeLessThanOrEqual(1);
        expect(inside(m.word, m.panel), `${what}: the big word must be inside the panel`).toBe(true);
        for (const p of m.parts) expect(inside(p, m.panel), `${what}: .${p.cls} must be inside the panel`).toBe(true);
        expect(m.panel.y + m.panel.h, `${what}: the panel must fit on screen`).toBeLessThanOrEqual(m.view.h + 1);
        expect(overlaps(m.panel, m.topbar!), `${what}: the panel must not cover the top buttons`).toBe(false);
        expect(overlaps(m.panel, m.logo!), `${what}: the panel must not cover the game logo`).toBe(false);
        expect(overlaps(m.topbar!, m.logo!), `${what}: the top buttons must not cover the game logo`).toBe(false);
        expect(m.cardOverflow, `${what}: every word must fit its card`).toBeLessThanOrEqual(1);
        // long words in two narrow columns once shrank to 10-17px on phones
        expect(m.cardFont, `${what}: word cards must stay readable`).toBeGreaterThanOrEqual(30);
      }
    });
  }
}

// Tracing a long word on a phone made letters too small to trace: a word whose
// trace letters would be under 75px tall is tapped instead.
test('long words are tapped, not traced, when the trace letters would be too small', async ({ page }) => {
  const cases: [string, { width: number; height: number }, string, 'trace' | 'tap'][] = [
    ['phone', SIZES.phone, 'cat', 'trace'],
    ['phone', SIZES.phone, 'frog', 'trace'],
    ['phone', SIZES.phone, 'crown', 'tap'],
    ['phone', SIZES.phone, 'rainbow', 'tap'],
    ['tablet', SIZES.tablet, 'rainbow', 'trace'],
  ];
  for (const [name, viewport, word, want] of cases) {
    await page.setViewportSize(viewport);
    await page.goto(`/?debug=learn&word=${word}&mode=trace`);
    await page.waitForSelector('.panel.learn .activity');
    const got = await page.evaluate(() => (document.querySelector('.trace-svg') ? 'trace' : document.querySelector('.bubble') ? 'tap' : 'none'));
    expect(got, `${name}, ${word.toUpperCase()}`).toBe(want);
  }
});
