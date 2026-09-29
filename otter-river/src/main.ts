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
import { makePostcard } from './postcard';
import { addPhoto, decodeRecipe, deletePhoto, download, listPhotos, Photo, shareImage, shareLink } from './album';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const params = new URLSearchParams(location.search);
const canvas = $<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;

if (params.get('debug') === 'wardrobe') {
  renderWardrobe(canvas);
} else if (params.has('photo')) {
  showPostcardPage(params.get('photo') ?? '');
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
  if (params.has('dam')) game.river.forceDam = true;
  if (params.has('animal')) game.fauna.force = params.get('animal') as never;
  if (params.has('rain')) (game as unknown as { rainIn: number }).rainIn = 1;
  if (params.get('debug') === 'river') (window as unknown as { game: Game }).game = game;
  if (params.has('skip')) game.dist = Number(params.get('skip')) || 0;
  if (params.has('shells')) { data.shells = Number(params.get('shells')) || 0; data.total = Math.max(data.total, data.shells); }

  // ---------- Sizing: integer-scaled low-res canvas that fills the stage ----------
  // The pixel scale comes from the window (not the stage), so opening or closing
  // the market drawer never changes the otter's size: it only reveals more world.
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = stage.getBoundingClientRect();
    const devW = Math.max(1, r.width * dpr);
    const devH = Math.max(1, r.height * dpr);
    const winW = window.innerWidth * dpr;
    const winH = window.innerHeight * dpr;
    const portrait = mobileDock();
    const scale = portrait
      ? Math.max(2, Math.round(winW / 200))
      : Math.max(2, Math.round(winH / 290));
    const vw = Math.ceil(devW / scale);
    const vh = Math.ceil(devH / scale);
    // keep the otter where it sits with the drawer open
    const openH = portrait ? winH * 0.58 : devH;
    game.fixedOtterY = Math.round((openH / scale) * 0.64);
    canvas.width = vw;
    canvas.height = vh;
    canvas.style.width = `${(vw * scale) / dpr}px`;
    canvas.style.height = `${(vh * scale) / dpr}px`;
    ctx.imageSmoothingEnabled = false;
    game.resize(vw, vh);
  }
  const mobileDock = () => window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 720px)').matches;
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---------- UI ----------
  const art = worldArt();
  const shellURL = spriteURL(art.shell, 3);
  document.querySelectorAll<HTMLImageElement>('.shell-icon').forEach((i) => (i.src = shellURL));
  ($('btn-pause').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.pause, 3);
  ($('btn-camera').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.camera, 3);
  ($('btn-album').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.album, 3);
  ($('photo-op').querySelector('img') as HTMLImageElement).src = spriteURL(art.icons.camera, 3);
  const soundOn = spriteURL(art.icons.sound, 3);
  const soundOff = spriteURL(art.icons.mute, 3);
  const soundImg = $('btn-sound').querySelector('img') as HTMLImageElement;

  const hud = $('hud');
  const title = $('title');
  const pauseEl = $('pause');
  const toast = $('toast');
  const place = $('place');
  let paused = false;

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

  // ---------- NEW banner: once per item, when it unlocks or first becomes affordable ----------
  const available = (i: ItemDef) => !data.owned.includes(i.id) && i.unlockAt <= data.total && i.price <= data.shells;
  if (data.announced === null) {
    // older save: don't re-announce what the player could already get
    data.announced = items().filter((i) => data.owned.includes(i.id) || available(i)).map((i) => i.id);
  }
  const announced = new Set(data.announced);
  const newsQueue: ItemDef[] = [];
  let newsBusy = false;
  const news = $('news');
  const iconURLs = new Map<string, string>();
  function nextNews() {
    const it = newsQueue.shift();
    if (!it) { newsBusy = false; return; }
    newsBusy = true;
    if (!iconURLs.has(it.id)) iconURLs.set(it.id, spriteURL(it.frames[0], 2));
    news.innerHTML = '';
    const img = Object.assign(document.createElement('img'), { src: iconURLs.get(it.id)!, alt: '' });
    const chip = Object.assign(document.createElement('span'), { className: 'chip', textContent: 'NEW' });
    const label = Object.assign(document.createElement('span'), { className: 'label', textContent: it.name });
    news.append(img, chip, label);
    news.dataset.item = it.id;
    news.setAttribute('aria-label', `New at the market: ${it.name}`);
    news.classList.add('show');
    audio.chime();
    setTimeout(() => news.classList.remove('show'), 3000);
    setTimeout(nextNews, 3600);
  }
  news.addEventListener('click', () => {
    if (news.dataset.item) shop.focus(news.dataset.item);
    news.classList.remove('show');
  });
  function checkNews() {
    const fresh = items().filter((i) => available(i) && !announced.has(i.id));
    if (!fresh.length) return;
    for (const i of fresh) {
      announced.add(i.id);
      if (!data.fresh.includes(i.id)) data.fresh.push(i.id);
      newsQueue.push(i);
    }
    data.announced = [...announced];
    shop.render();
    if (!newsBusy) nextNews();
  }
  function checkUnlocks(_before: number) {
    checkNews();
  }
  function maybeHintShop() {
    checkNews();
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
    else if (e.key === 'c' || e.key === 'C') void takePhoto();
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

  // ---------- Photos ----------
  const photoOp = $('photo-op');
  let photoOpTimer = 0;
  function timeOfDay() {
    const p = game.dayPhase();
    return p < 0.08 ? 'morning' : p < 0.48 ? 'day' : p < 0.62 ? 'sunset' : p < 0.9 ? 'night' : 'dawn';
  }
  async function takePhoto() {
    if (!game.playing) return;
    audio.unlock();
    audio.shutter();
    photoOp.classList.remove('show');
    const flash = $('flash');
    flash.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on')));
    const place = game.river.biomeName(game.otterY - Math.floor(game.dist));
    const caption = `${place} · ${timeOfDay()}`;
    const at = new Date();
    const png = makePostcard(canvas, caption, at).toDataURL('image/png');
    const photo: Photo = { id: `${at.getTime()}`, png, recipe: game.recipe(caption), caption, at: at.getTime() };
    await addPhoto(photo);
    showToast('Saved to your album 📷');
  }
  $('btn-camera').addEventListener('click', () => void takePhoto());
  photoOp.addEventListener('click', () => void takePhoto());

  const albumEl = $('album');
  const viewer = $('viewer');
  let viewing: Photo | null = null;
  async function openAlbum() {
    audio.click();
    const photos = await listPhotos();
    const grid = $('album-grid');
    grid.innerHTML = '';
    $('album-empty').classList.toggle('hidden', photos.length > 0);
    for (const p of photos) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', p.caption);
      b.append(Object.assign(document.createElement('img'), { src: p.png, alt: p.caption }));
      b.addEventListener('click', () => {
        viewing = p;
        ($('viewer-img') as HTMLImageElement).src = p.png;
        viewer.classList.remove('hidden');
      });
      grid.append(b);
    }
    albumEl.classList.remove('hidden');
    if (game.playing && !paused) { albumPaused = true; setPaused(true); pauseEl.classList.add('hidden'); }
  }
  let albumPaused = false;
  function closeAlbum() {
    albumEl.classList.add('hidden');
    viewer.classList.add('hidden');
    if (albumPaused) { albumPaused = false; setPaused(false); }
  }
  $('btn-album').addEventListener('click', () => void openAlbum());
  $('btn-close-album').addEventListener('click', closeAlbum);
  $('btn-back').addEventListener('click', () => viewer.classList.add('hidden'));
  $('btn-share-image').addEventListener('click', async () => {
    if (!viewing) return;
    const r = await shareImage(viewing);
    if (r === 'downloaded') showToast('Picture saved to your device');
  });
  $('btn-share-link').addEventListener('click', async () => {
    if (!viewing) return;
    const r = await shareLink(viewing);
    if (r === 'copied') showToast('Link copied: send it to a friend!');
  });
  $('btn-download').addEventListener('click', () => viewing && download(viewing));
  $('btn-delete').addEventListener('click', async () => {
    if (!viewing) return;
    await deletePhoto(viewing.id);
    viewer.classList.add('hidden');
    await openAlbum();
  });

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
    const sky = game.sky();
    audio.ambience({
      biome: game.river.biome(game.otterY - Math.floor(game.dist)).id,
      night: sky.night,
      rain: game.rain,
      dam: game.damNear,
      t: now / 1000,
    });
    placeCheck -= dt;
    if (game.playing && placeCheck <= 0) {
      placeCheck = 1;
      if (!paused) {
        const reason = game.photoMoment();
        if (reason) {
          (photoOp.querySelector('span') as HTMLElement).textContent = `${reason}: photo op!`;
          photoOp.classList.add('show');
          clearTimeout(photoOpTimer);
          photoOpTimer = window.setTimeout(() => photoOp.classList.remove('show'), 6500);
        }
      }
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

/** A shared postcard link: re-render the scene from its recipe, then invite a new game. */
function showPostcardPage(code: string) {
  const r = decodeRecipe(code);
  const page = $('postcard-page');
  page.classList.remove('hidden');
  $('app').classList.add('hidden');
  if (!r) {
    $('postcard-caption').textContent = 'This postcard got a little wet… but the river is waiting for you!';
    ($('postcard-img') as HTMLImageElement).classList.add('hidden');
    return;
  }
  const g = new Game({ collect() {}, bump() {} });
  const c = document.createElement('canvas');
  c.width = r.w;
  c.height = r.h;
  const cx = c.getContext('2d')!;
  cx.imageSmoothingEnabled = false;
  g.applyRecipe(r);
  const draw = () => {
    g.render(cx);
    ($('postcard-img') as HTMLImageElement).src = makePostcard(c, r.c ?? 'Otter River', new Date(r.at ?? Date.now())).toDataURL();
  };
  draw();
  // re-draw once the pixel font has loaded so the caption uses it
  void document.fonts?.ready.then(draw);
  $('postcard-caption').textContent = r.c ?? '';
  document.title = 'A postcard from Otter River';
}
