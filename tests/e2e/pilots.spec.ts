import { test, expect } from '@playwright/test';

test.describe('Pilots page', () => {
  test('should allow searching for a pilot and viewing their details', async ({ page }) => {
    await page.goto('/pilots');

    await page.fill('input[type="text"]', 'John Doe');

    await page.click('text=John Doe');

    await expect(page).toHaveURL(/.*\/pilots\/john-doe/);

    await expect(page.locator('h1')).toContainText('John Doe');
  });
});