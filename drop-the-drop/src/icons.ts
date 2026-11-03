// Picture icons for buttons (children who cannot read use these).
const svg = (body: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICON = {
  play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  again: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.8 4.2v4.6h-4.6"/>'),
  home: svg('<path d="M4 11.2 12 4.5l8 6.7"/><path d="M6.5 9.5V19.5h11V9.5"/><path d="M10.2 19.5v-5h3.6v5"/>'),
  soundOn: svg('<path d="M4.5 9.5h3.5l5-4v13l-5-4H4.5z" fill="currentColor"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6"/><path d="M19 6.5a7.8 7.8 0 0 1 0 11"/>'),
  soundOff: svg('<path d="M4.5 9.5h3.5l5-4v13l-5-4H4.5z" fill="currentColor"/><path d="m16.5 9.5 5 5m0-5-5 5"/>'),
  levels: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" fill="currentColor" stroke="none"/>'),
  yes: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  no: svg('<path d="m6.5 6.5 11 11m0-11-11 11"/>'),
};

export const ICON_LOCK = svg('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>');
export const ICON_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="#ffc928" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
/** a phone turning clockwise from upright to lying down, with a curved arrow the same way */
export const ICON_ROTATE = '<svg viewBox="-6 -6 132 132" aria-hidden="true"><g class="rot-phone"><rect x="42" y="26" width="36" height="68" rx="7" fill="#fff" stroke="#343a56" stroke-width="5"/><circle cx="60" cy="85" r="3" fill="#343a56"/><circle cx="54" cy="50" r="5" fill="#e3283a"/><circle cx="66" cy="60" r="4.2" fill="#1d63d8"/></g><path d="M96.0 17.1A56 56 0 0 1 105.9 92.1" fill="none" stroke="#3f7fe0" stroke-width="6" stroke-linecap="round"/><path d="M118.3 88.3L105.9 92.1L105.2 79.1" fill="none" stroke="#3f7fe0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
