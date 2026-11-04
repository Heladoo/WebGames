import './styles.css';
import { COLOR_HE, colorName, type ColorName, css, PIG, type Pig, pigToRgb, sameColor, share } from './color';
import { Drop } from './drop';
import { type FailInfo, Game } from './game';
import { ICON, ICON_LOCK, ICON_ROTATE, ICON_STAR } from './icons';
import { LAB, LEVELS, type Level } from './levels';
import { drawDrop, drawGlitterPile } from './render';
import { setMuted, unlock } from './sfx';
import { load, save } from './state';
import { stats } from './stats';
import { initSplash } from './splash';
import { PICTURES } from './towel';

const params = new URLSearchParams(location.search);
const debug = params.get('debug') ?? '';
const store = load();
setMuted(store.muted);

// A drop (טיפה) is feminine in Hebrew: one drop, several drops. The in-between
// colours have no everyday adjective, so they read "a drop in turquoise".
const ONE: Partial<Record<ColorName, string>> = {
  red: 'אדומה', yellow: 'צהובה', blue: 'כחולה', orange: 'כתומה', purple: 'סגולה', green: 'ירוקה', brown: 'חומה',
};
const MANY: Partial<Record<ColorName, string>> = {
  red: 'אדומות', yellow: 'צהובות', blue: 'כחולות', orange: 'כתומות', purple: 'סגולות', green: 'ירוקות', brown: 'חומות',
};
/** "טיפה ירוקה" or "טיפה בצבע טורקיז" */
const aDrop = (n: ColorName) => `טיפה ${ONE[n] ?? `בצבע ${COLOR_HE[n]}`}`;
const drops = (n: ColorName) => `טיפות ${MANY[n] ?? `בצבע ${COLOR_HE[n]}`}`;

const app = document.getElementById('app')!;
app.innerHTML = `
  <canvas id="bg" aria-hidden="true"></canvas>
  <canvas id="stage" aria-label="דף נייר עם טיפות צבע וכוסות. גוררים טיפה באצבע."></canvas>
  <div id="topbar" class="hidden">
    <button class="round" id="btn-home" aria-label="מסך הבית">${ICON.home}</button>
    <span class="level-pill" id="level-pill" aria-live="polite"></span>
    <span class="grow"></span>
    <button class="round" id="btn-restart" aria-label="להתחיל את השלב מחדש">${ICON.again}</button>
    <button class="round" id="btn-sound" aria-label="צלילים"></button>
  </div>

  <div id="home" class="screen">
    <div class="title-card">
      <div class="title-logo">
        <h1><img src="/logo.webp" alt="Drop the Drop" lang="en" width="600" height="600"></h1>
      </div>
      <div class="title-side">
        <div class="home-buttons">
          <button class="home-btn" id="btn-play"><span class="home-ic">${ICON.play}</span><span class="home-label">לשחק</span></button>
          <button class="home-btn alt" id="btn-levels"><span class="home-ic">${ICON.levels}</span><span class="home-label">שלבים</span></button>
        </div>
        <a class="portal-link" href="https://dorothy-games.vercel.app/" aria-label="Dorothy Games: more games"><img src="/dorothy-logo.webp" alt="" width="180" height="90"></a>
        <p class="fine">בלי פרסומות, חשבונות או עוגיות. נספרים רק משחקים וזמן משחק, בלי מידע אישי.</p>
      </div>
    </div>
  </div>

  <div id="pick" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="pick-title">
    <div class="card pick-card">
      <div class="pick-head">
        <button class="round" id="btn-pick-back" aria-label="מסך הבית">${ICON.home}</button>
        <h2 id="pick-title">שלבים</h2>
        <span class="round-space"></span>
      </div>
      <div class="levels" id="levels" role="list" aria-label="שלבים"></div>
    </div>
  </div>

  <div id="fail" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="fail-text">
    <div class="card">
      <canvas id="fail-pic" width="560" height="170" aria-hidden="true"></canvas>
      <p id="fail-text"></p>
      <button class="home-btn" id="btn-retry"><span class="home-ic">${ICON.again}</span><span class="home-label">עוד פעם</span></button>
    </div>
  </div>

  <div id="win" class="hidden" role="dialog" aria-label="כל הכבוד! השלב הושלם">
    <div class="row">
      <button class="home-btn big" id="btn-next"><span class="home-ic">${ICON.play}</span><span class="home-label">לשלב הבא</span></button>
      <button class="home-btn alt" id="btn-again"><span class="home-ic">${ICON.again}</span><span class="home-label">שוב</span></button>
      <button class="home-btn alt" id="btn-win-levels"><span class="home-ic">${ICON.levels}</span><span class="home-label">שלבים</span></button>
    </div>
  </div>

  <div id="ask" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="ask-text">
    <div class="card">
      <p id="ask-text"></p>
      <div class="row">
        <button class="home-btn yes" id="btn-yes"><span class="home-ic">${ICON.yes}</span><span class="home-label">כן</span></button>
        <button class="home-btn alt" id="btn-no"><span class="home-ic">${ICON.no}</span><span class="home-label">לא</span></button>
      </div>
    </div>
  </div>

  <div id="rotate" role="alert">
    <div class="rot-pic">${ICON_ROTATE}</div>
    <p>סובבו את המכשיר לרוחב</p>
  </div>
`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const game = new Game($<HTMLCanvasElement>('stage'), $<HTMLCanvasElement>('bg'), { fail: showFail, win: showWin });
let index = firstOpen();
const forced = params.get('level');
if (forced === 'lab') game.start(LAB, false);
else {
  if (forced && /^\d+$/.test(forced)) index = Math.max(0, Math.min(LEVELS.length - 1, Number(forced) - 1));
  game.start(LEVELS[index], false);
}

function isDone(i: number) { return store.done.includes(LEVELS[i].id); }
function isOpen(i: number) { return i === 0 || isDone(i - 1) || isDone(i); }
/** the first level not finished yet (or the last one) */
function firstOpen() {
  const i = LEVELS.findIndex((l) => !store.done.includes(l.id));
  return i < 0 ? LEVELS.length - 1 : i;
}

// ---------------------------------------------------------------- screens

function show(id: string, on: boolean) { $(id).classList.toggle('hidden', !on); }

function openHome() {
  game.paused = true;
  game.cancelDrag();
  const any = going() || store.done.length > 0;
  $('btn-play').querySelector('.home-label')!.textContent = any ? 'להמשיך' : 'לשחק';
  for (const id of ['win', 'fail', 'ask', 'pick']) show(id, false);
  show('home', true);
  show('topbar', false);
}

function enterLevel(i: number, drip = true) {
  index = i;
  for (const id of ['fail', 'win', 'ask', 'home', 'pick']) show(id, false);
  show('topbar', true);
  $('level-pill').textContent = String(i + 1);
  $('level-pill').setAttribute('aria-label', `שלב ${i + 1}`);
  game.start(LEVELS[i], drip);
  game.paused = false;
  lockLandscape();
  if (!counted) { counted = true; stats.start(); }
  stats.level(LEVELS[i].id);
}
/** one play per visit, counted when the first level starts */
let counted = false;
addEventListener('pagehide', () => stats.flush(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) stats.flush(true); });

/** Is a level under way (something done, not finished)? */
function going() { return game.touched && !game.over && game.level === LEVELS[index]; }

function resume() {
  show('home', false);
  show('topbar', true);
  game.paused = false;
}

function play() {
  if (going()) resume();
  // after a finished level, the next one; otherwise the level on the paper
  else enterLevel(game.won ? Math.min(LEVELS.length - 1, index + 1) : index);
}

function ask(text: string, yes: () => void) {
  game.paused = true;
  $('ask-text').textContent = text;
  show('ask', true);
  $('btn-yes').onclick = () => { show('ask', false); yes(); };
  $('btn-no').onclick = () => {
    show('ask', false);
    game.paused = !$('home').classList.contains('hidden') || !$('pick').classList.contains('hidden');
  };
  $('btn-no').focus();
}

function failText(info: FailInfo): string {
  if (info.kind === 'glitter') {
    return `ל${aDrop(colorName(info.mix))} יש עכשיו נצנצים, וזה לא מתאים לאף כוס. נסו לעקוף את פס הדבק.`;
  }
  if (info.kind === 'towel') {
    // "בעלי הכותרת", "בשמש": the area's name with ב (an opening ה goes away)
    const n = info.area ?? '';
    const where = 'ב' + (n.startsWith('ה') ? n.slice(1) : n);
    return `${where} יש עכשיו ${COLOR_HE[colorName(info.a)]}, אבל צריך שם ${COLOR_HE[colorName(info.b)]}. ננסה שוב?`;
  }
  if (info.kind === 'stuck') return 'הטיפות שנשארו כבר לא יכולות למלא את הכוסות. בואו ננסה שוב, ואולי נחבר או נפצל אחרת.';
  const a = colorName(info.a), b = colorName(info.b), m = colorName(info.mix);
  if (info.kind === 'touch') {
    return `${aDrop(a)} נגעה ב${aDrop(b)}, והן התערבבו ל${aDrop(m)}. כאן כל צבע הולך לכוס שלו, אז שומרים שטיפות בצבעים שונים לא ייגעו.`;
  }
  if (sameColor(info.a, info.b)) {
    return `שתי ${drops(a)} התחברו לטיפה גדולה מדי, ואף כוס כאן לא מחכה ל${aDrop(a)} כל כך גדולה.`;
  }
  return `${aDrop(a)} ו${aDrop(b)} התערבבו ל${aDrop(m)}, אבל אף כוס לא מחכה לטיפה כזאת.`;
}

function showFail(info: FailInfo) {
  game.paused = true;
  $('fail-text').textContent = failText(info);
  if (info.kind === 'stuck') paintLeft($<HTMLCanvasElement>('fail-pic'));
  else paintEquation($<HTMLCanvasElement>('fail-pic'), info);
  show('fail', true);
  $('btn-retry').focus();
}

function showWin() {
  if (game.level !== LAB) stats.won(game.level.id);
  if (game.level !== LAB && !store.done.includes(game.level.id)) { store.done.push(game.level.id); save(store); }
  const last = index >= LEVELS.length - 1;
  $('btn-next').hidden = last;
  show('win', true);
  (last ? $('btn-again') : $('btn-next')).focus();
}

// ---------------------------------------------------------------- level picker

/** The screen with every open level (from home or from the end of a level). */
function openPicker() {
  game.paused = true;
  game.cancelDrag();
  buildLevels();
  show('home', false);
  show('win', false);
  show('pick', true);
  (document.querySelector('.level-tile.current') as HTMLElement | null)?.focus();
}


function cupColors(l: Level): { c: string; glitter: boolean }[] {
  if (l.towel) {
    // a towel level: its picture's colours, or the three base colours for free colouring
    const cols = l.towel.picture ? PICTURES[l.towel.picture].map((a) => a.color) : (['red', 'yellow', 'blue'] as const);
    return cols.map((c) => ({ c: css(pigToRgb(PIG[c])), glitter: false }));
  }
  return l.cups.map((c) => ({ c: css(pigToRgb(PIG[c.color])), glitter: !!c.glitter }));
}

function buildLevels() {
  const box = $('levels');
  box.innerHTML = '';
  const current = going() ? index : firstOpen();
  LEVELS.forEach((l, i) => {
    const open = isOpen(i);
    if (!open && !isOpen(i - 1)) return; // only the next locked level is shown
    const b = document.createElement('button');
    b.className = 'level-tile' + (isDone(i) ? ' done' : '') + (i === current && open ? ' current' : '') + (open ? '' : ' locked');
    b.setAttribute('role', 'listitem');
    b.disabled = !open;
    b.setAttribute('aria-label', open ? `שלב ${i + 1}${isDone(i) ? ', הושלם' : ''}` : `שלב ${i + 1}, נעול`);
    const dots = cupColors(l).map((d) => `<i style="--c:${d.c}"${d.glitter ? ' class="glit"' : ''}></i>`).join('');
    b.innerHTML = open
      ? `<span class="num">${i + 1}</span><span class="dots">${dots}</span>${isDone(i) ? `<span class="badge">${ICON_STAR}</span>` : ''}`
      : `<span class="lock">${ICON_LOCK}</span><span class="dots">${dots}</span>`;
    if (open) {
      b.onclick = () => {
        if (going() && i === index) resume();
        else if (going()) ask('לעזוב את השלב הזה ולעבור לשלב אחר?', () => enterLevel(i));
        else enterLevel(i);
      };
    }
    box.appendChild(b);
  });
}

// ---------------------------------------------------------------- small pictures

/** Paint still drops into a small canvas (for the cards and the logo). */
function paintDrops(cv: HTMLCanvasElement, items: { x: number; y: number; vol: number; pig: Pig; glitter?: boolean }[], unit: number) {
  const ctx = cv.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  for (const it of items) {
    const d = new Drop(it.x, it.y, it.vol, it.pig);
    d.glitter = !!it.glitter;
    drawDrop(ctx, d, unit);
  }
}

/** The drops still on the paper, in a row (for the dead-end card). */
function paintLeft(cv: HTMLCanvasElement) {
  const unit = cv.height / 28;
  const w = cv.width / unit;
  const left = game.drops.slice(0, 6);
  paintDrops(cv, left.map((d, i) => ({ x: (w * (left.length - i - 0.5)) / left.length, y: 14, vol: Math.min(2.4, d.vol), pig: share(d.pig) })), unit);
}

function paintEquation(cv: HTMLCanvasElement, info: FailInfo) {
  const ctx = cv.getContext('2d')!;
  const unit = cv.height / 28;
  const w = cv.width / unit;
  const vol = (p: Pig) => Math.min(2.2, Math.max(1, (p[0] + p[1] + p[2]) * 0.9));
  if (info.kind === 'towel') {
    // what the area got ≠ what it wants
    paintDrops(cv, [
      { x: w * 0.75, y: 14, vol: 1.8, pig: share(info.a) },
      { x: w * 0.25, y: 14, vol: 1.8, pig: share(info.b) },
    ], unit);
    ctx.setTransform(unit, 0, 0, unit, 0, 0);
    ctx.fillStyle = '#5b6380';
    ctx.font = '700 9px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('≠', w * 0.5, 14.5);
    return;
  }
  if (info.kind === 'glitter') {
    // the drop + glitter = the drop with glitter
    paintDrops(cv, [
      { x: w * 0.86, y: 14, vol: 1.6, pig: share(info.a) },
      { x: w * 0.17, y: 14, vol: 1.9, pig: share(info.a), glitter: true },
    ], unit);
    ctx.setTransform(unit, 0, 0, unit, 0, 0);
    drawGlitterPile(ctx, w * 0.56, 13, 8.5);
  } else paintDrops(cv, [
    { x: w * 0.86, y: 14, vol: vol(info.a), pig: share(info.a) },
    { x: w * 0.56, y: 14, vol: vol(info.b), pig: share(info.b) },
    { x: w * 0.17, y: 14, vol: Math.min(3.2, vol(info.a) + vol(info.b)), pig: share(info.mix), glitter: info.glitter },
  ], unit);
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  ctx.fillStyle = '#5b6380';
  ctx.font = '700 9px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', w * 0.71, 14.5);
  ctx.fillText('=', w * 0.37, 14.5);
}


// ---------------------------------------------------------------- buttons

function refreshSound() {
  const b = $('btn-sound');
  b.innerHTML = store.muted ? ICON.soundOff : ICON.soundOn;
  b.setAttribute('aria-label', store.muted ? 'להפעיל צלילים' : 'להשתיק');
  b.setAttribute('aria-pressed', String(store.muted));
}
refreshSound();

/** Ask the browser to keep landscape where it can (Android, in full screen or installed). */
function lockLandscape() {
  try {
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    o.lock?.('landscape').catch(() => { /* not allowed here: the turn-the-device picture covers it */ });
  } catch { /* not supported */ }
}

addEventListener('pointerdown', unlock, { capture: true });
initSplash();
addEventListener('keydown', unlock, { capture: true });

$('btn-play').onclick = play;
$('btn-home').onclick = openHome;
$('btn-restart').onclick = () => (game.touched && !game.over ? ask('להתחיל את השלב מההתחלה?', () => enterLevel(index)) : enterLevel(index));
$('btn-retry').onclick = () => enterLevel(index);
$('btn-again').onclick = () => enterLevel(index);
$('btn-next').onclick = () => enterLevel(Math.min(LEVELS.length - 1, index + 1));
$('btn-win-levels').onclick = openPicker;
$('btn-levels').onclick = openPicker;
$('btn-pick-back').onclick = openHome;
$('btn-sound').onclick = () => {
  store.muted = !store.muted;
  save(store);
  setMuted(store.muted);
  refreshSound();
};

// ---------------------------------------------------------------- debug hooks

if (debug) (window as unknown as { __dd: Game }).__dd = game;
if (debug === 'play') enterLevel(index, true);
else if (debug === 'icon') {
  // one big drop on paper, for the app icons (screenshot it square)
  show('home', false);
  game.start({ id: 'icon', mixing: false, cups: [], drops: [] }, false);
  game.drops.push(new Drop(80, 50, 8, PIG.blue));
} else if (debug === 'sheet') {
  // every colour at a few sizes, to check the look
  show('home', false);
  game.start({ id: 'sheet', mixing: true, cups: [], drops: [] }, false);
  const cols: Pig[] = [PIG.red, PIG.yellow, PIG.blue, PIG.orange, PIG.purple, PIG.green, [1, 1, 1]];
  cols.forEach((pig, i) => [1, 2.5, 5].forEach((vol, j) => game.drops.push(new Drop(16 + i * 21, 20 + j * 26, vol, pig))));
} else if (debug === 'party') {
  // the celebration of the current level, at once
  enterLevel(index, false);
  game.drops = [];
  for (const c of game.cups) { c.got = c.total; c.filled = true; c.goal = 0.68; c.level = 0.68; }
  game.over = game.won = true;
  game.party = 0;
} else if (debug === 'lab') {
  show('home', false);
  show('topbar', true);
  game.start(LAB, true);
  game.paused = false;
} else openHome();
