import { test, expect } from '@playwright/test'

test.describe('Manager Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'manager.demo')
    await page.fill('input[type="password"]', 'changeme123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/manager$/)
  })

  test('E2E-002: Manager ve cortes con filtros', async ({ page }) => {
    await page.click('a:has-text("Cortes")')
    await expect(page).toHaveURL(/\/manager\/cuts$/)

    await expect(page.locator('h3')).toContainText('Cortes')
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.locator('button:has-text("Limpiar filtros")')).toBeVisible()
  })
})
