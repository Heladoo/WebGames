// Runs many races without drawing them, with different kinds of players, and reports how they go. Used by
// ?debug=sim and the simulation tests to keep the race fair, close and stress free.

import { TRACKS, type TrackId } from '../art/tracks';
import { raceCoins } from '../content';
import { BASE_SPEED, Race } from './sim';

export type Player = 'perfect' | 'average' | 'idle' | 'idleHelp';

export interface Report {
  races: number;
  winRate: number;
  avgPlace: number;
  worstPlace: number;
  minCoins: number;
  maxTime: number;
  minTime: number;
  maxGap: number; // seconds behind the winner, worst case
  minSpeed: number; // slowest speed seen after the start, as a share of the base speed
  obstacles: number;
  blockedLanes: number; // obstacles that covered all three lanes (must be 0)
}

export function simulate(player: Player, track: TrackId, n: number, seed0 = 1): Report {
  let wins = 0;
  let placeSum = 0;
  let worst = 0;
  let minCoins = Infinity;
  let maxTime = 0;
  let minTime = Infinity;
  let maxGap = 0;
  let minSpeed = Infinity;
  let obstacles = 0;
  let blocked = 0;
  for (let k = 0; k < n; k++) {
    const race = new Race({
      track,
      seed: seed0 + k,
      help: player === 'idleHelp',
      autopilot: player === 'perfect' ? 1 : player === 'average' ? 0.7 : player === 'idle' ? 0 : undefined,
    });
    race.started = true;
    obstacles += race.course.obstacles.length;
    blocked += race.course.obstacles.filter((o) => o.lanes.length >= 3).length;
    let guard = 0;
    while (!race.done && guard++ < 30 * 400) {
      race.step(1 / 30);
      if (race.t > 4 && race.me.finish < 0) minSpeed = Math.min(minSpeed, race.me.speed / BASE_SPEED);
    }
    const place = race.order.indexOf(0) + 1;
    if (place === 1) wins++;
    placeSum += place;
    worst = Math.max(worst, place);
    minCoins = Math.min(minCoins, raceCoins(place, race.me.candies));
    maxTime = Math.max(maxTime, race.me.finish);
    minTime = Math.min(minTime, race.me.finish);
    const first = Math.min(...race.runners.filter((r) => r.finish >= 0).map((r) => r.finish));
    maxGap = Math.max(maxGap, race.me.finish - first);
  }
  return { races: n, winRate: wins / n, avgPlace: placeSum / n, worstPlace: worst, minCoins, maxTime, minTime, maxGap, minSpeed, obstacles: obstacles / n, blockedLanes: blocked };
}

export function simulateAll(n: number): Record<string, Report> {
  const out: Record<string, Report> = {};
  for (const t of TRACKS) for (const p of ['perfect', 'average', 'idle', 'idleHelp'] as Player[]) out[`${t}:${p}`] = simulate(p, t, n);
  return out;
}
