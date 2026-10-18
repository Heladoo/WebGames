import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import '@fontsource/secular-one/400.css';
import './styles.css';
import { setupComposer } from './composer';
import { fetchIdeas, renderBoard } from './ideas';
import { stats } from './stats';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const params = new URLSearchParams(location.search);
const debug = params.get('debug');

/** Round the plank at both ends of every shelf row (the grid wraps on its own). */
function markRows() {
  const cells = [...document.querySelectorAll<HTMLElement>('#tiles > .cell')];
  cells.forEach((c, i) => {
    const top = c.offsetTop;
    c.classList.toggle('row-start', i === 0 || cells[i - 1].offsetTop !== top);
    c.classList.toggle('row-end', i === cells.length - 1 || cells[i + 1].offsetTop !== top);
  });
}

function setupShelf() {
  markRows();
  new ResizeObserver(markRows).observe($('tiles'));
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a.box[data-game]')) {
    a.addEventListener('click', () => stats.open(a.dataset.game!));
  }
}

/** The (i) button on each game box: hover or focus shows a one-line description, a tap toggles it (touch screens). */
function setupTips() {
  const cells = [...document.querySelectorAll<HTMLElement>('#tiles > .cell')];
  const close = () => cells.forEach((c) => c.classList.remove('tip-open'));
  for (const cell of cells) {
    cell.querySelector('.info')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !cell.classList.contains('tip-open');
      close();
      cell.classList.toggle('tip-open', open);
    });
  }
  document.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    close();
    // a focused (i) keeps its tooltip open too: let go of it
    if (document.activeElement?.classList.contains('info')) (document.activeElement as HTMLElement).blur();
  });
}

function setupBoard() {
  const board = $<HTMLDetailsElement>('board');
  // open beside the shelf on wide screens, folded under it on phones
  const wide = matchMedia('(min-width: 900px)');
  board.open = wide.matches;
  wide.addEventListener('change', () => (board.open = wide.matches));
  const list = $('ideas');
  const more = $<HTMLButtonElement>('more');
  const count = $('board-count');
  fetchIdeas()
    .then((ideas) => renderBoard(list, more, count, ideas))
    .catch(() => renderBoard(list, more, count, null));
}

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
}

function setupInstall() {
  const btn = $<HTMLButtonElement>('install');
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return;
  let deferred: InstallPrompt | null = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    btn.hidden = false;
  });
  window.addEventListener('appinstalled', () => (btn.hidden = true));
  // iPhone and iPad have no install prompt: show how to do it by hand
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) btn.hidden = false;
  const iosDialog = $<HTMLDialogElement>('ios-dialog');
  iosDialog.querySelector('[data-close]')?.addEventListener('click', () => iosDialog.close());
  btn.addEventListener('click', async () => {
    if (deferred) {
      await deferred.prompt();
      deferred = null;
      btn.hidden = true;
    } else if (ios) {
      iosDialog.showModal();
    }
  });
}

if (debug === 'og' || debug === 'icon') {
  void import('./debug').then((m) => m.render(debug));
} else {
  setupShelf();
  setupTips();
  setupBoard();
  setupInstall();
  const composer = setupComposer();
  for (const b of document.querySelectorAll('[data-open-idea]')) b.addEventListener('click', () => composer.open());
  stats.visit();
  if (import.meta.env.PROD && 'serviceWorker' in navigator && !debug) {
    window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}
