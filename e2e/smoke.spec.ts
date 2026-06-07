import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify the app boots and the browser toolchain works end-to-end.
 * These intentionally avoid backend/DB dependencies so they stay green without
 * live external services.
 */

test('homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Gulel/i);
  await expect(page.locator('body')).toBeVisible();
});

test('no uncaught page errors on load', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors, errors.join('\n')).toHaveLength(0);
});
