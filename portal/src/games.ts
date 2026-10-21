// The list of games on the shelf. This is the only file to edit when a game
// is added, renamed or moved; the page, the JSON-LD and the sitemap are built
// from it (see vite.config.ts). Games outside this repo are listed the same
// way: they are just links.

export interface Game {
  /** stable id, used for stats and the tile picture: /games/<id>.jpg */
  id: string;
  /** the name, read by screen readers and used in the tooltip button's label (the picture, a logo, already shows it) */
  name: string;
  /** one sentence for parents and search engines (Hebrew) */
  about: string;
  /** full address of the game; games open in a new tab, so the portal doesn't depend on any game's own page */
  url: string;
  /** shows the "new" badge */
  isNew?: boolean;
  /** for JSON-LD */
  genre: string[];
  /** language of the game itself, for JSON-LD; leave out when unknown */
  inLanguage?: string;
}

export const GAMES: Game[] = [
  {
    id: 'otter-river',
    name: 'חיי לוטרה',
    about: 'שטים על הנהר, אוספים צדפים ומלבישים את הלוטרה.',
    url: 'https://web-games-otter-river.vercel.app/',
    genre: ['Casual', 'Relaxing'],
    inLanguage: 'en',
  },
  {
    id: 'word-trail',
    name: 'שביל המילים',
    about: 'הרפתקה של מילים באנגלית: בוחרים, מקשיבים ומציירים אותיות.',
    url: 'https://word-trail-rho.vercel.app/',
    genre: ['Educational', 'Adventure'],
    inLanguage: 'en',
  },
  {
    id: 'bead-box',
    name: 'צמיד לדרך',
    about: 'משחילים צמידים מחרוזים צבעוניים ולומדים מילים באנגלית.',
    url: 'https://bead-box.vercel.app/',
    genre: ['Educational', 'Creative'],
    inLanguage: 'en',
  },
  {
    id: 'palace-race',
    name: 'המרוץ לארמון',
    about: 'מרוץ רגוע: בוחרים חיה מלכותית ורוכב, דוהרים לארמון, אוספים ממתקים וזוכים בגביע.',
    url: 'https://web-games-palace-race.vercel.app/',
    isNew: true,
    genre: ['Casual', 'Racing'],
    inLanguage: 'he',
  },
  {
    // not in this repo: github.com/Heladoo/Birdnet_kids, served by GitHub Pages
    id: 'birdnet-kids',
    name: 'Birdnet Kids',
    about: 'לוחצים על ציפור ושומעים את השיר שלה.',
    url: 'https://heladoo.github.io/Birdnet_kids/',
    genre: ['Educational', 'Nature'],
    inLanguage: 'en',
  },
];

/** "Coming soon" boxes at the end of the shelf; 0 hides them. */
export const COMING_SOON = 0;

export const SITE = {
  name: 'משחקי דורותי',
  nameEn: 'Dorothy Games',
  tagline: 'משחקים רגועים, מילדים לילדים',
  description:
    'משחקי דורותי: משחקי דפדפן רגועים, בטוחים ומשמחים לילדים ולכל המשפחה, לגילאי 4 עד 99. בלי פרסומות, בלי הרשמה ובלי עוגיות. משחקים בחינם בטלפון, בטאבלט ובמחשב.',
  /** the quiet line under the shelf */
  facts: ['לגילאי 4–99', 'חינם', 'בלי פרסומות', 'בלי הרשמה', 'בלי עוגיות', 'בטוח ורגוע'],
};
