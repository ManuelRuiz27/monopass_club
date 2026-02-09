import { expect, request, test, type APIRequestContext } from '@playwright/test'

const coreApiBaseUrl =
  process.env.VITE_CORE_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

async function login(api: APIRequestContext, username: string, password: string) {
  const response = await api.post('/auth/login', {
    data: { username, password },
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  return body.token as string
}

test.describe('Security Permissions', () => {
  test('SEC-001: RP solo puede descargar tickets propios', async () => {
    const api = await request.newContext({ baseURL: coreApiBaseUrl })
    const managerToken = await login(api, 'manager.demo', 'changeme123')
    const managerHeaders = { Authorization: `Bearer ${managerToken}` }

    const clubsResponse = await api.get('/clubs', { headers: managerHeaders })
    expect(clubsResponse.ok()).toBeTruthy()
    const clubs = await clubsResponse.json()
    expect(Array.isArray(clubs) && clubs.length > 0).toBeTruthy()

    const unique = Date.now()
    const eventResponse = await api.post('/events', {
      headers: managerHeaders,
      data: {
        clubId: clubs[0].id,
        name: `SEC Event ${unique}`,
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    })
    expect(eventResponse.ok()).toBeTruthy()
    const event = await eventResponse.json()

    const ownerUsername = `rp_owner_${unique}`
    const viewerUsername = `rp_viewer_${unique}`
    const rpPassword = 'secret123'

    const ownerCreateResponse = await api.post('/rps', {
      headers: managerHeaders,
      data: {
        name: `Owner ${unique}`,
        username: ownerUsername,
        password: rpPassword,
      },
    })
    expect(ownerCreateResponse.ok()).toBeTruthy()
    const ownerRp = await ownerCreateResponse.json()

    const viewerCreateResponse = await api.post('/rps', {
      headers: managerHeaders,
      data: {
        name: `Viewer ${unique}`,
        username: viewerUsername,
        password: rpPassword,
      },
    })
    expect(viewerCreateResponse.ok()).toBeTruthy()

    const assignResponse = await api.post(`/events/${event.id}/rps`, {
      headers: managerHeaders,
      data: { rpId: ownerRp.id, limitAccesses: 5 },
    })
    expect(assignResponse.ok()).toBeTruthy()

    const ownerToken = await login(api, ownerUsername, rpPassword)
    const viewerToken = await login(api, viewerUsername, rpPassword)
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` }
    const viewerHeaders = { Authorization: `Bearer ${viewerToken}` }

    const ticketResponse = await api.post('/tickets', {
      headers: ownerHeaders,
      data: {
        eventId: event.id,
        guestType: 'GENERAL',
      },
    })
    expect(ticketResponse.status()).toBe(201)
    const ticket = await ticketResponse.json()

    const ownerDownload = await api.get(`/tickets/${ticket.id}/png`, { headers: ownerHeaders })
    expect(ownerDownload.status()).toBe(200)
    expect(ownerDownload.headers()['content-type']).toContain('image/png')

    const viewerDownload = await api.get(`/tickets/${ticket.id}/png`, { headers: viewerHeaders })
    expect(viewerDownload.status()).toBe(404)

    await api.dispose()
  })

  test('SEC-002: health endpoints sensibles requieren manager y seed esta bloqueado por defecto', async () => {
    const api = await request.newContext({ baseURL: coreApiBaseUrl })
    const managerToken = await login(api, 'manager.demo', 'changeme123')
    const rpToken = await login(api, 'rp.demo', 'changeme123')

    const managerHeaders = { Authorization: `Bearer ${managerToken}` }
    const rpHeaders = { Authorization: `Bearer ${rpToken}` }

    const diagnoseNoAuth = await api.get('/health/diagnose')
    expect(diagnoseNoAuth.status()).toBe(401)

    const diagnoseRp = await api.get('/health/diagnose', { headers: rpHeaders })
    expect(diagnoseRp.status()).toBe(403)

    const diagnoseManager = await api.get('/health/diagnose', { headers: managerHeaders })
    expect(diagnoseManager.status()).toBe(200)

    const seedNoAuth = await api.post('/health/seed')
    expect(seedNoAuth.status()).toBe(401)

    const seedRp = await api.post('/health/seed', { headers: rpHeaders })
    expect(seedRp.status()).toBe(403)

    const seedManager = await api.post('/health/seed', { headers: managerHeaders })
    expect(seedManager.status()).toBe(403)

    await api.dispose()
  })
})
