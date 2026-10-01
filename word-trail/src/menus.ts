import { ALL_WORDS, picture } from './content';
import { BADGES, deletePhoto, download, listPhotos, makeStickerSheet, Photo, sharePng } from './rewards';
import { speech } from './speech';
import { sfx } from './sfx';
import { clearAll, SaveData, save } from './state';
import { $, h, openOverlay, toast } from './ui';

// The sticker book (stickers, badges, photos), the photo viewer and the grown-ups' menu.

export interface MenuHooks {
  newTrip: () => void;
}

export function initMenus(s: SaveData, hooks: MenuHooks) {
  const show = (w: string) => (s.settings.letterCase === 'upper' ? w.toUpperCase() : w);

  // ---------- sticker book ----------
  let tab = 'stickers';
  const body = $('book-body');
  const foot = $('book-foot');

  async function renderBook() {
    document.querySelectorAll<HTMLButtonElement>('#book .tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
    body.innerHTML = '';
    foot.innerHTML = '';
    if (tab === 'stickers') {
      const learned = ALL_WORDS.filter((w) => s.learned[w]);
      body.appendChild(h('p', 'book-count', `${learned.length} of ${ALL_WORDS.length} words`));
      const grid = h('div', 'sticker-grid');
      const order = [...learned, ...ALL_WORDS.filter((w) => !s.learned[w])];
      for (const w of order) {
        const got = !!s.learned[w];
        const b = h('button', `sticker${got ? '' : ' locked'}`, `${picture(w)}<span>${got ? show(w) : '?'}</span>`);
        b.setAttribute('aria-label', got ? w : 'Not found yet');
        if (got) b.addEventListener('click', () => { sfx.tap(); speech.say(w); b.classList.remove('boing'); void b.offsetWidth; b.classList.add('boing'); });
        grid.appendChild(b);
      }
      body.appendChild(grid);
      if (learned.length) {
        const btn = h('button', 'pill-btn', 'Share my stickers');
        btn.addEventListener('click', shareStickers);
        foot.appendChild(btn);
      }
    } else if (tab === 'badges') {
      const grid = h('div', 'badge-grid');
      for (const b of BADGES) {
        const got = s.badges.includes(b.id);
        const el = h('button', `badge${got ? '' : ' locked'}`, `<div class="medal">${picture(b.icon)}</div><span>${b.label}</span>`);
        if (got) el.addEventListener('click', () => speech.say(b.say));
        grid.appendChild(el);
      }
      body.appendChild(grid);
    } else {
      const photos = await listPhotos();
      if (!photos.length) {
        body.appendChild(h('p', 'empty', 'No photos yet. Tap the camera on the trail to take one!'));
        return;
      }
      const grid = h('div', 'photo-grid');
      photos.forEach((p, i) => {
        const b = h('button', 'thumb', `<img alt="" src="${p.png}"/>`);
        b.setAttribute('aria-label', p.caption);
        b.addEventListener('click', () => openViewer(photos, i));
        grid.appendChild(b);
      });
      body.appendChild(grid);
    }
  }

  document.querySelectorAll<HTMLButtonElement>('#book .tab').forEach((t) =>
    t.addEventListener('click', () => {
      tab = t.dataset.tab!;
      sfx.tap();
      renderBook();
    }),
  );

  async function shareStickers() {
    toast('Making your sticker picture…', 1500);
    const png = await makeStickerSheet(s, s.settings.letterCase === 'upper');
    const r = await sharePng(png, 'word-trail-stickers.png', `I know ${Object.keys(s.learned).length} English words!`);
    if (r === 'downloaded') toast('Saved the sticker picture');
  }

  // ---------- photo viewer ----------
  let current: Photo | null = null;
  let onDelete: (() => void) | null = null;
  function openViewer(list: Photo[], i: number, allowDelete = true) {
    current = list[i];
    ($('viewer-img') as HTMLImageElement).src = current.png;
    $('viewer-cap').textContent = current.caption;
    $('btn-delete').classList.toggle('hidden', !allowDelete);
    onDelete = () => renderBook();
    openOverlay('viewer');
    speech.say(current.caption);
  }
  const fileName = (p: Photo) => `word-trail-${new Date(p.at).toISOString().slice(0, 10)}-${p.id.slice(-4)}.png`;
  $('btn-share').addEventListener('click', async () => {
    if (!current) return;
    const r = await sharePng(current.png, fileName(current), current.caption);
    if (r === 'downloaded') toast('Saved the picture');
  });
  $('btn-save').addEventListener('click', () => current && download(current.png, fileName(current)));
  $('btn-delete').addEventListener('click', async () => {
    if (!current || !confirm('Delete this photo?')) return;
    await deletePhoto(current.id);
    current = null;
    $('viewer').classList.add('hidden');
    onDelete?.();
  });

  // ---------- grown-ups ----------
  const seg = (id: string, value: string, set: (v: string) => void) => {
    const box = $(id);
    const paint = (v: string) => box.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    paint(value);
    box.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
      b.addEventListener('click', () => {
        set(b.dataset.v!);
        paint(b.dataset.v!);
        save(s);
      }),
    );
  };
  seg('opt-case', s.settings.letterCase, (v) => (s.settings.letterCase = v as 'upper' | 'lower'));
  seg('opt-activity', s.settings.activity, (v) => (s.settings.activity = v as 'mix' | 'tap' | 'trace'));

  const rate = $<HTMLInputElement>('opt-rate');
  rate.value = String(Math.round(s.settings.rate * 100));
  rate.addEventListener('change', () => {
    s.settings.rate = Number(rate.value) / 100;
    speech.rate = s.settings.rate;
    save(s);
    speech.say('Hello! This is my voice.');
  });

  const voiceSel = $<HTMLSelectElement>('opt-voice');
  const fillVoices = () => {
    const vs = speech.voices();
    voiceSel.innerHTML = `<option value="">Automatic</option>` + vs.map((v) => `<option>${v.name.replace(/</g, '')}</option>`).join('');
    voiceSel.value = vs.some((v) => v.name === s.settings.voice) ? s.settings.voice : '';
    $('voice-note').classList.toggle('hidden', vs.length > 0);
  };
  fillVoices();
  speech.onVoices(fillVoices);
  voiceSel.addEventListener('change', () => {
    s.settings.voice = voiceSel.value;
    speech.setVoice(voiceSel.value);
    save(s);
    speech.say('Hello! This is my voice.');
  });

  const sound = $<HTMLInputElement>('opt-sound');
  sound.checked = s.settings.sound;
  sound.addEventListener('change', () => {
    s.settings.sound = sound.checked;
    sfx.enabled = sound.checked;
    save(s);
  });

  const progress = () => {
    const words = Object.keys(s.learned).length;
    const top = Object.entries(s.learned).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
    $('progress').innerHTML = `
      <div><b>${words}</b><span>words</span></div>
      <div><b>${s.letters.length}</b><span>letters</span></div>
      <div><b>${s.decisions}</b><span>choices</span></div>
      <div><b>${s.places.length}</b><span>places</span></div>
      ${top.length ? `<p class="note">Most practised: ${top.join(', ')}</p>` : ''}`;
  };

  $('btn-new-trip').addEventListener('click', () => {
    if (!confirm('Start a new trip? Your child will choose a new friend. Stickers and badges are kept.')) return;
    $('parents').classList.add('hidden');
    hooks.newTrip();
  });
  $('btn-share-stickers').addEventListener('click', shareStickers);
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('Erase all progress, stickers and settings on this device? Photos stay in the album.')) return;
    clearAll();
    location.reload();
  });

  // hold the gear for a moment so little fingers don't open it by accident
  const gear = $('btn-parents');
  let holdTimer = 0;
  const cancelHold = () => {
    clearTimeout(holdTimer);
    gear.classList.remove('holding');
  };
  gear.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    gear.classList.add('holding');
    holdTimer = window.setTimeout(() => {
      gear.classList.remove('holding');
      progress();
      fillVoices();
      openOverlay('parents');
    }, 1500);
  });
  gear.addEventListener('pointerup', () => {
    if (gear.classList.contains('holding')) toast('Grown-ups: press and hold ⚙️');
    cancelHold();
  });
  gear.addEventListener('pointerleave', cancelHold);
  gear.addEventListener('pointercancel', cancelHold);
  gear.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    openBook(which = 'stickers') {
      tab = which;
      renderBook();
      return openOverlay('book');
    },
    openPhoto(p: Photo) {
      openViewer([p], 0, false);
    },
  };
}
