import { expect, request, test } from '@playwright/test'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'
const scannerApiBaseUrl =
  process.env.VITE_SCANNER_API_BASE_URL ?? process.env.SCANNER_API_BASE_URL ?? 'http://localhost:4100'

test.describe('RP & Scanner Flow', () => {
  test('E2E-001: RP genera -> Scanner confirma -> Manager visualiza corte', async ({ browser }) => {
    const coreApi = await request.newContext({ baseURL: coreApiBaseUrl })
    const managerLogin = await coreApi.post('/auth/login', {
      data: { username: 'manager.demo', password: 'changeme123' },
    })
    expect(managerLogin.ok()).toBeTruthy()
    const { token: managerToken } = await managerLogin.json()
    const managerHeaders = { Authorization: `Bearer ${managerToken}` }

    const clubsResponse = await coreApi.get('/clubs', { headers: managerHeaders })
    const clubs = await clubsResponse.json()
    if (!Array.isArray(clubs) || clubs.length === 0) {
      throw new Error('No hay clubs disponibles para el manager demo')
    }

    const eventName = `E2E Scanner ${Date.now()}`
    const eventResponse = await coreApi.post('/events', {
      headers: managerHeaders,
      data: {
        clubId: clubs[0].id,
        name: eventName,
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    })
    expect(eventResponse.ok()).toBeTruthy()
    const event = await eventResponse.json()

    const rpsResponse = await coreApi.get('/rps', { headers: managerHeaders })
    const rps = await rpsResponse.json()
    const rpDemo = Array.isArray(rps) ? rps.find((rp) => rp.user?.username === 'rp.demo') : null
    if (!rpDemo) {
      throw new Error('RP demo no encontrado')
    }

    const assignResponse = await coreApi.post(`/events/${event.id}/rps`, {
      headers: managerHeaders,
      data: { rpId: rpDemo.id, limitAccesses: 10 },
    })
    expect(assignResponse.ok()).toBeTruthy()

    const rpContext = await browser.newContext()
    const rpPage = await rpContext.newPage()
    await rpPage.goto('/login')
    await rpPage.fill('input[type="text"]', 'rp.demo')
    await rpPage.fill('input[type="password"]', 'changeme123')
    await rpPage.click('button[type="submit"]')
    await expect(rpPage).toHaveURL(/\/rp$/)

    const eventCard = rpPage.locator('.event-select-card').filter({ hasText: eventName }).first()
    await expect(eventCard).toBeVisible()
    await eventCard.click()

    await rpPage.getByRole('button', { name: /generar acceso/i }).click()
    const previewImage = rpPage.locator('[data-testid="ticket-preview"]')
    await expect(previewImage).toBeVisible()
    const qrToken = (await previewImage.getAttribute('data-ticket-id'))?.trim() ?? ''
    expect(qrToken).not.toEqual('')

    const scannerLogin = await coreApi.post('/auth/login', {
      data: { username: 'scanner.demo', password: 'changeme123' },
    })
    expect(scannerLogin.ok()).toBeTruthy()
    const { token: scannerToken } = await scannerLogin.json()
    const scannerHeaders = { Authorization: `Bearer ${scannerToken}` }
    const scannerApi = await request.newContext({ baseURL: scannerApiBaseUrl })

    const validateResponse = await scannerApi.post('/scan/validate', {
      headers: scannerHeaders,
      data: { qrToken },
    })
    expect(validateResponse.status()).toBe(200)
    const validateBody = await validateResponse.json()
    expect(validateBody.valid).toBe(true)

    const confirmResponse = await scannerApi.post('/scan/confirm', {
      headers: scannerHeaders,
      data: { qrToken, clientRequestId: crypto.randomUUID() },
    })
    expect(confirmResponse.status()).toBe(200)
    const confirmBody = await confirmResponse.json()
    expect(confirmBody.confirmed).toBe(true)

    const revalidateResponse = await scannerApi.post('/scan/validate', {
      headers: scannerHeaders,
      data: { qrToken },
    })
    expect(revalidateResponse.status()).toBe(200)
    const revalidateBody = await revalidateResponse.json()
    expect(revalidateBody.valid).toBe(false)
    expect(revalidateBody.reason).toBe('ALREADY_SCANNED')

    const managerContext = await browser.newContext()
    const managerPage = await managerContext.newPage()
    await managerPage.goto('/login')
    await managerPage.fill('input[type="text"]', 'manager.demo')
    await managerPage.fill('input[type="password"]', 'changeme123')
    await managerPage.click('button[type="submit"]')
    await expect(managerPage).toHaveURL(/\/manager$/)

    await managerPage.click('a:has-text("Cortes")')
    await expect(managerPage).toHaveURL(/\/manager\/cuts$/)
    const managerEventCard = managerPage.locator('.card').filter({ hasText: eventName })
    await expect(managerEventCard).toBeVisible()
    await expect(managerEventCard).toContainText('Total')

    await rpContext.close()
    await managerContext.close()
    await scannerApi.dispose()
    await coreApi.dispose()
  })
})
