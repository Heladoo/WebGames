import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// The browser tests drive real pointer drags on the canvas and read the game
// state through the ?debug=state hook (see tests/).
const localChromium = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5207',
    launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {},
  },
  webServer: {
    command: 'npx vite --port 5207 --strictPort',
    url: 'http://localhost:5207',
    reuseExistingServer: true,
  },
});
