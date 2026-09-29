// The one shared palette. Every sprite may only use these letters, which is
// what keeps the whole game looking like a single, cozy set.
export const PALETTE: Record<string, string> = {
  O: '#4b3040', // outline (soft plum-brown, never pure black)
  B: '#a86b4c', // otter fur
  D: '#7d4a36', // dark fur / bark
  L: '#f3d9b8', // light belly fur
  C: '#fff0dc', // cream highlight
  E: '#2e1f2b', // eyes
  W: '#ffffff', // white / shine
  P: '#f59fae', // blush
  N: '#3b2330', // nose
  R: '#ef7a7a', // coral red
  r: '#c4566a', // dark coral
  Y: '#ffd97a', // butter yellow
  y: '#e5a94f', // ochre
  F: '#ffab6b', // orange
  f: '#d9804a', // dark orange
  G: '#8fd694', // leaf green
  g: '#5fa878', // dark green
  T: '#6fd0c8', // teal
  t: '#3f9fa8', // dark teal
  U: '#7fb3f0', // sky blue
  u: '#5480c9', // dark blue
  V: '#c3a4ef', // lavender
  v: '#8f6fc9', // purple
  K: '#ff9fc8', // pink
  k: '#d8709e', // dark pink
  S: '#ffd6c9', // shell peach
  M: '#c9cfdf', // light gray
  m: '#7d86a0', // gray
  H: '#3a3552', // lens dark
  I: '#8c90c8', // lens shine
  A: '#c4f3ec', // water highlight
};

// World colors used for large fills (still from the same cozy family).
export const WORLD = {
  water: '#7ccfd0',
  waterDeep: '#68c0c7',
  waterLight: '#a9e6e0',
  foam: '#e4fbf6',
  sand: '#f6e3b9',
  sandDark: '#e6cb95',
  grass: '#a3dc8e',
  grassDark: '#7fc47f',
  grassLight: '#c3eba2',
};
