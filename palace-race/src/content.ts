// Game data: track prices and difficulty, shop items and prices, coins per place. Pure data, used by the game, the
// simulation and the tests.

import type { TrackId } from './art/tracks';
import type { BraidsId, HelmetId, SaddleId } from './art/riders';

/** Coins to open each track; the first is open from the start. About 2–3 races earn the next one. */
export const TRACK_PRICE: Record<TrackId, number> = { forest: 0, meadow: 80, snow: 120, canyon: 160, garden: 200 };

/** Coins by finishing place (everyone gets some: there is no losing), plus one for every few candies. */
export const PLACE_COINS = [50, 40, 35, 30, 25];
export const CANDIES_PER_COIN = 4;
export const raceCoins = (place: number, candies: number) => PLACE_COINS[place - 1] + Math.floor(candies / CANDIES_PER_COIN);

export type ItemKind = 'helmet' | 'braids' | 'saddle';
export interface Item { kind: ItemKind; id: HelmetId | BraidsId | SaddleId; price: number }

/** The first item of each kind is free and always owned. */
export const ITEMS: Item[] = [
  { kind: 'helmet', id: 'basic', price: 0 },
  { kind: 'helmet', id: 'flowers', price: 40 },
  { kind: 'helmet', id: 'stars', price: 50 },
  { kind: 'helmet', id: 'rainbow', price: 60 },
  { kind: 'helmet', id: 'crown', price: 80 },
  { kind: 'braids', id: 'none', price: 0 },
  { kind: 'braids', id: 'pink', price: 50 },
  { kind: 'braids', id: 'gold', price: 50 },
  { kind: 'braids', id: 'rainbow', price: 70 },
  { kind: 'saddle', id: 'basic', price: 0 },
  { kind: 'saddle', id: 'flowers', price: 60 },
  { kind: 'saddle', id: 'stars', price: 70 },
  { kind: 'saddle', id: 'rainbow', price: 90 },
  { kind: 'saddle', id: 'royal', price: 100 },
];
export const itemKey = (i: { kind: ItemKind; id: string }) => `${i.kind}:${i.id}`;
export const FREE_ITEMS = ITEMS.filter((i) => i.price === 0).map(itemKey);

export interface Difficulty {
  length: number; // race length in stage units (base speed ~330 units/s)
  gap: [number, number]; // distance between obstacles
  doubles: number; // chance an obstacle covers two lanes
  ai: [number, number]; // opponents' skill range
}

/** Tracks get a little busier one by one; the forest is the gentlest. */
export const DIFFICULTY: Record<TrackId, Difficulty> = {
  forest: { length: 21000, gap: [1250, 1750], doubles: 0, ai: [0.62, 0.8] },
  meadow: { length: 22000, gap: [1150, 1600], doubles: 0.1, ai: [0.65, 0.82] },
  snow: { length: 23000, gap: [1050, 1500], doubles: 0.18, ai: [0.68, 0.85] },
  canyon: { length: 23500, gap: [1000, 1420], doubles: 0.25, ai: [0.7, 0.87] },
  garden: { length: 24000, gap: [950, 1350], doubles: 0.3, ai: [0.72, 0.88] },
};

/** How many first races show the tutorial hand and slow down before the first obstacles. */
export const TUTORIAL_RACES = 2;
