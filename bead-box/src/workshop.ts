// The make-a-bracelet screen: choose a shape tab, choose a color or design, hear and see the word, then place
// the bead on the bracelet. Nothing here can go wrong: any bead can go in any slot, and a bead can be replaced.

import { DESIGN_WORD, SHAPE_WORD, SLOTS, designsOf, phrase, placeById, wordsOf, type Bead, type DesignId, type ShapeId } from './content';
import { beadSVG, dotsIcon, shapeIcon } from './art/beads';
import { ICONS } from './art/ui';
import { placeArt, braceletSVG } from './scene';
import { addPhoto, encodeRecipe } from './album';
import { makePhoto } from './photo';
import { speech } from './speech';
import { sfx } from './sfx';
import { music } from './music';
import { unlockNext, type SaveData } from './state';
import { $, wait } from './dom';

export interface Finished {
  place: string;
  png: string;
  caption: string;
  recipe: string;
  newPlace: string | null;
}

export interface WorkshopHost {
  data: SaveData;
  persist(): void;
  openAlbum(): void;
  toMap(): void;
  finished(f: Finished): void;
}

export class Workshop {
  place = 'beach';
  shape: ShapeId = 'round';
  design: DesignId = 'blue';
  beads: (Bead | null)[] = Array(SLOTS).fill(null);
  private busy = false; // true while a finished bracelet is being turned into a picture

  constructor(private host: WorkshopHost) {
    $('tabs').addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-shape]');
      if (b) this.pickShape(b.dataset.shape as ShapeId);
    });
    $('designs').addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-design]');
      if (b) this.pickDesign(b.dataset.design as DesignId);
    });
    $('btn-say').addEventListener('click', () => void this.say(phrase(this.current()), 'both'));
    $('btn-place').addEventListener('click', () => this.placeAt(this.nextFree()));
    $('table').addEventListener('click', (e) => {
      const s = (e.target as Element).closest<SVGElement>('[data-slot]');
      if (s) this.placeAt(Number(s.dataset.slot));
    });
    $('btn-back').addEventListener('click', () => this.host.toMap());
    $('btn-album').addEventListener('click', () => this.host.openAlbum());
    $('btn-back').innerHTML = ICONS.back;
    $('btn-album').innerHTML = ICONS.album;
    $('btn-place').innerHTML = ICONS.check;
    $('btn-say').innerHTML = ICONS.speaker;
  }

  current(): Bead {
    return { shape: this.shape, design: this.design };
  }

  nextFree(): number {
    const i = this.beads.findIndex((b) => !b);
    return i < 0 ? 0 : i;
  }

  /** Open a place. A bracelet left unfinished last time is picked up where it was. */
  enter(placeId: string, preset?: (Bead | null)[]) {
    const place = placeById(placeId);
    this.place = place.id;
    this.beads = preset ? preset.slice(0, SLOTS).concat(Array(Math.max(0, SLOTS - preset.length)).fill(null)) : (this.host.data.drafts[place.id] ?? Array(SLOTS).fill(null)).slice();
    this.shape = 'round';
    this.design = place.colors[0];
    this.busy = false;
    $('bg').innerHTML = placeArt(place.id);
    music.setPlace(place.id);
    this.renderAll();
    void speech.say(place.name, { rate: 0.9 });
  }

  /** Start a fresh bracelet in the same place. */
  restart() {
    this.beads = Array(SLOTS).fill(null);
    delete this.host.data.drafts[this.place];
    this.host.persist();
    this.busy = false;
    this.renderTable();
    this.renderPill();
  }

  // ---------- drawing ----------

  renderAll() {
    this.renderPill();
    this.renderTabs();
    this.renderDesigns();
    this.renderCard();
    this.renderTable();
  }

  renderPill() {
    const p = placeById(this.place);
    const done = Math.min(5, this.host.data.finished[p.id] ?? 0);
    $('place-pill').innerHTML =
      `<div class="place-thumb"><svg viewBox="40 150 320 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${placeArt(p.id)}</svg></div>` +
      `<div><div class="place-name">${p.name}</div><div class="dots" role="img" aria-label="${done} bracelets finished here">${Array.from({ length: 5 }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')}</div></div>`;
  }

  renderTabs() {
    const p = placeById(this.place);
    $('tabs').innerHTML = p.shapes
      .map((s) => `<button class="tab" role="tab" data-shape="${s}" aria-selected="${s === this.shape}" aria-label="${SHAPE_WORD[s]}">${s === 'round' ? dotsIcon('currentColor', 28) : shapeIcon(s, 'currentColor', 28)}</button>`)
      .join('');
  }

  renderDesigns() {
    const p = placeById(this.place);
    $('designs').innerHTML = designsOf(p)
      .map((d) => `<button class="design" role="option" data-design="${d}" aria-selected="${d === this.design}" aria-label="${DESIGN_WORD[d]}">${beadSVG(this.shape, d, 64, true)}</button>`)
      .join('');
  }

  renderCard(highlight: 'design' | 'shape' | 'both' | null = null) {
    const b = this.current();
    $('word-bead').innerHTML = beadSVG(b.shape, b.design, 68, false);
    const noun = b.shape === 'round' ? 'bead' : SHAPE_WORD[b.shape];
    const hi = (k: 'design' | 'shape') => (highlight === k || highlight === 'both' ? ' say' : '');
    $('word-text').innerHTML = `<span class="${hi('design').trim()}">${DESIGN_WORD[b.design]}</span> <span class="${hi('shape').trim()}">${noun}</span>`;
  }

  renderTable(fresh: number | null = null) {
    const next = this.beads.findIndex((b) => !b);
    $('table').innerHTML = braceletSVG(this.place, this.beads, { next: next < 0 ? null : next, fresh, interactive: true });
  }

  // ---------- choosing ----------

  pickShape(s: ShapeId) {
    this.shape = s;
    sfx.tap();
    this.renderTabs();
    this.renderDesigns();
    this.renderCard('shape');
    void this.say(SHAPE_WORD[s] === 'round' ? 'round bead' : SHAPE_WORD[s], 'shape');
  }

  pickDesign(d: DesignId) {
    this.design = d;
    sfx.tap();
    this.renderDesigns();
    this.renderCard('design');
    void this.say(DESIGN_WORD[d], 'design');
  }

  /** Say a word and light up the matching word on the card. Without a voice, a soft two-note chime plays instead. */
  async say(text: string, which: 'design' | 'shape' | 'both') {
    this.renderCard(which);
    if (!speech.available) {
      sfx.wordChime();
      await wait(700);
    } else {
      await speech.say(text, { rate: 0.95 });
    }
    this.renderCard();
  }

  // ---------- placing ----------

  placeAt(i: number) {
    if (this.busy || i < 0 || i >= SLOTS) return;
    const bead = this.current();
    this.beads[i] = bead;
    sfx.place();
    const data = this.host.data;
    for (const w of wordsOf(bead)) data.learned[w] = (data.learned[w] ?? 0) + 1;
    const full = this.beads.every(Boolean);
    if (!full) data.drafts[this.place] = this.beads.slice();
    this.host.persist();
    this.renderTable(i);
    const spoken = this.say(phrase(bead), 'both');
    if (full) void this.finish(spoken);
  }

  private async finish(spoken: Promise<void>) {
    this.busy = true;
    await spoken;
    const place = placeById(this.place);
    const data = this.host.data;
    sfx.success();
    let png = '';
    let caption = '';
    try {
      ({ png, caption } = await makePhoto(place.id, this.beads));
    } catch {
      // a picture could not be drawn (very old browser): the bracelet still counts
    }
    const recipe = encodeRecipe({ place: place.id, beads: this.beads.filter((b): b is Bead => !!b) });
    if (png) await addPhoto({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, png, caption, recipe, at: Date.now() });
    data.finished[place.id] = (data.finished[place.id] ?? 0) + 1;
    const newPlace = unlockNext(data);
    delete data.drafts[place.id];
    this.host.persist();
    this.renderPill();
    this.host.finished({ place: place.id, png, caption, recipe, newPlace });
    void speech.say(place.cheer, { rate: 0.9 });
  }
}
