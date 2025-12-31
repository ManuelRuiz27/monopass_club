import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('FE-AUTH-001: Login success', async ({ page }) => {
        // Assuming manager entry point
        await page.goto('/login');

        // Use more robust selectors
        // Assuming the first text input is username/email and password input is type="password"
        await page.fill('input[type="text"]', 'manager.demo');
        await page.fill('input[type="password"]', 'changeme123');
        await page.click('button[type="submit"]');

        // Verify redirection to dashboard
        await expect(page).toHaveURL(/\/dashboard|clubs/);
    });

    test('FE-AUTH-002: Login failure', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="text"]', 'manager.demo');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Verify error message or stay on login
        // Assuming some error text appears
        // await expect(page.locator('text=Invalid credentials')).toBeVisible(); 
        // Or just check we are still on login
        await expect(page).toHaveURL(/\/login/);
    });
});
