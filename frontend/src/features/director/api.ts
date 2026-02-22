import { coreHttpClient } from '@/lib/httpClient'

export type DirectorSubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE'
export type DirectorSubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
export type DirectorBillingCycle = 'MONTHLY' | 'ANNUAL'
export type DirectorSubscriptionType = 'PER_EVENT' | 'RECURRING'
export type DirectorPaymentStatus = 'PAID' | 'DUE_SOON' | 'PENDING' | 'PAST_DUE'
export type DirectorPaymentRecordStatus = 'PAID' | 'PENDING' | 'PAST_DUE' | 'VOID'

type DirectorSubscriptionCommon = {
  type: DirectorSubscriptionType
  plan: DirectorSubscriptionPlan
  status: DirectorSubscriptionStatus
  startsAt: string
  renewsAt: string | null
}

export type DirectorRecurringSubscription = DirectorSubscriptionCommon & {
  type: 'RECURRING'
  billingCycle: DirectorBillingCycle
  recurringAmount: number
}

export type DirectorPerEventSubscription = DirectorSubscriptionCommon & {
  type: 'PER_EVENT'
  perEventAmount: number
}

export type DirectorManagerSubscriptionDTO = DirectorRecurringSubscription | DirectorPerEventSubscription

export type DirectorManagerPaymentRecordDTO = {
  id: string
  concept: string
  amount: number
  currency: 'USD'
  status: DirectorPaymentRecordStatus
  issuedAt: string
  dueAt: string | null
  paidAt: string | null
}

export type DirectorManagerBillingDTO = {
  paymentStatus: DirectorPaymentStatus
  nextDueAt: string | null
  lastPaidAt: string | null
  history: DirectorManagerPaymentRecordDTO[]
}

export type DirectorManagerDTO = {
  id: string
  active: boolean
  user: {
    id: string
    name: string
    username: string
    email: string
  }
  clubs: Array<{
    id: string
    name: string
    active: boolean
  }>
  subscription: DirectorManagerSubscriptionDTO
  billing: DirectorManagerBillingDTO
}

type DirectorManagerUpsertCommon = {
  name: string
  username: string
  email: string
  active: boolean
  clubIds: string[]
  subscriptionType: DirectorSubscriptionType
  subscriptionPlan: DirectorSubscriptionPlan
  subscriptionStatus: DirectorSubscriptionStatus
  subscriptionStartsAt: string
  subscriptionRenewsAt: string | null
  paymentStatus: DirectorPaymentStatus
  billingNextDueAt: string | null
  billingLastPaidAt: string | null
}

export type DirectorManagerUpsertPayload =
  | (DirectorManagerUpsertCommon & {
      subscriptionType: 'RECURRING'
      billingCycle: DirectorBillingCycle
      recurringAmount: number
      perEventAmount?: never
    })
  | (DirectorManagerUpsertCommon & {
      subscriptionType: 'PER_EVENT'
      perEventAmount: number
      billingCycle?: never
      recurringAmount?: never
    })

export type DirectorLandingAppointment = {
  id: string
  createdAt: string
  fullName: string
  phone: string
  clubInterest: string
  eventType: string
  preferredDate: string | null
  status: 'NEW' | 'CONTACTED' | 'BOOKED' | 'CANCELLED'
  source: 'LANDING'
}

export const directorApi = {
  getManagers: () => coreHttpClient.get<DirectorManagerDTO[]>('/director/managers'),
  createManager: (payload: DirectorManagerUpsertPayload) => coreHttpClient.post<DirectorManagerDTO>('/director/managers', payload),
  updateManager: (managerId: string, payload: Partial<DirectorManagerUpsertPayload>) =>
    coreHttpClient.patch<DirectorManagerDTO>(`/director/managers/${managerId}`, payload),
  deleteManager: (managerId: string) => coreHttpClient.delete<void>(`/director/managers/${managerId}`),
  getLandingAppointments: () =>
    coreHttpClient
      .get<{ items: DirectorLandingAppointment[] }>('/director/landing-appointments')
      .then((response) => response.items ?? []),
}
