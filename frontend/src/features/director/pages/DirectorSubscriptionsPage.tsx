import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { directorMonetizationApi, type DirectorSubscriptionDTO, type DirectorSubscriptionStatus } from '../monetizationApi'
import { dateInputToIso, formatDate } from '../monetizationUi'

type SubscriptionForm = {
  clubId: string
  planId: string
  status: DirectorSubscriptionStatus
  startAt: string
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndAt: string
  seatsHostsLimit: string
  cancelAtPeriodEnd: boolean
  overridesJson: string
}

function defaultDates() {
  const now = new Date()
  const next = new Date(now.getTime() + 30 * 24 * 3600 * 1000)
  return { today: now.toISOString().slice(0, 10), next: next.toISOString().slice(0, 10) }
}

function defaultForm(): SubscriptionForm {
  const { today, next } = defaultDates()
  return {
    clubId: '',
    planId: '',
    status: 'active',
    startAt: today,
    currentPeriodStart: today,
    currentPeriodEnd: next,
    trialEndAt: '',
    seatsHostsLimit: '',
    cancelAtPeriodEnd: false,
    overridesJson: '{}',
  }
}

function parseOverrides(raw: string) {
  if (!raw.trim()) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

export function DirectorSubscriptionsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | DirectorSubscriptionStatus>('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<SubscriptionForm>(() => defaultForm())
  const [editing, setEditing] = useState<DirectorSubscriptionDTO | null>(null)

  const clubsQuery = useQuery({ queryKey: ['director', 'monetization', 'clubs'], queryFn: directorMonetizationApi.getClubs })
  const plansQuery = useQuery({ queryKey: ['director', 'monetization', 'plans-all'], queryFn: () => directorMonetizationApi.getPlans({ page: 1, pageSize: 100 }) })
  const subscriptionsQuery = useQuery({
    queryKey: ['director', 'monetization', 'subscriptions', { page, statusFilter, search }],
    queryFn: () =>
      directorMonetizationApi.getSubscriptions({
        page,
        pageSize: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        q: search.trim() || undefined,
      }),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      let overrides: Record<string, unknown> = {}
      try {
        overrides = parseOverrides(form.overridesJson)
      } catch {
        throw new Error('Overrides JSON invalido.')
      }
      return directorMonetizationApi.createSubscription({
        clubId: form.clubId,
        planId: form.planId,
        status: form.status,
        startAt: dateInputToIso(form.startAt) ?? new Date().toISOString(),
        currentPeriodStart: dateInputToIso(form.currentPeriodStart) ?? new Date().toISOString(),
        currentPeriodEnd: dateInputToIso(form.currentPeriodEnd) ?? new Date().toISOString(),
        trialEndAt: dateInputToIso(form.trialEndAt) ?? null,
        seatsHostsLimit: form.seatsHostsLimit ? Number.parseInt(form.seatsHostsLimit, 10) : null,
        cancelAtPeriodEnd: form.cancelAtPeriodEnd,
        overrides,
      })
    },
    onSuccess: () => {
      toast.showToast({ title: 'Suscripcion creada', variant: 'success' })
      setForm(defaultForm())
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'dashboard'] })
    },
    onError: (error) => toast.showToast({ title: 'Error creando suscripcion', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<DirectorSubscriptionDTO> & { trialEndAt?: string | null } }) =>
      directorMonetizationApi.updateSubscription(payload.id, payload.data),
    onSuccess: () => {
      toast.showToast({ title: 'Suscripcion actualizada', variant: 'success' })
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'dashboard'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo actualizar', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const isLoading = clubsQuery.isLoading || plansQuery.isLoading || subscriptionsQuery.isLoading
  const error = clubsQuery.error || plansQuery.error || subscriptionsQuery.error
  const clubs = clubsQuery.data ?? []
  const plans = plansQuery.data?.items ?? []
  const subscriptions = subscriptionsQuery.data?.items ?? []
  const total = subscriptionsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 10))

  const stats = {
    active: subscriptions.filter((s) => s.status === 'active').length,
    pastDue: subscriptions.filter((s) => s.status === 'past_due').length,
    canceled: subscriptions.filter((s) => s.status === 'canceled').length,
  }

  if (isLoading) return <PageLoadingState message="Cargando suscripciones..." />
  if (error) return <PageErrorState description="No se pudieron cargar las suscripciones." />

  return (
    <div className="director-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Monetizacion · Suscripciones</h3>
          <p className="text-muted director-page__subtitle">Asigna planes por club y administra estado, trial y ciclo actual.</p>
        </div>
      </header>

      <section className="director-kpis">
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Activas (pagina)</p><strong>{stats.active}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Past due</p><strong>{stats.pastDue}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Canceladas</p><strong>{stats.canceled}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Pagina</p><strong>{page}/{totalPages}</strong></article>
      </section>

      <section className="card">
        <div className="director-toolbar__desktop">
          <input placeholder="Buscar club o plan..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | DirectorSubscriptionStatus); setPage(1) }}>
            <option value="all">Todos</option>
            <option value="active">active</option>
            <option value="trialing">trialing</option>
            <option value="past_due">past_due</option>
            <option value="paused">paused</option>
            <option value="canceled">canceled</option>
          </select>
        </div>
        {subscriptions.length === 0 ? (
          <CardEmptyState title="Sin suscripciones" description="Crea una suscripcion para un club." />
        ) : (
          <div className="director-table-wrap">
            <table className="director-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Periodo actual</th>
                  <th>Trial</th>
                  <th>Cancelacion</th>
                  <th>Entitlements</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.club?.name ?? item.clubId}</td>
                    <td>{item.plan?.name ?? item.planId}</td>
                    <td><span className={`badge ${item.status === 'active' ? 'badge--success' : item.status === 'past_due' ? 'badge--warning' : 'badge--info'}`}>{item.status}</span></td>
                    <td>{formatDate(item.currentPeriodStart)} → {formatDate(item.currentPeriodEnd)}</td>
                    <td>{formatDate(item.trialEndAt)}</td>
                    <td>{item.cancelAtPeriodEnd ? 'Al final del periodo' : 'No'}</td>
                    <td><code>{Object.keys(item.effectiveEntitlements ?? {}).join(', ') || '—'}</code></td>
                    <td>
                      <div className="director-managers-actions">
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(item)}>Editar</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, data: { status: item.status === 'paused' ? 'active' : 'paused' } })}>
                          {item.status === 'paused' ? 'Reactivar' : 'Pausar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, data: { cancelAtPeriodEnd: !item.cancelAtPeriodEnd } })}>
                          {item.cancelAtPeriodEnd ? 'Quitar cancel.' : 'Cancel. fin periodo'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
          <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente</Button>
        </div>
      </section>

      <section className="card">
        <h4 className="director-section-title">Asignar suscripcion a club</h4>
        <div className="form-grid">
          <label>Club
            <select value={form.clubId} onChange={(e) => setForm((p) => ({ ...p, clubId: e.target.value }))}>
              <option value="">Selecciona...</option>
              {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
            </select>
          </label>
          <label>Plan
            <select value={form.planId} onChange={(e) => setForm((p) => ({ ...p, planId: e.target.value }))}>
              <option value="">Selecciona...</option>
              {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </select>
          </label>
          <label>Estado
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DirectorSubscriptionStatus }))}>
              <option value="trialing">trialing</option><option value="active">active</option><option value="past_due">past_due</option><option value="paused">paused</option><option value="canceled">canceled</option>
            </select>
          </label>
          <label>Inicio<input type="date" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} /></label>
          <label>Periodo inicio<input type="date" value={form.currentPeriodStart} onChange={(e) => setForm((p) => ({ ...p, currentPeriodStart: e.target.value }))} /></label>
          <label>Periodo fin<input type="date" value={form.currentPeriodEnd} onChange={(e) => setForm((p) => ({ ...p, currentPeriodEnd: e.target.value }))} /></label>
          <label>Trial fin<input type="date" value={form.trialEndAt} onChange={(e) => setForm((p) => ({ ...p, trialEndAt: e.target.value }))} /></label>
          <label>Hosts limit<input type="number" value={form.seatsHostsLimit} onChange={(e) => setForm((p) => ({ ...p, seatsHostsLimit: e.target.value }))} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.cancelAtPeriodEnd} onChange={(e) => setForm((p) => ({ ...p, cancelAtPeriodEnd: e.target.checked }))} />
            Cancelar al final del periodo
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Overrides JSON
            <textarea rows={5} value={form.overridesJson} onChange={(e) => setForm((p) => ({ ...p, overridesJson: e.target.value }))} />
          </label>
        </div>
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={() => setForm(defaultForm())}>Limpiar</Button>
          <Button type="button" loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Crear suscripcion</Button>
        </div>
      </section>

      {editing ? (
        <section className="card">
          <h4 className="director-section-title">Edicion rapida · {editing.club?.name}</h4>
          <div className="director-managers-actions">
            <Button type="button" variant="secondary" onClick={() => updateMutation.mutate({ id: editing.id, data: { status: 'active' } })}>Marcar active</Button>
            <Button type="button" variant="secondary" onClick={() => updateMutation.mutate({ id: editing.id, data: { status: 'past_due' } })}>Marcar past_due</Button>
            <Button type="button" variant="secondary" onClick={() => updateMutation.mutate({ id: editing.id, data: { status: 'canceled' } })}>Cancelar</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cerrar</Button>
          </div>
          <p className="text-muted">Periodo actual: {formatDate(editing.currentPeriodStart)} → {formatDate(editing.currentPeriodEnd)}</p>
          <p className="text-muted">Entitlements efectivos: <code>{JSON.stringify(editing.effectiveEntitlements)}</code></p>
        </section>
      ) : null}
    </div>
  )
}
