import { test, expect } from '@playwright/test';

test.describe('QA smoke harness', () => {
  test('dashboard landing shows summary metrics', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pilot Logbook');
    await expect(page.getByTestId('summary-total-hours')).toBeVisible();
    await expect(page.getByTestId('summary-total-flights')).toBeVisible();
  });

  test('pilot directory supports lookup and drill-in', async ({ page }) => {
    await page.goto('/pilots');

    const firstPilotCard = page.locator('[data-testid="pilot-card"]').first();
    const pilotName = await firstPilotCard.locator('h3, h2').first().textContent();

    await expect(firstPilotCard).toBeVisible();
    await firstPilotCard.click();

    await expect(page).toHaveURL(/\/pilots\//);
    if (pilotName) {
      await expect(page.locator('h1')).toContainText(pilotName.trim());
    }

    await expect(page.getByTestId('pilot-flight-table')).toBeVisible();
  });
});
