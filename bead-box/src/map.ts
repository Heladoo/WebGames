// The map: every place as a card. Open places can be played again and again; locked ones open by finishing a bracelet.

import { PLACES } from './content';
import { ICONS } from './art/ui';
import { fillThumbs, thumb } from './backdrop';
import type { SaveData } from './state';
import { $ } from './dom';

export function renderMap(data: SaveData, onPick: (id: string) => void, onLocked: (id: string) => void, highlight: string | null = null) {
  const grid = $('map-grid');
  grid.innerHTML = PLACES.map((p) => {
    const open = data.unlocked.includes(p.id);
    const done = Math.min(5, data.finished[p.id] ?? 0);
    const dots = `<div class="dots" role="img" aria-label="${data.finished[p.id] ?? 0} bracelets finished">${Array.from({ length: 5 }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')}</div>`;
    return (
      `<button class="place-card${open ? '' : ' locked'}${highlight === p.id ? ' new' : ''}" data-place="${p.id}" aria-label="${p.name}${open ? '' : ', locked. Finish a bracelet to open it'}">` +
      `<div class="thumb">${thumb(p.id)}</div>` +
      (open ? '' : `<div class="lock"><span>${ICONS.lock}<br/>Finish a bracelet<br/>to open</span></div>`) +
      `<b>${p.name}</b>${open ? dots : ''}</button>`
    );
  }).join('');
  fillThumbs(grid);
  grid.onclick = (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-place]');
    if (!card) return;
    const id = card.dataset.place!;
    if (data.unlocked.includes(id)) onPick(id);
    else {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      onLocked(id);
    }
  };
}
