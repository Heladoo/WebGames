// Anonymous play statistics: counts plays and play time only.
// No accounts, no cookies, no personal data: just a random id kept on this
// device so unique players can be estimated.

const ENDPOINT = '/api/stats';
const enabled = !['localhost', '127.0.0.1', ''].includes(location.hostname) && !location.search.includes('debug');

function anonId(): string {
  try {
    let id = localStorage.getItem('otter-river-anon');
    if (!id || !/^[a-z0-9]{8,32}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join('');
      localStorage.setItem('otter-river-anon', id);
    }
    return id;
  } catch {
    return 'anonymous00';
  }
}

function send(body: object, beacon = false) {
  if (!enabled) return;
  const data = JSON.stringify({ ...body, id: anonId() });
  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([data], { type: 'application/json' }));
    } else {
      void fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true }).catch(() => {});
    }
  } catch {
    // stats are best-effort
  }
}

let pending = 0;

export const stats = {
  start() {
    send({ type: 'start' });
  },
  /** Call every frame with the real elapsed time while the game is actually being played. */
  tick(dt: number) {
    pending += dt;
    if (pending >= 120) this.flush();
  },
  flush(beacon = false) {
    const s = Math.min(180, Math.round(pending));
    pending = 0;
    if (s >= 1) send({ type: 'time', s }, beacon);
  },
};
