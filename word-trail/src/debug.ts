import { heroArt, HEROES } from './art/characters';
import { C, ell, flat, line, piece, svgBox } from './art/paper';
import { RIDES } from './art/rides';
import { WEAR_SLOT } from './art/wearables';
import { ALL_WORDS, picture } from './content';
import { LOWER, UPPER } from './glyphs';
import { sceneMarkup } from './scene';
import { newTrip } from './state';
import { runFrames, runRig, runTiles } from './rig';

// Debug pages for checking art: ?debug=wardrobe, ?debug=words, ?debug=glyphs,
// ?debug=icon and ?debug=og (app icon and link-preview image), plus
// ?debug=rig and ?debug=tiles, which the anatomy tests read.

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

  if (kind === 'rig') return runRig();
  if (kind === 'tiles') return void runTiles();
  if (kind === 'frames') return runFrames(ALL_WORDS, picture);

  if (kind === 'icon' || kind === 'og') {
    // app icons and the link-preview image, drawn from the game's own art
    document.body.className = 'debug-art';
    const trip = { ...newTrip(), hero: 'dog', worn: { head: 'hat' as const }, friends: ['bee'], place: 'park' };
    const heroX = 430;
    document.body.innerHTML = kind === 'icon'
      ? `<svg viewBox="0 0 200 200" style="width:100vmin;height:100vmin;display:block">${frogIcon()}</svg>`
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

/** The app icon: a crowned frog face with pink glasses, in paper pieces. */
function frogIcon() {
  const green = '#8cc07a', light = '#bfe0a6';
  const eye = (x: number) => `${piece(ell(x, 76, 20, 20), C.white, { lift: 1 })}
    ${flat(ell(x + 3, 80, 10, 11), C.ink)}${flat(ell(x + 6.5, 75, 3.6, 3.8), C.white)}${flat(ell(x, 85, 1.6, 1.6), C.white)}`;
  return `<rect width="200" height="200" fill="${C.cream}"/>
    <g filter="url(#pc)">
      ${piece(ell(66, 74, 31, 30), green, { lift: 2 })}${piece(ell(134, 74, 31, 30), green, { lift: 2 })}
      ${piece('M26 120 C24 82 56 66 100 66 C144 66 176 82 174 120 C172 158 142 180 100 180 C58 180 28 158 26 120 Z', green, { lift: 2.4 })}
      ${piece('M42 134 C60 152 140 152 158 134 C158 160 134 178 100 178 C66 178 42 160 42 134 Z', light, { lift: 1 })}
      ${piece('M64 50 L60 14 L82 32 L100 4 L118 32 L140 14 L136 50 C124 54 76 54 64 50 Z', C.mustard, { lift: 1.8 })}
      ${piece(ell(100, 38, 6.5, 7.5), C.coral, { lift: 0.8 })}
      ${eye(66)}${eye(134)}
      ${flat(ell(66, 76, 25, 25), 'none', `stroke="${C.rose}" stroke-width="7"`)}${flat(ell(134, 76, 25, 25), 'none', `stroke="${C.rose}" stroke-width="7"`)}
      ${line('M91 72 C96 66 104 66 109 72', C.rose, 6)}
      ${flat(ell(46, 128, 10, 6), C.blush, 'opacity="0.85"')}${flat(ell(154, 128, 10, 6), C.blush, 'opacity="0.85"')}
      ${line('M66 128 C86 146 114 146 134 128', C.ink, 5)}
    </g>`;
}
