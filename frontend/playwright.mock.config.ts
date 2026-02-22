import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      VITE_APP_MOCK: 'true',
      VITE_RP_MOCK: 'true',
      VITE_CORE_API_BASE_URL: 'http://localhost:4000',
      VITE_SCANNER_API_BASE_URL: 'http://localhost:4100',
    },
  },
})
