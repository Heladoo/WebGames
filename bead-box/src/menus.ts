// The overlays: album, picture viewer, settings and the "someone made you a bracelet" landing page.

import { ALL_WORDS } from './content';
import { ICONS } from './art/ui';
import { deletePhoto, decodeRecipe, download, linkFor, listPhotos, shareLink, sharePng, type Photo } from './album';
import { makePhoto } from './photo';
import { speech } from './speech';
import { sfx } from './sfx';
import { music } from './music';
import { clearAll, defaults, wordCount, type SaveData } from './state';
import { $, toast } from './dom';

export interface MenuHost {
  data: SaveData;
  persist(): void;
  applySettings(): void;
  reset(): void;
}

const show = (id: string) => $(id).classList.remove('hidden');
const hide = (id: string) => $(id).classList.add('hidden');

export function closeOverlays() {
  for (const id of ['album', 'viewer', 'settings', 'gift']) hide(id);
}

export function initMenus(host: MenuHost) {
  document.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => {
    b.innerHTML = ICONS.close;
    b.addEventListener('click', () => b.closest('.overlay')?.classList.add('hidden'));
  });
  document.querySelectorAll<HTMLElement>('.overlay').forEach((o) =>
    o.addEventListener('click', (e) => {
      if (e.target === o && o.id !== 'finish') o.classList.add('hidden');
    }));

  // ----- album -----
  let viewing: Photo | null = null;

  async function openAlbum() {
    const photos = await listPhotos();
    $('album-body').innerHTML = photos.length
      ? photos.map((p) => `<button data-id="${p.id}" aria-label="${p.caption}"><img src="${p.png}" alt="${p.caption}" draggable="false" /></button>`).join('')
      : '<p class="album-empty">No bracelets yet. Finish one and it will be saved here.</p>';
    $('album-body').onclick = (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
      const p = photos.find((x) => x.id === b?.dataset.id);
      if (p) openViewer(p);
    };
    show('album');
  }

  function openViewer(p: Photo) {
    viewing = p;
    ($('viewer-img') as HTMLImageElement).src = p.png;
    ($('viewer-img') as HTMLImageElement).alt = p.caption;
    show('viewer');
  }

  $('viewer-share').addEventListener('click', async () => {
    if (!viewing) return;
    const r = await sharePng(viewing.png, 'bracelet.png', viewing.caption);
    if (r === 'downloaded') toast('Picture saved');
  });
  $('viewer-link').addEventListener('click', async () => {
    if (!viewing) return;
    const r = await shareLink(linkFor(viewing.recipe), 'I made a bracelet in Bead Box!');
    if (r === 'copied') toast('Link copied');
  });
  $('viewer-delete').innerHTML = `${ICONS.trash}<span style="margin-left:6px">Delete</span>`;
  $('viewer-delete').addEventListener('click', async () => {
    if (!viewing) return;
    await deletePhoto(viewing.id);
    hide('viewer');
    void openAlbum();
  });

  // ----- settings -----
  const d = host.data;
  const music_ = $<HTMLInputElement>('opt-music');
  const sound = $<HTMLInputElement>('opt-sound');
  const volume = $<HTMLInputElement>('opt-volume');
  const rate = $<HTMLInputElement>('opt-rate');

  function renderVoices() {
    const list = speech.voices();
    $('voice-note').classList.toggle('hidden', list.length > 0 || speech.available);
    const cur = speech.current()?.name ?? '';
    $('opt-voice').innerHTML = list.length
      ? [`<button role="radio" data-v="" aria-checked="${d.settings.voice === ''}">Automatic</button>`]
          .concat(list.map((v) => `<button role="radio" data-v="${v.name.replace(/"/g, '')}" aria-checked="${d.settings.voice === v.name || (d.settings.voice === '' && false && v.name === cur)}">${v.name}</button>`))
          .join('')
      : '';
  }
  $('opt-voice').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]');
    if (!b) return;
    d.settings.voice = b.dataset.v ?? '';
    speech.setVoice(d.settings.voice);
    host.persist();
    renderVoices();
    void speech.say('Hello! Let us make a bracelet.');
  });
  speech.onVoices(renderVoices);

  function openSettings() {
    music_.checked = d.settings.music;
    sound.checked = d.settings.sound;
    volume.value = String(Math.round(d.settings.volume * 100));
    rate.value = String(Math.round(d.settings.rate * 100));
    renderVoices();
    $('progress').textContent = `Words learned: ${wordCount(d)} of ${ALL_WORDS.length}. Bracelets made: ${Object.values(d.finished).reduce((a, b) => a + b, 0)}.`;
    show('settings');
  }
  music_.addEventListener('change', () => { d.settings.music = music_.checked; host.applySettings(); host.persist(); });
  sound.addEventListener('change', () => { d.settings.sound = sound.checked; host.applySettings(); host.persist(); sfx.tap(); });
  volume.addEventListener('input', () => { d.settings.volume = Number(volume.value) / 100; host.applySettings(); host.persist(); });
  rate.addEventListener('change', () => { d.settings.rate = Number(rate.value) / 100; host.applySettings(); host.persist(); void speech.say('A blue star'); });
  let armed = 0;
  $('btn-reset').addEventListener('click', () => {
    if (Date.now() - armed < 4000) {
      clearAll();
      Object.assign(d, defaults());
      host.reset();
      hide('settings');
      toast('Starting again. Your album is kept.');
      armed = 0;
    } else {
      armed = Date.now();
      toast('Tap "Start again" once more to restart. Your album is kept.');
    }
  });

  // ----- a bracelet from a link -----
  async function openGift(place: string, beads: import('./content').Bead[], onPlay: () => void) {
    const { png } = await makePhoto(place, beads.concat(Array(Math.max(0, 12 - beads.length)).fill(null)));
    ($('gift-img') as HTMLImageElement).src = png;
    show('gift');
    $('gift-play').onclick = () => { hide('gift'); onPlay(); };
  }

  return { openAlbum, openSettings, openGift, download, decodeRecipe, hasMusic: () => music.enabled };
}
