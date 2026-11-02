import './styles.css';
import { colorName, PIG, type Pig } from './color';
import { Drop } from './drop';
import { type FailInfo, Game } from './game';
import { ICON } from './icons';
import { LEVELS } from './levels';
import { drawDrop, drawPaper } from './render';
import { setMuted, unlock } from './sfx';
import { load, save } from './state';

const params = new URLSearchParams(location.search);
const debug = params.get('debug') ?? '';
const level = LEVELS[params.get('level') ?? ''] ?? LEVELS.sample;
const store = load();
setMuted(store.muted);

// the feminine form, since a drop (טיפה) is feminine in Hebrew
const DROP_HE: Record<string, string> = {
  red: 'אדומה', yellow: 'צהובה', blue: 'כחולה', orange: 'כתומה', purple: 'סגולה', green: 'ירוקה', brown: 'חומה',
};

const app = document.getElementById('app')!;
app.innerHTML = `
  <canvas id="stage" aria-label="דף נייר עם טיפות צבע וכוסות. גוררים טיפה באצבע."></canvas>
  <div id="topbar">
    <button class="round" id="btn-home" aria-label="מסך הבית">${ICON.home}</button>
    <span class="grow"></span>
    <button class="round" id="btn-restart" aria-label="להתחיל את השלב מחדש">${ICON.again}</button>
    <button class="round" id="btn-sound" aria-label="צלילים"></button>
  </div>

  <div id="home" class="screen">
    <div class="title-card">
      <div class="title-logo">
        <canvas id="logo-drops" width="300" height="130" aria-hidden="true"></canvas>
        <h1 lang="en" dir="ltr">Drop the Drop</h1>
        <p class="sub">טיפות צבע לכוסות</p>
      </div>
      <div class="home-buttons">
        <button class="home-btn" id="btn-play"><span class="home-ic">${ICON.play}</span><span class="home-label">לשחק</span></button>
        <button class="home-btn alt" id="btn-new" hidden><span class="home-ic">${ICON.again}</span><span class="home-label">מההתחלה</span></button>
      </div>
      <a class="portal-link" href="https://dorothy-games.vercel.app/" aria-label="Dorothy Games: more games"><img src="/dorothy-logo.webp" alt="" width="180" height="90"></a>
      <p class="fine">בלי פרסומות, בלי חשבונות ובלי עוגיות. שום דבר לא נספר ולא נשלח.</p>
    </div>
  </div>

  <div id="fail" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="fail-text">
    <div class="card">
      <canvas id="fail-pic" width="560" height="170" aria-hidden="true"></canvas>
      <p id="fail-text"></p>
      <button class="home-btn" id="btn-retry"><span class="home-ic">${ICON.again}</span><span class="home-label">עוד פעם</span></button>
    </div>
  </div>

  <div id="win" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="win-title">
    <div class="card">
      <h2 id="win-title">כל הכבוד!</h2>
      <canvas id="win-pic" width="520" height="170" aria-hidden="true"></canvas>
      <div class="row">
        <button class="home-btn" id="btn-again"><span class="home-ic">${ICON.again}</span><span class="home-label">שוב</span></button>
        <button class="home-btn alt" id="btn-win-home"><span class="home-ic">${ICON.home}</span><span class="home-label">הביתה</span></button>
      </div>
    </div>
  </div>

  <div id="ask" class="screen hidden" role="dialog" aria-modal="true" aria-labelledby="ask-text">
    <div class="card">
      <p id="ask-text">להתחיל את השלב מההתחלה?</p>
      <div class="row">
        <button class="home-btn yes" id="btn-yes"><span class="home-ic">${ICON.yes}</span><span class="home-label">כן</span></button>
        <button class="home-btn alt" id="btn-no"><span class="home-ic">${ICON.no}</span><span class="home-label">לא</span></button>
      </div>
    </div>
  </div>
`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const game = new Game($<HTMLCanvasElement>('stage'), { fail: showFail, win: showWin });
game.start(level, false);

// ---------------------------------------------------------------- screens

function show(id: string, on: boolean) { $(id).classList.toggle('hidden', !on); }

function openHome() {
  game.paused = true;
  const going = game.touched && !game.over;
  $('btn-play').querySelector('.home-label')!.textContent = going ? 'להמשיך' : 'לשחק';
  $('btn-new').hidden = !going;
  show('home', true);
  $('topbar').classList.add('hidden');
}

function play() {
  show('home', false);
  $('topbar').classList.remove('hidden');
  if (game.over) game.start(level, true);
  else if (!game.touched) game.dripIn();
  game.paused = false;
}

function restart() {
  for (const id of ['fail', 'win', 'ask', 'home']) show(id, false);
  $('topbar').classList.remove('hidden');
  game.start(level, true);
  game.paused = false;
}

function ask(text: string, yes: () => void) {
  game.paused = true;
  $('ask-text').textContent = text;
  show('ask', true);
  $('btn-yes').onclick = () => { show('ask', false); yes(); };
  $('btn-no').onclick = () => { show('ask', false); game.paused = !$('home').classList.contains('hidden'); };
}

function showFail(info: FailInfo) {
  game.paused = true;
  const a = DROP_HE[colorName(info.a)], b = DROP_HE[colorName(info.b)], m = DROP_HE[colorName(info.mix)];
  $('fail-text').textContent = `טיפה ${a} נגעה בטיפה ${b}, והן התערבבו לטיפה ${m}. כאן כל צבע הולך לכוס שלו, אז שומרים שטיפות בצבעים שונים לא ייגעו.`;
  paintEquation($<HTMLCanvasElement>('fail-pic'), info);
  show('fail', true);
  $('btn-retry').focus();
}

function showWin() {
  game.paused = true;
  if (!store.done.includes(level.id)) { store.done.push(level.id); save(store); }
  paintRow($<HTMLCanvasElement>('win-pic'), game.cups.map((c) => c.pig));
  show('win', true);
  $('btn-again').focus();
}

// ---------------------------------------------------------------- small pictures

/** Paint still drops into a small canvas (for the cards and the logo). */
function paintDrops(cv: HTMLCanvasElement, items: { x: number; y: number; vol: number; pig: Pig }[], unit: number, paper = false) {
  const w = cv.width, h = cv.height;
  if (cv.dataset.w !== String(w)) {
    cv.style.width = w / 2 + 'px';
    cv.dataset.w = String(w);
  }
  const ctx = cv.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (paper) drawPaper(ctx, w, h);
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  for (const it of items) {
    const d = new Drop(it.x, it.y, it.vol, it.pig);
    drawDrop(ctx, d, unit);
  }
}

function paintEquation(cv: HTMLCanvasElement, info: FailInfo) {
  const ctx = cv.getContext('2d')!;
  const unit = cv.height / 26;
  const w = cv.width / unit;
  const share = (p: Pig) => { const s = p[0] + p[1] + p[2]; return [p[0] / s, p[1] / s, p[2] / s] as Pig; };
  paintDrops(cv, [
    { x: w * 0.86, y: 13, vol: 1.6, pig: share(info.a) },
    { x: w * 0.56, y: 13, vol: 1.6, pig: share(info.b) },
    { x: w * 0.16, y: 13, vol: 3.2, pig: share(info.mix) },
  ], unit);
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  ctx.fillStyle = '#5b6380';
  ctx.font = '700 9px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', w * 0.71, 13.5);
  ctx.fillText('=', w * 0.37, 13.5);
}

function paintRow(cv: HTMLCanvasElement, pigs: Pig[]) {
  const unit = cv.height / 26;
  const w = cv.width / unit;
  paintDrops(cv, pigs.map((pig, i) => ({ x: (w * (pigs.length - i - 0.5)) / pigs.length, y: 12, vol: 2.6, pig })), unit);
}

paintDrops($<HTMLCanvasElement>('logo-drops'), [
  { x: 10, y: 9.5, vol: 1, pig: PIG.red },
  { x: 22.5, y: 10, vol: 1.7, pig: PIG.yellow },
  { x: 35, y: 9.5, vol: 1.25, pig: PIG.blue },
], 300 / 46);

// ---------------------------------------------------------------- buttons

function refreshSound() {
  const b = $('btn-sound');
  b.innerHTML = store.muted ? ICON.soundOff : ICON.soundOn;
  b.setAttribute('aria-label', store.muted ? 'להפעיל צלילים' : 'להשתיק');
  b.setAttribute('aria-pressed', String(store.muted));
}
refreshSound();

addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });

$('btn-play').onclick = play;
$('btn-new').onclick = () => ask('להתחיל את השלב מההתחלה?', restart);
$('btn-home').onclick = openHome;
$('btn-restart').onclick = () => (game.touched && !game.over ? ask('להתחיל את השלב מההתחלה?', restart) : restart());
$('btn-retry').onclick = restart;
$('btn-again').onclick = restart;
$('btn-win-home').onclick = () => { show('win', false); openHome(); };
$('btn-sound').onclick = () => {
  store.muted = !store.muted;
  save(store);
  setMuted(store.muted);
  refreshSound();
};

// ---------------------------------------------------------------- debug hooks

if (debug) (window as unknown as { __dd: Game }).__dd = game;
if (debug === 'play') play();
if (debug === 'icon') {
  // one big drop on paper, for the app icons (screenshot it square)
  show('home', false);
  $('topbar').classList.add('hidden');
  game.start({ id: 'icon', mixing: false, cups: [], drops: [] }, false);
  const d = new Drop(game.W / 2, game.H / 2, 22, PIG.blue);
  game.drops.push(d);
}
if (debug === 'sheet') {
  // every colour at a few sizes, plus a stretched one, to check the look
  show('home', false);
  $('topbar').classList.add('hidden');
  game.start({ id: 'sheet', mixing: true, cups: [], drops: [] }, false);
  const cols: Pig[] = [PIG.red, PIG.yellow, PIG.blue, PIG.orange, PIG.purple, PIG.green, [1, 1, 1]];
  cols.forEach((pig, i) => {
    [1, 3, 6].forEach((vol, j) => game.drops.push(new Drop(10 + i * ((game.W - 20) / 6), 22 + j * 24, vol, pig)));
  });
}
if (params.has('debug')) document.documentElement.dataset.debug = debug;
if (debug === '' || debug === 'state') openHome();
