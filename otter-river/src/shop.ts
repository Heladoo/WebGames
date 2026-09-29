import { items, ItemDef, itemById, Slot, SLOTS } from './art/items';
import { spriteURL } from './art/sprite';
import { worldArt } from './art/world';
import { WORLD } from './art/palette';
import { drawOtter, Equipped, IDLE_POSE, itemFrame, Pose } from './otterDraw';
import type { SaveData } from './state';

interface ShopDeps {
  data: SaveData;
  onBuy(item: ItemDef): void;
  onEquip(item: ItemDef, on: boolean): void;
  click(): void;
}

const PREVIEW_W = 60;
const PREVIEW_H = 72;

export class Shop {
  private tab: Slot = 'hat';
  private selected: string | null = null;
  private tabsEl = document.getElementById('shop-tabs')!;
  private gridEl = document.getElementById('shop-grid')!;
  private nameEl = document.getElementById('preview-name')!;
  private actionEl = document.getElementById('shop-action') as HTMLButtonElement;
  private canvas = document.getElementById('preview') as HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private icons = new Map<string, string>();
  private shellURL: string;

  constructor(private deps: ShopDeps) {
    this.canvas.width = PREVIEW_W;
    this.canvas.height = PREVIEW_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.shellURL = spriteURL(worldArt().shell, 4);
    for (const it of items()) this.icons.set(it.id, spriteURL(it.frames[0], 4));

    for (const s of SLOTS) {
      const b = document.createElement('button');
      b.className = 'tab';
      b.textContent = s.label;
      b.dataset.slot = s.id;
      b.addEventListener('click', () => {
        this.deps.click();
        this.tab = s.id;
        this.selected = null;
        this.render();
      });
      this.tabsEl.appendChild(b);
    }

    this.actionEl.addEventListener('click', () => this.act());
  }

  open() {
    const firstAffordable = items().find((i) => !this.deps.data.owned.includes(i.id) && i.price <= this.deps.data.shells);
    if (firstAffordable) {
      this.tab = firstAffordable.slot;
      this.selected = firstAffordable.id;
    }
    this.render();
  }

  private act() {
    const it = itemById(this.selected ?? undefined);
    if (!it) return;
    const d = this.deps.data;
    if (!d.owned.includes(it.id)) {
      if (d.shells < it.price) return;
      this.deps.onBuy(it);
    } else {
      this.deps.onEquip(it, d.equipped[it.slot] !== it.id);
    }
    this.render();
  }

  render() {
    const d = this.deps.data;
    for (const b of Array.from(this.tabsEl.children) as HTMLElement[]) {
      b.classList.toggle('active', b.dataset.slot === this.tab);
    }
    this.gridEl.innerHTML = '';
    for (const it of items().filter((i) => i.slot === this.tab)) {
      const owned = d.owned.includes(it.id);
      const wearing = d.equipped[it.slot] === it.id;
      const card = document.createElement('button');
      card.className = 'card';
      card.classList.toggle('selected', this.selected === it.id);
      card.classList.toggle('wearing', wearing);
      const priceHTML = owned
        ? `<span class="price owned">${wearing ? 'Wearing' : 'Owned'}</span>`
        : `<span class="price ${d.shells < it.price ? 'short' : ''}"><img src="${this.shellURL}" alt="" />${it.price}</span>`;
      card.innerHTML = `<span class="icon"><img src="${this.icons.get(it.id)}" alt="" /></span><span class="name">${it.name}</span>${priceHTML}`;
      card.addEventListener('click', () => {
        this.deps.click();
        if (this.selected === it.id && owned) {
          this.act();
          return;
        }
        this.selected = it.id;
        this.render();
      });
      this.gridEl.appendChild(card);
    }

    const sel = itemById(this.selected ?? undefined);
    const a = this.actionEl;
    a.classList.remove('buy', 'off');
    if (!sel) {
      this.nameEl.textContent = 'Pick something nice';
      a.textContent = 'Choose an item';
      a.disabled = true;
    } else if (!d.owned.includes(sel.id)) {
      this.nameEl.textContent = sel.name;
      const short = sel.price - d.shells;
      a.disabled = short > 0;
      a.textContent = short > 0 ? `Need ${short} more` : `Buy for ${sel.price}`;
      a.classList.add('buy');
    } else {
      this.nameEl.textContent = sel.name;
      const wearing = d.equipped[sel.slot] === sel.id;
      a.disabled = false;
      a.textContent = wearing ? 'Take off' : sel.slot === 'pet' ? 'Bring along' : 'Wear';
      if (wearing) a.classList.add('off');
    }
  }

  /** Animated try-on preview, called every frame while the shop is open. */
  draw(t: number) {
    const ctx = this.ctx;
    ctx.fillStyle = WORLD.water;
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.fillStyle = WORLD.waterLight;
    for (let i = 0; i < 7; i++) {
      const y = (i * 11 + Math.floor(t * 6)) % PREVIEW_H;
      ctx.fillRect((i * 17) % (PREVIEW_W - 6), y, 3 + (i % 3), 1);
    }

    const eq: Equipped = { ...this.deps.data.equipped };
    const sel = itemById(this.selected ?? undefined);
    if (sel) eq[sel.slot] = sel.id;

    const breath = Math.sin((t * Math.PI * 2) / 2.8);
    const pose: Pose = {
      ...IDLE_POSE,
      bob: Math.round(Math.sin((t * Math.PI * 2) / 3.4) * 1.2),
      hb: breath > 0.35 ? 1 : 0,
      pawL: breath < -0.35 ? -1 : 0,
      pawR: breath < -0.35 ? -1 : 0,
      tail: Math.round(Math.sin((t * Math.PI * 2) / 2.2)),
      eyes: t % 4 < 0.14 ? 'closed' : 'open',
    };
    const ox = 28;
    const oy = 52;
    drawOtter(ctx, ox, oy, pose, eq, t);
    const pet = itemById(eq.pet);
    if (pet?.pet === 'follow') {
      const f = itemFrame(pet, t);
      ctx.drawImage(f.canvas, 49 - f.px, 62 - f.py + Math.round(Math.sin(t * 2.4)));
    } else if (pet?.pet === 'fly') {
      const f = itemFrame(pet, t);
      ctx.drawImage(f.canvas, ox + Math.round(Math.sin(t * 0.9) * 16) - f.px, 18 + Math.round(Math.sin(t * 1.7) * 4) - f.py);
    }
  }
}
