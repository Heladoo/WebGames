import { heroArt, HEROES, HeroId } from './art/characters';
import { friendIcon, SMALL_FRIENDS } from './art/friends';
import { PLACE_IDS, placeIcon, SkyId, skyIcon, PlaceId } from './art/places';
import { rideIcon, RIDE_IDS } from './art/rides';
import { CARRY, ITEM_BOX, itemArt, WEAR_SLOT } from './art/wearables';
import { svgBox } from './art/paper';

// The word bank: every word is short, concrete and has its own picture.

export type Category = 'hero' | 'wear' | 'place' | 'friend' | 'sky' | 'carry' | 'ride';

export const WORDS: Record<Category, string[]> = {
  hero: HEROES,
  wear: Object.keys(WEAR_SLOT),
  place: PLACE_IDS,
  friend: [...SMALL_FRIENDS, ...HEROES],
  sky: ['sun', 'cloud', 'rain', 'rainbow', 'moon'],
  carry: CARRY,
  ride: RIDE_IDS,
};

/** What the voice asks for each kind of decision. */
export function prompt(cat: Category, hero: string | null): string {
  const who = hero ? `the ${hero}` : 'we';
  switch (cat) {
    case 'hero': return 'Who will go on a trip?';
    case 'wear': return `What will ${who} wear?`;
    case 'place': return `Where will ${who} go?`;
    case 'friend': return 'Who will come along?';
    case 'sky': return 'What is in the sky?';
    case 'carry': return `What will ${who} take?`;
    case 'ride': return `What will ${who} ride?`;
  }
}

/** Short cheer after finishing a word. */
export const CHEERS = ['Great job!', 'Well done!', 'Wonderful!', 'Super!', 'You did it!', 'Hooray!', 'Amazing!'];

/** Friendly spoken line when something new joins the trip. */
export function arrival(cat: Category, word: string, hero: string): string {
  switch (cat) {
    case 'hero': return `Hello, ${word}! Let's go!`;
    case 'wear': return `The ${hero} has a ${word}!`.replace('a boots', 'boots').replace('a glasses', 'glasses');
    case 'place': return `Off to the ${word}!`;
    case 'friend': return `The ${word} is coming too!`;
    case 'sky': return word === 'rain' ? 'Look, rain!' : `Look, the ${word}!`;
    case 'carry': return `The ${hero} has ${/^[aeiou]/.test(word) ? 'an' : 'a'} ${word}!`;
    case 'ride': return `Let's go by ${word}!`;
  }
}

export function categoryOf(word: string): Category {
  for (const c of ['wear', 'place', 'sky', 'carry', 'ride', 'hero', 'friend'] as Category[]) if (WORDS[c].includes(word)) return c;
  return 'friend';
}

/** The picture of any word as a standalone SVG string. */
export function picture(word: string, cls = 'pic'): string {
  if ((HEROES as string[]).includes(word)) return svgBox(`<g filter="url(#pc)">${heroArt(word as HeroId)}</g>`, '0 0 200 200', cls);
  if (SMALL_FRIENDS.includes(word)) return svgBox(friendIcon(word), '0 0 200 200', cls);
  if ((PLACE_IDS as string[]).includes(word)) return svgBox(placeIcon(word as PlaceId), '0 0 200 200', cls);
  if (WORDS.sky.includes(word)) return svgBox(skyIcon(word as SkyId), '0 0 200 200', cls);
  if (RIDE_IDS.includes(word)) return svgBox(`<g filter="url(#pc)">${rideIcon(word)}</g>`, '0 0 200 200', cls);
  if (word in ITEM_BOX) return svgBox(`<g filter="url(#pc)">${itemArt(word)}</g>`, ITEM_BOX[word], cls);
  return svgBox('', '0 0 200 200', cls);
}

export const ALL_WORDS = [...new Set(Object.values(WORDS).flat())];
