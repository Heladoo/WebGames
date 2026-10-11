import { ALL_WORDS } from './content';
import { speech } from './speech';
import { sfx } from './sfx';
import { anyOverlayOpen } from './ui';

// Find the word: the word waits big above (with its picture), and below are a
// few word cards with no pictures. The child finds the same word by its
// letters. A wrong card wobbles and says its own word; nothing is lost. After
// a quiet while the word is said again, and later the right card glows.

const shuffle = <T>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/**
 * Other words to choose from. Early on they look clearly different (another
 * first letter); later they share the first letter or the length, so the
 * child has to look at more than the first letter.
 */
export function distractors(word: string, level: number, pool: string[] = ALL_WORDS): string[] {
  const n = level >= 2 ? 3 : 2;
  const others = shuffle(pool.filter((w) => w !== word && w.length <= 8));
  const near = (w: string) => w[0] === word[0] || Math.abs(w.length - word.length) === 0;
  const picked = level >= 2
    ? [...others.filter(near), ...others.filter((w) => !near(w))]
    : [...others.filter((w) => w[0] !== word[0] && Math.abs(w.length - word.length) <= 1), ...others.filter((w) => w[0] !== word[0])];
  return [...new Set(picked)].slice(0, n);
}

/** Card text under this size (CSS px) is too small for a young child to read. */
export const MIN_CARD_FONT = 30;

/**
 * Picks how many cards sit side by side: as many as fit while the longest
 * word on offer stays at least MIN_CARD_FONT, else one card per row. (Long
 * words in two narrow columns once shrank to 10–17px on phones.)
 */
function layout(host: HTMLElement, options: string[]) {
  const len = Math.max(...options.map((w) => w.length));
  const width = host.clientWidth || 300;
  const gap = parseFloat(getComputedStyle(host).columnGap) || 12;
  // a capital is about 0.72em wide plus 0.08em spacing; a card has about 48px of padding and border
  const font = (cols: number) => ((width - gap * (cols - 1)) / cols - 48) / (len * 0.8);
  const choices = [...new Set([options.length, 2, 1])].filter((c) => c <= options.length);
  const cols = choices.find((c) => font(c) >= MIN_CARD_FONT) ?? 1;
  // the rows must also fit the height left on screen (a phone held sideways is short);
  // a card is about 1.1 lines of text plus 16px of padding and border
  const rows = Math.ceil(options.length / cols);
  const room = innerHeight - host.getBoundingClientRect().top - 20;
  const byHeight = ((room - gap * (rows - 1)) / rows - 16) / 1.1;
  host.style.setProperty('--cols', String(cols));
  host.style.setProperty('--fs', `${Math.floor(Math.max(MIN_CARD_FONT, Math.min(font(cols), byHeight, 58)))}px`);
  host.classList.toggle('one-col', cols === 1);
}

export function findWord(host: HTMLElement, word: string, level: number, show: (w: string) => string): { done: Promise<void>; cancel: () => void } {
  const options = shuffle([word, ...distractors(word, level)]);
  host.classList.add(`n${options.length}`);
  let cancelled = false;
  let found = false;
  let idle = performance.now();
  let hints = 0;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));

  const cards = options.map((w) => {
    const b = document.createElement('button');
    b.className = 'word-card';
    b.textContent = show(w);
    b.dataset.w = w;
    b.setAttribute('aria-label', w);
    host.appendChild(b);
    b.addEventListener('click', () => {
      if (cancelled || found) return;
      idle = performance.now();
      if (w !== word) {
        sfx.soft();
        speech.say(w);
        b.classList.remove('wobble');
        void b.offsetWidth;
        b.classList.add('wobble', 'tried');
        return;
      }
      found = true;
      sfx.chime(5);
      b.classList.add('right');
      cards.forEach((c) => c !== b && c.classList.add('fade'));
      stop();
      setTimeout(resolveDone, 900);
    });
    return b;
  });

  layout(host, options);

  // a quiet moment: say the word again; after two, make the right card glow
  const timer = window.setInterval(() => {
    if (cancelled || found) return;
    if (anyOverlayOpen() || document.hidden) { idle = performance.now(); return; }
    if (performance.now() - idle < 8000) return;
    idle = performance.now();
    hints++;
    speech.say(word, { pitch: 1.15 });
    if (hints >= 2) cards.find((c) => c.dataset.w === word)?.classList.add('glow');
  }, 500);
  const stop = () => window.clearInterval(timer);

  return {
    done,
    cancel: () => {
      cancelled = true;
      stop();
      resolveDone();
    },
  };
}
