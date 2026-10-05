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

export function findWord(host: HTMLElement, word: string, level: number, show: (w: string) => string): { done: Promise<void>; cancel: () => void } {
  const options = shuffle([word, ...distractors(word, level)]);
  host.classList.add(`n${options.length}`);
  host.style.setProperty('--len', String(Math.max(...options.map((w) => w.length))));
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
