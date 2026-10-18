// The ideas board: approved ideas from players, with hearts.

import { pictureLabel, pictureSVG } from './pictures';
import { anonId } from './stats';


export interface Idea {
  id: string;
  pics: string[];
  text: string;
  names: string[];
  hearts: number;
}

const HEARTED_KEY = 'dorothy-games-hearts';
/** how many notes show before "show more" */
const FIRST = 4;
const NOTE_COLORS = ['#FFF8C4', '#DDF1F6', '#FDE2E4', '#E3F3D8', '#EDE3F7'];
const PIN_COLORS = ['#C2452A', '#2F6F6A', '#D9982A', '#6A4FA0', '#3E7CB1'];

function hearted(): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(HEARTED_KEY) || '[]');
    return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveHearted(s: Set<string>) {
  try {
    localStorage.setItem(HEARTED_KEY, JSON.stringify([...s].slice(-500)));
  } catch {
    // private mode: hearts still count, they just aren't remembered
  }
}

/** "נועה", "נועה ויואב", "נועה, דן ויואב" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ו${names[names.length - 1]}`;
}

export async function fetchIdeas(): Promise<Idea[]> {
  const r = await fetch('/api/ideas', { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(String(r.status));
  const body = (await r.json()) as { ideas?: unknown };
  return Array.isArray(body.ideas) ? (body.ideas as Idea[]) : [];
}

const heartIcon = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.4 5c2.1 0 3.4 1.2 4.1 2.4h3C14.2 6.2 15.5 5 17.6 5 21 5 22.7 8.4 21.2 11.4 19 15.6 12 20 12 20z"/></svg>`;

function noteEl(idea: Idea, index: number, mine: Set<string>): HTMLElement {
  const li = document.createElement('li');
  li.className = 'note';
  li.style.setProperty('--note', NOTE_COLORS[index % NOTE_COLORS.length]);
  li.style.setProperty('--pin', PIN_COLORS[index % PIN_COLORS.length]);
  li.style.setProperty('--tilt', `${[-1.4, 1.1, -0.7, 1.5, -1][index % 5]}deg`);

  if (idea.pics.length) {
    const pics = document.createElement('div');
    pics.className = 'note-pics';
    pics.setAttribute('role', 'img');
    pics.setAttribute('aria-label', idea.pics.map(pictureLabel).join(', '));
    pics.innerHTML = idea.pics.map((p) => pictureSVG(p, 40)).join('');
    li.appendChild(pics);
  }
  if (idea.text) {
    const p = document.createElement('p');
    p.className = 'note-text';
    p.textContent = idea.text; // never innerHTML: this text comes from players
    li.appendChild(p);
  }
  const foot = document.createElement('div');
  foot.className = 'note-foot';
  const by = document.createElement('span');
  by.className = 'note-by';
  if (idea.names.length) by.textContent = `מאת ${joinNames(idea.names)}`;
  foot.appendChild(by);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'heart';
  const count = document.createElement('span');
  let n = idea.hearts;
  const paint = () => {
    const on = mine.has(idea.id);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', `אהבתי (${n})`);
    count.textContent = String(n);
  };
  btn.innerHTML = heartIcon;
  btn.appendChild(count);
  paint();
  btn.addEventListener('click', () => {
    const on = !mine.has(idea.id);
    if (on) mine.add(idea.id);
    else mine.delete(idea.id);
    n = Math.max(0, n + (on ? 1 : -1));
    saveHearted(mine);
    paint();
    if (on) {
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
    }
    void fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'heart', id: anonId(), idea: idea.id, on }),
    }).catch(() => {});
  });
  foot.appendChild(btn);
  li.appendChild(foot);
  return li;
}

/** Fill the board; `null` means the list could not be loaded. */
export function renderBoard(list: HTMLElement, more: HTMLButtonElement, count: HTMLElement, ideas: Idea[] | null) {
  list.textContent = '';
  more.hidden = true;
  count.textContent = ideas && ideas.length ? String(ideas.length) : '';
  if (ideas === null) {
    const p = document.createElement('li');
    p.className = 'board-empty';
    p.textContent = 'הלוח לא נטען עכשיו. נסו שוב אחר כך.';
    list.appendChild(p);
    return;
  }
  if (!ideas.length) {
    const p = document.createElement('li');
    p.className = 'board-empty';
    p.textContent = 'עוד אין כאן רעיונות. אולי הרעיון הראשון יהיה שלכם?';
    list.appendChild(p);
    return;
  }
  const mine = hearted();
  ideas.forEach((idea, i) => {
    const el = noteEl(idea, i, mine);
    if (i >= FIRST) el.hidden = true;
    list.appendChild(el);
  });
  if (ideas.length > FIRST) {
    more.hidden = false;
    more.onclick = () => {
      for (const el of list.querySelectorAll<HTMLElement>('.note[hidden]')) el.hidden = false;
      more.hidden = true;
    };
  }
}
