// The app: one save, one screen at a time (plain DOM), the shared top bar (home, coins, shop, and the grown-ups
// gear that needs a long press), the grown-ups panel, and the settings that drive sound and music.

import { ICONS } from './art/icons';
import { TRACKS, type TrackId } from './art/tracks';
import { sfx } from './sfx';
import { music } from './music';
import { clearAll, defaults, save, type SaveData } from './state';
import { holdButton } from './ui';

export type Screen = 'title' | 'map' | 'animal' | 'kid' | 'shop' | 'race';

export class App {
  data: SaveData;
  root: HTMLElement;
  /** Where the shop goes back to. */
  back: Screen = 'map';
  private screens: Partial<Record<Screen, (app: App) => void>> = {};

  constructor(root: HTMLElement, data: SaveData) {
    this.root = root;
    this.data = data;
    this.applySettings();
    // the audio can only start from a tap or a key press
    const unlock = () => {
      sfx.unlock();
      if (sfx.context && sfx.bus) music.start(sfx.context, sfx.bus);
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => (document.hidden ? sfx.suspend() : sfx.resume()));
  }

  register(s: Screen, f: (app: App) => void) {
    this.screens[s] = f;
  }

  go(s: Screen) {
    document.querySelectorAll('.overlay.grownups').forEach((e) => e.remove());
    this.screens[s]?.(this);
  }

  save() {
    save(this.data);
  }

  applySettings() {
    const st = this.data.settings;
    sfx.enabled = st.sound;
    sfx.setVolume(st.volume);
    music.setOn(st.music);
  }

  setTrack(t: TrackId | 'menu') {
    music.setTrack(t);
  }

  /** The top bar of the menu screens. */
  topbar(opts: { home?: boolean; shop?: boolean } = {}) {
    return `<header class="topbar">
      ${opts.home === false ? '<span></span>' : `<button class="round-btn" data-tb="home" aria-label="לבית">${ICONS.home}</button>`}
      <div class="tb-right">
        <div class="pill coins" data-tb="coins" aria-label="${this.data.coins} מטבעות">${ICONS.coin}<span>${this.data.coins}</span></div>
        ${opts.shop === false ? '' : `<button class="round-btn" data-tb="shop" aria-label="חנות">${ICONS.shop}</button>`}
        <button class="round-btn small hold" data-tb="gear" aria-label="להורים: לחיצה ארוכה">${ICONS.gear}</button>
      </div>
    </header>`;
  }

  wireTopbar(el: HTMLElement, here: Screen) {
    el.querySelector('[data-tb="home"]')?.addEventListener('click', () => {
      sfx.tap();
      this.go(here === 'map' ? 'title' : 'map');
    });
    el.querySelector('[data-tb="shop"]')?.addEventListener('click', () => {
      sfx.tap();
      this.back = here;
      this.go('shop');
    });
    const gear = el.querySelector<HTMLElement>('[data-tb="gear"]');
    if (gear) holdButton(gear, 1500, () => this.grownups());
  }

  /** Show the coin count everywhere it is on screen. */
  showCoins() {
    document.querySelectorAll('[data-tb="coins"]').forEach((p) => {
      p.querySelector('span')!.textContent = String(this.data.coins);
      p.setAttribute('aria-label', `${this.data.coins} מטבעות`);
    });
  }

  /** The grown-ups panel: sound, music, volume, help mode, starting over, and what is (not) collected. */
  grownups() {
    sfx.tap();
    const st = this.data.settings;
    const o = document.createElement('div');
    o.className = 'overlay grownups';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'הגדרות להורים');
    const sw = (id: string, icon: string, label: string, on: boolean) =>
      `<label class="setting">${icon}<span>${label}</span><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i class="switch"></i></label>`;
    o.innerHTML = `<div class="card sheet">
      <header class="sheet-head"><h2>להורים</h2><button class="round-btn small" data-close aria-label="לסגור">${ICONS.close}</button></header>
      ${sw('g-music', ICONS.music, 'מוזיקה', st.music)}
      ${sw('g-sound', ICONS.soundOn, 'צלילים', st.sound)}
      <label class="setting">${ICONS.soundOn}<span>עוצמה</span><input type="range" id="g-vol" min="0" max="100" step="5" value="${Math.round(st.volume * 100)}" aria-label="עוצמה"></label>
      ${sw('g-help', ICONS.hand, 'עזרה: החיה מתחמקת לפעמים לבד', st.help)}
      <p class="note">${this.data.races} מרוצים, ${this.data.wins} ניצחונות, ${this.data.coins} מטבעות, ${this.data.unlocked.length} מתוך ${TRACKS.length} מסלולים פתוחים.</p>
      <div class="row-btns"><button class="round-btn hold" id="g-reset" aria-label="להתחיל מחדש: לחיצה ארוכה">${ICONS.again}</button><span class="note">להתחיל מחדש (לחיצה ארוכה)</span></div>
      <p class="note">ההתקדמות נשמרת רק בדפדפן הזה. אין חשבונות, אין פרסומות ואין עוגיות. נאספת רק ספירה אנונימית של משחקים וזמן משחק.</p>
    </div>`;
    document.body.appendChild(o);
    const $ = <T extends HTMLElement>(s: string) => o.querySelector<T>(s)!;
    const close = () => o.remove();
    o.addEventListener('click', (e) => {
      if (e.target === o) close();
    });
    $('[data-close]').addEventListener('click', close);
    const bind = (id: string, f: (v: boolean) => void) => $<HTMLInputElement>(id).addEventListener('change', (e) => {
      f((e.target as HTMLInputElement).checked);
      this.applySettings();
      this.save();
    });
    bind('#g-music', (v) => (st.music = v));
    bind('#g-sound', (v) => (st.sound = v));
    bind('#g-help', (v) => (st.help = v));
    $<HTMLInputElement>('#g-vol').addEventListener('input', (e) => {
      st.volume = Number((e.target as HTMLInputElement).value) / 100;
      this.applySettings();
      this.save();
    });
    holdButton($('#g-reset'), 1000, () => {
      const c = document.createElement('div');
      c.className = 'confirm';
      c.innerHTML = `<button class="round-btn" id="g-yes" aria-label="כן, להתחיל מחדש">${ICONS.check}</button><button class="round-btn" id="g-no" aria-label="לא">${ICONS.close}</button>`;
      $('.sheet').appendChild(c);
      c.querySelector('#g-no')!.addEventListener('click', () => c.remove());
      c.querySelector('#g-yes')!.addEventListener('click', () => {
        clearAll();
        const keep = this.data.settings;
        this.data = { ...defaults(), settings: keep };
        this.save();
        close();
        this.go('title');
      });
    });
  }
}
