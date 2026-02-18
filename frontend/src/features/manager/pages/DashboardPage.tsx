import { Link } from 'react-router-dom'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { managerApi } from '../api'
import { PageErrorState, PageLoadingState } from '@/components/ui'
import { useGsapCountUp } from '@/lib/motion/useGsapCountUp'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

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
  const pageRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const safeStats: DashboardStats = stats ?? {
    activeEventsToday: 0,
    totalTicketsGenerated: 0,
    totalTicketsScanned: 0,
    activeRps: 0,
    activeScanners: 0,
    topRps: [],
    weeklyActivity: [],
  }

  const conversionRate =
    safeStats.totalTicketsGenerated > 0
      ? Math.round((safeStats.totalTicketsScanned / safeStats.totalTicketsGenerated) * 100)
      : 0

  const maxWeeklyValue = Math.max(...safeStats.weeklyActivity.map((item) => item.value), 1)

  const kpis = [
    { label: 'Eventos hoy', value: safeStats.activeEventsToday, tone: 'primary' },
    { label: 'Generados', value: safeStats.totalTicketsGenerated, tone: 'success' },
    { label: 'Confirmados', value: safeStats.totalTicketsScanned, tone: 'info' },
    { label: 'Asistencia', value: conversionRate, suffix: '%', tone: 'default' },
    { label: 'RPs activos', value: safeStats.activeRps, tone: 'default' },
    { label: 'Scanners activos', value: safeStats.activeScanners, tone: 'default' },
  ]

  const dashboardMotionKey = [
    safeStats.activeEventsToday,
    safeStats.totalTicketsGenerated,
    safeStats.totalTicketsScanned,
    conversionRate,
    safeStats.activeRps,
    safeStats.activeScanners,
    safeStats.weeklyActivity.map((entry) => entry.value).join(','),
    safeStats.topRps.map((entry) => entry.generated).join(','),
    isLoading ? 'loading' : 'ready',
    error ? 'error' : 'ok',
  ].join('|')

  useGsapCountUp(pageRef, '.manager-dashboard-kpi__value[data-count-target]', dashboardMotionKey)

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = pageRef.current
    if (!scope) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .fromTo(
          '.manager-dashboard-page__header',
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.24, clearProps: 'opacity,transform' },
        )
        .fromTo(
          '.manager-dashboard-kpi',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.05, clearProps: 'opacity,transform' },
          '-=0.08',
        )
        .fromTo(
          '.manager-dashboard-chart, .manager-dashboard-toprps, .manager-dashboard-actions',
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.07, clearProps: 'opacity,transform' },
          '-=0.12',
        )

      const bars = gsap.utils.toArray<HTMLElement>('.manager-dashboard-bars__bar', scope)
      if (bars.length > 0) {
        gsap.fromTo(
          bars,
          { scaleY: 0, transformOrigin: 'bottom' },
          { scaleY: 1, duration: 0.44, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' },
        )
      }

      const fills = gsap.utils.toArray<HTMLElement>('.manager-dashboard-toprps__fill', scope)
      if (fills.length > 0) {
        gsap.fromTo(
          fills,
          { scaleX: 0, transformOrigin: 'left' },
          { scaleX: 1, duration: 0.42, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' },
        )
      }
    }, scope)

    return () => context.revert()
  }, [dashboardMotionKey, prefersReducedMotion])

  if (isLoading) {
    return <PageLoadingState message="Cargando dashboard..." />
  }

  if (error || !stats) {
    return <PageErrorState description="No pudimos obtener los datos del dashboard." />
  }

  return (
    <div ref={pageRef} className="manager-dashboard-page">
      <header className="manager-dashboard-page__header">
        <h3 className="manager-dashboard-page__title">Dashboard</h3>
      </header>

      <section className="manager-dashboard-kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`card manager-dashboard-kpi manager-dashboard-kpi--${kpi.tone}`}>
            <p className="text-muted">{kpi.label}</p>
            <strong className="manager-dashboard-kpi__value" data-count-target={kpi.value} data-count-suffix={kpi.suffix ?? ''}>
              {kpi.value}
              {kpi.suffix ?? ''}
            </strong>
          </article>
        ))}
      </section>

      <section className="manager-dashboard-grid">
        <article className="card manager-dashboard-chart">
          <h4 className="manager-dashboard-section-title">Actividad semanal</h4>
          <div className="manager-dashboard-bars" role="img" aria-label="Actividad semanal en accesos generados">
            {safeStats.weeklyActivity.map((item) => (
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
            {safeStats.topRps.map((rp, index) => (
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
                    style={{ width: `${(rp.generated / (safeStats.topRps[0]?.generated || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-muted manager-dashboard-toprps__meta">Asistencia estimada: {rp.attendance}</p>
              </div>
            ))}
            {safeStats.topRps.length === 0 ? <p className="text-muted">No hay actividad de RPs aun.</p> : null}
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
