// The "I have an idea!" form: pick one icon, describe the game, optionally sign.

import { PICTURES, pictureSVG } from './pictures';
import { LIMITS } from './rules';
import { anonId } from './stats';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const MESSAGES: Record<string, string> = {
  'too-many': 'שלחתם הרבה רעיונות היום. אפשר לשלוח עוד מחר!',
  full: 'יש המון רעיונות שמחכים לקריאה. נסו שוב בעוד כמה ימים.',
  off: 'תיבת הרעיונות עוד לא פתוחה. נסו שוב בקרוב.',
  empty: 'בחרו אייקון או כתבו כמה מילים.',
  failed: 'משהו לא הסתדר. נסו שוב.',
};

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();

export function setupComposer() {
  const dialog = $<HTMLDialogElement>('idea-dialog');
  const form = $<HTMLFormElement>('idea-form');
  const text = $<HTMLTextAreaElement>('idea-text');
  const name = $<HTMLInputElement>('idea-name');
  const row = $('pic-row');
  const error = $('idea-error');
  const send = $<HTMLButtonElement>('idea-send');
  const step = $('idea-step');
  const done = $('idea-done');
  let picked: string | null = null;

  text.maxLength = LIMITS.text;
  name.maxLength = LIMITS.name;

  // one pick; tapping the same icon again unpicks it
  for (const item of PICTURES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pic';
    b.dataset.pic = item.id;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', item.label);
    b.innerHTML = `${pictureSVG(item.id, 52)}<span class="pic-label"></span>`;
    b.querySelector('.pic-label')!.textContent = item.label;
    b.addEventListener('click', () => {
      picked = picked === item.id ? null : item.id;
      paintPicks();
      refresh();
    });
    row.appendChild(b);
  }

  function paintPicks() {
    for (const b of row.querySelectorAll<HTMLButtonElement>('.pic')) b.setAttribute('aria-pressed', String(b.dataset.pic === picked));
  }

  function refresh() {
    error.textContent = '';
    send.disabled = picked === null && tidy(text.value).length < 2;
  }
  text.addEventListener('input', refresh);
  name.addEventListener('input', () => (error.textContent = ''));

  function reset() {
    picked = null;
    paintPicks();
    text.value = '';
    name.value = '';
    step.hidden = false;
    done.hidden = true;
    send.textContent = 'לשלוח';
    refresh();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgText = tidy(text.value);
    const sender = tidy(name.value);
    if (picked === null && msgText.length < 2) return void (error.textContent = MESSAGES.empty);
    send.disabled = true;
    send.textContent = 'שולחים…';
    let problem = 'failed';
    try {
      const r = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'idea', id: anonId(), pic: picked, text: msgText, name: sender }),
      });
      if (r.status === 201) {
        step.hidden = true;
        done.hidden = false;
        done.querySelector<HTMLButtonElement>('[data-close]')?.focus();
        return;
      }
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      if (body.error && body.error in MESSAGES) problem = body.error;
    } catch {
      // offline: keep what was typed so it can be sent again
    }
    error.textContent = MESSAGES[problem];
    send.textContent = 'לשלוח';
    send.disabled = false;
  });

  for (const b of dialog.querySelectorAll<HTMLButtonElement>('[data-close]')) b.addEventListener('click', () => dialog.close());
  // tapping the dimmed backdrop closes the form too
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  return {
    open() {
      if (!done.hidden || dialog.dataset.used !== '1') reset();
      dialog.dataset.used = '1';
      dialog.showModal();
    },
  };
}
