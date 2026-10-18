import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// The tests drive the homepage in Chromium at phone, tablet and desktop sizes.
// The ideas API is faked per test with page.route (api/ideas.js has its own
// unit tests in tests/api.spec.ts).
const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {},
  },
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
  },
});
