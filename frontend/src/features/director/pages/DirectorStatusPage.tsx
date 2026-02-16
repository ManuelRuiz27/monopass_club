import { useMemo, useState } from 'react'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useDirectorData } from '../useDirectorData'

type StatusFilter = 'all' | 'stable' | 'risk' | 'inactive'

type ClubWithStatus = {
  clubId: string
  clubName: string
  activeEvents: number
  conversion: number
  pending: number
  status: 'Estable' | 'Riesgo' | 'Inactivo'
}

function resolveStatus(club: { clubActive: boolean; generated: number; conversion: number }): ClubWithStatus['status'] {
  if (!club.clubActive) return 'Inactivo'
  if (club.generated >= 40 && club.conversion < 60) return 'Riesgo'
  return 'Estable'
}

export function DirectorStatusPage() {
  const { data, isLoading, error } = useDirectorData()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pendingStatusFilter, setPendingStatusFilter] = useState<StatusFilter>('all')

  const modules = [
    {
      label: 'Clubs',
      active: data?.overview.clubsActive ?? 0,
      total: data?.overview.clubsTotal ?? 0,
    },
    {
      label: 'Eventos',
      active: data?.overview.eventsActive ?? 0,
      total: data?.overview.eventsTotal ?? 0,
    },
    {
      label: 'RPs',
      active: data?.overview.rpsActive ?? 0,
      total: data?.overview.rpsTotal ?? 0,
    },
    {
      label: 'Scanners',
      active: data?.overview.scannersActive ?? 0,
      total: data?.overview.scannersTotal ?? 0,
    },
  ]

  const rows = useMemo<ClubWithStatus[]>(() => {
    if (!data) return []

    return data.byClub
      .map((club) => ({
        clubId: club.clubId,
        clubName: club.clubName,
        activeEvents: club.activeEvents,
        conversion: club.conversion,
        pending: club.pending,
        status: resolveStatus(club),
      }))
      .filter((club) => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'stable') return club.status === 'Estable'
        if (statusFilter === 'risk') return club.status === 'Riesgo'
        return club.status === 'Inactivo'
      })
  }, [data, statusFilter])

  const hasFilter = statusFilter !== 'all'

  const resetFilters = () => {
    setStatusFilter('all')
  }

  const openFilterSheet = () => {
    setPendingStatusFilter(statusFilter)
    setIsFilterSheetOpen(true)
  }

  const applyPendingFilters = () => {
    setStatusFilter(pendingStatusFilter)
    setIsFilterSheetOpen(false)
  }

  if (isLoading) {
    return <PageLoadingState message="Cargando estados..." />
  }

  if (error || !data) {
    return <PageErrorState description="No se pudieron cargar los estados operativos." />
  }

  return (
    <div className="director-page director-status-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Estados</h3>
          <p className="text-muted director-page__subtitle">Seguimiento de salud operativa por modulo y club.</p>
        </div>
      </header>

      <section className="director-kpis">
        {modules.map((module) => (
          <article key={module.label} className="card director-kpi">
            <p className="text-muted">{module.label}</p>
            <strong>
              {module.active}/{module.total}
            </strong>
          </article>
        ))}
        <article className="card director-kpi">
          <p className="text-muted">Conversion global</p>
          <strong>{data.overview.conversion}%</strong>
        </article>
      </section>

      <section className="director-toolbar">
        <div className="director-toolbar__mobile">
          <Button type="button" variant="secondary" size="sm" onClick={openFilterSheet}>
            Filtrar
          </Button>
          {hasFilter ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="director-toolbar__desktop">
          <label>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">Todos</option>
              <option value="stable">Estable</option>
              <option value="risk">Riesgo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </section>

      {rows.length === 0 ? (
        <CardEmptyState
          title="No hay clubs para este filtro"
          description="Ajusta estado para ver mas resultados."
          actionLabel="Limpiar filtro"
          onAction={resetFilters}
        />
      ) : (
        <section className="director-grid">
          <article className="card">
            <h4 className="director-section-title">Estado por club</h4>
            <div className="director-table-wrap director-status-table-wrap">
              <table className="director-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Eventos activos</th>
                    <th>Conversion</th>
                    <th>Pendientes</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((club) => (
                    <tr key={club.clubId}>
                      <td>{club.clubName}</td>
                      <td>{club.activeEvents}</td>
                      <td>{club.conversion}%</td>
                      <td>{club.pending}</td>
                      <td>
                        <span
                          className={`badge ${club.status === 'Riesgo' ? 'badge--warning' : club.status === 'Inactivo' ? 'badge--danger' : 'badge--success'}`}
                        >
                          {club.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="director-status-mobile-list">
              {rows.map((club) => (
                <article key={`mobile-status-${club.clubId}`} className="card director-mobile-card">
                  <header className="director-mobile-card__header">
                    <h4 className="director-mobile-card__title">{club.clubName}</h4>
                    <span
                      className={`badge ${club.status === 'Riesgo' ? 'badge--warning' : club.status === 'Inactivo' ? 'badge--danger' : 'badge--success'}`}
                    >
                      {club.status}
                    </span>
                  </header>
                  <div className="stats-row director-mobile-card__stats">
                    <div>
                      <strong>{club.activeEvents}</strong>
                      <span>Eventos</span>
                    </div>
                    <div>
                      <strong>{club.conversion}%</strong>
                      <span>Conversion</span>
                    </div>
                    <div>
                      <strong>{club.pending}</strong>
                      <span>Pendientes</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <h4 className="director-section-title">Alertas</h4>
            {data.alerts.length === 0 ? (
              <p className="text-muted">Sin alertas activas.</p>
            ) : (
              <div className="director-alerts">
                {data.alerts.map((alert) => (
                  <article key={alert.id} className={`panel director-alert director-alert--${alert.level}`}>
                    <strong>{alert.title}</strong>
                    <p className="text-muted">{alert.description}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar estados"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyPendingFilters}>
              Aplicar
            </Button>
          </>
        }
      >
        <div className="form-grid director-sheet">
          <label>
            Estado
            <select value={pendingStatusFilter} onChange={(event) => setPendingStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">Todos</option>
              <option value="stable">Estable</option>
              <option value="risk">Riesgo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingStatusFilter('all')
              resetFilters()
              setIsFilterSheetOpen(false)
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
