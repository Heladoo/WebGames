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
  /** full address of the game; games always open in the same tab */
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
    name: 'נהר הלוטרה',
    about: 'שטים על הנהר, אוספים צדפים ומלבישים את הלוטרה.',
    url: 'https://otter-river.vercel.app/',
    alt: 'לוטרה עם כובע קש שטה על גלגל ים ורוד בנהר',
    genre: ['Casual', 'Relaxing'],
    inLanguage: 'en',
  },
  {
    id: 'word-trail',
    name: 'שביל המילים',
    about: 'הרפתקה של מילים באנגלית: בוחרים, מקשיבים ומציירים אותיות.',
    url: 'https://word-trail.vercel.app/',
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
    // PLACEHOLDERS: the name, sentence and picture below are guesses until the owner sends the real ones
    // (the address comes from the owner; the game is not in this repo).
    id: 'palace-race',
    name: 'מירוץ הארמון',
    about: 'משחק מירוץ חדש.',
    url: 'https://web-games-palace-race.vercel.app/',
    isNew: true,
    alt: 'ארמון עם דגל משובץ של מירוץ',
    genre: ['Casual', 'Racing'],
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
};
