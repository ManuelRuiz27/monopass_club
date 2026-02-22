import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { directorMonetizationApi, type DirectorBillingPeriod, type DirectorPlanDTO, type DirectorSubscriptionPlanStatus } from '../monetizationApi'
import { formatMxn } from '../monetizationUi'

type PlanFormState = {
  name: string
  description: string
  billingPeriod: DirectorBillingPeriod
  priceMxn: string
  includedEventsPerMonth: string
  overagePricePerEventMxn: string
  status: DirectorSubscriptionPlanStatus
  entitlementsJson: string
}

function defaultForm(): PlanFormState {
  return {
    name: '',
    description: '',
    billingPeriod: 'monthly',
    priceMxn: '149900',
    includedEventsPerMonth: '8',
    overagePricePerEventMxn: '19900',
    status: 'active',
    entitlementsJson: JSON.stringify({ rps: 20, scanners: 10 }, null, 2),
  }
}

function formFromPlan(plan: DirectorPlanDTO): PlanFormState {
  return {
    name: plan.name,
    description: plan.description ?? '',
    billingPeriod: plan.billingPeriod,
    priceMxn: String(plan.priceMxn),
    includedEventsPerMonth: plan.includedEventsPerMonth == null ? '' : String(plan.includedEventsPerMonth),
    overagePricePerEventMxn: plan.overagePricePerEventMxn == null ? '' : String(plan.overagePricePerEventMxn),
    status: plan.status,
    entitlementsJson: JSON.stringify(plan.entitlements ?? {}, null, 2),
  }
}

function parseForm(form: PlanFormState) {
  let entitlements: Record<string, unknown> = {}
  try {
    entitlements = form.entitlementsJson.trim() ? (JSON.parse(form.entitlementsJson) as Record<string, unknown>) : {}
  } catch {
    throw new Error('El JSON de entitlements es invalido.')
  }
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    billingPeriod: form.billingPeriod,
    priceMxn: Number.parseInt(form.priceMxn || '0', 10),
    includedEventsPerMonth: form.includedEventsPerMonth ? Number.parseInt(form.includedEventsPerMonth, 10) : null,
    overagePricePerEventMxn: form.overagePricePerEventMxn ? Number.parseInt(form.overagePricePerEventMxn, 10) : null,
    status: form.status,
    currency: 'MXN',
    entitlements,
  } as const
}

export function DirectorPlansPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | DirectorSubscriptionPlanStatus>('all')
  const [form, setForm] = useState<PlanFormState>(() => defaultForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const plansQuery = useQuery({
    queryKey: ['director', 'monetization', 'plans', { page, q, status }],
    queryFn: () =>
      directorMonetizationApi.getPlans({
        page,
        pageSize: 10,
        q: q.trim() || undefined,
        status: status === 'all' ? undefined : status,
      }),
  })

  const createMutation = useMutation({
    mutationFn: async () => directorMonetizationApi.createPlan(parseForm(form)),
    onSuccess: () => {
      toast.showToast({ title: 'Plan creado', variant: 'success' })
      setForm(defaultForm())
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'plans'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo crear el plan', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('Selecciona un plan')
      return directorMonetizationApi.updatePlan(editingId, parseForm(form))
    },
    onSuccess: () => {
      toast.showToast({ title: 'Plan actualizado', variant: 'success' })
      setEditingId(null)
      setForm(defaultForm())
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'plans'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo actualizar', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const archiveMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map((id) => directorMonetizationApi.archivePlan(id))),
    onSuccess: () => {
      toast.showToast({ title: 'Planes archivados', variant: 'info' })
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'plans'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo archivar', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const items = plansQuery.data?.items ?? []
  const total = plansQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 10))
  const activeCount = items.filter((plan) => plan.status === 'active').length

  if (plansQuery.isLoading) return <PageLoadingState message="Cargando planes..." />
  if (plansQuery.error) return <PageErrorState description="No se pudieron cargar los planes." />

  return (
    <div className="director-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Monetizacion · Planes</h3>
          <p className="text-muted director-page__subtitle">CRUD de planes y precios en MXN con entitlements configurables.</p>
        </div>
      </header>

      <section className="director-kpis">
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Pagina</p><strong>{page}/{totalPages}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Planes listados</p><strong>{items.length}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Activos en pagina</p><strong>{activeCount}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Seleccionados</p><strong>{selectedIds.length}</strong></article>
      </section>

      <section className="card">
        <div className="director-toolbar">
          <div className="director-toolbar__desktop">
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Buscar plan..." />
            <select value={status} onChange={(e) => { setStatus(e.target.value as 'all' | DirectorSubscriptionPlanStatus); setPage(1) }}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="archived">Archivados</option>
            </select>
            <Button type="button" variant="secondary" disabled={selectedIds.length === 0} loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate(selectedIds)}>
              Archivar seleccionados
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <CardEmptyState title="Sin planes" description="Crea el primer plan de monetizacion." />
        ) : (
          <div className="director-table-wrap">
            <table className="director-table">
              <thead>
                <tr>
                  <th />
                  <th>Plan</th>
                  <th>Periodo</th>
                  <th>Precio</th>
                  <th>Eventos incluidos</th>
                  <th>Overage</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((plan) => {
                  const checked = selectedIds.includes(plan.id)
                  return (
                    <tr key={plan.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, plan.id] : prev.filter((id) => id !== plan.id))}
                        />
                      </td>
                      <td>
                        <strong>{plan.name}</strong>
                        <div className="text-muted">{plan.description ?? 'Sin descripcion'}</div>
                      </td>
                      <td>{plan.billingPeriod}</td>
                      <td>{formatMxn(plan.priceMxn)}</td>
                      <td>{plan.includedEventsPerMonth ?? 'N/A'}</td>
                      <td>{plan.overagePricePerEventMxn == null ? 'N/A' : formatMxn(plan.overagePricePerEventMxn)}</td>
                      <td><span className={`badge ${plan.status === 'active' ? 'badge--success' : 'badge--info'}`}>{plan.status}</span></td>
                      <td>
                        <div className="director-managers-actions">
                          <Button type="button" size="sm" variant="secondary" onClick={() => { setEditingId(plan.id); setForm(formFromPlan(plan)) }}>Editar</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => archiveMutation.mutate([plan.id])}>Archivar</Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
        <h4 className="director-section-title">{editingId ? 'Editar plan' : 'Crear plan'}</h4>
        <div className="form-grid">
          <label>Nombre<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
          <label>Periodo
            <select value={form.billingPeriod} onChange={(e) => setForm((p) => ({ ...p, billingPeriod: e.target.value as DirectorBillingPeriod }))}>
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
              <option value="one_time">One-time</option>
            </select>
          </label>
          <label>Precio MXN (cents)<input type="number" value={form.priceMxn} onChange={(e) => setForm((p) => ({ ...p, priceMxn: e.target.value }))} /></label>
          <label>Eventos/mes<input type="number" value={form.includedEventsPerMonth} onChange={(e) => setForm((p) => ({ ...p, includedEventsPerMonth: e.target.value }))} /></label>
          <label>Overage por evento (cents)<input type="number" value={form.overagePricePerEventMxn} onChange={(e) => setForm((p) => ({ ...p, overagePricePerEventMxn: e.target.value }))} /></label>
          <label>Estado
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DirectorSubscriptionPlanStatus }))}>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>Descripcion<input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
          <label style={{ gridColumn: '1 / -1' }}>
            Entitlements JSON
            <textarea rows={6} value={form.entitlementsJson} onChange={(e) => setForm((p) => ({ ...p, entitlementsJson: e.target.value }))} />
          </label>
        </div>
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          {editingId ? <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm(defaultForm()) }}>Cancelar</Button> : null}
          <Button type="button" variant="secondary" onClick={() => setForm(defaultForm())}>Limpiar</Button>
          <Button type="button" loading={createMutation.isPending || updateMutation.isPending} onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}>
            {editingId ? 'Guardar cambios' : 'Crear plan'}
          </Button>
        </div>
      </section>
    </div>
  )
}
