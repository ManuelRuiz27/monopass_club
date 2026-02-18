import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import {
  LandingOrderStatus,
  LandingProvisioningStatus,
  LicenseBillingType,
  LicensePlanType,
  LicenseStatus,
  UserRole,
} from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'
import { hashPassword } from '../../lib/password'

const utmSchema = z
  .object({
    source: z.string().trim().min(1).optional(),
    medium: z.string().trim().min(1).optional(),
    campaign: z.string().trim().min(1).optional(),
    term: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1).optional(),
  })
  .optional()

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'eventDate must be YYYY-MM-DD')

const landingLeadBodySchema = z.object({
  name: z.string().trim().min(2),
  club: z.string().trim().min(2),
  city: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().email().optional(),
  eventDate: dateOnlySchema.optional(),
  estimatedVolume: z.number().int().positive().optional(),
  utm: utmSchema,
})

const activationBodySchema = z.object({
  clubName: z.string().trim().min(2),
  city: z.string().trim().min(2),
  ownerName: z.string().trim().min(2),
  ownerEmail: z.string().email(),
  phone: z.string().trim().min(8),
  utm: utmSchema,
})

const orderParamsSchema = z.object({
  orderId: z.string().uuid(),
})

const mercadoPagoPreferenceResponseSchema = z.object({
  id: z.string(),
  init_point: z.string().url().optional(),
  sandbox_init_point: z.string().url().optional(),
})

const mercadoPagoPaymentResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  status: z.string().optional(),
  external_reference: z.string().optional().nullable(),
})

const webhookPayloadSchema = z
  .object({
    data: z
      .object({
        id: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
  })
  .passthrough()

const publicRateLimitStore = new Map<string, { count: number; resetAt: number }>()

function applyPublicRateLimit(ip: string, routeKey: string) {
  const now = Date.now()
  const windowMs = env.LANDING_PUBLIC_RATE_LIMIT_WINDOW_MS
  const max = env.LANDING_PUBLIC_RATE_LIMIT_MAX
  const key = `${routeKey}:${ip}`

  const current = publicRateLimitStore.get(key)
  if (!current || now > current.resetAt) {
    publicRateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, retryAfterMs: 0 }
  }

  if (current.count >= max) {
    return { limited: true, retryAfterMs: Math.max(0, current.resetAt - now) }
  }

  current.count += 1
  publicRateLimitStore.set(key, current)
  return { limited: false, retryAfterMs: 0 }
}

function getQueryParamFromUrl(rawUrl: string | undefined, key: string) {
  if (!rawUrl) return undefined
  try {
    const parsed = new URL(rawUrl, 'http://localhost')
    return parsed.searchParams.get(key) ?? undefined
  } catch {
    return undefined
  }
}

export function parseWebhookSignature(signatureHeader: string | undefined) {
  if (!signatureHeader) return undefined
  const chunks = signatureHeader.split(',').map((part) => part.trim())
  const data = new Map<string, string>()
  for (const chunk of chunks) {
    const [k, v] = chunk.split('=')
    if (k && v) data.set(k, v)
  }
  const ts = data.get('ts')
  const v1 = data.get('v1')
  if (!ts || !v1) return undefined
  return { ts, v1 }
}

export function buildWebhookManifest(params: { dataId: string; requestId: string; ts: string }) {
  return `id:${params.dataId};request-id:${params.requestId};ts:${params.ts};`
}

export function isValidWebhookSignature(params: {
  secret: string
  dataId: string
  requestId: string
  ts: string
  signatureV1: string
}) {
  const manifest = buildWebhookManifest({
    dataId: params.dataId,
    requestId: params.requestId,
    ts: params.ts,
  })
  const expectedSignature = createHmac('sha256', params.secret).update(manifest).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const providedBuffer = Buffer.from(params.signatureV1, 'hex')
  if (expectedBuffer.length !== providedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, providedBuffer)
}

function resolveMpBaseUrl() {
  return process.env.MP_API_BASE_URL?.trim() || 'https://api.mercadopago.com'
}

function resolveAppLoginUrl() {
  const explicit = env.APP_LOGIN_URL?.trim()
  if (explicit) return explicit
  const base = env.APP_PUBLIC_BASE_URL?.trim()
  if (!base) return 'https://app.passmonkey.club/login'
  return `${base.replace(/\/$/, '')}/login`
}

async function sendProvisioningAccessEmail(params: {
  to: string
  ownerName: string
  username: string
  temporaryPassword: string
  orderId: string
}) {
  const apiKey = env.RESEND_API_KEY?.trim()
  const fromEmail = env.RESEND_FROM_EMAIL?.trim()

  if (!apiKey || !fromEmail) {
    return { sent: false, error: 'email_not_configured' as const }
  }

  const loginUrl = resolveAppLoginUrl()
  const subject = 'Tu acceso a Pass Monkey ya esta listo'
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Acceso activado</h2>
      <p>Hola ${params.ownerName}, tu pago fue aprobado y ya creamos tu cuenta.</p>
      <p><strong>Usuario:</strong> ${params.username}</p>
      <p><strong>Password temporal:</strong> ${params.temporaryPassword}</p>
      <p><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p>Orden: ${params.orderId}</p>
      <p>Te recomendamos cambiar la contrasena en tu primer ingreso.</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    return { sent: false, error: `email_provider_error:${response.status}:${errorBody.slice(0, 180)}` }
  }

  return { sent: true as const }
}

async function createMercadoPagoPreference(params: {
  accessToken: string
  orderId: string
  ownerName: string
  ownerEmail: string
}) {
  const landingBase = env.APP_PUBLIC_BASE_URL?.replace(/\/$/, '')
  const successUrl = landingBase ? `${landingBase}/checkout/success?orderId=${params.orderId}` : undefined
  const pendingUrl = landingBase ? `${landingBase}/checkout/pending?orderId=${params.orderId}` : undefined
  const failureUrl = landingBase ? `${landingBase}/checkout/failure?orderId=${params.orderId}` : undefined

  const baseUrl = resolveMpBaseUrl()
  const response = await fetch(`${baseUrl}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: params.orderId,
      items: [
        {
          id: params.orderId,
          title: 'Pass Monkey - Activar 1 evento',
          quantity: 1,
          currency_id: env.PRICING_CURRENCY,
          unit_price: env.PRICING_EVENT,
        },
      ],
      payer: {
        name: params.ownerName,
        email: params.ownerEmail,
      },
      metadata: {
        product: 'pass-monkey-event-activation',
        orderId: params.orderId,
      },
      back_urls: successUrl && pendingUrl && failureUrl
        ? {
            success: successUrl,
            pending: pendingUrl,
            failure: failureUrl,
          }
        : undefined,
      auto_return: successUrl ? 'approved' : undefined,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Mercado Pago preference error ${response.status}: ${errorBody}`)
  }

  const payload = mercadoPagoPreferenceResponseSchema.parse(await response.json())
  const paymentUrl = payload.init_point ?? payload.sandbox_init_point
  if (!paymentUrl) {
    throw new Error('Mercado Pago preference created without checkout url')
  }

  return { preferenceId: payload.id, paymentUrl }
}

async function fetchMercadoPagoPayment(params: { accessToken: string; paymentId: string }) {
  const baseUrl = resolveMpBaseUrl()
  const response = await fetch(`${baseUrl}/v1/payments/${params.paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Mercado Pago payment error ${response.status}: ${errorBody}`)
  }

  return mercadoPagoPaymentResponseSchema.parse(await response.json())
}

function mapMercadoPagoStatus(status: string | undefined): LandingOrderStatus {
  if (status === 'approved') return LandingOrderStatus.PAID
  if (status === 'rejected' || status === 'cancelled') return LandingOrderStatus.FAILED
  return LandingOrderStatus.PENDING
}

function sanitizeUsernamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)
}

async function buildProvisioningUsername(
  ownerEmail: string,
  orderId: string,
  findByUsername: (username: string) => Promise<{ id: string } | null>,
) {
  const emailPrefix = ownerEmail.split('@')[0] ?? 'owner'
  const base = sanitizeUsernamePart(emailPrefix) || 'owner'
  const orderSlice = orderId.replace(/-/g, '').slice(0, 6)
  let candidate = `owner_${base}_${orderSlice}`

  for (let i = 0; i < 5; i += 1) {
    const existing = await findByUsername(candidate)
    if (!existing) return candidate
    candidate = `owner_${base}_${orderSlice}${i + 1}`
  }

  return `owner_${orderSlice}_${randomUUID().replace(/-/g, '').slice(0, 6)}`
}

function buildInitialEventName() {
  const today = new Date().toISOString().slice(0, 10)
  return `Evento inicial ${today}`
}

async function provisionOrderAfterApprovedPayment(orderId: string) {
  const order = await prisma.landingOrder.findUnique({ where: { id: orderId } })
  if (!order) return
  if (order.provisioningStatus === LandingProvisioningStatus.PROVISIONED) return

  try {
    const result = await prisma.$transaction(async (tx) => {
      let managerUserId = order.managerUserId
      let username = ''
      let createdManager = false
      let temporaryPassword: string | undefined

      if (managerUserId) {
        const existingUser = await tx.user.findUnique({ where: { id: managerUserId } })
        if (!existingUser) managerUserId = null
      }

      if (!managerUserId) {
        temporaryPassword = `Pm-${randomUUID().slice(0, 8)}!`
        username = await buildProvisioningUsername(order.ownerEmail, order.id, (candidate) =>
          tx.user.findUnique({ where: { username: candidate }, select: { id: true } }),
        )
        const createdUser = await tx.user.create({
          data: {
            id: randomUUID(),
            name: order.ownerName,
            username,
            password: await hashPassword(temporaryPassword),
            role: UserRole.MANAGER,
            active: true,
          },
        })
        managerUserId = createdUser.id
        createdManager = true
      }

      const resolvedManagerId = managerUserId as string

      await tx.managerSetting.upsert({
        where: { managerId: resolvedManagerId },
        update: {},
        create: {
          id: randomUUID(),
          managerId: resolvedManagerId,
          otherLabel: 'Otro',
        },
      })

      const clubId =
        order.clubId ??
        (
          await tx.club.create({
            data: {
              id: randomUUID(),
              managerId: resolvedManagerId,
              name: order.clubName,
              capacity: 500,
              active: true,
            },
          })
        ).id

      const eventId =
        order.eventId ??
        (
          await tx.event.create({
            data: {
              id: randomUUID(),
              clubId,
              name: buildInitialEventName(),
              startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              endsAt: new Date(Date.now() + 30 * 60 * 60 * 1000),
              active: true,
            },
          })
        ).id

      const licenseId =
        order.licenseId ??
        (
          await tx.license.create({
            data: {
              id: randomUUID(),
              managerUserId: resolvedManagerId,
              clubId,
              planType: LicensePlanType.EVENT,
              billingType: LicenseBillingType.MANUAL,
              status: LicenseStatus.ACTIVE,
              periodStart: new Date(),
              periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              eventsRemaining: 1,
            },
          })
        ).id

      await tx.landingOrder.update({
        where: { id: order.id },
        data: {
          provisioningStatus: LandingProvisioningStatus.PROVISIONED,
          managerUserId: resolvedManagerId,
          clubId,
          eventId,
          licenseId,
          provisioningError: null,
          provisionedAt: new Date(),
        },
      })

      return { username, createdManager, temporaryPassword }
    })

    return {
      temporaryPassword: result.temporaryPassword,
      username: result.username,
      createdManager: result.createdManager,
    }
  } catch (error) {
    await prisma.landingOrder.update({
      where: { id: order.id },
      data: {
        provisioningStatus: LandingProvisioningStatus.FAILED,
        provisioningError: error instanceof Error ? error.message.slice(0, 300) : 'provisioning_failed',
      },
    })
    throw error
  }
}

export async function registerLandingRoutes(app: FastifyInstance) {
  app.get('/landing/pricing', async (request, reply) => {
    const rateLimit = applyPublicRateLimit(request.ip, 'landing_pricing')
    if (rateLimit.limited) {
      reply
        .status(429)
        .header('Retry-After', Math.ceil(rateLimit.retryAfterMs / 1000))
        .send({ status: 'rate_limited', message: 'Too many requests. Please retry later.' })
      return
    }

    reply.send({
      event_price: env.PRICING_EVENT,
      base_price: env.PRICING_BASE,
      pro_price: env.PRICING_PRO,
      currency: env.PRICING_CURRENCY,
    })
  })

  app.post('/landing/leads', async (request, reply) => {
    const rateLimit = applyPublicRateLimit(request.ip, 'landing_leads')
    if (rateLimit.limited) {
      reply
        .status(429)
        .header('Retry-After', Math.ceil(rateLimit.retryAfterMs / 1000))
        .send({ status: 'rate_limited', message: 'Too many requests. Please retry later.' })
      return
    }

    const body = landingLeadBodySchema.parse(request.body)

    const created = await prisma.lead.create({
      data: {
        name: body.name,
        club: body.club,
        city: body.city,
        phone: body.phone,
        email: body.email ?? null,
        eventDate: body.eventDate ? new Date(`${body.eventDate}T00:00:00.000Z`) : null,
        estimatedVolume: body.estimatedVolume ?? null,
        utmSource: body.utm?.source ?? null,
        utmMedium: body.utm?.medium ?? null,
        utmCampaign: body.utm?.campaign ?? null,
        utmTerm: body.utm?.term ?? null,
        utmContent: body.utm?.content ?? null,
      },
      select: { id: true },
    })

    reply.status(201).send({
      id: created.id,
      status: 'created',
    })
  })

  app.post('/landing/events/activation', async (request, reply) => {
    const rateLimit = applyPublicRateLimit(request.ip, 'landing_activation')
    if (rateLimit.limited) {
      reply
        .status(429)
        .header('Retry-After', Math.ceil(rateLimit.retryAfterMs / 1000))
        .send({ status: 'rate_limited', message: 'Too many requests. Please retry later.' })
      return
    }

    const body = activationBodySchema.parse(request.body)
    const orderId = randomUUID()

    await prisma.landingOrder.create({
      data: {
        id: orderId,
        provider: 'mercadopago',
        amount: env.PRICING_EVENT,
        currency: env.PRICING_CURRENCY,
        status: LandingOrderStatus.PENDING,
        clubName: body.clubName,
        city: body.city,
        ownerName: body.ownerName,
        ownerEmail: body.ownerEmail,
        phone: body.phone,
        utmSource: body.utm?.source ?? null,
        utmMedium: body.utm?.medium ?? null,
        utmCampaign: body.utm?.campaign ?? null,
        utmTerm: body.utm?.term ?? null,
        utmContent: body.utm?.content ?? null,
      },
    })

    if (!env.MP_ACCESS_TOKEN) {
      reply.status(503).send({
        status: 'configuration_error',
        orderId,
        message: 'MP_ACCESS_TOKEN is not configured.',
      })
      return
    }

    try {
      const preference = await createMercadoPagoPreference({
        accessToken: env.MP_ACCESS_TOKEN,
        orderId,
        ownerName: body.ownerName,
        ownerEmail: body.ownerEmail,
      })

      await prisma.landingOrder.update({
        where: { id: orderId },
        data: {
          providerPreferenceId: preference.preferenceId,
        },
      })

      reply.status(201).send({
        orderId,
        paymentUrl: preference.paymentUrl,
      })
    } catch (error) {
      app.log.error({ err: error, orderId }, 'failed to create Mercado Pago checkout preference')
      reply.status(502).send({
        status: 'provider_error',
        orderId,
        message: 'Unable to create payment checkout URL at this time.',
      })
    }
  })

  app.get('/landing/orders/:orderId', async (request, reply) => {
    const params = orderParamsSchema.parse(request.params)
    const order = await prisma.landingOrder.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        provisioningStatus: true,
        credentialsEmailSentAt: true,
        credentialsEmailError: true,
        createdAt: true,
        paidAt: true,
      },
    })

    if (!order) {
      reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Order not found.',
      })
      return
    }

    reply.send({
      orderId: order.id,
      paymentStatus: order.status,
      provisioningStatus: order.provisioningStatus,
      amount: order.amount,
      currency: order.currency,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      credentialsEmailSentAt: order.credentialsEmailSentAt,
      credentialsEmailError: order.credentialsEmailError,
    })
  })

  app.post('/webhooks/mercadopago', async (request, reply) => {
    const parsed = webhookPayloadSchema.safeParse(request.body)
    if (!parsed.success) {
      reply.status(400).send({ success: false, message: 'Invalid webhook payload.' })
      return
    }

    const paymentIdRaw = parsed.data.data?.id
    if (!paymentIdRaw) {
      reply.status(200).send({ success: true })
      return
    }

    const secret = env.MP_WEBHOOK_SECRET?.trim()
    if (secret) {
      const signatureHeader = parseWebhookSignature(request.headers['x-signature'] as string | undefined)
      const requestId = request.headers['x-request-id'] as string | undefined
      const dataIdFromQuery = getQueryParamFromUrl(request.raw.url, 'data.id')
      const dataId = dataIdFromQuery ?? String(paymentIdRaw)
      if (!signatureHeader || !requestId) {
        reply.status(401).send({ success: false, message: 'Invalid webhook signature.' })
        return
      }

      const validSignature = isValidWebhookSignature({
        secret,
        dataId,
        requestId,
        ts: signatureHeader.ts,
        signatureV1: signatureHeader.v1,
      })
      if (!validSignature) {
        reply.status(401).send({ success: false, message: 'Invalid webhook signature.' })
        return
      }
    }

    if (!env.MP_ACCESS_TOKEN) {
      reply.status(501).send({ success: false, message: 'Webhook handler requires MP_ACCESS_TOKEN.' })
      return
    }

    try {
      const payment = await fetchMercadoPagoPayment({
        accessToken: env.MP_ACCESS_TOKEN,
        paymentId: String(paymentIdRaw),
      })

      const orderId = payment.external_reference ?? undefined
      if (!orderId) {
        reply.status(200).send({ success: true })
        return
      }

      const order = await prisma.landingOrder.findUnique({ where: { id: orderId } })
      if (!order) {
        reply.status(200).send({ success: true })
        return
      }

      const nextStatus = mapMercadoPagoStatus(payment.status)
      const paymentId = String(payment.id)

      if (order.paymentId && order.paymentId !== paymentId) {
        app.log.warn(
          {
            orderId: order.id,
            existingPaymentId: order.paymentId,
            incomingPaymentId: paymentId,
          },
          'webhook ignored due to payment id mismatch for existing order',
        )
        reply.status(200).send({ success: true })
        return
      }

      const resolvedStatus = order.status === LandingOrderStatus.PAID ? LandingOrderStatus.PAID : nextStatus

      await prisma.landingOrder.update({
        where: { id: order.id },
        data: {
          status: resolvedStatus,
          paymentId,
          paidAt: resolvedStatus === LandingOrderStatus.PAID ? order.paidAt ?? new Date() : order.paidAt,
        },
      })

      if (resolvedStatus === LandingOrderStatus.PAID) {
        const provisioned = await provisionOrderAfterApprovedPayment(order.id)
        if (provisioned?.createdManager) {
          if (provisioned.username && provisioned.temporaryPassword) {
            const emailResult = await sendProvisioningAccessEmail({
              to: order.ownerEmail,
              ownerName: order.ownerName,
              username: provisioned.username,
              temporaryPassword: provisioned.temporaryPassword,
              orderId: order.id,
            })

            await prisma.landingOrder.update({
              where: { id: order.id },
              data: {
                credentialsEmailSentAt: emailResult.sent ? new Date() : null,
                credentialsEmailError: emailResult.sent ? null : emailResult.error,
              },
            })

            if (!emailResult.sent) {
              app.log.warn(
                {
                  orderId: order.id,
                  username: provisioned.username,
                  error: emailResult.error,
                },
                'order provisioned but credentials email was not sent',
              )
            }
          }
        }
      }

      reply.status(200).send({ success: true })
    } catch (error) {
      app.log.error({ err: error }, 'failed to process mercadopago webhook')
      reply.status(500).send({ success: false, message: 'Webhook processing failed.' })
    }
  })
}
