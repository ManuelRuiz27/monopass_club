import { devices, expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

const screenshotsDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots', 'manuales')

async function take(page: Page, fileName: string) {
  const viewport = page.viewportSize()
  const isMobile = Boolean(viewport && viewport.width <= 430)
  const fullPageDesktop = process.env.CAPTURE_FULLPAGE_DESKTOP === 'true'
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(120)
  await page.screenshot({
    path: path.join(screenshotsDir, fileName),
    fullPage: isMobile ? false : fullPageDesktop,
    animations: 'disabled',
  })
}

async function waitForScreenReady(page: Page, marker: string) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined)
  await page.waitForFunction(
    ({ expectedMarker }) => {
      const root = document.querySelector('#root')
      const text = document.body?.innerText?.trim() ?? ''
      if (!text) return false
      if (text.includes(expectedMarker)) return true
      if (text.includes('No se pudo') || text.includes('Error al cargar')) return true
      const hasRenderableContent = Boolean(root && root.querySelector('*'))
      return hasRenderableContent && text.length > 80 && !text.includes('Cargando...')
    },
    { expectedMarker: marker },
    { timeout: 20_000 },
  )
}

async function loginByUi(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="text"]', username)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

async function loginByApiWithRetry(api: APIRequestContext, username: string, password: string) {
  const maxAttempts = 12
  let lastStatus = 0
  let lastBody = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await api.post('/auth/login', { data: { username, password } })
    if (response.ok()) return response

    lastStatus = response.status()
    lastBody = await response.text().catch(() => '')
    const isRetryable = lastStatus >= 500 || lastStatus === 429
    if (!isRetryable || attempt === maxAttempts) break
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Login failed for ${username}. status=${lastStatus} body=${lastBody.slice(0, 250)}`)
}

test.describe('Manual Screenshots RP + Scanner', () => {
  test.skip(!process.env.CAPTURE_MANUALS, 'Set CAPTURE_MANUALS=true to generate manual screenshots')
  test.setTimeout(480000)

  test('captura baseline RP y Scanner mobile', async ({ browser }) => {
    mkdirSync(screenshotsDir, { recursive: true })

    const api = await request.newContext({ baseURL: coreApiBaseUrl })
    const managerLogin = await loginByApiWithRetry(api, 'manager.demo', 'changeme123')
    expect(managerLogin.ok()).toBeTruthy()
    const { token: managerToken } = await managerLogin.json()
    const managerHeaders = { Authorization: `Bearer ${managerToken}` }

    const clubsResponse = await api.get('/clubs', { headers: managerHeaders })
    const clubs = await clubsResponse.json()
    expect(Array.isArray(clubs) && clubs.length > 0).toBeTruthy()

    const rpsResponse = await api.get('/rps', { headers: managerHeaders })
    const rps = await rpsResponse.json()
    const rpDemo = Array.isArray(rps) ? rps.find((rp) => rp.user?.username === 'rp.demo') : null
    expect(rpDemo).toBeTruthy()

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

    const assignResponse = await api.post(`/events/${event.id}/rps`, {
      headers: managerHeaders,
      data: { rpId: rpDemo.id, limitAccesses: 10 },
    })
    expect(assignResponse.ok()).toBeTruthy()

    const rpContext = await browser.newContext({ ...devices['iPhone 13'] })
    const rpPage = await rpContext.newPage()
    await loginByUi(rpPage, 'rp.demo', 'changeme123')
    await expect(rpPage).toHaveURL(/\/rp/)

    await rpPage.goto('/rp/events')
    await waitForScreenReady(rpPage, 'Mis eventos')
    await take(rpPage, 'rp-mobile-01-eventos.png')

    const eventCard = rpPage.locator('.event-select-card').filter({ hasText: eventName }).first()
    await expect(eventCard).toBeVisible()
    await eventCard.click()
    await expect(rpPage).toHaveURL(/\/rp\/generate\//)
    await waitForScreenReady(rpPage, 'Generar acceso')
    await expect(rpPage.getByText('Tipo de invitado')).toBeVisible()
    await expect(rpPage.getByRole('button', { name: /generar acceso/i })).toBeVisible()
    await take(rpPage, 'rp-mobile-02-generar-acceso.png')

    await rpPage.getByRole('button', { name: /generar acceso/i }).click()
    await expect(rpPage).toHaveURL(/\/rp\/generated$/)
    const previewImage = rpPage.locator('[data-testid="ticket-preview"]')
    await expect(previewImage).toBeVisible()
    const qrToken = (await previewImage.getAttribute('data-ticket-id'))?.trim() ?? ''
    expect(qrToken).not.toEqual('')
    await waitForScreenReady(rpPage, 'Acceso Generado')
    await take(rpPage, 'rp-mobile-03-ticket-generado.png')

    await rpPage.goto('/rp/history')
    await expect(rpPage).toHaveURL(/\/rp\/history$/)
    await waitForScreenReady(rpPage, 'Historial')
    await take(rpPage, 'rp-mobile-04-historial.png')

    await rpPage.goto('/rp/profile')
    await expect(rpPage).toHaveURL(/\/rp\/profile$/)
    await waitForScreenReady(rpPage, 'Perfil')
    await take(rpPage, 'rp-mobile-05-perfil.png')

    const scannerContext = await browser.newContext({ ...devices['iPhone 13'] })
    const scannerPage = await scannerContext.newPage()
    await loginByUi(scannerPage, 'scanner.demo', 'changeme123')
    await expect(scannerPage).toHaveURL(/\/scanner/)
    await scannerPage.goto('/scanner')
    await waitForScreenReady(scannerPage, 'Scanner')
    await take(scannerPage, 'scanner-mobile-01-home.png')

    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.getByRole('button', { name: /^Validar$/i }).click()
    await expect(scannerPage.locator('.scanner-overlay')).toContainText('Acceso valido', { timeout: 15000 })
    await waitForScreenReady(scannerPage, 'Acceso valido')
    await take(scannerPage, 'scanner-mobile-02-validacion-exitosa.png')

    await scannerPage.getByRole('button', { name: /Escanear otro/i }).click()
    await scannerPage.fill('[data-testid="scanner-input"]', qrToken)
    await scannerPage.getByRole('button', { name: /^Validar$/i }).click()
    await expect(scannerPage.locator('.scanner-overlay')).toContainText('Acceso invalido', { timeout: 15000 })
    await waitForScreenReady(scannerPage, 'Acceso invalido')
    await take(scannerPage, 'scanner-mobile-03-ticket-reutilizado.png')

    await scannerPage.goto('/scanner/cuts')
    await expect(scannerPage).toHaveURL(/\/scanner\/cuts$/)
    await waitForScreenReady(scannerPage, 'Cortes en tiempo real')
    await take(scannerPage, 'scanner-mobile-04-cortes.png')

    await rpContext.close()
    await scannerContext.close()
    await api.dispose()
  })
})
