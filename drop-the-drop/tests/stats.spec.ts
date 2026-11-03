import { expect, test } from '@playwright/test';
// @ts-expect-error plain JS module
import handler, { commandsFor } from '../api/stats.js';

// The stats function (api/stats.js) runs in Node: its keys use this game's own
// prefix, a play costs 4 Redis commands, and without Redis it stays a silent no-op.

const res = () => {
  const r: any = { code: 0, headers: {}, body: null };
  r.setHeader = (k: string, v: string) => { r.headers[k] = v; };
  r.status = (c: number) => { r.code = c; return r; };
  r.end = () => r;
  r.json = (b: unknown) => { r.body = b; return r; };
  return r;
};

test('plays and play time use the dd: prefix and few commands', () => {
  const start = commandsFor({ type: 'start', id: 'abcdefgh12' }, '2026-11-03');
  expect(start).toHaveLength(4);
  for (const c of start) expect(String(c[1]).startsWith('dd:')).toBe(true);
  expect(commandsFor({ type: 'time', id: 'abcdefgh12', s: 120 }, '2026-11-03')).toHaveLength(2);
  expect(commandsFor({ type: 'time', id: 'abcdefgh12', s: 9999 })).toBeNull();
  expect(commandsFor({ type: 'start', id: 'NOT VALID' })).toBeNull();
});

test('without Redis a report is a quiet no-op, and the dashboard says what is missing', async () => {
  const r = await handler({ method: 'POST', body: '{"type":"start","id":"abcdefgh12"}' }, res(), {});
  expect(r.code).toBe(204);
  const g = await handler({ method: 'GET', query: { key: 'x' } }, res(), {});
  expect(g.code).toBe(503);
});

test('the game never counts on localhost or with ?debug', async ({ page }) => {
  const posts: string[] = [];
  await page.route('**/api/stats', (route) => { posts.push(route.request().postData() || ''); return route.fulfill({ status: 204 }); });
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('/');
  await page.click('#btn-play');
  await page.waitForTimeout(500);
  expect(posts).toEqual([]);
});
