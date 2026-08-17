import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'npm run dev --workspace apps/server',
      cwd: '../..',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      env: { DB_PATH: './data/e2e-test.sqlite' },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
