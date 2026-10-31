import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:4321/'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev -- --port 4321 --strictPort',
    url: 'http://localhost:4321',
    timeout: 180_000,
    reuseExistingServer: true
  }
});
