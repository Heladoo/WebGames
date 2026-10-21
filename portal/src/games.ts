// The list of games on the shelf. This is the only file to edit when a game
// is added, renamed or moved; the page, the JSON-LD and the sitemap are built
// from it (see vite.config.ts). Games outside this repo are listed the same
// way: they are just links.

export interface Game {
  /** stable id, used for stats and the tile picture: /games/<id>.jpg */
  id: string;
  /** name shown on the box (Hebrew) */
  name: string;
  /** one sentence for parents and search engines (Hebrew) */
  about: string;
  /** full address of the game; games open in a new tab, so the portal doesn't depend on any game's own page */
  url: string;
  /** shows the "new" badge */
  isNew?: boolean;
  /** what the art shows, for screen readers (Hebrew) */
  alt: string;
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
    alt: 'לוטרה עם כובע קש שטה על גלגל ים ורוד בנהר',
    genre: ['Casual', 'Relaxing'],
    inLanguage: 'en',
  },
  {
    id: 'word-trail',
    name: 'שביל המילים',
    about: 'הרפתקה של מילים באנגלית: בוחרים, מקשיבים ומציירים אותיות.',
    url: 'https://word-trail-rho.vercel.app/',
    alt: 'כלבלב עם כובע הולך בשביל בפארק ודבורה לידו',
    genre: ['Educational', 'Adventure'],
    inLanguage: 'en',
  },
  {
    id: 'bead-box',
    name: 'קופסת החרוזים',
    about: 'משחילים צמידים מחרוזים צבעוניים ולומדים מילים באנגלית.',
    url: 'https://bead-box.vercel.app/',
    isNew: true,
    alt: 'צמיד חרוזים צבעוני על שולחן עץ בחוף ים',
    genre: ['Educational', 'Creative'],
    inLanguage: 'en',
  },
  {
    id: 'palace-race',
    name: 'המרוץ לארמון',
    about: 'מרוץ רגוע: בוחרים חיה מלכותית ורוכב, דוהרים לארמון, אוספים ממתקים וזוכים בגביע.',
    url: 'https://web-games-palace-race.vercel.app/',
    isNew: true,
    alt: 'הלוגו של המרוץ לארמון: ארמון קסום, חד-קרן ואיל',
    genre: ['Casual', 'Racing'],
    inLanguage: 'he',
  },
];

/** "Coming soon" boxes at the end of the shelf; 0 hides them. */
export const COMING_SOON = 1;

export const SITE = {
  name: 'משחקי דורותי',
  nameEn: 'Dorothy Games',
  tagline: 'משחקים רגועים, מילדים לילדים',
  description:
    'משחקי דורותי: משחקי דפדפן רגועים, בטוחים ומשמחים לילדים ולכל המשפחה, לגילאי 4 עד 99. בלי פרסומות, בלי הרשמה ובלי עוגיות. משחקים בחינם בטלפון, בטאבלט ובמחשב.',
  /** the quiet line under the shelf */
  facts: ['לגילאי 4–99', 'חינם', 'בלי פרסומות', 'בלי הרשמה', 'בלי עוגיות', 'בטוח ורגוע'],
};
