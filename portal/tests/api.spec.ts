// Unit tests for api/ideas.js against a small in-memory stand-in for Upstash.
import { expect, test } from '@playwright/test';
import handler, { LIMITS as API_LIMITS, PICTURE_IDS as API_PICS, validateIdea } from '../api/ideas.js';
import { PICTURE_IDS } from '../src/pictures';
import { LIMITS } from '../src/rules';

type Val = string | Set<string> | Map<string, string>;

/** Just the Redis commands the function uses, answered like Upstash's /pipeline. */
function fakeRedis() {
  const db = new Map<string, Val>();
  const hash = (k: string) => {
    if (!db.has(k)) db.set(k, new Map());
    return db.get(k) as Map<string, string>;
  };
  const set = (k: string) => {
    if (!db.has(k)) db.set(k, new Set());
    return db.get(k) as Set<string>;
  };
  const run = ([cmd, k, ...a]: string[]): unknown => {
    switch (cmd) {
      case 'INCR': { const n = Number(db.get(k) ?? 0) + 1; db.set(k, String(n)); return n; }
      case 'EXPIRE': return 1;
      case 'HLEN': return hash(k).size;
      case 'HSET': hash(k).set(a[0], a[1]); return 1;
      case 'HGET': return hash(k).get(a[0]) ?? null;
      case 'HDEL': return hash(k).delete(a[0]) ? 1 : 0;
      case 'HEXISTS': return hash(k).has(a[0]) ? 1 : 0;
      case 'HGETALL': return [...hash(k)].flat();
      case 'HINCRBY': { const n = Number(hash(k).get(a[0]) ?? 0) + Number(a[1]); hash(k).set(a[0], String(n)); return n; }
      case 'SADD': { const s = set(k); const had = s.has(a[0]); s.add(a[0]); return had ? 0 : 1; }
      case 'SREM': return set(k).delete(a[0]) ? 1 : 0;
      case 'DEL': return db.delete(k) ? 1 : 0;
      default: throw new Error(`unexpected ${cmd}`);
    }
  };
  const fetchImpl = async (_url: string, init: { body: string }) => {
    const cmds = JSON.parse(init.body) as string[][];
    return { ok: true, json: async () => cmds.map((c) => ({ result: run(c.map(String)) })) };
  };
  return { db, fetchImpl };
}

const ENV = { UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't', STATS_KEY: 'secret' };

async function call(fetchImpl: unknown, req: { method: string; body?: unknown; query?: Record<string, string>; ip?: string }, env: Record<string, string> = ENV) {
  const out: { status: number; body?: any; headers: Record<string, string> } = { status: 0, headers: {} };
  const res = {
    setHeader: (k: string, v: string) => (out.headers[k] = v),
    status(n: number) { out.status = n; return res; },
    json(b: unknown) { out.body = b; return res; },
    end() { return res; },
  };
  await handler({ method: req.method, body: req.body, query: req.query ?? {}, headers: { 'x-forwarded-for': req.ip ?? '1.2.3.4' } }, res, env, fetchImpl);
  return out;
}

const idea = (over: object = {}) => ({ type: 'idea', id: 'anon12345', pics: ['dino', 'space'], text: 'דינוזאור בחלל', names: ['נועה'], ...over });

test('server and page agree on pictures and limits', () => {
  expect(API_PICS).toEqual(PICTURE_IDS);
  expect(API_LIMITS).toEqual(LIMITS);
});

test('validation keeps only safe, short ideas', () => {
  expect(validateIdea(idea())).toEqual({ pics: ['dino', 'space'], text: 'דינוזאור בחלל', names: ['נועה'] });
  expect(validateIdea(idea({ pics: ['unicorn'] }))).toBeNull();
  expect(validateIdea(idea({ pics: ['dog', 'dog'] }))).toBeNull();
  expect(validateIdea(idea({ pics: ['dog', 'sea', 'fly', 'cat'] }))).toBeNull();
  expect(validateIdea(idea({ text: 'א'.repeat(141) }))).toBeNull();
  expect(validateIdea(idea({ names: ['דנה 0501234567'] }))).toBeNull();
  expect(validateIdea(idea({ names: ['a@b.com'] }))).toBeNull();
  expect(validateIdea(idea({ names: ['א', 'ב', 'ג', 'ד', 'ה'] }))).toBeNull();
  expect(validateIdea(idea({ pics: [], text: ' ' }))).toBeNull();
  expect(validateIdea(idea({ text: 5 }))).toBeNull();
  // names: letters with a space or hyphen are fine, blanks are dropped
  expect(validateIdea(idea({ names: ['בת-אל', 'Mary Ann', '  '] }))?.names).toEqual(['בת-אל', 'Mary Ann']);
  // bidi overrides and control characters are stripped
  expect(validateIdea(idea({ text: 'שלום‮olleh\u0007  עולם' }))?.text).toBe('שלוםolleh עולם');
});

test('an idea waits for approval, then shows and collects hearts', async () => {
  const { fetchImpl, db } = fakeRedis();
  expect((await call(fetchImpl, { method: 'POST', body: idea() })).status).toBe(201);

  let pub = await call(fetchImpl, { method: 'GET' });
  expect(pub.body).toEqual({ ideas: [] });
  expect(pub.headers['Cache-Control']).toContain('s-maxage');

  expect((await call(fetchImpl, { method: 'GET', query: { key: 'wrong' } })).status).toBe(401);
  const admin = await call(fetchImpl, { method: 'GET', query: { key: 'secret' } });
  expect(admin.body.pending).toHaveLength(1);
  const id = admin.body.pending[0].id;

  expect((await call(fetchImpl, { method: 'POST', body: { type: 'approve', key: 'nope', idea: id } })).status).toBe(401);
  expect((await call(fetchImpl, { method: 'POST', body: { type: 'approve', key: 'secret', idea: id } })).status).toBe(200);
  pub = await call(fetchImpl, { method: 'GET' });
  expect(pub.body.ideas).toEqual([{ id, pics: ['dino', 'space'], text: 'דינוזאור בחלל', names: ['נועה'], t: expect.any(Number), hearts: 0 }]);

  const heart = (anon: string, on: boolean) => call(fetchImpl, { method: 'POST', body: { type: 'heart', id: anon, idea: id, on } });
  expect((await heart('anon12345', true)).body).toEqual({ changed: true, hearts: 1 });
  expect((await heart('anon12345', true)).body).toEqual({ changed: false });
  expect((await heart('other1234', true)).body).toEqual({ changed: true, hearts: 2 });
  expect((await heart('anon12345', false)).body).toEqual({ changed: true, hearts: 1 });

  // a heart for an idea that isn't on the board leaves nothing behind
  expect((await call(fetchImpl, { method: 'POST', body: { type: 'heart', id: 'anon12345', idea: 'zzzzzzzzzz', on: true } })).status).toBe(404);
  expect((db.get('pt:ideas:h:zzzzzzzzzz') as Set<string> | undefined)?.size ?? 0).toBe(0);

  expect((await call(fetchImpl, { method: 'POST', body: { type: 'remove', key: 'secret', idea: id } })).status).toBe(200);
  expect((await call(fetchImpl, { method: 'GET' })).body).toEqual({ ideas: [] });
  expect(db.has(`pt:ideas:h:${id}`)).toBe(false);
});

test('rejected ideas never show; bad requests are refused', async () => {
  const { fetchImpl } = fakeRedis();
  await call(fetchImpl, { method: 'POST', body: idea() });
  const id = (await call(fetchImpl, { method: 'GET', query: { key: 'secret' } })).body.pending[0].id;
  await call(fetchImpl, { method: 'POST', body: { type: 'reject', key: 'secret', idea: id } });
  const admin = await call(fetchImpl, { method: 'GET', query: { key: 'secret' } });
  expect(admin.body).toEqual({ pending: [], approved: [] });
  expect((await call(fetchImpl, { method: 'POST', body: { type: 'approve', key: 'secret', idea: id } })).status).toBe(404);
  expect((await call(fetchImpl, { method: 'POST', body: idea({ id: 'NOT VALID' }) })).status).toBe(400);
  expect((await call(fetchImpl, { method: 'POST', body: idea({ pics: ['<script>'] }) })).status).toBe(400);
  expect((await call(fetchImpl, { method: 'POST', body: 'not json' })).status).toBe(400);
  expect((await call(fetchImpl, { method: 'DELETE' })).status).toBe(405);
});

test('each network address can send a few ideas a day', async () => {
  const { fetchImpl } = fakeRedis();
  for (let i = 0; i < LIMITS.perDay; i++) expect((await call(fetchImpl, { method: 'POST', body: idea() })).status).toBe(201);
  const over = await call(fetchImpl, { method: 'POST', body: idea() });
  expect(over.status).toBe(429);
  expect(over.body).toEqual({ error: 'too-many' });
  expect((await call(fetchImpl, { method: 'POST', body: idea(), ip: '5.6.7.8' })).status).toBe(201);
});

test('without Redis the board is empty and sending says so', async () => {
  const { fetchImpl } = fakeRedis();
  expect((await call(fetchImpl, { method: 'GET' }, {})).body).toEqual({ ideas: [] });
  const sent = await call(fetchImpl, { method: 'POST', body: idea() }, {});
  expect(sent.status).toBe(503);
  expect(sent.body).toEqual({ error: 'off' });
});
