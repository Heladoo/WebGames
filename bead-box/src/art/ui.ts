// Small icons for the buttons, as inline svg (they take their colour from the text colour).

const svg = (body: string, size = 28) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  back: svg('<path d="M27 16 H6 M14 7 L5 16 L14 25"/>', 30),
  album: svg('<rect x="4" y="5" width="24" height="22" rx="5"/><circle cx="12" cy="13" r="2.6" fill="currentColor" stroke="none"/><path d="M5 24 L13 17 L18 22 L22 18 L27 23"/>', 30),
  check: svg('<path d="M6 17 L13 24 L26 8" stroke-width="4.4"/>', 36),
  lock: svg('<rect x="7" y="14" width="18" height="13" rx="4" fill="currentColor" stroke="none"/><path d="M11 14 V10 a5 5 0 0 1 10 0 V14"/>', 26),
  gear: svg('<circle cx="16" cy="16" r="4.5"/><path d="M16 3 V7 M16 25 V29 M3 16 H7 M25 16 H29 M7 7 L10 10 M22 22 L25 25 M25 7 L22 10 M10 22 L7 25"/>', 26),
  close: svg('<path d="M8 8 L24 24 M24 8 L8 24"/>', 24),
  soundOn: svg('<path d="M5 12 H10 L17 6 V26 L10 20 H5Z" fill="currentColor"/><path d="M22 11 a7 7 0 0 1 0 10 M25 7 a12 12 0 0 1 0 18"/>', 26),
  soundOff: svg('<path d="M5 12 H10 L17 6 V26 L10 20 H5Z" fill="currentColor"/><path d="M22 12 L29 20 M29 12 L22 20"/>', 26),
  plus: svg('<path d="M16 6 V26 M6 16 H26" stroke-width="4.8"/>', 34),
  speaker: svg('<path d="M5 12 H10 L17 6 V26 L10 20 H5Z" fill="currentColor" stroke="none"/><path d="M21 11 a7 7 0 0 1 0 10 M24.5 7.5 a12 12 0 0 1 0 17"/>', 34),
  share: svg('<path d="M16 21 V4 M9 11 L16 4 L23 11"/><path d="M6 17 V25 a2 2 0 0 0 2 2 H24 a2 2 0 0 0 2 -2 V17"/>', 26),
  trash: svg('<path d="M6 9 H26 M12 9 V5 H20 V9 M9 9 L10 27 H22 L23 9"/>', 24),
};
