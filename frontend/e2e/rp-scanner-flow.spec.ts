import { test, expect } from '@playwright/test'

test.describe('RP & Scanner Flow', () => {
  test('E2E-001: RP genera -> Scanner confirma -> Manager visualiza corte', async ({ browser }) => {
    // RP genera acceso
    const rpContext = await browser.newContext()
    const rpPage = await rpContext.newPage()
    await rpPage.goto('/login')
    await rpPage.fill('input[type="text"]', 'rp.demo')
    await rpPage.fill('input[type="password"]', 'changeme123')
    await rpPage.click('button[type="submit"]')
    await expect(rpPage).toHaveURL(/\/rp$/)

    await rpPage.click('a:has-text("Generar acceso")')
    const eventSelect = rpPage.locator('select').first()
    const options = await eventSelect.locator('option').all()
    if (options.length < 2) {
      throw new Error('No hay eventos disponibles para RP demo')
    }
    await eventSelect.selectOption({ index: 1 })
    const fullEventLabel = (await eventSelect.locator('option:checked').textContent())?.trim() ?? ''
    const eventName = fullEventLabel.split(' - ')[0]

    await rpPage.click('[data-testid="generate-btn"]')
    const previewImage = rpPage.locator('[data-testid="ticket-preview"]')
    await expect(previewImage).toBeVisible()
    const previewSrc = await previewImage.getAttribute('src')
    const tokenMatch = previewSrc?.match(/tickets\/([^/]+)\/png/i)
    const qrToken = tokenMatch?.[1]?.trim() ?? ''
    expect(qrToken).not.toEqual('')

    // Scanner valida y confirma
    const scannerContext = await browser.newContext()
    const scannerPage = await scannerContext.newPage()
    await scannerPage.goto('/login')
    await scannerPage.fill('input[type="text"]', 'scanner.demo')
    await scannerPage.fill('input[type="password"]', 'changeme123')
    await scannerPage.click('button[type="submit"]')
    await expect(scannerPage).toHaveURL(/\/scanner$/)

    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.click('[data-testid="validate-btn"]')
    await expect(scannerPage.locator('.scanner-result')).toContainText('Estado: Pendiente')

    await scannerPage.click('[data-testid="confirm-btn"]')
    await expect(scannerPage.locator('.scanner-result')).toContainText('Estado: Escaneado')

    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.click('[data-testid="validate-btn"]')
    await expect(scannerPage.locator('.scanner-result')).toContainText('Ya escaneado')

    // Manager revisa cortes
    const managerContext = await browser.newContext()
    const managerPage = await managerContext.newPage()
    await managerPage.goto('/login')
    await managerPage.fill('input[type="text"]', 'manager.demo')
    await managerPage.fill('input[type="password"]', 'changeme123')
    await managerPage.click('button[type="submit"]')
    await expect(managerPage).toHaveURL(/\/manager$/)

    await managerPage.click('a:has-text("Cortes")')
    await expect(managerPage).toHaveURL(/\/manager\/cuts$/)
    const eventCard = managerPage.locator('.card').filter({ hasText: eventName })
    await expect(eventCard).toBeVisible()
    await expect(eventCard).toContainText('Total')

    await rpContext.close()
    await scannerContext.close()
    await managerContext.close()
  })
})
