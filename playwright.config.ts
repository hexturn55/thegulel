import { defineConfig, devices, chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * Playwright configuration.
 *
 * Browser resolution strategy (important for the cloud dev environment):
 * This environment ships a pre-installed Playwright Chromium under
 * PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers, and `npx playwright install`
 * is blocked by the outbound network allowlist (cdn.playwright.dev is not
 * reachable). We therefore pin `playwright`/`@playwright/test` to the version
 * whose bundled Chromium revision matches the pre-installed one, so Playwright
 * resolves the browser automatically with zero downloads.
 *
 * As a belt-and-suspenders fallback (e.g. if the pinned version is ever bumped
 * past the pre-installed build), we point `executablePath` at the stable
 * `/opt/pw-browsers/chromium` symlink when the auto-resolved binary is absent.
 */
function resolveExecutablePath(): string | undefined {
  try {
    const bundled = chromium.executablePath();
    if (existsSync(bundled)) return undefined; // auto-resolution works; let Playwright manage it
  } catch {
    // fall through to the fallback below
  }
  const fallback = '/opt/pw-browsers/chromium';
  return existsSync(fallback) ? fallback : undefined;
}

const BASE_URL = process.env.PW_BASE_URL ?? 'http://localhost:3000';
const executablePath = resolveExecutablePath();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /**
   * Boots the Next.js dev server for E2E runs and reuses one if already running.
   * Requires a local `.env` (copy `.env.example`). Disable auto-start by
   * pointing PW_BASE_URL at an already-running server and setting PW_NO_SERVER=1.
   */
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
