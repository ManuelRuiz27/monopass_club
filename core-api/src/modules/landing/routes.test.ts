import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { createHmac, randomUUID } from 'crypto'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'
import { buildWebhookManifest, isValidWebhookSignature, parseWebhookSignature } from './routes'

describe.sequential('landing public routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  const createdLeadIds = new Set<string>()
  const createdOrderIds = new Set<string>()
  const createdManagerIds = new Set<string>()
  const createdClubIds = new Set<string>()
  const createdEventIds = new Set<string>()
  const createdLicenseIds = new Set<string>()
  const originalWebhookSecret = env.MP_WEBHOOK_SECRET
  const originalAccessToken = env.MP_ACCESS_TOKEN
  const originalResendApiKey = env.RESEND_API_KEY
  const originalResendFromEmail = env.RESEND_FROM_EMAIL
  const originalLoginUrl = env.APP_LOGIN_URL

  beforeAll(async () => {
    app = await buildServer()
    await app.ready()
  })

  afterAll(async () => {
    env.MP_WEBHOOK_SECRET = originalWebhookSecret
    env.MP_ACCESS_TOKEN = originalAccessToken
    env.RESEND_API_KEY = originalResendApiKey
    env.RESEND_FROM_EMAIL = originalResendFromEmail
    env.APP_LOGIN_URL = originalLoginUrl
    await app.close()
  })

  afterEach(async () => {
    vi.restoreAllMocks()

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

    if (createdLeadIds.size > 0) {
      await prisma.lead.deleteMany({ where: { id: { in: Array.from(createdLeadIds) } } })
      createdLeadIds.clear()
    }

    if (createdOrderIds.size > 0) {
      await prisma.landingOrder.deleteMany({ where: { id: { in: Array.from(createdOrderIds) } } })
      createdOrderIds.clear()
    }
  })

  test('GET /landing/pricing returns current pricing contract', async () => {
    const response = await request(app.server).get('/landing/pricing')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      event_price: expect.any(Number),
      base_price: expect.any(Number),
      pro_price: expect.any(Number),
      currency: expect.any(String),
    })
  })

  test('landing demo shared session can issue and validate a ticket across requests', async () => {
    const sessionId = `testdemo_${Date.now()}`

    const getInitial = await request(app.server).get(`/landing/demo-sessions/${sessionId}`)
    expect(getInitial.status).toBe(200)
    expect(getInitial.body.sessionId).toBe(sessionId)
    expect(getInitial.body.store.tickets).toEqual([])

    const issueResponse = await request(app.server)
      .post(`/landing/demo-sessions/${sessionId}/tickets`)
      .send({
        guestType: 'VIP',
        note: 'Mesa 7',
      })

    expect(issueResponse.status).toBe(201)
    expect(issueResponse.body.status).toBe('created')
    expect(issueResponse.body.ticket.code).toEqual(expect.any(String))
    expect(issueResponse.body.ticket.guestType).toBe('VIP')
    expect(issueResponse.body.store.tickets).toHaveLength(1)

    const qrPayload = issueResponse.body.ticket.qrPayload as string

    const getAgain = await request(app.server).get(`/landing/demo-sessions/${sessionId}`)
    expect(getAgain.status).toBe(200)
    expect(getAgain.body.store.tickets).toHaveLength(1)
    expect(getAgain.body.store.tickets[0].qrPayload).toBe(qrPayload)

    const validateResponse = await request(app.server)
      .post(`/landing/demo-sessions/${sessionId}/validate`)
      .send({ rawPayload: qrPayload })

    expect(validateResponse.status).toBe(200)
    expect(validateResponse.body.status).toBe('valid')
    expect(validateResponse.body.ticket.status).toBe('used')
    expect(validateResponse.body.store.tickets[0].status).toBe('used')

    const validateAgainResponse = await request(app.server)
      .post(`/landing/demo-sessions/${sessionId}/validate`)
      .send({ rawPayload: qrPayload })

    expect(validateAgainResponse.status).toBe(200)
    expect(validateAgainResponse.body.status).toBe('already_used')
  })

  test('POST /landing/events/activation creates pending order and returns configuration error when token is missing', async () => {
    const response = await request(app.server).post('/landing/events/activation').send({
      clubName: 'Club Test',
      city: 'CDMX',
      ownerName: 'Owner Test',
      ownerEmail: 'owner@test.com',
      phone: '+525511112222',
    })

    expect(response.status).toBe(503)
    expect(response.body.status).toBe('configuration_error')
    expect(response.body.orderId).toEqual(expect.any(String))
    createdOrderIds.add(response.body.orderId as string)

    const createdOrder = await prisma.landingOrder.findUnique({
      where: { id: response.body.orderId as string },
    })
    expect(createdOrder).not.toBeNull()
    expect(createdOrder?.status).toBe('PENDING')
    expect(createdOrder?.provider).toBe('mercadopago')
  })

  test('POST /landing/leads stores lead and utm payload', async () => {
    const response = await request(app.server).post('/landing/leads').send({
      name: 'Lead Demo',
      club: 'Club Demo',
      city: 'CDMX',
      phone: '+525511112222',
      email: 'lead@demo.com',
      eventDate: '2026-03-20',
      estimatedVolume: 220,
      utm: {
        source: 'instagram',
        medium: 'paid',
        campaign: 'camp_demo',
      },
    })

    expect(response.status).toBe(201)
    expect(response.body.status).toBe('created')
    expect(response.body.id).toEqual(expect.any(String))
    createdLeadIds.add(response.body.id as string)

    const createdLead = await prisma.lead.findUnique({ where: { id: response.body.id as string } })
    expect(createdLead).not.toBeNull()
    expect(createdLead?.club).toBe('Club Demo')
    expect(createdLead?.utmSource).toBe('instagram')
    expect(createdLead?.utmMedium).toBe('paid')
    expect(createdLead?.utmCampaign).toBe('camp_demo')
  })

  test('GET /landing/orders/:orderId returns order public status payload', async () => {
    const orderId = randomUUID()
    createdOrderIds.add(orderId)

    await prisma.landingOrder.create({
      data: {
        id: orderId,
        provider: 'mercadopago',
        amount: 750,
        currency: 'MXN',
        status: 'PENDING',
        clubName: 'Club Status',
        city: 'CDMX',
        ownerName: 'Owner Status',
        ownerEmail: 'owner.status@test.com',
        phone: '+525500000000',
      },
    })

    const response = await request(app.server).get(`/landing/orders/${orderId}`)
    expect(response.status).toBe(200)
    expect(response.body.orderId).toBe(orderId)
    expect(response.body.paymentStatus).toBe('PENDING')
    expect(response.body.provisioningStatus).toBe('NOT_STARTED')
    expect(response.body.amount).toBe(750)
    expect(response.body.currency).toBe('MXN')
  })

  test('POST /webhooks/mercadopago returns 401 on invalid signature when secret is configured', async () => {
    env.MP_WEBHOOK_SECRET = 'test-secret'

    const response = await request(app.server)
      .post('/webhooks/mercadopago?data.id=1312')
      .set('x-request-id', 'req-123')
      .set('x-signature', 'ts=123456,v1=bad-signature')
      .send({
        data: { id: '1312' },
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  test('webhook approved payment provisions manager, club and event', async () => {
    env.MP_WEBHOOK_SECRET = undefined
    env.MP_ACCESS_TOKEN = 'test-access-token'

    const orderId = randomUUID()
    createdOrderIds.add(orderId)
    await prisma.landingOrder.create({
      data: {
        id: orderId,
        provider: 'mercadopago',
        amount: 750,
        currency: 'MXN',
        status: 'PENDING',
        clubName: 'Club Provision',
        city: 'CDMX',
        ownerName: 'Owner Provision',
        ownerEmail: 'owner.provision@test.com',
        phone: '+525511112222',
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'pay_123',
        status: 'approved',
        external_reference: orderId,
      }),
    } as Response)

    const response = await request(app.server)
      .post('/webhooks/mercadopago')
      .send({ data: { id: 'pay_123' } })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    const updatedOrder = await prisma.landingOrder.findUnique({ where: { id: orderId } })
    expect(updatedOrder?.status).toBe('PAID')
    expect(updatedOrder?.provisioningStatus).toBe('PROVISIONED')
    expect(updatedOrder?.managerUserId).toEqual(expect.any(String))
    expect(updatedOrder?.clubId).toEqual(expect.any(String))
    expect(updatedOrder?.eventId).toEqual(expect.any(String))
    expect(updatedOrder?.licenseId).toEqual(expect.any(String))
    expect(updatedOrder?.paymentId).toBe('pay_123')

    if (updatedOrder?.managerUserId) createdManagerIds.add(updatedOrder.managerUserId)
    if (updatedOrder?.clubId) createdClubIds.add(updatedOrder.clubId)
    if (updatedOrder?.eventId) createdEventIds.add(updatedOrder.eventId)
    if (updatedOrder?.licenseId) createdLicenseIds.add(updatedOrder.licenseId)

    const manager = await prisma.user.findUnique({ where: { id: updatedOrder?.managerUserId ?? '' } })
    const club = await prisma.club.findUnique({ where: { id: updatedOrder?.clubId ?? '' } })
    const event = await prisma.event.findUnique({ where: { id: updatedOrder?.eventId ?? '' } })
    const license = await prisma.license.findUnique({ where: { id: updatedOrder?.licenseId ?? '' } })

    expect(manager?.role).toBe('MANAGER')
    expect(club?.name).toBe('Club Provision')
    expect(event?.clubId).toBe(updatedOrder?.clubId)
    expect(license?.planType).toBe('EVENT')
    expect(license?.billingType).toBe('MANUAL')
    expect(license?.eventsRemaining).toBe(1)
  })

  test('webhook approved payment sends credentials email when resend is configured', async () => {
    env.MP_WEBHOOK_SECRET = undefined
    env.MP_ACCESS_TOKEN = 'test-access-token'
    env.RESEND_API_KEY = 'resend-test-key'
    env.RESEND_FROM_EMAIL = 'no-reply@passmonkey.club'
    env.APP_LOGIN_URL = 'https://app.passmonkey.club/login'

    const orderId = randomUUID()
    createdOrderIds.add(orderId)
    await prisma.landingOrder.create({
      data: {
        id: orderId,
        provider: 'mercadopago',
        amount: 750,
        currency: 'MXN',
        status: 'PENDING',
        clubName: 'Club Mail',
        city: 'CDMX',
        ownerName: 'Owner Mail',
        ownerEmail: 'owner.mail@test.com',
        phone: '+525533334444',
      },
    })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('/v1/payments/')) {
        return {
          ok: true,
          json: async () => ({
            id: 'pay_mail_1',
            status: 'approved',
            external_reference: orderId,
          }),
        } as Response
      }
      if (url.includes('api.resend.com/emails')) {
        return {
          ok: true,
          text: async () => '',
          json: async () => ({ id: 'email_1' }),
        } as Response
      }
      return {
        ok: false,
        status: 500,
        text: async () => 'unexpected_url',
      } as Response
    })

    const response = await request(app.server)
      .post('/webhooks/mercadopago')
      .send({ data: { id: 'pay_mail_1' } })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(fetchSpy).toHaveBeenCalled()

    const updatedOrder = await prisma.landingOrder.findUnique({ where: { id: orderId } })
    expect(updatedOrder?.credentialsEmailSentAt).not.toBeNull()
    expect(updatedOrder?.credentialsEmailError).toBeNull()

    if (updatedOrder?.managerUserId) createdManagerIds.add(updatedOrder.managerUserId)
    if (updatedOrder?.clubId) createdClubIds.add(updatedOrder.clubId)
    if (updatedOrder?.eventId) createdEventIds.add(updatedOrder.eventId)
    if (updatedOrder?.licenseId) createdLicenseIds.add(updatedOrder.licenseId)
  })
})

describe('landing webhook signature helpers', () => {
  test('parseWebhookSignature extracts ts and v1', () => {
    const parsed = parseWebhookSignature('ts=1710000000,v1=abcdef123456')
    expect(parsed).toEqual({ ts: '1710000000', v1: 'abcdef123456' })
  })

  test('buildWebhookManifest creates expected format', () => {
    const manifest = buildWebhookManifest({
      dataId: '1001',
      requestId: 'req-abc',
      ts: '1710000000',
    })

    expect(manifest).toBe('id:1001;request-id:req-abc;ts:1710000000;')
  })

  test('isValidWebhookSignature validates hmac manifest', () => {
    const secret = 'test-secret'
    const manifest = 'id:1001;request-id:req-abc;ts:1710000000;'
    const signature = createHmac('sha256', secret).update(manifest).digest('hex')

    const valid = isValidWebhookSignature({
      secret,
      dataId: '1001',
      requestId: 'req-abc',
      ts: '1710000000',
      signatureV1: signature,
    })

    expect(valid).toBe(true)
  })
})
