import './styles.css';
import { SLOTS, isDesign, isShape, PLACE_IDS, type Bead } from './content';
import { ICONS } from './art/ui';
import { decodeRecipe } from './album';
import { setBackdrop, fillThumbs, thumb } from './backdrop';
import { initMenus, closeOverlays } from './menus';
import { renderMap } from './map';
import { Workshop, type Finished } from './workshop';
import { sfx } from './sfx';
import { music } from './music';
import { speech } from './speech';
import { stats } from './stats';
import { load, save } from './state';
import { $, toast } from './dom';
import { gameLink, sharePng } from './album';

const params = new URLSearchParams(location.search);
const debug = params.get('debug');

const data = load();
let saveTimer = 0;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => save(data), 400);
}

function applySettings() {
  const s = data.settings;
  sfx.enabled = s.sound;
  speech.muted = !s.sound;
  speech.rate = s.rate;
  speech.voiceName = s.voice;
  speech.pickVoice();
  sfx.setVolume(s.volume);
  music.setOn(s.music);
  const on = s.sound || s.music;
  $('btn-sound').innerHTML = on ? ICONS.soundOn : ICONS.soundOff;
  $('btn-sound').setAttribute('aria-label', on ? 'Mute sound' : 'Unmute sound');
}

type Screen = 'title' | 'map' | 'workshop';
let screen: Screen = 'title';
function go(s: Screen) {
  screen = s;
  for (const id of ['title', 'map', 'workshop']) $(id).classList.toggle('hidden', id !== s);
  closeOverlays();
  $('finish').classList.add('hidden');
}

let audioReady = false;
function unlockAudio() {
  sfx.unlock();
  speech.unlock();
  if (sfx.context && !audioReady) {
    audioReady = true;
    music.start(sfx.context, sfx.bus);
    applySettings();
  }
}

function showMap(highlight: string | null = null) {
  setBackdrop('beach');
  music.setPlace('beach');
  renderMap(
    data,
    (id) => { unlockAudio(); go('workshop'); workshop.enter(id); },
    () => { sfx.tap(); toast('Finish a bracelet to open this place'); },
    highlight,
  );
  go('map');
}

const workshop = new Workshop({
  data,
  persist,
  openAlbum: () => void menus.openAlbum(),
  toMap: () => { speech.stop(); showMap(); },
  finished: (f: Finished) => showFinish(f),
});

const menus = initMenus({
  data,
  persist,
  applySettings,
  reset: () => { applySettings(); showMap(); },
});

let lastFinish: Finished | null = null;
function showFinish(f: Finished) {
  lastFinish = f;
  ($('finish-img') as HTMLImageElement).src = f.png;
  const n = $('finish-new');
  if (f.newPlace) {
    n.textContent = `A new place is open: ${placeName(f.newPlace)}!`;
    n.classList.remove('hidden');
  } else n.classList.add('hidden');
  $('finish').classList.remove('hidden');
}
import { placeById } from './content';
const placeName = (id: string) => placeById(id).name;

$('finish-again').addEventListener('click', () => { $('finish').classList.add('hidden'); workshop.restart(); });
$('finish-map').addEventListener('click', () => { $('finish').classList.add('hidden'); showMap(lastFinish?.newPlace ?? null); });
$('finish-share').addEventListener('click', async () => {
  if (!lastFinish?.png) return;
  const r = await sharePng(lastFinish.png, 'bracelet.png', `I made a ${lastFinish.caption.toLowerCase()} in Bead Box! Play it here:`, gameLink());
  if (r !== 'shared') toast(r === 'saved+copied' ? 'Picture saved and game link copied' : 'Picture saved');
});

// ----- buttons -----
$('map-settings').innerHTML = ICONS.gear;
$('map-album').innerHTML = ICONS.album;
$('map-settings').addEventListener('click', () => menus.openSettings());
$('map-album').addEventListener('click', () => void menus.openAlbum());
$('btn-sound').addEventListener('click', () => {
  const on = data.settings.sound || data.settings.music;
  data.settings.sound = !on;
  data.settings.music = !on;
  applySettings();
  persist();
});

function begin() {
  unlockAudio();
  stats.start();
  showMap();
}
$('btn-start').addEventListener('click', begin);

document.addEventListener('pointerdown', () => unlockAudio(), { once: true });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const open = document.querySelector('.overlay:not(.hidden):not(#finish)');
    if (open) open.classList.add('hidden');
    else menus.openSettings();
  } else if (e.key === 'm' || e.key === 'M') $('btn-sound').click();
  else if (e.key === 'Enter' && screen === 'workshop' && !(e.target as HTMLElement).closest('button, input')) $('btn-place').click();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stats.flush(true);
    sfx.suspend();
    save(data);
  } else if (audioReady) sfx.unlock();
});
window.addEventListener('pagehide', () => { stats.flush(true); save(data); });

// anonymous play time: one second at a time, only while the screen is showing and a place is open
setInterval(() => { if (!document.hidden && screen !== 'title') stats.tick(1); }, 1000);

// ----- start -----
applySettings();
setBackdrop('beach');
$('title-art').innerHTML = thumb('beach');
fillThumbs($('title-art'));

function presetBeads(): (Bead | null)[] | undefined {
  const raw = params.get('beads');
  if (!raw) return undefined;
  const out: (Bead | null)[] = [];
  for (const part of raw.split(',').slice(0, SLOTS)) {
    const [shape, design] = part.split(':');
    out.push(isShape(shape) && isDesign(design) ? { shape, design } : null);
  }
  return out;
}

(async () => {
  if (debug) {
    const mod = await import('./debug');
    if (await mod.runDebug(debug, params)) return;
    // ?debug with ?place=woods&beads=round:blue,leaf:green jumps straight into a workshop state
    (window as unknown as Record<string, unknown>).game = { data, workshop, go, showMap, persist };
    const place = params.get('place');
    if (place && PLACE_IDS.includes(place)) {
      if (!data.unlocked.includes(place)) data.unlocked.push(place);
      go('workshop');
      workshop.enter(place, presetBeads());
    }
    return;
  }
  const code = params.get('bracelet');
  if (code) {
    const r = decodeRecipe(code);
    if (r) {
      await menus.openGift(r.place, r.beads, () => {});
      setBackdrop(r.place);
    }
  }
})();
