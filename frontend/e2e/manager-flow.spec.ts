import { test, expect } from '@playwright/test';

test.describe('Manager Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as manager before each test
        await page.goto('/login');
        await page.fill('input[type="text"]', 'manager.demo');
        await page.fill('input[type="password"]', 'changeme123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard|clubs/);
    });

    test('E2E-002: Manager ve corte clasificado', async ({ page }) => {
        // Navigate to cuts
        // Assuming there is a sidebar or validation to go to /cuts
        await page.goto('/cuts');

        // Check if cuts page loads
        await expect(page.locator('h1')).toContainText(/Cortes|Cuts/i);

        // Filter validation (just visual check for now)
        await expect(page.locator('input[type="date"]')).toBeVisible();
    });
});
