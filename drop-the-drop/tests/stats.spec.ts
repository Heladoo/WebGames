import { expect, test } from '@playwright/test';
// @ts-expect-error plain JS module
import handler, { commandsFor, summary } from '../api/stats.js';

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
  // which levels: one hash field per level, 1 command each
  expect(commandsFor({ type: 'level', id: 'abcdefgh12', level: 'l7' })).toEqual([['HINCRBY', 'dd:levels', 'l7', 1]]);
  expect(commandsFor({ type: 'won', id: 'abcdefgh12', level: 'l12' })).toEqual([['HINCRBY', 'dd:won', 'l12', 1]]);
  expect(commandsFor({ type: 'level', id: 'abcdefgh12', level: '<b>hi</b>' })).toBeNull();
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

test('the dashboard summary lists levels started and finished', async () => {
  const fake = async (_url: string, init: { body: string }) => {
    const cmds = JSON.parse(init.body) as string[][];
    const out = cmds.map((c) => {
      if (c[0] === 'HGETALL' && c[1] === 'dd:levels') return { result: ['l2', '5', 'l1', '9'] };
      if (c[0] === 'HGETALL' && c[1] === 'dd:won') return { result: ['l1', '7'] };
      return { result: null };
    });
    return { ok: true, json: async () => out };
  };
  const s = await summary(fake, new Date('2026-11-04T10:00:00Z'), { UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' });
  expect(s.levels).toEqual([{ level: 'l1', started: 9, won: 7 }, { level: 'l2', started: 5, won: 0 }]);
});
