import { test, expect, request } from '@playwright/test'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

test.describe('RP Limit', () => {
  test('E2E-005: RP muestra limite alcanzado', async ({ browser }) => {
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

    const eventName = `Limite E2E ${Date.now()}`
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
      data: { rpId: rpDemo.id, limitAccesses: 1 },
    })
    expect(assignResponse.ok()).toBeTruthy()
    await api.dispose()

    const rpContext = await browser.newContext()
    const rpPage = await rpContext.newPage()
    await rpPage.goto('/login')
    await rpPage.fill('input[type="text"]', 'rp.demo')
    await rpPage.fill('input[type="password"]', 'changeme123')
    await rpPage.click('button[type="submit"]')
    await expect(rpPage).toHaveURL(/\/rp$/)

    await rpPage.click('a:has-text("Generar acceso")')
    const eventSelect = rpPage.locator('select').first()
    await expect(eventSelect).toBeVisible()

    const option = eventSelect.locator(`option:has-text("${eventName}")`)
    await expect(option).toBeVisible()
    const assignmentId = await option.getAttribute('value')
    if (!assignmentId) {
      throw new Error('No se encontro el assignmentId del evento de limite')
    }

    await eventSelect.selectOption(assignmentId)
    await rpPage.click('[data-testid="generate-btn"]')
    await expect(rpPage.locator('[data-testid="ticket-preview"]')).toBeVisible()
    await expect(rpPage.getByText('Limite alcanzado')).toBeVisible()
    await expect(rpPage.getByTestId('generate-btn')).toBeDisabled()

    await rpContext.close()
  })
})
