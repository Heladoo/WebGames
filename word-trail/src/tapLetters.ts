import { speech } from './speech';
import { sfx } from './sfx';

// Letter tapping: the word's letters wait in slots and the next slot glows.
// Tapping any bubble says its letter name; the right one flies into its slot.
// Level 0: bubbles in order · 1: shuffled · 2 and 3: one or two extra letters.

const COLORS = ['#e3685b', '#3f8f8a', '#e8a93c', '#6c7fc4', '#d9788f', '#5f9e6e', '#c98a4b'];
// letters that look clearly different from most others, for extra bubbles
const EXTRAS = 'abdefhkmnrstuwxz';

const shuffle = <T>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export function tapWord(slotsHost: HTMLElement, bubblesHost: HTMLElement, word: string, level: number, upper: boolean, onLetter?: (i: number) => void): { done: Promise<void>; cancel: () => void } {
  const show = (c: string) => (upper ? c.toUpperCase() : c);
  const letters = [...word];
  const slots = letters.map((c, i) => {
    const s = document.createElement('span');
    s.className = 'slot';
    s.textContent = show(c);
    s.style.setProperty('--c', COLORS[i % COLORS.length]);
    slotsHost.appendChild(s);
    return s;
  });

  let pool = letters.map((c) => c);
  if (level >= 2) {
    const extra = shuffle([...EXTRAS].filter((c) => !word.includes(c))).slice(0, level >= 3 ? 2 : 1);
    pool = pool.concat(extra);
  }
  if (level >= 1) {
    pool = shuffle(pool);
    // don't hand the child the word already in order
    if (pool.join('') === word && pool.length > 1) pool.push(pool.shift()!);
  }
  const bubbles = pool.map((c, i) => {
    const b = document.createElement('button');
    b.className = 'bubble';
    b.textContent = show(c);
    b.dataset.ch = c;
    b.style.setProperty('--c', COLORS[(i * 3) % COLORS.length]);
    b.setAttribute('aria-label', `Letter ${c}`);
    bubblesHost.appendChild(b);
    return b;
  });

  let cur = 0;
  let idle = performance.now();
  let cancelled = false;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));

  const focus = () => {
    slots.forEach((s, i) => s.classList.toggle('current', i === cur));
    if (level === 0) bubbles.forEach((b) => b.classList.toggle('glow', !b.disabled && b.dataset.ch === letters[cur] && b === bubbles.find((x) => !x.disabled && x.dataset.ch === letters[cur])));
  };

  const onTap = (b: HTMLButtonElement) => {
    if (cancelled || b.disabled || cur >= letters.length) return;
    idle = performance.now();
    const ch = b.dataset.ch!;
    speech.letter(ch);
    if (ch !== letters[cur]) {
      sfx.soft();
      b.classList.remove('wobble');
      void b.offsetWidth;
      b.classList.add('wobble');
      return;
    }
    sfx.chime(cur);
    const slot = slots[cur];
    const from = b.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    b.disabled = true;
    b.classList.add('used');
    const ghost = b.cloneNode(true) as HTMLElement;
    ghost.classList.add('ghost');
    Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    document.body.appendChild(ghost);
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(0.6)`;
      ghost.style.opacity = '0.2';
    });
    setTimeout(() => ghost.remove(), 420);
    setTimeout(() => slot.classList.add('filled'), 300);
    onLetter?.(cur);
    cur++;
    if (cur >= letters.length) {
      slots.forEach((s) => s.classList.remove('current'));
      stop();
      setTimeout(resolveDone, 700);
    } else focus();
  };
  bubbles.forEach((b) => b.addEventListener('click', () => onTap(b)));

  // after a quiet moment, gently say which letter comes next and make it glow
  const timer = window.setInterval(() => {
    if (cancelled || cur >= letters.length) return;
    if (performance.now() - idle > 7000) {
      idle = performance.now();
      speech.letter(letters[cur]);
      const b = bubbles.find((x) => !x.disabled && x.dataset.ch === letters[cur]);
      b?.classList.add('glow');
    }
  }, 500);
  const stop = () => window.clearInterval(timer);

  focus();
  return {
    done,
    cancel: () => {
      cancelled = true;
      stop();
      resolveDone();
    },
  };
}
