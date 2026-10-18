// Anonymous visit statistics: counts visits and which game boxes are tapped.
// No accounts, no cookies, no personal data: just a random id kept on this
// device so unique visitors can be estimated (the same id marks hearts).

const ENDPOINT = '/api/stats';
const enabled = !['localhost', '127.0.0.1', ''].includes(location.hostname) && !location.search.includes('debug');

export function anonId(): string {
  try {
    let id = localStorage.getItem('dorothy-games-anon');
    if (!id || !/^[a-z0-9]{8,32}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join('');
      localStorage.setItem('dorothy-games-anon', id);
    }
    return id;
  } catch {
    return 'anonymous00';
  }
}

function send(body: object) {
  if (!enabled) return;
  const data = JSON.stringify({ ...body, id: anonId() });
  try {
    // a beacon survives the page being left, which is what tapping a game does
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([data], { type: 'application/json' }))) return;
    void fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true }).catch(() => {});
  } catch {
    // stats are best-effort
  }
}

export const stats = {
  visit() {
    send({ type: 'start' });
  },
  open(game: string) {
    send({ type: 'open', game });
  },
};
