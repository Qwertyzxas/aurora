import { defineConfig, devices } from '@playwright/test';

const PORT = 4176;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}/aurora/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://127.0.0.1:${PORT}/aurora/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
