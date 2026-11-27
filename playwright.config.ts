import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.E2E_PORT || '4173';
const baseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
  },
  projects: [
    {
      name: 'mobile-iphone-13',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'mobile-pixel-7',
      use: {
        ...devices['Pixel 7'],
      },
    },
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'node tests/serve-site.mjs',
    url: baseURL,
    env: { PORT: e2ePort, BASE_PATH: '' },
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
