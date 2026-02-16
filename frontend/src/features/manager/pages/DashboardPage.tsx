import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'
import { PageErrorState, PageLoadingState } from '@/components/ui'

type DashboardStats = {
  activeEventsToday: number
  totalTicketsGenerated: number
  totalTicketsScanned: number
  activeRps: number
  activeScanners: number
  topRps: Array<{ name: string; generated: number; attendance: number }>
  weeklyActivity: Array<{ day: string; value: number }>
}

function useDashboardStats(): { data: DashboardStats | null; isLoading: boolean; error: unknown } {
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const scannersQuery = useQuery({ queryKey: ['scanners'], queryFn: managerApi.getScanners })
  const cutsQuery = useQuery({
    queryKey: ['cuts-summary'],
    queryFn: () => managerApi.getCuts(),
  })

  const isLoading = eventsQuery.isLoading || rpsQuery.isLoading || scannersQuery.isLoading || cutsQuery.isLoading
  const error = eventsQuery.error || rpsQuery.error || scannersQuery.error || cutsQuery.error

  return useMemo(() => {
    if (isLoading || error) {
      return { data: null, isLoading, error }
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const activeEventsToday =
      eventsQuery.data?.filter((event) => {
        const start = new Date(event.startsAt)
        const end = new Date(event.endsAt)
        return event.active && start < todayEnd && end > todayStart
      }).length ?? 0

    const activeRps = rpsQuery.data?.filter((rp) => rp.active).length ?? 0
    const activeScanners = scannersQuery.data?.filter((scanner) => scanner.active).length ?? 0

    const topRps =
      rpsQuery.data
        ?.map((rp) => {
          const generated = rp.assignments.reduce((sum, assignment) => sum + assignment.usedAccesses, 0)
          return {
            name: rp.user.name,
            generated,
            attendance: Math.round(generated * 0.7),
          }
        })
        .sort((a, b) => b.generated - a.generated)
        .slice(0, 5) ?? []

    const totalTicketsGenerated = topRps.reduce((sum, rp) => sum + rp.generated, 0)
    const totalTicketsScanned = cutsQuery.data?.total ?? 0

    const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => ({
      day: days[index],
      value: 100 + index * 10,
    }))

    return {
      data: {
        activeEventsToday,
        totalTicketsGenerated,
        totalTicketsScanned,
        activeRps,
        activeScanners,
        topRps,
        weeklyActivity,
      },
      isLoading: false,
      error: null,
    }
  }, [isLoading, error, eventsQuery.data, rpsQuery.data, scannersQuery.data, cutsQuery.data])
}

export function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return <PageLoadingState message="Cargando dashboard..." />
  }

  if (error || !stats) {
    return <PageErrorState description="No pudimos obtener los datos del dashboard." />
  }

  const conversionRate =
    stats.totalTicketsGenerated > 0
      ? Math.round((stats.totalTicketsScanned / stats.totalTicketsGenerated) * 100)
      : 0

  const maxWeeklyValue = Math.max(...stats.weeklyActivity.map((item) => item.value), 1)

  const kpis = [
    { label: 'Eventos hoy', value: stats.activeEventsToday, tone: 'primary' },
    { label: 'Generados', value: stats.totalTicketsGenerated, tone: 'success' },
    { label: 'Confirmados', value: stats.totalTicketsScanned, tone: 'info' },
    { label: 'Asistencia', value: `${conversionRate}%`, tone: 'default' },
    { label: 'RPs activos', value: stats.activeRps, tone: 'default' },
    { label: 'Scanners activos', value: stats.activeScanners, tone: 'default' },
  ]

  return (
    <div className="manager-dashboard-page">
      <header className="manager-dashboard-page__header">
        <h3 className="manager-dashboard-page__title">Dashboard</h3>
      </header>

      <section className="manager-dashboard-kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`card manager-dashboard-kpi manager-dashboard-kpi--${kpi.tone}`}>
            <p className="text-muted">{kpi.label}</p>
            <strong>{kpi.value}</strong>
          </article>
        ))}
      </section>

      <section className="manager-dashboard-grid">
        <article className="card manager-dashboard-chart">
          <h4 className="manager-dashboard-section-title">Actividad semanal</h4>
          <div className="manager-dashboard-bars" role="img" aria-label="Actividad semanal en accesos generados">
            {stats.weeklyActivity.map((item) => (
              <div key={item.day} className="manager-dashboard-bars__item">
                <div
                  className="manager-dashboard-bars__bar"
                  style={{ height: `${(item.value / maxWeeklyValue) * 100}%` }}
                  title={`${item.value} accesos`}
                />
                <span className="text-muted manager-dashboard-bars__label">{item.day}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card manager-dashboard-toprps">
          <h4 className="manager-dashboard-section-title">Top RPs</h4>
          <div className="manager-dashboard-toprps__list">
            {stats.topRps.map((rp, index) => (
              <div key={rp.name} className="manager-dashboard-toprps__row">
                <div className="manager-dashboard-toprps__head">
                  <strong>
                    {index + 1}. {rp.name}
                  </strong>
                  <span>{rp.generated} gen</span>
                </div>
                <div className="manager-dashboard-toprps__track">
                  <div
                    className="manager-dashboard-toprps__fill"
                    style={{ width: `${(rp.generated / (stats.topRps[0]?.generated || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-muted manager-dashboard-toprps__meta">Asistencia estimada: {rp.attendance}</p>
              </div>
            ))}
            {stats.topRps.length === 0 ? <p className="text-muted">No hay actividad de RPs aun.</p> : null}
          </div>
        </article>
      </section>

      <section className="card manager-dashboard-actions">
        <h4 className="manager-dashboard-section-title">Acciones rapidas</h4>
        <div className="manager-dashboard-actions__list">
          <Link to="events" className="button">
            + Crear evento
          </Link>
          <Link to="rps" className="button button--ghost">
            Gestionar RPs
          </Link>
          <Link to="cuts" className="button button--ghost">
            Ver cortes
          </Link>
        </div>
      </section>
    </div>
  )
}
