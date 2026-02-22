import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { managerApi } from '@/features/manager/api'
import {
  directorApi,
  type DirectorBillingCycle,
  type DirectorManagerDTO,
  type DirectorManagerPaymentRecordDTO,
  type DirectorManagerUpsertPayload,
  type DirectorPaymentStatus,
  type DirectorSubscriptionPlan,
  type DirectorSubscriptionStatus,
  type DirectorSubscriptionType,
} from '../api'

type ManagerFormState = {
  name: string
  username: string
  email: string
  active: boolean
  clubIds: string[]
  subscriptionType: DirectorSubscriptionType
  subscriptionPlan: DirectorSubscriptionPlan
  subscriptionStatus: DirectorSubscriptionStatus
  billingCycle: DirectorBillingCycle
  recurringAmount: string
  perEventAmount: string
  subscriptionStartsAt: string
  subscriptionRenewsAt: string
  paymentStatus: DirectorPaymentStatus
  billingNextDueAt: string
  billingLastPaidAt: string
}

const SUBSCRIPTION_TYPE_OPTIONS: Array<{ value: DirectorSubscriptionType; label: string }> = [
  { value: 'PER_EVENT', label: 'Por evento' },
  { value: 'RECURRING', label: 'Por pago recurrente' },
]

const PLAN_OPTIONS: Array<{ value: DirectorSubscriptionPlan; label: string }> = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

const STATUS_OPTIONS: Array<{ value: DirectorSubscriptionStatus; label: string }> = [
  { value: 'TRIAL', label: 'Trial' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'PAST_DUE', label: 'Pago vencido' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const BILLING_OPTIONS: Array<{ value: DirectorBillingCycle; label: string }> = [
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'ANNUAL', label: 'Anual' },
]

const PAYMENT_STATUS_OPTIONS: Array<{ value: DirectorPaymentStatus; label: string }> = [
  { value: 'PAID', label: 'Al dia' },
  { value: 'DUE_SOON', label: 'Vence pronto' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAST_DUE', label: 'Vencido' },
]

function toDateInputValue(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toIsoDateOrNull(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(`${trimmed}T12:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toIsoDateRequired(value: string, fallback?: string) {
  const parsed = toIsoDateOrNull(value)
  return parsed ?? fallback ?? new Date().toISOString()
}

function defaultForm(): ManagerFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: '',
    username: '',
    email: '',
    active: true,
    clubIds: [],
    subscriptionType: 'RECURRING',
    subscriptionPlan: 'BASIC',
    subscriptionStatus: 'TRIAL',
    billingCycle: 'MONTHLY',
    recurringAmount: '79',
    perEventAmount: '39',
    subscriptionStartsAt: today,
    subscriptionRenewsAt: '',
    paymentStatus: 'PENDING',
    billingNextDueAt: today,
    billingLastPaidAt: '',
  }
}

function formFromManager(manager: DirectorManagerDTO): ManagerFormState {
  let billingCycle: DirectorBillingCycle = 'MONTHLY'
  let recurringAmount = '79'
  let perEventAmount = '39'

  if (manager.subscription.type === 'RECURRING') {
    billingCycle = manager.subscription.billingCycle
    recurringAmount = String(manager.subscription.recurringAmount)
  } else {
    perEventAmount = String(manager.subscription.perEventAmount)
  }

  return {
    name: manager.user.name,
    username: manager.user.username,
    email: manager.user.email,
    active: manager.active,
    clubIds: manager.clubs.map((club) => club.id),
    subscriptionType: manager.subscription.type,
    subscriptionPlan: manager.subscription.plan,
    subscriptionStatus: manager.subscription.status,
    billingCycle,
    recurringAmount,
    perEventAmount,
    subscriptionStartsAt: toDateInputValue(manager.subscription.startsAt),
    subscriptionRenewsAt: toDateInputValue(manager.subscription.renewsAt),
    paymentStatus: manager.billing.paymentStatus,
    billingNextDueAt: toDateInputValue(manager.billing.nextDueAt),
    billingLastPaidAt: toDateInputValue(manager.billing.lastPaidAt),
  }
}

function payloadFromForm(form: ManagerFormState): DirectorManagerUpsertPayload {
  const common = {
    name: form.name.trim(),
    username: form.username.trim().toLowerCase(),
    email: form.email.trim().toLowerCase(),
    active: form.active,
    clubIds: Array.from(new Set(form.clubIds)),
    subscriptionType: form.subscriptionType,
    subscriptionPlan: form.subscriptionPlan,
    subscriptionStatus: form.subscriptionStatus,
    subscriptionStartsAt: toIsoDateRequired(form.subscriptionStartsAt),
    subscriptionRenewsAt: toIsoDateOrNull(form.subscriptionRenewsAt),
    paymentStatus: form.paymentStatus,
    billingNextDueAt: toIsoDateOrNull(form.billingNextDueAt),
    billingLastPaidAt: toIsoDateOrNull(form.billingLastPaidAt),
  }

  if (form.subscriptionType === 'RECURRING') {
    return {
      ...common,
      subscriptionType: 'RECURRING',
      billingCycle: form.billingCycle,
      recurringAmount: Number(form.recurringAmount),
    }
  }

  return {
    ...common,
    subscriptionType: 'PER_EVENT',
    perEventAmount: Number(form.perEventAmount),
  }
}

function statusBadgeClass(status: DirectorSubscriptionStatus) {
  if (status === 'ACTIVE') return 'badge--success'
  if (status === 'TRIAL') return 'badge--info'
  if (status === 'PAST_DUE') return 'badge--warning'
  return 'badge--danger'
}

function statusLabel(status: DirectorSubscriptionStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

function paymentStatusBadgeClass(status: DirectorPaymentStatus) {
  if (status === 'PAID') return 'badge--success'
  if (status === 'DUE_SOON') return 'badge--info'
  if (status === 'PENDING') return 'badge--warning'
  return 'badge--danger'
}

function paymentStatusLabel(status: DirectorPaymentStatus) {
  return PAYMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

function paymentRecordStatusBadgeClass(status: DirectorManagerPaymentRecordDTO['status']) {
  if (status === 'PAID') return 'badge--success'
  if (status === 'PENDING') return 'badge--warning'
  if (status === 'PAST_DUE') return 'badge--danger'
  return 'badge--info'
}

function paymentRecordStatusLabel(status: DirectorManagerPaymentRecordDTO['status']) {
  if (status === 'PAID') return 'Pagado'
  if (status === 'PENDING') return 'Pendiente'
  if (status === 'PAST_DUE') return 'Vencido'
  return 'Anulado'
}

function planLabel(plan: DirectorSubscriptionPlan) {
  return PLAN_OPTIONS.find((option) => option.value === plan)?.label ?? plan
}

function subscriptionTypeLabel(type: DirectorSubscriptionType) {
  return SUBSCRIPTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
}

function subscriptionAmountLabel(manager: DirectorManagerDTO) {
  if (manager.subscription.type === 'RECURRING') {
    return `USD ${manager.subscription.recurringAmount}/${manager.subscription.billingCycle === 'MONTHLY' ? 'mes' : 'anio'}`
  }
  return `USD ${manager.subscription.perEventAmount}/evento`
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date)
}

function ManagerFormFields({
  form,
  clubs,
  onChange,
}: {
  form: ManagerFormState
  clubs: Array<{ id: string; name: string; active: boolean }>
  onChange: Dispatch<SetStateAction<ManagerFormState>>
}) {
  return (
    <div className="form-grid director-managers-form">
      <label>
        Nombre
        <input value={form.name} onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))} required />
      </label>
      <label>
        Usuario
        <input
          value={form.username}
          onChange={(event) => onChange((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="manager.club"
          required
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="manager@club.com"
          required
        />
      </label>
      <label>
        Modalidad
        <select
          value={form.subscriptionType}
          onChange={(event) => onChange((prev) => ({ ...prev, subscriptionType: event.target.value as DirectorSubscriptionType }))}
        >
          {SUBSCRIPTION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Plan
        <select
          value={form.subscriptionPlan}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, subscriptionPlan: event.target.value as DirectorSubscriptionPlan }))
          }
        >
          {PLAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Estado suscripcion
        <select
          value={form.subscriptionStatus}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, subscriptionStatus: event.target.value as DirectorSubscriptionStatus }))
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Estado de pago
        <select
          value={form.paymentStatus}
          onChange={(event) => onChange((prev) => ({ ...prev, paymentStatus: event.target.value as DirectorPaymentStatus }))}
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {form.subscriptionType === 'RECURRING' ? (
        <>
          <label>
            Facturacion
            <select
              value={form.billingCycle}
              onChange={(event) => onChange((prev) => ({ ...prev, billingCycle: event.target.value as DirectorBillingCycle }))}
            >
              {BILLING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Monto recurrente (USD)
            <input
              type="number"
              min={0}
              step={1}
              value={form.recurringAmount}
              onChange={(event) => onChange((prev) => ({ ...prev, recurringAmount: event.target.value }))}
              required
            />
          </label>
        </>
      ) : (
        <label>
          Precio por evento (USD)
          <input
            type="number"
            min={0}
            step={1}
            value={form.perEventAmount}
            onChange={(event) => onChange((prev) => ({ ...prev, perEventAmount: event.target.value }))}
            required
          />
        </label>
      )}
      <label>
        Inicio suscripcion
        <input
          type="date"
          value={form.subscriptionStartsAt}
          onChange={(event) => onChange((prev) => ({ ...prev, subscriptionStartsAt: event.target.value }))}
          required
        />
      </label>
      <label>
        Renovacion
        <input
          type="date"
          value={form.subscriptionRenewsAt}
          onChange={(event) => onChange((prev) => ({ ...prev, subscriptionRenewsAt: event.target.value }))}
        />
      </label>
      <label>
        Proximo cobro / vencimiento
        <input
          type="date"
          value={form.billingNextDueAt}
          onChange={(event) => onChange((prev) => ({ ...prev, billingNextDueAt: event.target.value }))}
        />
      </label>
      <label>
        Ultimo pago
        <input
          type="date"
          value={form.billingLastPaidAt}
          onChange={(event) => onChange((prev) => ({ ...prev, billingLastPaidAt: event.target.value }))}
        />
      </label>

      <label className="director-managers-form__checkbox">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) => onChange((prev) => ({ ...prev, active: event.target.checked }))}
        />
        Cuenta manager activa
      </label>

      <div className="director-managers-club-picker">
        <p className="director-managers-club-picker__title">Clubs asignados</p>
        <div className="director-managers-club-picker__grid">
          {clubs.map((club) => {
            const checked = form.clubIds.includes(club.id)
            return (
              <label key={club.id} className="director-managers-club-picker__option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    onChange((prev) => ({
                      ...prev,
                      clubIds: event.target.checked ? [...prev.clubIds, club.id] : prev.clubIds.filter((id) => id !== club.id),
                    }))
                  }
                />
                <span>{club.name}</span>
                <small>{club.active ? 'Activo' : 'Inactivo'}</small>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DirectorManagersPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const managersQuery = useQuery({ queryKey: ['director', 'managers'], queryFn: directorApi.getManagers })
  const clubsQuery = useQuery({ queryKey: ['director', 'manager-clubs'], queryFn: managerApi.getClubs })

  const [createForm, setCreateForm] = useState<ManagerFormState>(() => defaultForm())
  const [editing, setEditing] = useState<{ managerId: string; form: ManagerFormState } | null>(null)
  const [billingHistoryManagerId, setBillingHistoryManagerId] = useState<string | null>(null)

  const isLoading = managersQuery.isLoading || clubsQuery.isLoading
  const error = managersQuery.error || clubsQuery.error
  const managers = managersQuery.data ?? []
  const clubs = clubsQuery.data ?? []
  const billingHistoryManager = useMemo(
    () => managers.find((manager) => manager.id === billingHistoryManagerId) ?? null,
    [billingHistoryManagerId, managers],
  )

  const totalMrr = useMemo(
    () =>
      managers
        .reduce((sum, manager) => {
          if (!manager.active) return sum
          if (manager.subscription.type !== 'RECURRING') return sum
          if (manager.subscription.status !== 'ACTIVE' && manager.subscription.status !== 'TRIAL') return sum
          return sum + manager.subscription.recurringAmount
        }, 0),
    [managers],
  )

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = payloadFromForm(createForm)
      if (!payload.name || !payload.username || !payload.email) throw new Error('Completa nombre, usuario y email.')
      if (payload.subscriptionType === 'RECURRING' && !Number.isFinite(payload.recurringAmount)) {
        throw new Error('Monto recurrente invalido.')
      }
      if (payload.subscriptionType === 'PER_EVENT' && !Number.isFinite(payload.perEventAmount)) {
        throw new Error('Precio por evento invalido.')
      }
      return directorApi.createManager(payload)
    },
    onSuccess: () => {
      toast.showToast({ title: 'Manager creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['director', 'managers'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'dashboard'] })
      setCreateForm(defaultForm())
    },
    onError: (errorValue: unknown) => {
      toast.showToast({
        title: 'No se pudo crear el manager',
        description: errorValue instanceof Error ? errorValue.message : undefined,
        variant: 'error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ managerId, form }: { managerId: string; form: ManagerFormState }) =>
      directorApi.updateManager(managerId, payloadFromForm(form)),
    onSuccess: () => {
      toast.showToast({ title: 'Manager actualizado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['director', 'managers'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'dashboard'] })
      setEditing(null)
    },
    onError: (errorValue: unknown) => {
      toast.showToast({
        title: 'No se pudo actualizar el manager',
        description: errorValue instanceof Error ? errorValue.message : undefined,
        variant: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (managerId: string) => directorApi.deleteManager(managerId),
    onSuccess: () => {
      toast.showToast({ title: 'Manager eliminado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['director', 'managers'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'dashboard'] })
    },
    onError: (errorValue: unknown) => {
      toast.showToast({
        title: 'No se pudo eliminar el manager',
        description: errorValue instanceof Error ? errorValue.message : undefined,
        variant: 'error',
      })
    },
  })

  const openEdit = (manager: DirectorManagerDTO) => {
    setEditing({ managerId: manager.id, form: formFromManager(manager) })
  }

  const handleToggleActive = (manager: DirectorManagerDTO) => {
    updateMutation.mutate({
      managerId: manager.id,
      form: { ...formFromManager(manager), active: !manager.active },
    })
  }

  const handleDelete = (manager: DirectorManagerDTO) => {
    if (!window.confirm(`Eliminar manager ${manager.user.name}?`)) return
    deleteMutation.mutate(manager.id)
  }

  if (isLoading) return <PageLoadingState message="Cargando managers..." />
  if (error) return <PageErrorState description="No se pudieron cargar los managers." />

  return (
    <div className="director-page director-managers-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Managers y suscripciones</h3>
          <p className="text-muted director-page__subtitle">
            Administra cuentas manager, clubs asignados y el estado comercial de la suscripcion.
          </p>
        </div>
      </header>

      <section className="director-kpis">
        <article className="director-kpi director-kpi--flat">
          <p className="text-muted">Managers</p>
          <strong>{managers.length}</strong>
        </article>
        <article className="director-kpi director-kpi--flat">
          <p className="text-muted">Suscripciones activas/trial</p>
          <strong>{managers.filter((manager) => ['ACTIVE', 'TRIAL'].includes(manager.subscription.status)).length}</strong>
        </article>
        <article className="director-kpi director-kpi--flat">
          <p className="text-muted">MRR recurrente estimado</p>
          <strong>USD {totalMrr}</strong>
        </article>
        <article className="director-kpi director-kpi--flat">
          <p className="text-muted">Cuentas por evento</p>
          <strong>{managers.filter((manager) => manager.subscription.type === 'PER_EVENT').length}</strong>
        </article>
        <article className="director-kpi director-kpi--flat">
          <p className="text-muted">Cobro vencido</p>
          <strong>{managers.filter((manager) => manager.billing.paymentStatus === 'PAST_DUE').length}</strong>
        </article>
      </section>

      <section className="director-data-panel director-managers-create">
        <header className="director-managers-section-head">
          <h4 className="director-section-title">Crear manager</h4>
          <p className="text-muted">Alta de cuenta y configuracion de suscripcion inicial.</p>
        </header>

        <ManagerFormFields form={createForm} clubs={clubs} onChange={setCreateForm} />

        <div className="director-managers-form__actions">
          <Button type="button" variant="ghost" onClick={() => setCreateForm(defaultForm())}>
            Limpiar
          </Button>
          <Button type="button" loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            Crear manager
          </Button>
        </div>
      </section>

      {managers.length === 0 ? (
        <CardEmptyState
          title="No hay managers"
          description="Crea el primer manager para empezar a administrar suscripciones."
        />
      ) : (
        <section className="director-data-panel director-managers-list">
          <header className="director-managers-section-head">
            <h4 className="director-section-title">Base de managers</h4>
            <p className="text-muted">CRUD operativo para plataforma.</p>
          </header>

          <div className="director-table-wrap director-managers-table-wrap">
            <table className="director-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Usuario</th>
                  <th>Clubs</th>
                  <th>Modalidad / Plan</th>
                  <th>Suscripcion</th>
                  <th>Cobro</th>
                  <th>Prox. cobro</th>
                  <th>Renovacion</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id}>
                    <td>
                      <div className="director-managers-cell__stack">
                        <strong>{manager.user.name}</strong>
                        <small>{manager.user.email}</small>
                      </div>
                    </td>
                    <td>{manager.user.username}</td>
                    <td>{manager.clubs.map((club) => club.name).join(', ') || 'Sin clubs'}</td>
                    <td>
                      {subscriptionTypeLabel(manager.subscription.type)} / {planLabel(manager.subscription.plan)}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(manager.subscription.status)}`}>{statusLabel(manager.subscription.status)}</span>
                    </td>
                    <td>
                      <span className={`badge ${paymentStatusBadgeClass(manager.billing.paymentStatus)}`}>
                        {paymentStatusLabel(manager.billing.paymentStatus)}
                      </span>
                    </td>
                    <td>{formatDate(manager.billing.nextDueAt)}</td>
                    <td>{formatDate(manager.subscription.renewsAt)}</td>
                    <td>{subscriptionAmountLabel(manager)}</td>
                    <td>
                      <div className="director-managers-actions">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setBillingHistoryManagerId(manager.id)}>
                          Cobros
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(manager)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleActive(manager)}>
                          {manager.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(manager)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="director-dashboard-topclubs-mobile-list">
            {managers.map((manager) => (
              <article key={`mobile-manager-${manager.id}`} className="director-mobile-card director-mobile-card--flat">
                <header className="director-mobile-card__header">
                  <div>
                    <h4 className="director-mobile-card__title">{manager.user.name}</h4>
                    <p className="text-muted">{manager.user.email}</p>
                  </div>
                  <div className="director-managers-mobile-badges">
                    <span className={`badge ${statusBadgeClass(manager.subscription.status)}`}>{statusLabel(manager.subscription.status)}</span>
                    <span className={`badge ${paymentStatusBadgeClass(manager.billing.paymentStatus)}`}>
                      {paymentStatusLabel(manager.billing.paymentStatus)}
                    </span>
                  </div>
                </header>

                <div className="director-mobile-card__stats director-managers-mobile-meta">
                  <p>
                    <strong>Usuario:</strong> {manager.user.username}
                  </p>
                  <p>
                    <strong>Clubs:</strong> {manager.clubs.map((club) => club.name).join(', ') || 'Sin clubs'}
                  </p>
                  <p>
                    <strong>Modalidad:</strong> {subscriptionTypeLabel(manager.subscription.type)}
                  </p>
                  <p>
                    <strong>Plan:</strong> {planLabel(manager.subscription.plan)}
                  </p>
                  <p>
                    <strong>Prox. cobro:</strong> {formatDate(manager.billing.nextDueAt)}
                  </p>
                  <p>
                    <strong>Renovacion:</strong> {formatDate(manager.subscription.renewsAt)}
                  </p>
                  <p>
                    <strong>Monto:</strong> {subscriptionAmountLabel(manager)}
                  </p>
                </div>

                <div className="director-managers-actions director-managers-actions--mobile">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setBillingHistoryManagerId(manager.id)}>
                    Cobros
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(manager)}>
                    Editar
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleActive(manager)}>
                    {manager.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(manager)}>
                    Eliminar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <BottomSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar manager"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              loading={updateMutation.isPending}
              onClick={() => {
                if (!editing) return
                updateMutation.mutate({ managerId: editing.managerId, form: editing.form })
              }}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="director-managers-sheet">
            <ManagerFormFields
              form={editing.form}
              clubs={clubs}
              onChange={(updater) =>
                setEditing((prev) => (prev ? { ...prev, form: typeof updater === 'function' ? updater(prev.form) : updater } : prev))
              }
            />
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={Boolean(billingHistoryManager)}
        onClose={() => setBillingHistoryManagerId(null)}
        title={billingHistoryManager ? `Cobros - ${billingHistoryManager.user.name}` : 'Cobros'}
        actions={
          <Button type="button" variant="secondary" onClick={() => setBillingHistoryManagerId(null)}>
            Cerrar
          </Button>
        }
      >
        {billingHistoryManager ? (
          <div className="director-managers-sheet">
            <div className="director-managers-history-summary">
              <span className={`badge ${paymentStatusBadgeClass(billingHistoryManager.billing.paymentStatus)}`}>
                {paymentStatusLabel(billingHistoryManager.billing.paymentStatus)}
              </span>
              <p className="text-muted">Prox. cobro: {formatDate(billingHistoryManager.billing.nextDueAt)}</p>
              <p className="text-muted">Ultimo pago: {formatDate(billingHistoryManager.billing.lastPaidAt)}</p>
            </div>

            {billingHistoryManager.billing.history.length === 0 ? (
              <p className="text-muted">Sin cobros registrados todavia.</p>
            ) : (
              <>
                <div className="director-table-wrap director-managers-history-table-wrap">
                  <table className="director-table">
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Emision</th>
                        <th>Vencimiento</th>
                        <th>Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistoryManager.billing.history.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.concept}</td>
                          <td>
                            {payment.currency} {payment.amount}
                          </td>
                          <td>
                            <span className={`badge ${paymentRecordStatusBadgeClass(payment.status)}`}>
                              {paymentRecordStatusLabel(payment.status)}
                            </span>
                          </td>
                          <td>{formatDate(payment.issuedAt)}</td>
                          <td>{formatDate(payment.dueAt)}</td>
                          <td>{formatDate(payment.paidAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="director-dashboard-topclubs-mobile-list">
                  {billingHistoryManager.billing.history.map((payment) => (
                    <article key={`pay-mobile-${payment.id}`} className="director-mobile-card director-mobile-card--flat">
                      <header className="director-mobile-card__header">
                        <h4 className="director-mobile-card__title">{payment.concept}</h4>
                        <span className={`badge ${paymentRecordStatusBadgeClass(payment.status)}`}>
                          {paymentRecordStatusLabel(payment.status)}
                        </span>
                      </header>
                      <div className="director-mobile-card__stats director-managers-mobile-meta">
                        <p>
                          <strong>Monto:</strong> {payment.currency} {payment.amount}
                        </p>
                        <p>
                          <strong>Emision:</strong> {formatDate(payment.issuedAt)}
                        </p>
                        <p>
                          <strong>Vencimiento:</strong> {formatDate(payment.dueAt)}
                        </p>
                        <p>
                          <strong>Pago:</strong> {formatDate(payment.paidAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  )
}
