import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'

type DashboardStats = {
  activeEventsToday: number
  totalTicketsGenerated: number
  totalTicketsScanned: number
  activeRps: number
  activeScanners: number
  topRps: Array<{ name: string; Generated: number; Attendance: number }>
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

    // Top RPs calculation
    const topRps = rpsQuery.data
      ?.map((rp) => ({
        name: rp.user.name,
        Generated: rp.assignments.reduce((sum, a) => sum + a.usedAccesses, 0),
        // Simulating attendance as aprox 60-80% of generated for this demo
        Attendance: Math.round(rp.assignments.reduce((sum, a) => sum + a.usedAccesses, 0) * 0.7),
      }))
      .sort((a, b) => b.Generated - a.Generated)
      .slice(0, 5) ?? []

    // Total tickets
    const totalTicketsGenerated = topRps.reduce((sum, rp) => sum + rp.Generated, 0)
    const totalTicketsScanned = cutsQuery.data?.total ?? 0

    // Simulated Weekly Activity (last 7 days)
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => ({
      day: days[i],
      value: 100 + i * 10, // Deterministic for now to avoid randomness lint error
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
  }, [
    isLoading,
    error,
    eventsQuery.data,
    rpsQuery.data,
    scannersQuery.data,
    cutsQuery.data,
  ])
}

export function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <section className="page-placeholder">
        <p className="text-muted">Cargando dashboard...</p>
      </section>
    )
  }

  if (error || !stats) {
    return (
      <section className="page-placeholder">
        <h2>Error al cargar</h2>
        <p className="text-danger">No pudimos obtener los datos del dashboard.</p>
      </section>
    )
  }

  const conversionRate =
    stats.totalTicketsGenerated > 0
      ? Math.round((stats.totalTicketsScanned / stats.totalTicketsGenerated) * 100)
      : 0

  const maxWeeklyValue = Math.max(...stats.weeklyActivity.map(d => d.value))

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Dashboard</h3>

      {/* KPI Cards */}
      <div className="card-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <article className="card">
          <div className="stats-row">
            <div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}>
                {stats.activeEventsToday}
              </strong>
              <span style={{ fontSize: '0.8rem' }}>Eventos hoy</span>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="stats-row">
            <div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--color-success)' }}>
                {stats.totalTicketsGenerated}
              </strong>
              <span style={{ fontSize: '0.8rem' }}>Generados</span>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="stats-row">
            <div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--color-info)' }}>
                {stats.totalTicketsScanned}
              </strong>
              <span style={{ fontSize: '0.8rem' }}>Confirmados</span>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="stats-row">
            <div>
              <strong style={{ fontSize: '1.75rem' }}>{conversionRate}%</strong>
              <span style={{ fontSize: '0.8rem' }}>Asistencia</span>
            </div>
          </div>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Weekly Activity Chart */}
        <section className="card">
          <h4 style={{ marginTop: 0 }}>Actividad Semanal</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', marginTop: '1rem', gap: '0.5rem' }}>
            {stats.weeklyActivity.map((d) => (
              <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '100%',
                    background: 'var(--primary-soft)',
                    height: `${(d.value / maxWeeklyValue) * 100}%`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: '4px'
                  }}
                  title={`${d.value} accesos`}
                />
                <span className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top RPs Table */}
        <section className="card">
          <h4 style={{ marginTop: 0 }}>Top RPs</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {stats.topRps.map((rp, i) => (
              <div key={rp.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <strong>{i + 1}. {rp.name}</strong>
                  <span>{rp.Generated} gen</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(rp.Generated / (stats.topRps[0]?.Generated || 1)) * 100}%`,
                      height: '100%',
                      background: 'var(--color-success)',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            ))}
            {stats.topRps.length === 0 && <p className="text-muted">No hay actividad de RPs aún.</p>}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="card">
        <h4 style={{ marginTop: 0 }}>Acciones rápidas</h4>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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