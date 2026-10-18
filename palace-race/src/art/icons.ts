// Picture icons for every button, so children who cannot read can play on their own. Each icon is a small
// coloured sticker (filled shapes with a dark outline) in a 64 x 64 box, used as inline SVG in buttons. Text
// labels under them are small and only for grown-ups; every button also has an aria-label.

const INK = '#4a2a4a';

const svg = (body: string, size = 44) =>
  `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

const arrow = (rot: number, fill: string) =>
  `<g transform="rotate(${rot} 32 32)"><path d="M32 8 L54 32 H41 V56 H23 V32 H10Z" fill="${fill}" stroke="${INK}" stroke-width="4"/><path d="M32 15 L45 29" stroke="#fff" stroke-width="3.4" opacity=".6"/></g>`;

const starPath = (cx: number, cy: number, r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${p.join('L')}Z`;
};

export const ICONS = {
  play: svg(`<path d="M20 10 L54 32 L20 54Z" fill="#5ccf6a" stroke="${INK}" stroke-width="4.4"/><path d="M25 20 L41 30" stroke="#fff" stroke-width="3.6" opacity=".6"/>`),
  home: svg(`<path d="M8 32 L32 10 L56 32" fill="none" stroke="${INK}" stroke-width="5"/><path d="M15 30 V54 H49 V30 L32 15Z" fill="#ffcf5a" stroke="${INK}" stroke-width="4"/><path d="M27 54 V40 h10 V54" fill="#e8744a" stroke="${INK}" stroke-width="3.4"/><path d="M8 32 L32 10 L56 32" fill="none" stroke="#e8344e" stroke-width="3"/>`),
  pause: svg(`<rect x="14" y="10" width="13" height="44" rx="4" fill="#7fb6ff" stroke="${INK}" stroke-width="4"/><rect x="37" y="10" width="13" height="44" rx="4" fill="#7fb6ff" stroke="${INK}" stroke-width="4"/>`),
  soundOn: svg(`<path d="M8 24 H18 L32 12 V52 L18 40 H8Z" fill="#ffcf5a" stroke="${INK}" stroke-width="4"/><path d="M40 22 a12 12 0 0 1 0 20 M46 14 a22 22 0 0 1 0 36" fill="none" stroke="${INK}" stroke-width="4.4"/>`),
  soundOff: svg(`<path d="M8 24 H18 L32 12 V52 L18 40 H8Z" fill="#d8d0e0" stroke="${INK}" stroke-width="4"/><path d="M40 24 L54 40 M54 24 L40 40" stroke="#e8344e" stroke-width="5"/>`),
  shop: svg(`<path d="M12 22 H52 L48 56 H16Z" fill="#ff8fc8" stroke="${INK}" stroke-width="4"/><path d="M22 26 V18 a10 10 0 0 1 20 0 V26" fill="none" stroke="${INK}" stroke-width="4"/><path d="${starPath(32, 39, 9)}" fill="#ffe066" stroke="${INK}" stroke-width="2.6"/>`),
  lock: svg(`<path d="M20 28 V20 a12 12 0 0 1 24 0 V28" fill="none" stroke="${INK}" stroke-width="5"/><rect x="12" y="27" width="40" height="29" rx="7" fill="#ffcf5a" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="39" r="4.4" fill="${INK}"/><path d="M32 41 V48" stroke="${INK}" stroke-width="4"/>`),
  unlock: svg(`<path d="M20 28 V18 a12 12 0 0 1 23 -4" fill="none" stroke="${INK}" stroke-width="5"/><rect x="12" y="27" width="40" height="29" rx="7" fill="#5ccf6a" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="39" r="4.4" fill="${INK}"/><path d="M32 41 V48" stroke="${INK}" stroke-width="4"/><path d="M52 8 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill="#ffe066" stroke="${INK}" stroke-width="1.6"/>`),
  coin: svg(`<circle cx="32" cy="32" r="24" fill="#ffcf3a" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="32" r="16" fill="none" stroke="#e8a11c" stroke-width="3"/><path d="M24 36 L26 24 L32 31 L38 24 L40 36Z" fill="#fff3b8" stroke="#b07810" stroke-width="2"/><path d="M18 22 a18 18 0 0 1 10 -8" stroke="#fff" stroke-width="3.4" fill="none" opacity=".7"/>`),
  candy: svg(`<path d="M20 30 L6 20 L8 44 L20 34Z M44 30 L58 20 L56 44 L44 34Z" fill="#ff7aa8" stroke="${INK}" stroke-width="3.4"/><ellipse cx="32" cy="32" rx="14" ry="12" fill="#ff9ec8" stroke="${INK}" stroke-width="3.6"/><path d="M26 23 q4 9 0 18 M34 21 q4 11 0 22" stroke="#fff" stroke-width="3" fill="none"/>`),
  check: svg(`<path d="M10 34 L26 50 L54 16" fill="none" stroke="${INK}" stroke-width="11"/><path d="M10 34 L26 50 L54 16" fill="none" stroke="#5ccf6a" stroke-width="6"/>`),
  close: svg(`<path d="M14 14 L50 50 M50 14 L14 50" stroke="${INK}" stroke-width="11"/><path d="M14 14 L50 50 M50 14 L14 50" stroke="#ff7a8a" stroke-width="6"/>`),
  again: svg(`<path d="M48 22 A18 18 0 1 0 50 38" fill="none" stroke="${INK}" stroke-width="10"/><path d="M48 22 A18 18 0 1 0 50 38" fill="none" stroke="#7fb6ff" stroke-width="5.4"/><path d="M38 10 L54 22 L40 30Z" fill="#7fb6ff" stroke="${INK}" stroke-width="3.6"/>`),
  trophy: svg(`<path d="M18 12 H46 V24 a14 14 0 0 1 -28 0Z" fill="#ffcf3a" stroke="${INK}" stroke-width="4"/><path d="M18 16 H9 a9 9 0 0 0 11 14 M46 16 H55 a9 9 0 0 1 -11 14" fill="none" stroke="${INK}" stroke-width="4"/><path d="M28 37 H36 V46 H28Z" fill="#e8a11c" stroke="${INK}" stroke-width="3.4"/><rect x="18" y="46" width="28" height="10" rx="3" fill="#b07a48" stroke="${INK}" stroke-width="3.4"/><path d="M24 16 V24" stroke="#fff" stroke-width="3.4" opacity=".7"/>`),
  camera: svg(`<rect x="8" y="20" width="48" height="34" rx="8" fill="#7fb6ff" stroke="${INK}" stroke-width="4"/><path d="M22 20 L26 12 H38 L42 20" fill="#7fb6ff" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="37" r="11" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="37" r="5" fill="${INK}"/><circle cx="48" cy="28" r="3" fill="#ffe066"/>`),
  share: svg(`<path d="M32 40 V10 M20 22 L32 10 L44 22" fill="none" stroke="${INK}" stroke-width="5"/><path d="M14 32 V52 H50 V32" fill="none" stroke="${INK}" stroke-width="5"/><path d="M32 40 V10 M20 22 L32 10 L44 22" fill="none" stroke="#5ccf6a" stroke-width="2"/>`),
  gear: svg(`<path d="M32 6 l5 7 8 -3 1 9 9 1 -3 8 7 5 -7 5 3 8 -9 1 -1 9 -8 -3 -5 7 -5 -7 -8 3 -1 -9 -9 -1 3 -8 -7 -5 7 -5 -3 -8 9 -1 1 -9 8 3Z" fill="#c8c0d8" stroke="${INK}" stroke-width="3.4"/><circle cx="32" cy="32" r="9" fill="#fff" stroke="${INK}" stroke-width="3.4"/>`),
  // a U-turn arrow: "back"
  back: svg(`<path d="M22 16 H40 a14 14 0 0 1 0 28 H20" fill="none" stroke="${INK}" stroke-width="11"/><path d="M22 16 H40 a14 14 0 0 1 0 28 H20" fill="none" stroke="#7fb6ff" stroke-width="5.4"/><path d="M26 2 L8 16 L26 30Z" fill="#7fb6ff" stroke="${INK}" stroke-width="3.6"/><path d="M12 15 L22 8" stroke="#fff" stroke-width="3" opacity=".6"/>`),
  up: svg(arrow(0, '#ffcf5a')),
  down: svg(arrow(180, '#7fb6ff')),
  laneFar: svg(arrow(-45, '#c9a0ff')),
  laneNear: svg(arrow(135, '#c9a0ff')),
  hand: svg(`<path d="M24 34 V12 a5 5 0 0 1 10 0 V30 l2 -4 a5 5 0 0 1 9 2 l2 -2 a5 5 0 0 1 8 4 V44 a14 14 0 0 1 -14 14 H34 a14 14 0 0 1 -12 -7 L12 36 a5 5 0 0 1 8 -6Z" fill="#ffe0c8" stroke="${INK}" stroke-width="3.6"/><path d="M34 30 V40 M44 30 V40" stroke="${INK}" stroke-width="2.4" opacity=".5"/>`),
  palace: svg(`<path d="M10 56 V30 H18 V56 M46 56 V30 H54 V56" fill="#f1e8f8" stroke="${INK}" stroke-width="3"/><path d="M8 30 L14 16 L20 30Z M44 30 L50 16 L56 30Z" fill="#8a6ad6" stroke="${INK}" stroke-width="3"/><path d="M18 56 V36 H46 V56Z" fill="#f1e8f8" stroke="${INK}" stroke-width="3"/><path d="M24 36 V24 H40 V36" fill="#f1e8f8" stroke="${INK}" stroke-width="3"/><path d="M22 24 L32 6 L42 24Z" fill="#ee8cbf" stroke="${INK}" stroke-width="3"/><path d="M27 56 V46 a5 5 0 0 1 10 0 V56Z" fill="#ffcf3a" stroke="${INK}" stroke-width="2.6"/>`),
  music: svg(`<path d="M24 46 V14 L50 8 V40" fill="none" stroke="${INK}" stroke-width="4.4"/><ellipse cx="18" cy="47" rx="8" ry="6.4" fill="#c9a0ff" stroke="${INK}" stroke-width="3.6"/><ellipse cx="44" cy="41" rx="8" ry="6.4" fill="#c9a0ff" stroke="${INK}" stroke-width="3.6"/>`),
  medal: svg(`<path d="M18 4 L28 30 M46 4 L36 30" stroke="${INK}" stroke-width="10"/><path d="M18 4 L28 30" stroke="#ff7aa8" stroke-width="5.4"/><path d="M46 4 L36 30" stroke="#4dabf7" stroke-width="5.4"/><circle cx="32" cy="42" r="17" fill="#ffcf3a" stroke="${INK}" stroke-width="4"/><circle cx="32" cy="42" r="11" fill="#ffe27a" stroke="#c8861a" stroke-width="2.4"/><path d="${starPath(32, 42, 8)}" fill="#fff6c8" stroke="#c8861a" stroke-width="1.8"/>`),
  medalEmpty: svg(`<circle cx="32" cy="38" r="17" fill="#ffffff" fill-opacity=".55" stroke="${INK}" stroke-width="3.4" stroke-dasharray="6 5"/>`),
  helmet: svg(`<path d="M8 40 a24 24 0 0 1 48 -4 H34 L8 40Z" fill="#ff8fc8" stroke="${INK}" stroke-width="4"/><path d="M34 36 H60 L58 42 H34Z" fill="#e8609c" stroke="${INK}" stroke-width="3.4"/><path d="M16 26 a18 18 0 0 1 14 -10" stroke="#fff" stroke-width="3.4" fill="none" opacity=".7"/>`),
  // a happy face with a big ponytail and a bow: "hairstyles"
  hair: svg(`<path d="M40 22 C52 18 62 28 58 44 C56 52 50 56 46 52 C52 44 50 34 42 32Z" fill="#c9733a" stroke="${INK}" stroke-width="3.4"/><path d="M46 30 C52 32 54 40 52 46" stroke="#f0a868" stroke-width="2.6" fill="none"/><circle cx="26" cy="34" r="17" fill="#ffd9be" stroke="${INK}" stroke-width="3.6"/><path d="M8 34 C6 18 18 9 30 10 C40 10 46 18 44 28 C38 22 30 20 22 22 C16 24 12 28 10 36Z" fill="#c9733a" stroke="${INK}" stroke-width="3.4"/><path d="M18 16 C24 13 32 13 38 17" stroke="#f0a868" stroke-width="2.6" fill="none"/><path d="M38 16 l9 -7 l1 11Z M38 16 l12 5 l-8 6Z" fill="#ff7aa8" stroke="${INK}" stroke-width="2.4"/><circle cx="40" cy="18" r="3.2" fill="#e8509c" stroke="${INK}" stroke-width="2"/><path d="M17 37 q3 -4 6 0 M29 37 q3 -4 6 0" stroke="${INK}" stroke-width="2.6" fill="none"/><path d="M20 43 q6 5 12 0" stroke="${INK}" stroke-width="2.6" fill="none"/><circle cx="15" cy="42" r="3" fill="#ff9aa8" opacity=".7"/><circle cx="37" cy="42" r="3" fill="#ff9aa8" opacity=".7"/>`),
  // a riding saddle from the side: blanket, seat with pommel and cantle, flap, and a stirrup
  saddle: svg(`<path d="M5 30 H59 V44 a6 6 0 0 1 -6 6 H11 a6 6 0 0 1 -6 -6Z" fill="#4dabf7" stroke="${INK}" stroke-width="3.4"/><path d="M8 45 H56" stroke="#ffd43b" stroke-width="3" stroke-dasharray="4 3"/><path d="M8 31 C8 22 14 18 20 24 C26 29 38 29 44 23 C48 18 54 12 57 18 C59 23 56 30 50 32 H14 C10 32 8 33 8 31Z" fill="#a8602e" stroke="${INK}" stroke-width="3.4"/><path d="M16 25 C24 30 36 30 44 25" stroke="#e8a060" stroke-width="2.6" fill="none"/><path d="M24 30 H42 V42 a4 4 0 0 1 -4 4 H28 a4 4 0 0 1 -4 -4Z" fill="#8a4a24" stroke="${INK}" stroke-width="3"/><path d="M33 44 V53" stroke="${INK}" stroke-width="3"/><path d="M26 61 L28 53 H38 L40 61Z" fill="#c8c0d8" stroke="${INK}" stroke-width="3"/>`),
};

export type IconId = keyof typeof ICONS;
