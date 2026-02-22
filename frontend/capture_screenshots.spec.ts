import { test } from '@playwright/test';

// Configuration injected via config file, but we can override locally if needed.

test('capture manager dashboard', async ({ page }) => {
    await page.addInitScript(() => {
        // Set session in local storage
        window.localStorage.setItem('monopass_session', JSON.stringify({
            token: 'mock-token',
            userId: 'mock-user',
            role: 'MANAGER'
        }));
    });

    await page.goto('/manager');
    await page.waitForLoadState('networkidle'); // Wait for assets
    // Wait for GSAP animations to finish
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '../landing/public/assets/screenshots/manager-dashboard.png' });
});

test('capture rp sharing', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('monopass_session', JSON.stringify({
            token: 'mock-token',
            userId: 'mock-user',
            role: 'RP'
        }));
    });

    await page.goto('/rp');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '../landing/public/assets/screenshots/rp-sharing.png' });
});

test('capture scanner', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('monopass_session', JSON.stringify({
            token: 'mock-token',
            userId: 'mock-user',
            role: 'SCANNER'
        }));
    });

    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '../landing/public/assets/screenshots/scanner-validado.png' });
});
