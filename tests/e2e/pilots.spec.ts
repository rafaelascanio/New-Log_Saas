import { test, expect } from '@playwright/test';

test.describe('Pilots page', () => {
  test('should allow searching for a pilot and viewing their details', async ({ page }) => {
    await page.goto('/pilots');

    await page.getByTestId('pilot-search').fill('John Doe');

    await page.getByTestId('pilot-card').filter({ hasText: 'John Doe' }).first().click();

    await expect(page).toHaveURL(/.*\/pilots\/john-doe/);

    await expect(page.locator('h1')).toContainText('John Doe');
  });
});