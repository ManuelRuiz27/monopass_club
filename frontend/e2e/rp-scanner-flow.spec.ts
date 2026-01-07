import { test, expect, request } from '@playwright/test'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

test.describe('RP & Scanner Flow', () => {
  test('E2E-001: RP genera -> Scanner confirma -> Manager visualiza corte', async ({ browser }) => {
    const api = await request.newContext({ baseURL: coreApiBaseUrl })
    const loginResponse = await api.post('/auth/login', {
      data: { username: 'manager.demo', password: 'changeme123' },
    })
    expect(loginResponse.ok()).toBeTruthy()
    const { token } = await loginResponse.json()
    const headers = { Authorization: `Bearer ${token}` }

    const clubsResponse = await api.get('/clubs', { headers })
    const clubs = await clubsResponse.json()
    if (!Array.isArray(clubs) || clubs.length === 0) {
      throw new Error('No hay clubs disponibles para el manager demo')
    }

    const eventName = `E2E Scanner ${Date.now()}`
    const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const eventResponse = await api.post('/events', {
      headers,
      data: {
        clubId: clubs[0].id,
        name: eventName,
        startsAt,
        endsAt,
      },
    })
    expect(eventResponse.ok()).toBeTruthy()
    const event = await eventResponse.json()

    const rpsResponse = await api.get('/rps', { headers })
    const rps = await rpsResponse.json()
    const rpDemo = Array.isArray(rps) ? rps.find((rp) => rp.user?.username === 'rp.demo') : null
    if (!rpDemo) {
      throw new Error('RP demo no encontrado')
    }

    const assignResponse = await api.post(`/events/${event.id}/rps`, {
      headers,
      data: { rpId: rpDemo.id, limitAccesses: 10 },
    })
    expect(assignResponse.ok()).toBeTruthy()
    await api.dispose()

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
    const option = eventSelect.locator(`option:has-text("${eventName}")`)
    await expect(option).toHaveCount(1)
    const assignmentId = await option.getAttribute('value')
    if (!assignmentId) {
      throw new Error('No se encontro el assignmentId del evento')
    }
    await eventSelect.selectOption(assignmentId)

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
    // Auto-confirm should happen for standard tickets
    await expect(scannerPage.locator('.feedback-success')).toContainText('Acceso Permitido')
    await expect(scannerPage.locator('.ticket-info')).toContainText('Estado: Escaneado')

    // await scannerPage.click('[data-testid="confirm-btn"]') // Removed as it is now auto-confirm
    // await expect(scannerPage.locator('.scanner-result')).toContainText('Estado: Escaneado')

    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.click('[data-testid="validate-btn"]')
    await expect(scannerPage.locator('.feedback-warning')).toContainText('Este ticket YA fue escaneado')

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
