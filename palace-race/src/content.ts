// Game data: the medals that open tracks, track difficulty, shop items and prices, coins per place. Pure data, used by the game, the
// simulation and the tests.

import { TRACKS, type TrackId } from './art/tracks';
import type { HairId, HelmetId, SaddleId } from './art/riders';

/**
 * Medals (places 1–3) needed to open each track. Medals are kept, never spent: the next track opens by itself after
 * the first medal, then after 3, 5 and 7. Coins are only for the shop.
 */
export const TRACK_MEDALS: Record<TrackId, number> = { forest: 0, meadow: 1, snow: 3, canyon: 5, garden: 7 };
export const isMedal = (place: number) => place >= 1 && place <= 3;
/** The tracks that `medals` open. */
export const openTracks = (medals: number) => TRACKS.filter((t) => medals >= TRACK_MEDALS[t]);

/** Coins by finishing place (everyone gets some: there is no losing), plus one for every few candies. */
export const PLACE_COINS = [50, 40, 35, 30, 25];
export const CANDIES_PER_COIN = 4;
export const raceCoins = (place: number, candies: number) => PLACE_COINS[place - 1] + Math.floor(candies / CANDIES_PER_COIN);

export type ItemKind = 'helmet' | 'hair' | 'saddle';
export interface Item { kind: ItemKind; id: HelmetId | HairId | SaddleId; price: number }

/** The first item of each kind is free and always owned. */
export const ITEMS: Item[] = [
  { kind: 'helmet', id: 'basic', price: 0 },
  { kind: 'helmet', id: 'flowers', price: 40 },
  { kind: 'helmet', id: 'stars', price: 50 },
  { kind: 'helmet', id: 'racer', price: 50 },
  { kind: 'helmet', id: 'rainbow', price: 60 },
  { kind: 'helmet', id: 'knight', price: 70 },
  { kind: 'helmet', id: 'dino', price: 70 },
  { kind: 'helmet', id: 'unicorn', price: 80 },
  { kind: 'helmet', id: 'crown', price: 90 },
  { kind: 'hair', id: 'none', price: 0 },
  { kind: 'hair', id: 'spikes', price: 40 },
  { kind: 'hair', id: 'curls', price: 40 },
  { kind: 'hair', id: 'surfer', price: 50 },
  { kind: 'hair', id: 'ponytail', price: 40 },
  { kind: 'hair', id: 'pink', price: 50 },
  { kind: 'hair', id: 'gold', price: 50 },
  { kind: 'hair', id: 'rainbow', price: 70 },
  { kind: 'saddle', id: 'basic', price: 0 },
  { kind: 'saddle', id: 'flowers', price: 60 },
  { kind: 'saddle', id: 'stars', price: 70 },
  { kind: 'saddle', id: 'rainbow', price: 90 },
  { kind: 'saddle', id: 'royal', price: 100 },
];
/** Names for grown-ups (labels and tooltips); children choose by the pictures. */
export const ITEM_NAME: Record<ItemKind, Record<string, string>> = {
  helmet: { basic: 'קסדה רגילה', flowers: 'קסדת פרחים', stars: 'קסדת כוכבים', rainbow: 'קסדת קשת', crown: 'קסדת כתר', unicorn: 'קסדת חד-קרן', knight: 'קסדת אביר', racer: 'קסדת מירוץ', dino: 'קסדת דינוזאור' },
  hair: { none: 'השיער שלי', spikes: 'קוצים', curls: 'תלתלים', surfer: 'שיער גולש', ponytail: 'קוקו', pink: 'צמות ורודות', gold: 'צמות זהב', rainbow: 'צמות קשת' },
  saddle: { basic: 'אוכף רגיל', flowers: 'אוכף פרחים', stars: 'אוכף כוכבים', rainbow: 'אוכף קשת', royal: 'אוכף מלכותי' },
};
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
  canyon: { length: 23500, gap: [1000, 1420], doubles: 0.25, ai: [0.68, 0.85] },
  garden: { length: 24000, gap: [950, 1350], doubles: 0.3, ai: [0.68, 0.85] },
};

/** How many first races show the tutorial hand and slow down before the first obstacles. */
export const TUTORIAL_RACES = 2;
