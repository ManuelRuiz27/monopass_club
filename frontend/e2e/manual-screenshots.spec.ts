import { expect, request, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

const screenshotsDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots', 'manuales')

async function take(page: Parameters<typeof test>[0]['page'], fileName: string) {
  await page.screenshot({
    path: path.join(screenshotsDir, fileName),
    fullPage: true,
  })
}

test.describe('Manual Screenshots', () => {
  test.skip(!process.env.CAPTURE_MANUALS, 'Set CAPTURE_MANUALS=true to generate manual screenshots')

  test('captura flujos RP y Scanner', async ({ browser }) => {
    mkdirSync(screenshotsDir, { recursive: true })

    const api = await request.newContext({ baseURL: coreApiBaseUrl })
    const managerLogin = await api.post('/auth/login', {
      data: { username: 'manager.demo', password: 'changeme123' },
    })
    expect(managerLogin.ok()).toBeTruthy()
    const { token: managerToken } = await managerLogin.json()
    const managerHeaders = { Authorization: `Bearer ${managerToken}` }

    const clubsResponse = await api.get('/clubs', { headers: managerHeaders })
    const clubs = await clubsResponse.json()
    expect(Array.isArray(clubs) && clubs.length > 0).toBeTruthy()

    const eventName = `Manual RP Scanner ${Date.now()}`
    const eventResponse = await api.post('/events', {
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

    const rpsResponse = await api.get('/rps', { headers: managerHeaders })
    const rps = await rpsResponse.json()
    const rpDemo = Array.isArray(rps) ? rps.find((rp) => rp.user?.username === 'rp.demo') : null
    expect(rpDemo).toBeTruthy()

    const assignResponse = await api.post(`/events/${event.id}/rps`, {
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
    await take(rpPage, 'rp-01-eventos-asignados.png')

    const eventCard = rpPage.locator('.event-select-card').filter({ hasText: eventName }).first()
    await expect(eventCard).toBeVisible()
    await eventCard.click()
    await take(rpPage, 'rp-02-generar-acceso.png')

    await rpPage.getByRole('button', { name: /generar acceso/i }).click()
    const previewImage = rpPage.locator('[data-testid="ticket-preview"]')
    await expect(previewImage).toBeVisible()
    const qrToken = (await previewImage.getAttribute('data-ticket-id'))?.trim() ?? ''
    expect(qrToken).not.toEqual('')
    await take(rpPage, 'rp-03-ticket-generado.png')

    await rpPage.goto('/rp/history')
    await expect(rpPage).toHaveURL(/\/rp\/history$/)
    await take(rpPage, 'rp-04-historial.png')

    await rpPage.goto('/rp/profile')
    await expect(rpPage).toHaveURL(/\/rp\/profile$/)
    await take(rpPage, 'rp-05-perfil.png')

    const scannerContext = await browser.newContext()
    const scannerPage = await scannerContext.newPage()
    await scannerPage.goto('/login')
    await scannerPage.fill('input[type="text"]', 'scanner.demo')
    await scannerPage.fill('input[type="password"]', 'changeme123')
    await scannerPage.click('button[type="submit"]')
    await expect(scannerPage).toHaveURL(/\/scanner$/)
    await take(scannerPage, 'scanner-01-home.png')

    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.click('[data-testid="validate-btn"]')
    await expect(scannerPage.locator('.ticket-info')).toContainText('Estado: Escaneado', { timeout: 15000 })
    await take(scannerPage, 'scanner-02-validacion-exitosa.png')

    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.click('[data-testid="validate-btn"]')
    await expect(scannerPage.locator('.feedback-error')).toBeVisible({ timeout: 10000 })
    await take(scannerPage, 'scanner-03-ticket-reutilizado.png')

    await scannerPage.goto('/scanner/cuts')
    await expect(scannerPage).toHaveURL(/\/scanner\/cuts$/)
    await take(scannerPage, 'scanner-04-cortes.png')

    await rpContext.close()
    await scannerContext.close()
    await api.dispose()
  })
})
