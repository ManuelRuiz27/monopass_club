import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('FE-AUTH-001: Login success redirects by rol', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="text"]', 'manager.demo')
    await page.fill('input[type="password"]', 'changeme123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/manager$/)
    await expect(page.locator('.app-brand')).toContainText('MonoPass')
  })

  test('FE-AUTH-002: Login failure stays on form', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="text"]', 'manager.demo')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('text=No se pudo iniciar sesion. Verifica usuario y contrasena.')).toBeVisible()
  })
})
