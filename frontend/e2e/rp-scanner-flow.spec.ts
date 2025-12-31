import { test, expect } from '@playwright/test';

test.describe('RP & Scanner Flow', () => {
    test('E2E-001: Flujo completo RP -> Scanner', async ({ page, browser }) => {
        // 1. RP Context
        const rpContext = await browser.newContext();
        const rpPage = await rpContext.newPage();

        // Login as RP
        await rpPage.goto('/login');
        await rpPage.fill('input[type="text"]', 'rp.demo');
        await rpPage.fill('input[type="password"]', 'changeme123');
        await rpPage.click('button[type="submit"]');
        await expect(rpPage).toHaveURL(/\/events/);

        // Generate Ticket
        // Assume first event card has a button or link
        await rpPage.click('text=Ver asignación'); // Adjust selector if needed
        await rpPage.click('text=Generar acceso'); // Adjust selector if needed

        // Fill guest details
        // Note: Check if select logic changed to radio buttons based on GenerateAccessPage source
        // In previous view_file, it was radio buttons! 
        // <input type="radio" value={option.value} ... />
        // So we click the label or input.
        await rpPage.click('label:has-text("General")');
        await rpPage.click('[data-testid="generate-btn"]');

        // Wait for QR/Token
        const tokenLocator = rpPage.locator('[data-testid="ticket-token"]');
        await expect(tokenLocator).toBeVisible();
        const tokenText = await tokenLocator.innerText();

        // 2. Scanner Context
        const scannerContext = await browser.newContext();
        const scannerPage = await scannerContext.newPage();

        // Login as Scanner
        await scannerPage.goto('/login');
        await scannerPage.fill('input[type="text"]', 'scanner.demo');
        await scannerPage.fill('input[type="password"]', 'changeme123');
        await scannerPage.click('button[type="submit"]');

        // Go to scanner page (simulated via dashboard button or direct URL if protected)
        // Assuming dashboard has a link or we just go there.
        // await scannerPage.goto('/scanner'); // If needed

        // Simulate Scan
        await scannerPage.fill('[data-testid="scanner-input"]', tokenText);
        await scannerPage.click('[data-testid="validate-btn"]');

        // Expect Valid
        // Checking for "Tipo: General" or ticket details
        await expect(scannerPage.locator('.card')).toContainText('Tipo: General');
        await expect(scannerPage.locator('.card')).toContainText('Estado: Pendiente');

        // Confirm
        await scannerPage.click('[data-testid="confirm-btn"]');
        await expect(scannerPage.locator('.card')).toContainText('Estado: Escaneado');

        // Re-validate (E2E-004)
        await scannerPage.fill('[data-testid="scanner-input"]', tokenText);
        await scannerPage.click('[data-testid="validate-btn"]');

        // Expect Invalid/Used
        await expect(scannerPage.locator('text=Ya escaneado')).toBeVisible();

        await rpContext.close();
        await scannerContext.close();
    });
});
