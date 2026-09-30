import { heroArt, HEROES } from './art/characters';
import { svgBox } from './art/palette';
import { RIDES } from './art/rides';
import { WEAR_SLOT } from './art/wearables';
import { ALL_WORDS, picture } from './content';
import { LOWER, UPPER } from './glyphs';
import { sceneMarkup } from './scene';
import { newTrip } from './state';

// Debug pages for checking art: ?debug=wardrobe, ?debug=words, ?debug=glyphs,
// plus ?debug=icon and ?debug=og, which draw the app icon and link-preview image.

export function runDebug(kind: string) {
  document.body.innerHTML = '';
  document.body.className = 'debug';
  const wrap = document.createElement('div');
  wrap.className = 'debug-grid';
  document.body.appendChild(wrap);
  const cell = (svg: string, label: string) => {
    const d = document.createElement('figure');
    d.innerHTML = `${svg}<figcaption>${label}</figcaption>`;
    wrap.appendChild(d);
  };

  if (kind === 'icon' || kind === 'og') {
    // app icons and the link-preview image, drawn from the game's own art
    document.body.className = 'debug-art';
    const trip = { ...newTrip(), hero: 'dog', worn: { head: 'hat' as const }, friends: ['bee'], place: 'park' };
    const heroX = 430;
    document.body.innerHTML = kind === 'icon'
      ? `<svg viewBox="0 0 200 200" style="width:100vmin;height:100vmin;display:block"><rect width="200" height="200" fill="#bfe6f5"/>
          <circle cx="100" cy="112" r="84" fill="#fffaf4"/><g transform="translate(14 22) scale(0.86)">${heroArt('dog', { worn: { head: 'hat' } })}</g></svg>`
      : `<svg viewBox="${heroX - 470} 20 800 420" style="width:100vw;height:100vh;display:block" preserveAspectRatio="xMidYMid slice">${sceneMarkup(trip, { x0: heroX - 470, y0: 20, w: 800, h: 420 }, heroX)}</svg>
          <div class="og-title">Word Trail</div>`;
    wrap.remove();
    return;
  }

  if (kind === 'wardrobe') {
    const wear = Object.keys(WEAR_SLOT);
    for (const hero of HEROES) {
      cell(svgBox(heroArt(hero), '-10 -10 220 220'), hero);
      for (const w of wear) cell(svgBox(heroArt(hero, { worn: { [WEAR_SLOT[w]]: w } }), '-10 -10 220 220'), `${hero} + ${w}`);
      cell(svgBox(heroArt(hero, { worn: { head: 'crown', neck: 'scarf', feet: 'boots', back: 'bag', face: 'glasses' }, carry: 'balloon' }), '-10 -10 220 220'), `${hero} + all`);
      for (const r of Object.keys(RIDES)) {
        const ride = RIDES[r];
        cell(svgBox(`${ride.under}<g transform="translate(0 ${ride.dy})">${heroArt(hero, { seated: true, carry: 'kite' })}</g>${ride.over}`, '-10 -10 220 220'), `${hero} on ${r}`);
      }
    }
  } else if (kind === 'glyphs') {
    for (const set of [UPPER, LOWER])
      for (const [ch, g] of Object.entries(set))
        cell(`<svg class="pic" viewBox="-10 -10 ${g.w + 20} 155">
          <path d="M-10 45 H${g.w + 10} M-10 100 H${g.w + 10}" stroke="#ddd"/>
          ${g.strokes.map((d, i) => `<path d="${d}" fill="none" stroke="${['#ff8fb0', '#7fc8f0', '#9ed98b', '#ffc15e'][i]}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
        </svg>`, ch);
  } else {
    for (const w of ALL_WORDS) cell(picture(w), w);
  }
}
