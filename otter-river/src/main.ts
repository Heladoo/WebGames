import './styles.css';
import { Game } from './game';
import { AudioEngine } from './audio';
import { load, save } from './state';
import { Shop } from './shop';
import { items, ItemDef } from './art/items';
import { worldArt } from './art/world';
import { spriteURL } from './art/sprite';
import { renderWardrobe } from './debug';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;

if (new URLSearchParams(location.search).get('debug') === 'wardrobe') {
  renderWardrobe(canvas);
} else {
  start();
}

function start() {
  const data = load();
  const audio = new AudioEngine(data.settings);
  let scale = 3;

  const game = new Game({
    collect(value) {
      data.shells += value;
      data.total += value;
      audio.collect(value);
      updateWallet(true);
      maybeHintShop();
      scheduleSave();
    },
    bump() {
      audio.bump();
    },
  });
  game.equipped = data.equipped;
  game.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Sizing: integer-scaled low-res canvas that fills the screen ----------
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const devW = window.innerWidth * dpr;
    const devH = window.innerHeight * dpr;
    scale = Math.max(2, Math.min(Math.floor(devH / 200), Math.floor(devW / 100)));
    const vw = Math.ceil(devW / scale);
    const vh = Math.ceil(devH / scale);
    canvas.width = vw;
    canvas.height = vh;
    canvas.style.width = `${(vw * scale) / dpr}px`;
    canvas.style.height = `${(vh * scale) / dpr}px`;
    ctx.imageSmoothingEnabled = false;
    game.resize(vw, vh);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- UI ----------
  const art = worldArt();
  const shellURL = spriteURL(art.shell, 4);
  document.querySelectorAll<HTMLImageElement>('.shell-icon').forEach((i) => (i.src = shellURL));
  ($('btn-shop').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.bag, 3);
  ($('btn-pause').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.pause, 4);
  const soundOn = spriteURL(art.icons.sound, 3);
  const soundOff = spriteURL(art.icons.mute, 3);
  const soundImg = $('btn-sound').querySelector('img') as HTMLImageElement;

  const hud = $('hud');
  const title = $('title');
  const pauseEl = $('pause');
  const shopEl = $('shop');
  const toast = $('toast');
  let paused = false;

  function updateWallet(pop = false) {
    document.querySelectorAll<HTMLElement>('.wallet .shells').forEach((el) => {
      el.textContent = String(data.shells);
      if (pop) {
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 180);
      }
    });
    const affordable = items().some((i) => !data.owned.includes(i.id) && i.price <= data.shells);
    $('btn-shop').classList.toggle('glow', affordable);
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
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
  }

  const hinted = new Set<string>();
  function maybeHintShop() {
    const next = items()
      .filter((i) => !data.owned.includes(i.id) && i.price <= data.shells && !hinted.has(i.id))
      .sort((a, b) => b.price - a.price)[0];
    if (next) {
      hinted.add(next.id);
      showToast(`You can buy the ${next.name}!`);
    }
  }

  let saveTimer = 0;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => save(data), 800);
  }

  const shop = new Shop({
    data,
    click: () => audio.click(),
    onBuy(it: ItemDef) {
      data.shells -= it.price;
      data.owned.push(it.id);
      data.equipped[it.slot] = it.id;
      audio.buy();
      updateWallet();
      save(data);
    },
    onEquip(it: ItemDef, on: boolean) {
      if (on) data.equipped[it.slot] = it.id;
      else delete data.equipped[it.slot];
      audio.equip();
      save(data);
    },
  });

  function beginPlay() {
    audio.unlock();
    title.classList.add('hidden');
    hud.classList.remove('hidden');
    game.playing = true;
    game.welcome();
  }

  function setPaused(p: boolean) {
    if (!game.playing) return;
    paused = p;
    pauseEl.classList.toggle('hidden', !p);
    if (p) syncSettingsUI();
  }

  function openShop(open: boolean) {
    if (!game.playing) return;
    shopEl.classList.toggle('hidden', !open);
    if (open) {
      toast.classList.remove('show');
      audio.click();
      shop.open();
    } else {
      save(data);
    }
  }

  const shopOpen = () => !shopEl.classList.contains('hidden');

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
    $('stat-total').textContent = String(data.total);
  }

  $('btn-start').addEventListener('click', beginPlay);
  $('btn-shop').addEventListener('click', () => openShop(true));
  $('btn-close-shop').addEventListener('click', () => openShop(false));
  shopEl.addEventListener('click', (e) => { if (e.target === shopEl) openShop(false); });
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
    else if (e.key === 'Escape') {
      if (shopOpen()) openShop(false);
      else setPaused(!paused);
    } else if (e.key === 'p' || e.key === 'P') {
      if (!shopOpen()) setPaused(!paused);
    } else if (e.key === 'b' || e.key === 'B') {
      if (!paused) openShop(!shopOpen());
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMute();
    } else return;
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
  function frame(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const frozen = paused || shopOpen();
    if (!frozen) {
      acc += dt;
      while (acc >= STEP) {
        game.update(STEP);
        acc -= STEP;
      }
    } else {
      acc = 0;
    }
    game.render(ctx);
    if (shopOpen()) shop.draw(now / 1000);
    audio.tick();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
