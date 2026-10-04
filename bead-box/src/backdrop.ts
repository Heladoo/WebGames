// Shows the painted scenery: the full-screen background and the small thumbnails on the map and place pill.

import { scenePicture } from './scene';
import { setAmbient } from './ambient';
import { $ } from './dom';

/** The colour behind each scene's picture, shown for the instant before it is painted. */
const SKY: Record<string, string> = { beach: '#6cc6f6', woods: '#cfeccd', ball: '#241f6b', city: '#7cc8ff', snow: '#a9d8f7', garden: '#8fd6f5' };

/** How big to paint the background: enough pixels for this screen (cover fits the scene to the screen), at most 3x. */
function bgScale(): number {
  const dpr = window.devicePixelRatio || 1;
  const need = Math.max((innerWidth * dpr) / 400, (innerHeight * dpr) / 700);
  return Math.min(3, Math.max(2, Math.ceil(need)));
}

export function setBackdrop(place: string) {
  const img = $('bg') as HTMLImageElement;
  img.dataset.place = place;
  $('app').style.background = SKY[place] ?? SKY.beach;
  setAmbient(place);
  void scenePicture(place, bgScale()).then((p) => {
    if (img.dataset.place === place) img.src = p.url;
  });
}

/** Markup for a thumbnail; call fillThumbs on its container afterwards. */
export const thumb = (place: string, cls = '') => `<img class="${cls}" data-scene="${place}" alt="" draggable="false" />`;

export function fillThumbs(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>('img[data-scene]').forEach((img) => {
    void scenePicture(img.dataset.scene!, 0.75).then((p) => {
      img.src = p.url;
    });
  });
}
