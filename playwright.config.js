import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      // iPad-sized touch context on Chromium: device descriptors force WebKit,
      // and we deliberately standardise on one engine for the mockup suite.
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 810, height: 1080 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        userAgent: devices['iPad (gen 7)'].userAgent,
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        userAgent: devices['iPhone 14'].userAgent,
      },
    },
  ],
  webServer: {
    command: 'node tests/server.mjs',
    port: 4173,
    reuseExistingServer: true,
  },
});
