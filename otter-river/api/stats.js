// Anonymous play statistics for Otter River (Vercel serverless function).
//
// Storage: Upstash Redis over its REST API (add "Upstash for Redis" in the
// Vercel dashboard under Storage; it injects the env vars below). No personal
// data is stored: only counters, plus a HyperLogLog of random anonymous ids
// to estimate unique players.
//
//   POST {type:"start", id}      → one more play
//   POST {type:"time", id, s}    → add s seconds of play (1..120)
//   GET  ?key=STATS_KEY          → totals + last 30 days (for /stats.html)

import { timingSafeEqual } from 'node:crypto';

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DAY_TTL = 60 * 60 * 24 * 400;

export async function redis(commands, fetchImpl = fetch) {
  const r = await fetchImpl(`${URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
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
    return [
      ['INCR', 'or:plays'],
      ['INCR', `or:plays:${today}`], ['EXPIRE', `or:plays:${today}`, DAY_TTL],
      ['PFADD', 'or:players', msg.id],
      ['PFADD', `or:players:${today}`, msg.id], ['EXPIRE', `or:players:${today}`, DAY_TTL],
    ];
  }
  if (msg.type === 'time') {
    const s = Math.round(Number(msg.s));
    if (!Number.isFinite(s) || s < 1 || s > 120) return null;
    return [
      ['INCRBY', 'or:seconds', s],
      ['INCRBY', `or:seconds:${today}`, s], ['EXPIRE', `or:seconds:${today}`, DAY_TTL],
    ];
  }
  return null;
}

export async function summary(fetchImpl = fetch, now = new Date()) {
  const days = [];
  for (let i = 29; i >= 0; i--) days.push(day(new Date(now.getTime() - i * 864e5)));
  const cmds = [['GET', 'or:plays'], ['GET', 'or:seconds'], ['PFCOUNT', 'or:players']];
  for (const d of days) cmds.push(['GET', `or:plays:${d}`], ['GET', `or:seconds:${d}`], ['PFCOUNT', `or:players:${d}`]);
  const res = await redis(cmds, fetchImpl);
  const n = (v) => Number(v) || 0;
  return {
    plays: n(res[0]),
    seconds: n(res[1]),
    players: n(res[2]),
    days: days.map((d, i) => ({ day: d, plays: n(res[3 + i * 3]), seconds: n(res[4 + i * 3]), players: n(res[5 + i * 3]) })),
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL || !TOKEN) return res.status(204).end(); // stats not set up yet: never break the game
  try {
    if (req.method === 'POST') {
      const cmds = commandsFor(parseBody(req.body));
      if (!cmds) return res.status(400).end();
      await redis(cmds);
      return res.status(204).end();
    }
    if (req.method === 'GET') {
      const key = process.env.STATS_KEY;
      if (!key || !sameKey(req.query?.key ?? '', key)) return res.status(401).json({ error: 'wrong key' });
      return res.status(200).json(await summary());
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch {
    return res.status(502).end();
  }
}
