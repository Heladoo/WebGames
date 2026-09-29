import './styles.css';
import { Game } from './game';
import { AudioEngine } from './audio';
import { load, save } from './state';
import { Shop } from './shop';
import { items, ItemDef } from './art/items';
import { worldArt } from './art/world';
import { spriteURL } from './art/sprite';
import { paintNumber } from './numbers';
import { renderWardrobe } from './debug';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const params = new URLSearchParams(location.search);
const canvas = $<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;

if (params.get('debug') === 'wardrobe') {
  renderWardrobe(canvas);
} else {
  start();
}

function start() {
  const data = load();
  const audio = new AudioEngine(data.settings);
  const stage = $('stage');
  const dock = $('dock');

  const game = new Game({
    collect(value) {
      const before = data.total;
      data.shells += value;
      data.total += value;
      audio.collect(value);
      updateWallet(true);
      checkUnlocks(before);
      maybeHintShop();
      scheduleSave();
    },
    bump() {
      audio.bump();
    },
  });
  game.outfit = { equipped: data.equipped, pets: data.pets };
  game.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // debug helpers: ?time=0.6 (day phase), ?island=1, ?animal=heron, ?rain=1, ?shells=500
  if (params.has('time')) game.dayOffset = Number(params.get('time')) || 0;
  if (params.has('island')) game.river.forceIsland = true;
  if (params.has('animal')) game.fauna.force = params.get('animal') as never;
  if (params.has('rain')) (game as unknown as { rainIn: number }).rainIn = 1;
  if (params.get('debug') === 'river') (window as unknown as { game: Game }).game = game;
  if (params.has('skip')) game.dist = Number(params.get('skip')) || 0;
  if (params.has('shells')) { data.shells = Number(params.get('shells')) || 0; data.total = Math.max(data.total, data.shells); }

  // ---------- Sizing: integer-scaled low-res canvas that fills the stage ----------
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = stage.getBoundingClientRect();
    const devW = Math.max(1, r.width * dpr);
    const devH = Math.max(1, r.height * dpr);
    const scale = Math.max(2, Math.min(Math.floor(devH / 330), Math.floor(devW / 170)));
    const vw = Math.ceil(devW / scale);
    const vh = Math.ceil(devH / scale);
    canvas.width = vw;
    canvas.height = vh;
    canvas.style.width = `${(vw * scale) / dpr}px`;
    canvas.style.height = `${(vh * scale) / dpr}px`;
    ctx.imageSmoothingEnabled = false;
    game.resize(vw, vh);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---------- UI ----------
  const art = worldArt();
  const shellURL = spriteURL(art.shell, 3);
  document.querySelectorAll<HTMLImageElement>('.shell-icon').forEach((i) => (i.src = shellURL));
  ($('btn-pause').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.pause, 3);
  const soundOn = spriteURL(art.icons.sound, 3);
  const soundOff = spriteURL(art.icons.mute, 3);
  const soundImg = $('btn-sound').querySelector('img') as HTMLImageElement;

  const hud = $('hud');
  const title = $('title');
  const pauseEl = $('pause');
  const toast = $('toast');
  const place = $('place');
  let paused = false;

  const mobileDock = () => window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 720px)').matches;
  dock.classList.toggle('collapsed', mobileDock() && !data.dockOpen);
  $('dock-handle').addEventListener('click', () => {
    dock.classList.toggle('collapsed');
    data.dockOpen = !dock.classList.contains('collapsed');
    audio.click();
    scheduleSave();
  });

  function updateWallet(pop = false) {
    document.querySelectorAll<HTMLCanvasElement>('canvas.shells').forEach((c) => {
      const small = c.closest('.pill.small');
      paintNumber(c, data.shells, small ? 2 : 3);
    });
    if (pop) {
      document.querySelectorAll('.wallet').forEach((w) => {
        w.classList.add('pop');
        setTimeout(() => w.classList.remove('pop'), 180);
      });
    }
  }

  function updateSoundIcon() {
    soundImg.src = data.settings.muted ? soundOff : soundOn;
    $('btn-sound').setAttribute('aria-label', data.settings.muted ? 'Unmute sound (M)' : 'Mute sound (M)');
  }

  let toastTimer = 0;
  function showToast(msg: string) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3400);
  }

  let placeTimer = 0;
  let lastPlace = '';
  function showPlace(name: string) {
    place.textContent = `~ ${name} ~`;
    place.classList.add('show');
    clearTimeout(placeTimer);
    placeTimer = window.setTimeout(() => place.classList.remove('show'), 3200);
  }

  function checkUnlocks(before: number) {
    const unlocked = items().filter((i) => i.unlockAt > before && i.unlockAt <= data.total);
    if (!unlocked.length) return;
    for (const i of unlocked) if (!data.fresh.includes(i.id)) data.fresh.push(i.id);
    showToast(`New at the market: ${unlocked.map((i) => i.name).join(', ')}!`);
    shop.render();
  }

  const hinted = new Set<string>();
  function maybeHintShop() {
    const next = items()
      .filter((i) => !data.owned.includes(i.id) && i.unlockAt <= data.total && i.price <= data.shells && !hinted.has(i.id))
      .sort((a, b) => b.price - a.price)[0];
    if (next) {
      hinted.add(next.id);
      showToast(`You can buy the ${next.name}!`);
      shop.render();
    }
  }

  let saveTimer = 0;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => save(data), 800);
  }

  function setOn(it: ItemDef, on: boolean) {
    if (it.slot === 'pet') {
      data.pets = data.pets.filter((p) => p !== it.id);
      if (on) data.pets.push(it.id);
      game.outfit.pets = data.pets;
    } else if (on) {
      data.equipped[it.slot] = it.id;
    } else {
      delete data.equipped[it.slot];
    }
  }

  const shop = new Shop({
    data,
    click: () => { audio.unlock(); audio.click(); },
    preview(it) { game.ghost = it; },
    buy(it: ItemDef) {
      audio.unlock();
      if (data.shells < it.price) {
        audio.deny();
        return false;
      }
      data.shells -= it.price;
      data.owned.push(it.id);
      setOn(it, true);
      game.ghost = null;
      audio.buy();
      updateWallet();
      save(data);
      return true;
    },
    toggle(it: ItemDef) {
      const on = it.slot === 'pet' ? !data.pets.includes(it.id) : data.equipped[it.slot] !== it.id;
      setOn(it, on);
      audio.equip();
      save(data);
    },
    seen(id: string) {
      data.fresh = data.fresh.filter((f) => f !== id);
      scheduleSave();
    },
  });
  shop.render();

  function beginPlay() {
    audio.unlock();
    title.classList.add('hidden');
    hud.classList.remove('hidden');
    game.playing = true;
    game.welcome();
    lastPlace = game.river.biomeName(game.otterY - Math.floor(game.dist));
    showPlace(lastPlace);
  }

  function setPaused(p: boolean) {
    if (!game.playing) return;
    paused = p;
    pauseEl.classList.toggle('hidden', !p);
    if (p) syncSettingsUI();
  }

  function toggleMute() {
    data.settings.muted = !data.settings.muted;
    audio.unlock();
    audio.apply(data.settings);
    updateSoundIcon();
    save(data);
  }

  function syncSettingsUI() {
    ($('opt-music') as HTMLInputElement).checked = data.settings.music;
    ($('opt-sfx') as HTMLInputElement).checked = data.settings.sfx;
    ($('opt-volume') as HTMLInputElement).value = String(Math.round(data.settings.volume * 100));
    paintNumber($<HTMLCanvasElement>('stat-total'), data.total, 2);
  }

  $('btn-start').addEventListener('click', beginPlay);
  $('btn-pause').addEventListener('click', () => setPaused(true));
  $('btn-resume').addEventListener('click', () => setPaused(false));
  $('btn-sound').addEventListener('click', toggleMute);
  $('opt-music').addEventListener('change', (e) => {
    data.settings.music = (e.target as HTMLInputElement).checked;
    audio.apply(data.settings);
    save(data);
  });
  $('opt-sfx').addEventListener('change', (e) => {
    data.settings.sfx = (e.target as HTMLInputElement).checked;
    audio.apply(data.settings);
    save(data);
  });
  $('opt-volume').addEventListener('input', (e) => {
    data.settings.volume = Number((e.target as HTMLInputElement).value) / 100;
    if (data.settings.volume > 0 && data.settings.muted) {
      data.settings.muted = false;
      updateSoundIcon();
    }
    audio.apply(data.settings);
    scheduleSave();
  });

  // ---------- Input ----------
  const KEYS_LEFT = ['ArrowLeft', 'a', 'A'];
  const KEYS_RIGHT = ['ArrowRight', 'd', 'D'];
  window.addEventListener('keydown', (e) => {
    if (!game.playing) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        beginPlay();
      }
      return;
    }
    if (KEYS_LEFT.includes(e.key)) game.keys.left = true;
    else if (KEYS_RIGHT.includes(e.key)) game.keys.right = true;
    else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') setPaused(!paused);
    else if (e.key === 'm' || e.key === 'M') toggleMute();
    else return;
    if (e.key.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (KEYS_LEFT.includes(e.key)) game.keys.left = false;
    if (KEYS_RIGHT.includes(e.key)) game.keys.right = false;
  });
  window.addEventListener('blur', () => {
    game.keys.left = game.keys.right = false;
    game.pointerX = null;
  });

  const toVirtualX = (clientX: number) => {
    const r = canvas.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * canvas.width;
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (!game.playing) return;
    canvas.setPointerCapture(e.pointerId);
    game.pointerX = toVirtualX(e.clientX);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (game.pointerX !== null) game.pointerX = toVirtualX(e.clientX);
  });
  const release = () => { game.pointerX = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      audio.suspend();
      setPaused(true);
      save(data);
    } else {
      audio.resume();
    }
  });
  window.addEventListener('pagehide', () => save(data));

  updateWallet();
  updateSoundIcon();

  // ---------- Loop ----------
  const STEP = 1 / 60;
  let acc = 0;
  let last = performance.now();
  let placeCheck = 0;
  function frame(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) {
      acc += dt;
      while (acc >= STEP) {
        game.update(STEP);
        acc -= STEP;
      }
    } else {
      acc = 0;
    }
    game.render(ctx);
    audio.tick();
    audio.weather(game.rain);
    placeCheck -= dt;
    if (game.playing && placeCheck <= 0) {
      placeCheck = 1;
      const name = game.river.biomeName(game.otterY - Math.floor(game.dist));
      if (name !== lastPlace) {
        lastPlace = name;
        showPlace(name);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
