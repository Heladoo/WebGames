// Every place's scenery, painted in code. Each scene is an svg fragment for a 400 x 700 box (sky on top, ground
// below). The table and bracelet are separate (see tables.ts and scene.ts). Scenes are painted once into a
// picture, so they can use many shapes and filters.

import { beach } from './places/beach';
import { woods } from './places/woods';
import { ball } from './places/ball';
import { city } from './places/city';
import { snow } from './places/snow';
import { garden } from './places/garden';

const ART: Record<string, () => string> = { beach, woods, ball, city, snow, garden };

/** The scenery of a place as an svg fragment for a 400 x 700 box. */
export const placeArt = (id: string): string => (ART[id] ?? beach)();
