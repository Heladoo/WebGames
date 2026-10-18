// Game ideas sent by players (Vercel serverless function).
//
// Players pick one picture, describe the game in a few sentences and may sign
// with a first name. Nothing is shown to anyone until the owner approves it on
// the owner's stats page, /stats.html (it asks for STATS_KEY). Approved ideas can
// get hearts from other players, one per browser.
//
// Storage: the same Upstash Redis as the stats (see api/stats.js), keys
// prefixed "pt:". Only what the player typed is stored, plus a short-lived
// hashed counter per network address that limits how many ideas can be sent
// per day.
//
//   GET                              → approved ideas with hearts (public, cached briefly)
//   GET  ?key=STATS_KEY              → pending + approved ideas (owner)
//   POST {type:"idea", id, pic, text, name}
//   POST {type:"heart", id, idea, on}
//   POST {type:"approve"|"reject"|"remove", key, idea}   (owner)

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { redis } from './stats.js';

const P = 'pt:';
const NEW = `${P}ideas:new`;
const OK = `${P}ideas:ok`;
const HEARTS = `${P}ideas:hearts`;
const heartSet = (idea) => `${P}ideas:h:${idea}`;

// Must match PICTURE_IDS in src/pictures.ts (a test checks it).
export const PICTURE_IDS = [
  'dog', 'cat', 'dino', 'robot', 'fish', 'bird',
  'sea', 'forest', 'space', 'city', 'farm', 'snow',
  'build', 'cook', 'drive', 'fly', 'grow', 'music',
];

// Must match LIMITS in src/rules.ts (a test checks it).
export const LIMITS = { text: 500, name: 30, perDay: 5, queue: 300, shown: 60 };

const ANON_RE = /^[a-z0-9]{8,32}$/;
const IDEA_RE = /^[a-z0-9]{10}$/;
// control characters and bidi overrides (which can make text read backwards)
const STRIP_RE = /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;

function creds(env) {
  return {
    url: (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '').replace(/\/+$/, ''),
    token: env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '',
  };
}

function sameKey(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === 'string') {
    if (body.length > 4096) return null;
    try { return JSON.parse(body); } catch { return null; }
  }
  return typeof body === 'object' ? body : null;
}

export function clean(s) {
  return typeof s === 'string' ? s.replace(STRIP_RE, '').replace(/\s+/g, ' ').trim() : '';
}

/** The idea as it may be stored, or null when anything about it is off. */
export function validateIdea(msg) {
  if (!msg || typeof msg !== 'object') return null;
  const pic = msg.pic ?? null;
  if (pic !== null && !(typeof pic === 'string' && PICTURE_IDS.includes(pic))) return null;
  if (msg.text != null && typeof msg.text !== 'string') return null;
  const text = clean(msg.text);
  if (text.length > LIMITS.text) return null;
  if (msg.name != null && typeof msg.name !== 'string') return null;
  const name = clean(msg.name);
  if (name.length > LIMITS.name) return null;
  if (pic === null && text.length < 2) return null;
  return { pic, text, name };
}

const newId = () => Array.from(randomBytes(10), (b) => (b % 36).toString(36)).join('');
const day = (d = new Date()) => d.toISOString().slice(0, 10);

/** A per-day, hashed stand-in for the sender's network address (never stored in the clear). */
export function senderKey(req, env, today = day()) {
  const h = req.headers || {};
  const ip = String(h['x-forwarded-for'] || h['x-real-ip'] || '').split(',')[0].trim() || 'unknown';
  return createHash('sha256').update(`${env.STATS_KEY || 'dorothy'}|${today}|${ip}`).digest('hex').slice(0, 20);
}

function pairs(flat) {
  const out = new Map();
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) out.set(flat[i], flat[i + 1]);
  return out;
}

function parseStored(id, json) {
  if (!IDEA_RE.test(id)) return null;
  try {
    const v = JSON.parse(json);
    const idea = validateIdea(v);
    return idea ? { id, ...idea, t: Number(v.t) || 0 } : null;
  } catch {
    return null;
  }
}

export async function listIdeas(fetchImpl, env, withPending = false) {
  const cmds = [['HGETALL', OK], ['HGETALL', HEARTS]];
  if (withPending) cmds.push(['HGETALL', NEW]);
  const res = await redis(cmds, fetchImpl, env);
  const hearts = pairs(res[1]);
  const approved = [];
  for (const [id, json] of pairs(res[0])) {
    const idea = parseStored(id, json);
    if (idea) approved.push({ ...idea, hearts: Math.max(0, Number(hearts.get(id)) || 0) });
  }
  approved.sort((a, b) => b.hearts - a.hearts || b.t - a.t);
  if (!withPending) return { ideas: approved.slice(0, LIMITS.shown) };
  const pending = [];
  for (const [id, json] of pairs(res[2])) {
    const idea = parseStored(id, json);
    if (idea) pending.push(idea);
  }
  pending.sort((a, b) => a.t - b.t);
  return { pending, approved };
}

async function submit(msg, req, env, fetchImpl, now) {
  if (!ANON_RE.test(String(msg.id ?? ''))) return [400];
  const idea = validateIdea(msg);
  if (!idea) return [400];
  const rl = `${P}ideas:rl:${senderKey(req, env, day(now))}`;
  const [count, , queued] = await redis([['INCR', rl], ['EXPIRE', rl, 86400], ['HLEN', NEW]], fetchImpl, env);
  if (Number(count) > LIMITS.perDay) return [429, { error: 'too-many' }];
  if (Number(queued) >= LIMITS.queue) return [503, { error: 'full' }];
  await redis([['HSET', NEW, newId(), JSON.stringify({ ...idea, t: now.getTime() })]], fetchImpl, env);
  return [201, { ok: true }];
}

async function heart(msg, env, fetchImpl) {
  const anon = String(msg.id ?? '');
  const idea = String(msg.idea ?? '');
  if (!ANON_RE.test(anon) || !IDEA_RE.test(idea) || typeof msg.on !== 'boolean') return [400];
  const [exists, changed] = await redis([['HEXISTS', OK, idea], [msg.on ? 'SADD' : 'SREM', heartSet(idea), anon]], fetchImpl, env);
  if (Number(exists) !== 1) {
    if (msg.on && Number(changed) === 1) await redis([['SREM', heartSet(idea), anon]], fetchImpl, env);
    return [404];
  }
  if (Number(changed) !== 1) return [200, { changed: false }];
  const [n] = await redis([['HINCRBY', HEARTS, idea, msg.on ? 1 : -1]], fetchImpl, env);
  return [200, { changed: true, hearts: Math.max(0, Number(n) || 0) }];
}

async function moderate(msg, env, fetchImpl) {
  const idea = String(msg.idea ?? '');
  if (!IDEA_RE.test(idea)) return [400];
  if (msg.type === 'approve') {
    const [json] = await redis([['HGET', NEW, idea]], fetchImpl, env);
    if (!json) return [404];
    await redis([['HSET', OK, idea, json], ['HDEL', NEW, idea]], fetchImpl, env);
    return [200, { ok: true }];
  }
  if (msg.type === 'reject') {
    await redis([['HDEL', NEW, idea]], fetchImpl, env);
    return [200, { ok: true }];
  }
  await redis([['HDEL', OK, idea], ['HDEL', HEARTS, idea], ['DEL', heartSet(idea)]], fetchImpl, env);
  return [200, { ok: true }];
}

export default async function handler(req, res, env = process.env, fetchImpl = fetch, now = new Date()) {
  const { url, token } = creds(env);
  const connected = Boolean(url && token);
  const send = (status, body) => (body ? res.status(status).json(body) : res.status(status).end());
  try {
    if (req.method === 'GET') {
      const key = req.query?.key;
      if (key != null) {
        res.setHeader('Cache-Control', 'no-store');
        if (!env.STATS_KEY) return send(503, { error: 'STATS_KEY is not set in Vercel yet.' });
        if (!sameKey(key, env.STATS_KEY)) return send(401, { error: 'That key does not match STATS_KEY.' });
        if (!connected) return send(503, { error: 'Redis is not connected: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel, then redeploy.' });
        return send(200, await listIdeas(fetchImpl, env, true));
      }
      // everyone reads the same list, so let Vercel's edge serve it for a little while
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
      if (!connected) return send(200, { ideas: [] });
      return send(200, await listIdeas(fetchImpl, env));
    }
    if (req.method === 'POST') {
      res.setHeader('Cache-Control', 'no-store');
      const msg = parseBody(req.body);
      if (!msg || typeof msg.type !== 'string') return send(400);
      if (msg.type === 'approve' || msg.type === 'reject' || msg.type === 'remove') {
        if (!env.STATS_KEY || !sameKey(msg.key ?? '', env.STATS_KEY)) return send(401, { error: 'That key does not match STATS_KEY.' });
        if (!connected) return send(503, { error: 'Redis is not connected.' });
        return send(...(await moderate(msg, env, fetchImpl)));
      }
      if (!connected) return send(503, { error: 'off' });
      if (msg.type === 'idea') return send(...(await submit(msg, req, env, fetchImpl, now)));
      if (msg.type === 'heart') return send(...(await heart(msg, env, fetchImpl)));
      return send(400);
    }
    res.setHeader('Allow', 'GET, POST');
    return send(405);
  } catch {
    return send(502, { error: 'Redis did not answer.' });
  }
}
