// The "I have an idea!" form: pick pictures, optionally write, optionally sign.

import { LIMITS, NAME_RE } from './rules';
import { PICTURE_GROUPS, pictureSVG } from './pictures';
import { anonId } from './stats';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const MESSAGES: Record<string, string> = {
  'too-many': 'שלחתם הרבה רעיונות היום. אפשר לשלוח עוד מחר!',
  full: 'יש המון רעיונות שמחכים לקריאה. נסו שוב בעוד כמה ימים.',
  off: 'תיבת הרעיונות עוד לא פתוחה. נסו שוב בקרוב.',
  name: 'בשם אפשר לכתוב רק אותיות.',
  empty: 'בחרו תמונה או כתבו כמה מילים.',
  failed: 'משהו לא הסתדר. נסו שוב.',
};

export function setupComposer() {
  const dialog = $<HTMLDialogElement>('idea-dialog');
  const form = $<HTMLFormElement>('idea-form');
  const text = $<HTMLTextAreaElement>('idea-text');
  const nameList = $('name-list');
  const addName = $<HTMLButtonElement>('add-name');
  const error = $('idea-error');
  const send = $<HTMLButtonElement>('idea-send');
  const step = $('idea-step');
  const done = $('idea-done');
  const picked = new Map<string, string>(); // group → picture id

  // one row of picture buttons per group; one pick per group
  const pickers = $('pickers');
  for (const g of PICTURE_GROUPS) {
    const fs = document.createElement('fieldset');
    fs.className = 'picker';
    const legend = document.createElement('legend');
    legend.textContent = g.label;
    fs.appendChild(legend);
    const row = document.createElement('div');
    row.className = 'pic-row';
    for (const item of g.items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pic';
      b.dataset.pic = item.id;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', item.label);
      b.innerHTML = `${pictureSVG(item.id, 52)}<span class="pic-label"></span>`;
      b.querySelector('.pic-label')!.textContent = item.label;
      b.addEventListener('click', () => {
        if (picked.get(g.id) === item.id) picked.delete(g.id);
        else picked.set(g.id, item.id);
        for (const other of row.querySelectorAll<HTMLButtonElement>('.pic')) {
          other.setAttribute('aria-pressed', String(picked.get(g.id) === other.dataset.pic));
        }
        refresh();
      });
      row.appendChild(b);
    }
    fs.appendChild(row);
    pickers.appendChild(fs);
  }

  function nameInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name';
    input.maxLength = LIMITS.name;
    input.autocomplete = 'off';
    input.setAttribute('aria-labelledby', 'names-label');
    input.placeholder = 'שם פרטי';
    input.addEventListener('input', () => (error.textContent = ''));
    return input;
  }

  function names(): HTMLInputElement[] {
    return [...nameList.querySelectorAll<HTMLInputElement>('input.name')];
  }

  addName.addEventListener('click', () => {
    if (names().length >= LIMITS.names) return;
    const input = nameInput();
    nameList.appendChild(input);
    input.focus();
    addName.hidden = names().length >= LIMITS.names;
  });

  function refresh() {
    error.textContent = '';
    send.disabled = picked.size === 0 && text.value.trim().length < 2;
  }
  text.addEventListener('input', refresh);

  function reset() {
    picked.clear();
    for (const b of pickers.querySelectorAll('.pic')) b.setAttribute('aria-pressed', 'false');
    text.value = '';
    nameList.textContent = '';
    nameList.appendChild(nameInput());
    addName.hidden = false;
    step.hidden = false;
    done.hidden = true;
    send.textContent = 'לשלוח';
    refresh();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pics = PICTURE_GROUPS.map((g) => picked.get(g.id)).filter((x): x is string => Boolean(x));
    const msgText = text.value.replace(/\s+/g, ' ').trim();
    const signed = names().map((i) => i.value.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!pics.length && msgText.length < 2) return void (error.textContent = MESSAGES.empty);
    const bad = names().find((i) => {
      const v = i.value.replace(/\s+/g, ' ').trim();
      return v && !NAME_RE.test(v);
    });
    if (bad) {
      error.textContent = MESSAGES.name;
      bad.focus();
      return;
    }
    send.disabled = true;
    send.textContent = 'שולחים…';
    let problem = 'failed';
    try {
      const r = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'idea', id: anonId(), pics, text: msgText, names: signed }),
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
