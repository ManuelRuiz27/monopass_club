import { PaymentProvider, PaymentStatus } from '@prisma/client'

export type ProviderWebhookParseResult = {
  provider: PaymentProvider
  providerRef?: string | undefined
  status?: PaymentStatus | undefined
  amountMxn?: number | undefined
  invoiceId?: string | undefined
  clubId?: string | undefined
  feeMxn?: number | undefined
  metadata?: Record<string, unknown> | undefined
  accepted: boolean
  message?: string | undefined
}

export interface PaymentProviderAdapter {
  provider: PaymentProvider
  enabled: boolean
  parseWebhookPayload(payload: unknown): ProviderWebhookParseResult
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function createStubAdapter(provider: PaymentProvider, enabled: boolean): PaymentProviderAdapter {
  return {
    provider,
    enabled,
    parseWebhookPayload(payload) {
      const parsed = asRecord(payload)
      const providerRef = typeof parsed?.providerRef === 'string' ? parsed.providerRef : undefined
      const invoiceId = typeof parsed?.invoiceId === 'string' ? parsed.invoiceId : undefined
      const clubId = typeof parsed?.clubId === 'string' ? parsed.clubId : undefined
      const amountMxn = typeof parsed?.amountMxn === 'number' ? Math.round(parsed.amountMxn) : undefined
      return {
        provider,
        providerRef,
        invoiceId,
        clubId,
        amountMxn,
        accepted: true,
        message: enabled
          ? 'Webhook provider stub accepted payload (adapter pending implementation)'
          : 'Provider adapter disabled by feature flag',
        metadata: parsed ?? undefined,
      }
    },
  }
}

const MANUAL_ADAPTER: PaymentProviderAdapter = {
  provider: PaymentProvider.manual,
  enabled: true,
  parseWebhookPayload(payload) {
    const parsed = asRecord(payload)
    const providerRef = typeof parsed?.providerRef === 'string' ? parsed.providerRef : undefined
    const invoiceId = typeof parsed?.invoiceId === 'string' ? parsed.invoiceId : undefined
    const clubId = typeof parsed?.clubId === 'string' ? parsed.clubId : undefined
    const amountMxn = typeof parsed?.amountMxn === 'number' ? Math.round(parsed.amountMxn) : undefined
    const feeMxn = typeof parsed?.feeMxn === 'number' ? Math.round(parsed.feeMxn) : undefined
    const rawStatus = typeof parsed?.status === 'string' ? parsed.status : 'succeeded'
    const status = ['pending', 'succeeded', 'failed', 'refunded'].includes(rawStatus) ? (rawStatus as PaymentStatus) : PaymentStatus.succeeded

    return {
      provider: PaymentProvider.manual,
      providerRef,
      invoiceId,
      clubId,
      amountMxn,
      feeMxn,
      status,
      accepted: true,
      metadata: parsed ?? undefined,
    }
  },
}

export function buildProviderRegistry(flags?: Partial<Record<PaymentProvider, boolean>>) {
  return new Map<PaymentProvider, PaymentProviderAdapter>([
    [PaymentProvider.manual, MANUAL_ADAPTER],
    [PaymentProvider.stripe, createStubAdapter(PaymentProvider.stripe, Boolean(flags?.[PaymentProvider.stripe]))],
    [PaymentProvider.conekta, createStubAdapter(PaymentProvider.conekta, Boolean(flags?.[PaymentProvider.conekta]))],
    [
      PaymentProvider.mercadopago,
      createStubAdapter(PaymentProvider.mercadopago, Boolean(flags?.[PaymentProvider.mercadopago])),
    ],
    [PaymentProvider.openpay, createStubAdapter(PaymentProvider.openpay, Boolean(flags?.[PaymentProvider.openpay]))],
  ])
}
