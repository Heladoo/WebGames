import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// The anatomy tests render the art in Chromium and check how the parts of
// every character relate to each other (see tests/anatomy.spec.ts).
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
