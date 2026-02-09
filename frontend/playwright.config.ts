import { defineConfig, devices } from '@playwright/test';

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
  webServer: [
    {
      command: 'npm run dev -w core-api',
      url: 'http://localhost:4000/health',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      cwd: '..',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/monopass?schema=public',
        JWT_SECRET: process.env.JWT_SECRET ?? 'local-dev-secret-please-change',
        ENABLE_HEALTH_SEED: 'false',
        CORE_API_BASE_URL: 'http://localhost:4000',
        SCANNER_API_BASE_URL: 'http://localhost:4100',
        PORT: '4000',
      },
    },
    {
      command: 'npm run dev -w scanner-service',
      url: 'http://localhost:4100/health',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      cwd: '..',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/monopass?schema=public',
        CORE_API_BASE_URL: 'http://localhost:4000',
        JWT_SECRET: process.env.JWT_SECRET ?? 'local-dev-secret-please-change',
        SCANNER_API_KEY: process.env.SCANNER_API_KEY ?? 'local-scanner-key-123456',
        PORT: '4100',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      env: {
        ...process.env,
        VITE_CORE_API_BASE_URL: 'http://localhost:4000',
        VITE_SCANNER_API_BASE_URL: 'http://localhost:4100',
      },
    },
  ],
});
