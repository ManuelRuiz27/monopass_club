import { devices, expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'
const scannerApiBaseUrl =
  process.env.VITE_SCANNER_API_BASE_URL ?? process.env.SCANNER_API_BASE_URL ?? 'http://localhost:4100'

const screenshotsDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots', 'manuales')

async function take(page: Page, fileName: string) {
  const viewport = page.viewportSize()
  const isMobile = Boolean(viewport && viewport.width <= 430)
  const fullPageDesktop = process.env.CAPTURE_FULLPAGE_DESKTOP === 'true'
  await page.screenshot({
    path: path.join(screenshotsDir, fileName),
    fullPage: isMobile ? false : fullPageDesktop,
    animations: 'disabled',
  })
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

async function waitForShellReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.app-bottom-nav')).toBeVisible()
}

async function waitForManagerContent(page: Page) {
  await waitForShellReady(page)
  await expect(page.getByText('Cargando...', { exact: false })).toHaveCount(0, { timeout: 15000 })
}

async function waitForMarker(page: Page, marker: string) {
  await page.waitForFunction(
    ({ expectedMarker }) => {
      const text = document.body?.innerText ?? ''
      return text.includes(expectedMarker) || text.includes('No se pudo')
    },
    { expectedMarker: marker },
    { timeout: 20_000 },
  )
}

test.describe('Manual Screenshots Manager', () => {
  test.skip(!process.env.CAPTURE_MANUALS, 'Set CAPTURE_MANUALS=true to generate manual screenshots')
  test.setTimeout(180000)

  test('captura baseline de gerente desktop y mobile', async ({ browser }) => {
    mkdirSync(screenshotsDir, { recursive: true })

    const coreApi = await request.newContext({ baseURL: coreApiBaseUrl })
    const scannerApi = await request.newContext({ baseURL: scannerApiBaseUrl })

    const managerLogin = await loginByApiWithRetry(coreApi, 'manager.demo', 'changeme123')
    expect(managerLogin.ok()).toBeTruthy()
    const { token: managerToken } = await managerLogin.json()
    const managerHeaders = { Authorization: `Bearer ${managerToken}` }

    const clubsResponse = await coreApi.get('/clubs', { headers: managerHeaders })
    const clubs = await clubsResponse.json()
    expect(Array.isArray(clubs) && clubs.length > 0).toBeTruthy()

    const rpsResponse = await coreApi.get('/rps', { headers: managerHeaders })
    const rps = await rpsResponse.json()
    const rpDemo = Array.isArray(rps) ? rps.find((rp) => rp.user?.username === 'rp.demo') : null
    expect(rpDemo).toBeTruthy()

    const eventName = `Manual Manager ${Date.now()}`
    const createEventResponse = await coreApi.post('/events', {
      headers: managerHeaders,
      data: {
        clubId: clubs[0].id,
        name: eventName,
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    })
    expect(createEventResponse.ok()).toBeTruthy()
    const event = await createEventResponse.json()

    const assignResponse = await coreApi.post(`/events/${event.id}/rps`, {
      headers: managerHeaders,
      data: { rpId: rpDemo.id, limitAccesses: 20 },
    })
    expect(assignResponse.ok()).toBeTruthy()

    const rpLogin = await loginByApiWithRetry(coreApi, 'rp.demo', 'changeme123')
    expect(rpLogin.ok()).toBeTruthy()
    const { token: rpToken } = await rpLogin.json()

    const createTicket = await coreApi.post('/tickets', {
      headers: { Authorization: `Bearer ${rpToken}` },
      data: { eventId: event.id, guestType: 'GENERAL' },
    })
    expect(createTicket.status()).toBe(201)
    const ticket = await createTicket.json()

    const scannerLogin = await loginByApiWithRetry(coreApi, 'scanner.demo', 'changeme123')
    expect(scannerLogin.ok()).toBeTruthy()
    const { token: scannerToken } = await scannerLogin.json()
    const confirmResponse = await scannerApi.post('/scan/confirm', {
      headers: { Authorization: `Bearer ${scannerToken}` },
      data: { qrToken: ticket.id, clientRequestId: crypto.randomUUID() },
    })
    expect([200, 409]).toContain(confirmResponse.status())

    const managerDesktop = await browser.newContext()
    const managerDesktopPage = await managerDesktop.newPage()
    await loginByUi(managerDesktopPage, 'manager.demo', 'changeme123')
    await expect(managerDesktopPage).toHaveURL(/\/manager/)
    await waitForManagerContent(managerDesktopPage)

    await managerDesktopPage.goto('/manager')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Dashboard')
    await take(managerDesktopPage, 'manager-desktop-01-dashboard.png')

    await managerDesktopPage.goto('/manager/events')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Eventos')
    await expect(managerDesktopPage.locator('body')).toContainText(eventName)
    await take(managerDesktopPage, 'manager-desktop-02-eventos.png')

    await managerDesktopPage.goto(`/manager/events/${event.id}`)
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, eventName)
    await expect(managerDesktopPage.locator('body')).toContainText(eventName)
    await take(managerDesktopPage, 'manager-desktop-03-detalle-activo.png')

    const closeEventResponse = await coreApi.patch(`/events/${event.id}`, {
      headers: managerHeaders,
      data: { active: false },
    })
    expect(closeEventResponse.ok()).toBeTruthy()

    await managerDesktopPage.goto(`/manager/events/${event.id}`)
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Evento Finalizado')
    await expect(managerDesktopPage.locator('body')).toContainText('Evento Finalizado')
    await take(managerDesktopPage, 'manager-desktop-04-detalle-cerrado.png')

    await managerDesktopPage.goto('/manager/team/rps')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Relaciones Publicas')
    await take(managerDesktopPage, 'manager-desktop-05-team-rps.png')

    await managerDesktopPage.goto('/manager/team/groups')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Grupos de RPs')
    await take(managerDesktopPage, 'manager-desktop-06-team-grupos.png')

    await managerDesktopPage.goto('/manager/team/staff')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Staff Scanner')
    await take(managerDesktopPage, 'manager-desktop-07-team-staff.png')

    await managerDesktopPage.goto('/manager/team/clubs')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Clubs')
    await take(managerDesktopPage, 'manager-desktop-08-clubs.png')

    await managerDesktopPage.goto('/manager/template')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Plantilla')
    await managerDesktopPage.locator('label:has-text("Evento") select').selectOption(event.id)
    await take(managerDesktopPage, 'manager-desktop-09-plantilla.png')

    await managerDesktopPage.goto('/manager/cuts')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Cortes')
    await take(managerDesktopPage, 'manager-desktop-10-cortes.png')

    await managerDesktopPage.goto('/manager/settings')
    await waitForManagerContent(managerDesktopPage)
    await waitForMarker(managerDesktopPage, 'Configuracion')
    await take(managerDesktopPage, 'manager-desktop-11-settings.png')

    const managerMobile = await browser.newContext({ ...devices['iPhone 13'] })
    const managerMobilePage = await managerMobile.newPage()
    await loginByUi(managerMobilePage, 'manager.demo', 'changeme123')
    await expect(managerMobilePage).toHaveURL(/\/manager/)
    await waitForManagerContent(managerMobilePage)

    await managerMobilePage.goto('/manager')
    await waitForManagerContent(managerMobilePage)
    await waitForMarker(managerMobilePage, 'Dashboard')
    await take(managerMobilePage, 'manager-mobile-01-dashboard.png')

    await managerMobilePage.goto('/manager/events')
    await waitForManagerContent(managerMobilePage)
    await waitForMarker(managerMobilePage, 'Eventos')
    await take(managerMobilePage, 'manager-mobile-02-eventos.png')

    await managerMobilePage.goto('/manager/team/rps')
    await waitForManagerContent(managerMobilePage)
    await waitForMarker(managerMobilePage, 'Relaciones Publicas')
    await take(managerMobilePage, 'manager-mobile-03-team-rps.png')

    await managerMobilePage.goto('/manager/cuts')
    await waitForManagerContent(managerMobilePage)
    await waitForMarker(managerMobilePage, 'Cortes')
    await take(managerMobilePage, 'manager-mobile-04-cortes.png')

    await managerDesktop.close()
    await managerMobile.close()
    await scannerApi.dispose()
    await coreApi.dispose()
  })
})
