import { createServer, IncomingMessage, ServerResponse } from 'http'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'

type PreferencePayload = {
  external_reference?: string
  back_urls?: {
    success?: string
    pending?: string
    failure?: string
  }
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(data) as Record<string, unknown>)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

describe.sequential('landing payment flow e2e (local fake MP)', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  let fakeMpServer: ReturnType<typeof createServer>
  let fakeMpBaseUrl = ''
  let capturedPreference: PreferencePayload | undefined

  const createdOrderIds = new Set<string>()
  const createdManagerIds = new Set<string>()
  const createdClubIds = new Set<string>()
  const createdEventIds = new Set<string>()
  const createdLicenseIds = new Set<string>()

  const originalMpAccessToken = env.MP_ACCESS_TOKEN
  const originalAppPublicBaseUrl = env.APP_PUBLIC_BASE_URL
  const originalResendApiKey = env.RESEND_API_KEY
  const originalResendFromEmail = env.RESEND_FROM_EMAIL
  const originalMpWebhookSecret = env.MP_WEBHOOK_SECRET
  const originalMpApiBaseUrl = process.env.MP_API_BASE_URL

  beforeAll(async () => {
    fakeMpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const method = req.method ?? 'GET'
      const url = new URL(req.url ?? '/', 'http://localhost')

      if (method === 'POST' && url.pathname === '/checkout/preferences') {
        const body = await readJsonBody(req)
        capturedPreference = body as PreferencePayload
        const response = {
          id: `pref_${randomUUID().slice(0, 6)}`,
          init_point: 'https://checkout.test/redirect',
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(response))
        return
      }

      if (method === 'GET' && url.pathname.startsWith('/v1/payments/')) {
        const paymentId = url.pathname.split('/').at(-1) ?? 'payment'
        const response = {
          id: paymentId,
          status: 'approved',
          external_reference: capturedPreference?.external_reference ?? null,
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(response))
        return
      }

      res.statusCode = 404
      res.end('not_found')
    })

    await new Promise<void>((resolve) => fakeMpServer.listen(0, '127.0.0.1', () => resolve()))
    const address = fakeMpServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('Could not bind fake MP server')
    }
    fakeMpBaseUrl = `http://127.0.0.1:${address.port}`

    env.MP_ACCESS_TOKEN = 'mp-token-test'
    env.APP_PUBLIC_BASE_URL = 'http://localhost:5174'
    env.RESEND_API_KEY = undefined
    env.RESEND_FROM_EMAIL = undefined
    env.MP_WEBHOOK_SECRET = undefined
    process.env.MP_API_BASE_URL = fakeMpBaseUrl

    app = await buildServer()
    await app.ready()
  })

  afterEach(async () => {
    if (createdEventIds.size > 0) {
      await prisma.event.deleteMany({ where: { id: { in: Array.from(createdEventIds) } } })
      createdEventIds.clear()
    }
    if (createdLicenseIds.size > 0) {
      await prisma.license.deleteMany({ where: { id: { in: Array.from(createdLicenseIds) } } })
      createdLicenseIds.clear()
    }
    if (createdClubIds.size > 0) {
      await prisma.club.deleteMany({ where: { id: { in: Array.from(createdClubIds) } } })
      createdClubIds.clear()
    }
    if (createdManagerIds.size > 0) {
      await prisma.managerSetting.deleteMany({ where: { managerId: { in: Array.from(createdManagerIds) } } })
      await prisma.user.deleteMany({ where: { id: { in: Array.from(createdManagerIds) } } })
      createdManagerIds.clear()
    }
    if (createdOrderIds.size > 0) {
      await prisma.landingOrder.deleteMany({ where: { id: { in: Array.from(createdOrderIds) } } })
      createdOrderIds.clear()
    }
    capturedPreference = undefined
  })

  afterAll(async () => {
    env.MP_ACCESS_TOKEN = originalMpAccessToken
    env.APP_PUBLIC_BASE_URL = originalAppPublicBaseUrl
    env.RESEND_API_KEY = originalResendApiKey
    env.RESEND_FROM_EMAIL = originalResendFromEmail
    env.MP_WEBHOOK_SECRET = originalMpWebhookSecret
    process.env.MP_API_BASE_URL = originalMpApiBaseUrl

    await app.close()
    await new Promise<void>((resolve, reject) => fakeMpServer.close((error) => (error ? reject(error) : resolve())))
  })

  test('activation + webhook + order status complete successfully', async () => {
    const activationResponse = await request(app.server).post('/landing/events/activation').send({
      clubName: 'Club E2E',
      city: 'CDMX',
      ownerName: 'Owner E2E',
      ownerEmail: 'owner.e2e@test.com',
      phone: '+525533331111',
      utm: {
        source: 'test',
        medium: 'integration',
        campaign: 'e2e',
      },
    })

    expect(activationResponse.status).toBe(201)
    expect(activationResponse.body.orderId).toEqual(expect.any(String))
    expect(activationResponse.body.paymentUrl).toBe('https://checkout.test/redirect')

    const orderId = activationResponse.body.orderId as string
    createdOrderIds.add(orderId)

    expect(capturedPreference?.external_reference).toBe(orderId)
    expect(capturedPreference?.back_urls?.success).toContain(`/checkout/success?orderId=${orderId}`)
    expect(capturedPreference?.back_urls?.pending).toContain(`/checkout/pending?orderId=${orderId}`)
    expect(capturedPreference?.back_urls?.failure).toContain(`/checkout/failure?orderId=${orderId}`)

    const webhookResponse = await request(app.server)
      .post('/webhooks/mercadopago')
      .send({ data: { id: 'pay_e2e_1' } })

    expect(webhookResponse.status).toBe(200)
    expect(webhookResponse.body.success).toBe(true)

    const orderStatusResponse = await request(app.server).get(`/landing/orders/${orderId}`)
    expect(orderStatusResponse.status).toBe(200)
    expect(orderStatusResponse.body.paymentStatus).toBe('PAID')
    expect(orderStatusResponse.body.provisioningStatus).toBe('PROVISIONED')
    expect(orderStatusResponse.body.credentialsEmailError).toBe('email_not_configured')

    const order = await prisma.landingOrder.findUnique({ where: { id: orderId } })
    expect(order?.managerUserId).toEqual(expect.any(String))
    expect(order?.clubId).toEqual(expect.any(String))
    expect(order?.eventId).toEqual(expect.any(String))
    expect(order?.licenseId).toEqual(expect.any(String))
    expect(order?.paymentId).toBe('pay_e2e_1')

    if (order?.managerUserId) createdManagerIds.add(order.managerUserId)
    if (order?.clubId) createdClubIds.add(order.clubId)
    if (order?.eventId) createdEventIds.add(order.eventId)
    if (order?.licenseId) createdLicenseIds.add(order.licenseId)
  })
})

