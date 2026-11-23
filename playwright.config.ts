import { defineConfig, devices } from '@playwright/test'

const PORT = 4174
const baseURL = `http://127.0.0.1:${PORT}`

// The tests run against the production build, served locally. Build first: `npm run e2e` does not.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', testIgnore: 'perf.spec.ts', use: { ...devices['Desktop Chrome'] } },
    // Measures time, so it runs on its own: npm run e2e:perf
    {
      name: 'perf',
      testMatch: 'perf.spec.ts',
      // Tracing takes a screenshot per frame, which is most of what would be measured.
      use: { ...devices['Desktop Chrome'], trace: 'off' },
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
})
