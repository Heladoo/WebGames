// Anonymous play statistics for Word Trail (Vercel serverless function).
//
// Storage: Upstash Redis over its REST API. The free plan is plenty. Create a
// database at console.upstash.com and put its REST URL and token into Vercel
// as UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (the Vercel Marketplace
// names KV_REST_API_URL / KV_REST_API_TOKEN work too). See the README.
// No personal data is stored: only counters, plus a HyperLogLog of random
// anonymous ids to estimate unique players.
//
// One free Upstash database can serve several games: every Word Trail key
// starts with "wt:" (Otter River uses "or:"), so their numbers never mix.
//
//   POST {type:"start", id}      → one more play
//   POST {type:"time", id, s}    → add s seconds of play (1..120)
//   GET  ?key=STATS_KEY          → totals + last 30 days (for /stats.html)

import { timingSafeEqual } from 'node:crypto';

const MAX_SECONDS = 180; // per report (the game reports every 2 minutes)
const P = 'wt:'; // key prefix for this game

// Read at call time so tests and redeploys see the current environment.
function creds(env = process.env) {
  return {
    url: (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '').replace(/\/+$/, ''),
    token: env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '',
  };
}

export async function redis(commands, fetchImpl = fetch, env = process.env) {
  const { url, token } = creds(env);
  const r = await fetchImpl(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

const day = (d = new Date()) => d.toISOString().slice(0, 10);

function sameKey(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === 'string') {
    if (body.length > 512) return null;
    try { return JSON.parse(body); } catch { return null; }
  }
  return typeof body === 'object' ? body : null;
}

export function commandsFor(msg, today = day()) {
  if (!msg || typeof msg.id !== 'string' || !/^[a-z0-9]{8,32}$/.test(msg.id)) return null;
  if (msg.type === 'start') {
    // 4 commands per play (the free plan allows 500,000 a month)
    return [
      ['INCR', `${P}plays`],
      ['INCR', `${P}plays:${today}`],
      ['PFADD', `${P}players`, msg.id],
      ['PFADD', `${P}players:${today}`, msg.id],
    ];
  }
  if (msg.type === 'time') {
    const s = Math.round(Number(msg.s));
    if (!Number.isFinite(s) || s < 1 || s > MAX_SECONDS) return null;
    return [
      ['INCRBY', `${P}seconds`, s],
      ['INCRBY', `${P}seconds:${today}`, s],
    ];
  }
  return null;
}

export async function summary(fetchImpl = fetch, now = new Date(), env = process.env) {
  const days = [];
  for (let i = 29; i >= 0; i--) days.push(day(new Date(now.getTime() - i * 864e5)));
  const cmds = [['GET', `${P}plays`], ['GET', `${P}seconds`], ['PFCOUNT', `${P}players`]];
  for (const d of days) cmds.push(['GET', `${P}plays:${d}`], ['GET', `${P}seconds:${d}`], ['PFCOUNT', `${P}players:${d}`]);
  const res = await redis(cmds, fetchImpl, env);
  const n = (v) => Number(v) || 0;
  return {
    plays: n(res[0]),
    seconds: n(res[1]),
    players: n(res[2]),
    days: days.map((d, i) => ({ day: d, plays: n(res[3 + i * 3]), seconds: n(res[4 + i * 3]), players: n(res[5 + i * 3]) })),
  };
}

export default async function handler(req, res, env = process.env, fetchImpl = fetch) {
  res.setHeader('Cache-Control', 'no-store');
  const { url, token } = creds(env);
  const connected = Boolean(url && token);
  try {
    if (req.method === 'POST') {
      // The game never sees errors: when stats aren't set up, it's a quiet no-op.
      if (!connected) return res.status(204).end();
      const cmds = commandsFor(parseBody(req.body));
      if (!cmds) return res.status(400).end();
      await redis(cmds, fetchImpl, env);
      return res.status(204).end();
    }
    if (req.method === 'GET') {
      // The dashboard, on the other hand, says exactly what is missing.
      if (!env.STATS_KEY) return res.status(503).json({ error: 'STATS_KEY is not set in Vercel yet.', step: 'key' });
      if (!sameKey(req.query?.key ?? '', env.STATS_KEY)) return res.status(401).json({ error: 'That key does not match STATS_KEY.' });
      if (!connected) {
        return res.status(503).json({ error: 'Redis is not connected: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel, then redeploy.', step: 'redis' });
      }
      return res.status(200).json(await summary(fetchImpl, new Date(), env));
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    if (req.method === 'GET') return res.status(502).json({ error: 'Redis did not answer. Check the URL and token, and that the free plan limit has not been reached.', step: 'redis' });
    return res.status(502).end();
  }
}
