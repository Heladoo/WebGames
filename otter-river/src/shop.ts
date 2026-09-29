import { items, ItemDef, Slot, SLOTS, itemById } from './art/items';
import { spriteURL } from './art/sprite';
import { worldArt } from './art/world';
import { numberCanvas } from './numbers';
import type { SaveData } from './state';

interface ShopDeps {
  data: SaveData;
  buy(item: ItemDef): boolean; // false when not affordable
  toggle(item: ItemDef): void;
  preview(item: ItemDef | null): void;
  click(): void;
  seen(id: string): void;
}

/** The River Market: a dock that stays open while the otter keeps floating. */
export class Shop {
  private tab: Slot = 'hat';
  private selected: string | null = null;
  private tabsEl = document.getElementById('shop-tabs')!;
  private gridEl = document.getElementById('shop-grid')!;
  private nameEl = document.getElementById('sel-name')!;
  private actionEl = document.getElementById('shop-action') as HTMLButtonElement;
  private icons = new Map<string, string>();
  private shellURL: string;
  private lockURL: string;
  private denyTimer = 0;

  constructor(private deps: ShopDeps) {
    const art = worldArt();
    this.shellURL = spriteURL(art.shell, 2);
    this.lockURL = spriteURL(art.icons.lock, 3);
    for (const it of items()) this.icons.set(it.id, spriteURL(it.frames[0], 3));

    for (const s of SLOTS) {
      const b = document.createElement('button');
      b.className = 'tab';
      b.dataset.slot = s.id;
      b.title = s.label;
      b.setAttribute('aria-label', s.label);
      b.innerHTML = `<img src="${spriteURL(art.icons[s.id], 3)}" alt="" /><span class="tab-label">${s.label}</span><span class="dot"></span>`;
      b.addEventListener('click', () => {
        this.deps.click();
        this.tab = s.id;
        this.select(null);
        document.getElementById('dock')!.classList.remove('collapsed');
        this.render();
      });
      this.tabsEl.appendChild(b);
    }
    this.actionEl.addEventListener('click', () => this.act());
  }

  /** Jump to an item (e.g. from a NEW banner). */
  focus(id: string) {
    const it = itemById(id);
    if (!it) return;
    this.tab = it.slot;
    document.getElementById('dock')!.classList.remove('collapsed');
    this.select(this.deps.data.owned.includes(id) ? null : id);
    if (this.deps.data.fresh.includes(id)) this.deps.seen(id);
    this.render();
    this.gridEl.querySelector('.card.selected')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private select(id: string | null) {
    this.selected = id;
    const it = itemById(id ?? undefined);
    const owned = it && this.deps.data.owned.includes(it.id);
    this.deps.preview(it && !owned ? it : null);
  }

  private act() {
    const it = itemById(this.selected ?? undefined);
    if (!it) return;
    const d = this.deps.data;
    if (!d.owned.includes(it.id)) {
      if (!this.deps.buy(it)) {
        this.deny(it.price - d.shells);
        return;
      }
      this.select(it.id);
    } else {
      this.deps.toggle(it);
    }
    this.render();
  }

  private deny(short: number) {
    const a = this.actionEl;
    a.classList.remove('shake');
    void a.offsetWidth; // restart the animation
    a.classList.add('shake');
    a.innerHTML = '';
    a.append('Need ', numberCanvas(short, 2), ' more');
    document.querySelectorAll('.wallet').forEach((w) => {
      w.classList.remove('flash');
      void (w as HTMLElement).offsetWidth;
      w.classList.add('flash');
    });
    clearTimeout(this.denyTimer);
    this.denyTimer = window.setTimeout(() => this.render(), 1600);
  }

  private isOn(it: ItemDef) {
    const d = this.deps.data;
    return it.slot === 'pet' ? d.pets.includes(it.id) : d.equipped[it.slot] === it.id;
  }

  render() {
    const d = this.deps.data;
    const fresh = new Set(d.fresh);
    for (const b of Array.from(this.tabsEl.children) as HTMLElement[]) {
      b.classList.toggle('active', b.dataset.slot === this.tab);
      b.classList.toggle('has-new', items().some((i) => i.slot === b.dataset.slot && fresh.has(i.id)));
    }

    this.gridEl.innerHTML = '';
    const list = items().filter((i) => i.slot === this.tab).sort((a, b) => (a.unlockAt - b.unlockAt) || (a.price - b.price));
    for (const it of list) {
      const locked = it.unlockAt > d.total;
      const owned = d.owned.includes(it.id);
      const on = this.isOn(it);
      const card = document.createElement('button');
      card.className = 'card';
      card.classList.toggle('selected', this.selected === it.id);
      card.classList.toggle('wearing', on);
      card.classList.toggle('locked', locked);
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.innerHTML = `<img src="${this.icons.get(it.id)}" alt="" />`;
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = locked ? '???' : it.name;
      const price = document.createElement('span');
      price.className = 'price';
      if (locked) {
        const lock = document.createElement('img');
        lock.className = 'lock-badge';
        lock.src = this.lockURL;
        lock.alt = 'Locked';
        icon.append(lock);
        price.classList.add('lock');
        price.append(Object.assign(document.createElement('img'), { src: this.lockURL, alt: '' }), numberCanvas(it.unlockAt, 2));
        card.title = `Locked: unlocks after collecting ${it.unlockAt} shells in total`;
        card.setAttribute('aria-label', card.title);
      } else if (owned) {
        price.classList.add('owned');
        price.textContent = on ? (it.slot === 'pet' ? 'With you' : 'Wearing') : 'Owned';
      } else {
        if (d.shells < it.price) price.classList.add('short');
        price.append(Object.assign(document.createElement('img'), { src: this.shellURL, alt: '' }), numberCanvas(it.price, 2));
      }
      card.append(icon, name, price);
      if (fresh.has(it.id) && !locked) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'NEW';
        card.append(badge);
      }
      card.addEventListener('click', () => {
        this.deps.click();
        if (fresh.has(it.id)) this.deps.seen(it.id);
        if (locked) {
          this.select(null);
          this.render();
          this.nameEl.textContent = `Locked: collect ${it.unlockAt - d.total} more shells to unlock`;
          return;
        }
        if (owned) {
          this.select(it.id);
          this.deps.toggle(it);
        } else {
          this.select(this.selected === it.id ? null : it.id);
        }
        this.render();
      });
      this.gridEl.appendChild(card);
    }

    const sel = itemById(this.selected ?? undefined);
    const a = this.actionEl;
    a.classList.remove('buy', 'off', 'shake', 'hidden');
    a.disabled = false;
    if (!sel) {
      this.nameEl.textContent = 'Tap to try on!';
      a.classList.add('hidden');
    } else if (!d.owned.includes(sel.id)) {
      this.nameEl.textContent = `Trying on: ${sel.name}`;
      a.innerHTML = '';
      a.append('Buy ', Object.assign(document.createElement('img'), { src: this.shellURL, alt: 'shells' }), numberCanvas(sel.price, 2));
      a.classList.add('buy');
    } else {
      const on = this.isOn(sel);
      this.nameEl.textContent = sel.name;
      a.textContent = on ? (sel.slot === 'pet' ? 'Send home' : 'Take off') : sel.slot === 'pet' ? 'Bring along' : 'Wear';
      if (on) a.classList.add('off');
    }
  }
}
