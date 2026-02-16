import { devices, expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

const screenshotsDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots', 'manuales')

type Session = {
  token: string
  userId: string
  role: 'MANAGER' | 'DIRECTOR'
}

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

async function bootstrapDirectorSession(page: Page, managerSession: Session) {
  const directorSession = { ...managerSession, role: 'DIRECTOR' as const }
  await page.addInitScript((session: Session) => {
    window.localStorage.setItem('monopass_session', JSON.stringify(session))
  }, directorSession)
}

test.describe('Manual Screenshots Director', () => {
  test.skip(!process.env.CAPTURE_MANUALS, 'Set CAPTURE_MANUALS=true to generate manual screenshots')

  test('captura baseline director desktop y mobile', async ({ browser }) => {
    mkdirSync(screenshotsDir, { recursive: true })

    const api = await request.newContext({ baseURL: coreApiBaseUrl })
    const loginResponse = await loginByApiWithRetry(api, 'manager.demo', 'changeme123')
    expect(loginResponse.ok()).toBeTruthy()
    const managerSession = (await loginResponse.json()) as Session

    const directorDesktop = await browser.newContext()
    const directorDesktopPage = await directorDesktop.newPage()
    await bootstrapDirectorSession(directorDesktopPage, managerSession)

    await directorDesktopPage.goto('/director')
    await expect(directorDesktopPage).toHaveURL(/\/director$/)
    await waitForScreenReady(directorDesktopPage, 'Dashboard global')
    await take(directorDesktopPage, 'director-desktop-01-dashboard.png')

    await directorDesktopPage.goto('/director/comparative')
    await expect(directorDesktopPage).toHaveURL(/\/director\/comparative$/)
    await waitForScreenReady(directorDesktopPage, 'Comparativo')
    await take(directorDesktopPage, 'director-desktop-02-comparativo.png')

    await directorDesktopPage.goto('/director/historical')
    await expect(directorDesktopPage).toHaveURL(/\/director\/historical$/)
    await waitForScreenReady(directorDesktopPage, 'Historicas')
    await take(directorDesktopPage, 'director-desktop-03-historicas.png')

    await directorDesktopPage.goto('/director/reports')
    await expect(directorDesktopPage).toHaveURL(/\/director\/reports$/)
    await waitForScreenReady(directorDesktopPage, 'Reportes')
    await take(directorDesktopPage, 'director-desktop-04-reportes.png')

    await directorDesktopPage.goto('/director/status')
    await expect(directorDesktopPage).toHaveURL(/\/director\/status$/)
    await waitForScreenReady(directorDesktopPage, 'Estados')
    await take(directorDesktopPage, 'director-desktop-05-estados.png')

    const directorMobile = await browser.newContext({ ...devices['iPhone 13'] })
    const directorMobilePage = await directorMobile.newPage()
    await bootstrapDirectorSession(directorMobilePage, managerSession)

    await directorMobilePage.goto('/director')
    await expect(directorMobilePage).toHaveURL(/\/director$/)
    await waitForScreenReady(directorMobilePage, 'Dashboard global')
    await take(directorMobilePage, 'director-mobile-01-dashboard.png')

    await directorMobilePage.goto('/director/comparative')
    await expect(directorMobilePage).toHaveURL(/\/director\/comparative$/)
    await waitForScreenReady(directorMobilePage, 'Comparativo')
    await take(directorMobilePage, 'director-mobile-02-comparativo.png')

    await directorMobilePage.goto('/director/historical')
    await expect(directorMobilePage).toHaveURL(/\/director\/historical$/)
    await waitForScreenReady(directorMobilePage, 'Historicas')
    await take(directorMobilePage, 'director-mobile-03-historicas.png')

    await directorMobilePage.goto('/director/reports')
    await expect(directorMobilePage).toHaveURL(/\/director\/reports$/)
    await waitForScreenReady(directorMobilePage, 'Reportes')
    await take(directorMobilePage, 'director-mobile-04-reportes.png')

    await directorMobilePage.goto('/director/status')
    await expect(directorMobilePage).toHaveURL(/\/director\/status$/)
    await waitForScreenReady(directorMobilePage, 'Estados')
    await take(directorMobilePage, 'director-mobile-05-estados.png')

    await directorDesktop.close()
    await directorMobile.close()
    await api.dispose()
  })
})
