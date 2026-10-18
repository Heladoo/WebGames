import './styles.css';
import { runDebug } from './debug';
import { App } from './app';
import { load, stopSaving } from './state';
import { TRACKS } from './art/tracks';
import { animalScreen, kidScreen, mapScreen, raceScreen, shopScreen } from './screens';
import { stats } from './stats';
import { tooltips } from './tip';

const params = new URLSearchParams(location.search);
const debug = params.get('debug');

if (debug) void runDebug(debug, params);
else {
  const data = load();
  // pretend games for testing never replace the real one: ?coins=500, ?open=all, ?screen=map|shop|animal
  if (params.has('coins') || params.has('open') || params.has('screen') || params.has('races')) stopSaving();
  if (params.has('coins')) data.coins = Math.max(0, Math.min(1e6, Number(params.get('coins')) || 0));
  if (params.get('open') === 'all') data.unlocked = [...TRACKS];
  if (params.has('races')) data.races = Math.max(0, Number(params.get('races')) || 0);
  tooltips();
  const app = new App(document.getElementById('app')!, data);
  app.register('map', mapScreen);
  app.register('animal', animalScreen);
  app.register('kid', kidScreen);
  app.register('shop', shopScreen);
  app.register('race', (a) => void raceScreen(a));
  (window as unknown as { app: App }).app = app;
  const start = params.get('screen');
  app.go(start === 'map' || start === 'shop' || start === 'animal' || start === 'kid' ? start : 'map');
  addEventListener('pagehide', () => stats.flush(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stats.flush(true);
  });
}
