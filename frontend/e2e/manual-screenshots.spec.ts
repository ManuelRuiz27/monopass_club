import { devices, expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

const screenshotsDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots', 'manuales')

type Session = {
  token: string
  userId: string
  role: 'MANAGER' | 'RP' | 'SCANNER' | 'DIRECTOR'
}

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

async function bootstrapSession(page: Page, session: Session) {
  await page.addInitScript((currentSession: Session) => {
    window.localStorage.setItem('monopass_session', JSON.stringify(currentSession))
  }, session)
}

async function setSyntheticScannerOverlay(
  page: Page,
  tone: 'success' | 'error' | 'warning',
  title: string,
  message: string,
) {
  await page.evaluate(
    ({ overlayTone, overlayTitle, overlayMessage }) => {
      const viewport = document.querySelector('.scanner-stage__viewport')
      if (!viewport) return

      document.getElementById('manual-overlay')?.remove()

      const overlay = document.createElement('div')
      overlay.id = 'manual-overlay'
      overlay.className = `scanner-overlay scanner-overlay--${overlayTone}`
      overlay.style.zIndex = '5'

      const card = document.createElement('div')
      card.className = 'scanner-overlay__card'

      const heading = document.createElement('h3')
      heading.textContent = overlayTitle
      card.appendChild(heading)

      const copy = document.createElement('p')
      copy.textContent = overlayMessage
      card.appendChild(copy)

      overlay.appendChild(card)
      viewport.appendChild(overlay)
    },
    { overlayTone: tone, overlayTitle: title, overlayMessage: message },
  )
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
    const managerSession = (await managerLogin.json()) as Session
    const managerToken = managerSession.token
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
    const rpLogin = await loginByApiWithRetry(api, 'rp.demo', 'changeme123')
    expect(rpLogin.ok()).toBeTruthy()
    const rpSession = (await rpLogin.json()) as Session
    await bootstrapSession(rpPage, rpSession)
    await rpPage.goto('/rp/events')
    await expect(rpPage).toHaveURL(/\/rp\/events/)

    await waitForScreenReady(rpPage, 'Accesos en vivo')
    await take(rpPage, 'rp-mobile-01-eventos.png')

    const eventRows = rpPage.locator('.rp-event-row')
    await expect(eventRows.first()).toBeVisible()
    let eventCard = eventRows.filter({ hasText: eventName }).first()
    if ((await eventCard.count()) === 0) {
      eventCard = eventRows.first()
    }
    await expect(eventCard).toBeVisible()
    await eventCard.click()
    await waitForScreenReady(rpPage, 'Generar acceso rapido')
    await expect(rpPage.locator('.rp-event-quick-panel__form')).toBeVisible()
    await expect(rpPage.getByRole('button', { name: /generar acceso ahora/i })).toBeVisible()
    await take(rpPage, 'rp-mobile-02-generar-acceso.png')

    await rpPage.getByRole('button', { name: /generar acceso ahora/i }).click()
    await expect(rpPage).toHaveURL(/\/rp\/generated$/)
    const previewImage = rpPage.locator('[data-testid="ticket-preview"]')
    await expect(previewImage).toBeVisible()
    const qrToken = (await previewImage.getAttribute('data-ticket-id'))?.trim() ?? ''
    expect(qrToken).not.toEqual('')
    await waitForScreenReady(rpPage, 'Acceso Generado')
    await take(rpPage, 'rp-mobile-03-ticket-generado.png')

    await rpPage.goto('/rp/history')
    await expect(rpPage).toHaveURL(/\/rp\/history$/)
    await waitForScreenReady(rpPage, 'Historial de accesos')
    await take(rpPage, 'rp-mobile-04-historial.png')

    await rpPage.goto('/rp/profile')
    await expect(rpPage).toHaveURL(/\/rp\/profile$/)
    await waitForScreenReady(rpPage, 'Perfil RP')
    await take(rpPage, 'rp-mobile-05-perfil.png')

    const scannerContext = await browser.newContext({ ...devices['iPhone 13'] })
    const scannerPage = await scannerContext.newPage()
    await scannerPage.addInitScript(() => {
      const mockStream = new MediaStream()
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => mockStream,
          enumerateDevices: async () => [{ kind: 'videoinput', deviceId: 'mock-cam', label: 'Mock Camera' }],
        },
      })
      Object.defineProperty(navigator, 'permissions', {
        configurable: true,
        value: {
          query: async () => ({ state: 'granted' }),
        },
      })
    })
    const scannerLogin = await loginByApiWithRetry(api, 'scanner.demo', 'changeme123')
    expect(scannerLogin.ok()).toBeTruthy()
    const scannerSession = (await scannerLogin.json()) as Session
    await bootstrapSession(scannerPage, scannerSession)
    await scannerPage.goto('/scanner')
    await waitForScreenReady(scannerPage, 'Scanner')
    await take(scannerPage, 'scanner-mobile-01-home.png')

    await setSyntheticScannerOverlay(scannerPage, 'success', 'Acceso valido', 'Entrada confirmada correctamente.')
    await expect(scannerPage.locator('.scanner-overlay')).toContainText('Acceso valido', { timeout: 15000 })
    await take(scannerPage, 'scanner-mobile-02-validacion-exitosa.png')

    await setSyntheticScannerOverlay(scannerPage, 'error', 'Acceso invalido', 'Este ticket ya fue utilizado.')
    await expect(scannerPage.locator('.scanner-overlay')).toContainText('Acceso invalido', { timeout: 15000 })
    await take(scannerPage, 'scanner-mobile-03-ticket-reutilizado.png')

    await setSyntheticScannerOverlay(scannerPage, 'warning', 'Acceso valido con nota', 'Revisa la nota antes de confirmar.')
    await take(scannerPage, 'scanner-mobile-04-cortes.png')

    await rpContext.close()
    await scannerContext.close()
    await api.dispose()
  })
})
