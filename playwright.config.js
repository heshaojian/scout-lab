import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/dev-server.mjs --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/newtab.html',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
