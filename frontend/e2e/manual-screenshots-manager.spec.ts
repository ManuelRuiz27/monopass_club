import { expect, request, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'
const scannerApiBaseUrl =
  process.env.VITE_SCANNER_API_BASE_URL ?? process.env.SCANNER_API_BASE_URL ?? 'http://localhost:4100'

const screenshotsDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots', 'manuales')

async function take(page: Parameters<typeof test>[0]['page'], fileName: string) {
  await page.screenshot({
    path: path.join(screenshotsDir, fileName),
    fullPage: true,
  })
}

test.describe('Manual Screenshots Manager', () => {
  test.skip(!process.env.CAPTURE_MANUALS, 'Set CAPTURE_MANUALS=true to generate manual screenshots')

  test('captura flujos de gerente', async ({ browser }) => {
    mkdirSync(screenshotsDir, { recursive: true })

    const coreApi = await request.newContext({ baseURL: coreApiBaseUrl })
    const managerLogin = await coreApi.post('/auth/login', {
      data: { username: 'manager.demo', password: 'changeme123' },
    })
    expect(managerLogin.ok()).toBeTruthy()
    const { token: managerToken } = await managerLogin.json()
    const managerHeaders = { Authorization: `Bearer ${managerToken}` }

    const clubsResponse = await coreApi.get('/clubs', { headers: managerHeaders })
    const clubs = await clubsResponse.json()
    expect(Array.isArray(clubs) && clubs.length > 0).toBeTruthy()

    const eventName = `Manual Manager ${Date.now()}`
    const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const createEventResponse = await coreApi.post('/events', {
      headers: managerHeaders,
      data: {
        clubId: clubs[0].id,
        name: eventName,
        startsAt,
        endsAt,
      },
    })
    expect(createEventResponse.ok()).toBeTruthy()
    const event = await createEventResponse.json()

    const rpsResponse = await coreApi.get('/rps', { headers: managerHeaders })
    const rps = await rpsResponse.json()
    const rpDemo = Array.isArray(rps) ? rps.find((rp) => rp.user?.username === 'rp.demo') : null
    expect(rpDemo).toBeTruthy()

    const assignResponse = await coreApi.post(`/events/${event.id}/rps`, {
      headers: managerHeaders,
      data: { rpId: rpDemo.id, limitAccesses: 10 },
    })
    expect(assignResponse.ok()).toBeTruthy()

    const rpLogin = await coreApi.post('/auth/login', {
      data: { username: 'rp.demo', password: 'changeme123' },
    })
    expect(rpLogin.ok()).toBeTruthy()
    const { token: rpToken } = await rpLogin.json()

    const createTicket = await coreApi.post('/tickets', {
      headers: { Authorization: `Bearer ${rpToken}` },
      data: { eventId: event.id, guestType: 'GENERAL' },
    })
    expect(createTicket.status()).toBe(201)
    const ticket = await createTicket.json()

    const scannerLogin = await coreApi.post('/auth/login', {
      data: { username: 'scanner.demo', password: 'changeme123' },
    })
    expect(scannerLogin.ok()).toBeTruthy()
    const { token: scannerToken } = await scannerLogin.json()
    const scannerApi = await request.newContext({ baseURL: scannerApiBaseUrl })
    const confirmResponse = await scannerApi.post('/scan/confirm', {
      headers: { Authorization: `Bearer ${scannerToken}` },
      data: { qrToken: ticket.id, clientRequestId: crypto.randomUUID() },
    })
    expect([200, 409]).toContain(confirmResponse.status())

    const managerContext = await browser.newContext()
    const managerPage = await managerContext.newPage()

    await managerPage.goto('/login')
    await managerPage.fill('input[type="text"]', 'manager.demo')
    await managerPage.fill('input[type="password"]', 'changeme123')
    await managerPage.click('button[type="submit"]')
    await expect(managerPage).toHaveURL(/\/manager$/)
    await take(managerPage, 'manager-01-dashboard.png')

    await managerPage.goto('/manager/team/rps')
    await expect(managerPage).toHaveURL(/\/manager\/team\/rps$/)
    await take(managerPage, 'manager-02-team-rps.png')

    await managerPage.goto('/manager/team/groups')
    await expect(managerPage).toHaveURL(/\/manager\/team\/groups$/)
    await take(managerPage, 'manager-03-team-rp-groups.png')

    await managerPage.goto('/manager/team/staff')
    await expect(managerPage).toHaveURL(/\/manager\/team\/staff$/)
    await take(managerPage, 'manager-04-team-scanner-staff.png')

    await managerPage.goto('/manager/team/clubs')
    await expect(managerPage).toHaveURL(/\/manager\/team\/clubs$/)
    await take(managerPage, 'manager-05-clubs.png')

    await managerPage.goto('/manager/events')
    await expect(managerPage).toHaveURL(/\/manager\/events$/)
    await expect(managerPage.locator('.card').filter({ hasText: eventName }).first()).toBeVisible()
    await take(managerPage, 'manager-06-eventos.png')

    await managerPage.goto('/manager/template')
    await expect(managerPage).toHaveURL(/\/manager\/template$/)
    await managerPage.locator('label:has-text("Evento") select').selectOption(event.id)
    await take(managerPage, 'manager-07-plantilla-qr.png')

    await managerPage.goto('/manager/cuts')
    await expect(managerPage).toHaveURL(/\/manager\/cuts$/)
    await take(managerPage, 'manager-08-cortes.png')

    await managerPage.goto('/manager/settings')
    await expect(managerPage).toHaveURL(/\/manager\/settings$/)
    await take(managerPage, 'manager-09-settings.png')

    await managerContext.close()
    await scannerApi.dispose()
    await coreApi.dispose()
  })
})
