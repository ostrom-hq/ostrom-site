// SPDX-License-Identifier: Apache-2.0
import { defineConfig, devices } from '@playwright/test'

// CI runs the suite against the Docker image (PLAYWRIGHT_BASE_URL=http://localhost:8080). Locally, without it, the
// export in out/ is served by scripts/serve.ts.
const external = process.env['PLAYWRIGHT_BASE_URL']
const baseURL = external ?? 'http://localhost:3100'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] === undefined ? 0 : 1,
  reporter: process.env['CI'] === undefined ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  ...(external === undefined
    ? {
        webServer: {
          command: 'node scripts/serve.ts out 3100',
          url: 'http://localhost:3100/healthz',
          reuseExistingServer: true,
        },
      }
    : {}),
})
