// Picture icons for buttons (children who cannot read use these).
const svg = (body: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICON = {
  play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  again: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.8 4.2v4.6h-4.6"/>'),
  home: svg('<path d="M4 11.2 12 4.5l8 6.7"/><path d="M6.5 9.5V19.5h11V9.5"/><path d="M10.2 19.5v-5h3.6v5"/>'),
  soundOn: svg('<path d="M4.5 9.5h3.5l5-4v13l-5-4H4.5z" fill="currentColor"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6"/><path d="M19 6.5a7.8 7.8 0 0 1 0 11"/>'),
  soundOff: svg('<path d="M4.5 9.5h3.5l5-4v13l-5-4H4.5z" fill="currentColor"/><path d="m16.5 9.5 5 5m0-5-5 5"/>'),
  yes: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  no: svg('<path d="m6.5 6.5 11 11m0-11-11 11"/>'),
};
