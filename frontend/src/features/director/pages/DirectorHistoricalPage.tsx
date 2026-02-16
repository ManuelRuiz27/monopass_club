import { useMemo } from 'react'
import { useDirectorData } from '../useDirectorData'
import { PageErrorState, PageLoadingState } from '@/components/ui'

export function DirectorHistoricalPage() {
  const { data, isLoading, error } = useDirectorData()

  const trend = useMemo(() => {
    if (!data) return []

    const eventMonthById = new Map<string, string>()
    const generatedByMonth = new Map<string, number>()
    const scannedByMonth = new Map<string, number>()

    for (const event of data.events) {
      const month = event.startsAt.slice(0, 7)
      eventMonthById.set(event.id, month)
      const generated = event.assignments.reduce((sum, assignment) => sum + assignment.usedAccesses, 0)
      generatedByMonth.set(month, (generatedByMonth.get(month) ?? 0) + generated)
    }

    for (const cutEvent of data.cutEvents) {
      const month = eventMonthById.get(cutEvent.eventId)
      if (!month) continue
      scannedByMonth.set(month, (scannedByMonth.get(month) ?? 0) + cutEvent.total)
    }

    const months = Array.from(new Set([...generatedByMonth.keys(), ...scannedByMonth.keys()])).sort()

    return months.slice(-8).map((month) => {
      const generated = generatedByMonth.get(month) ?? 0
      const scanned = scannedByMonth.get(month) ?? 0
      return {
        month,
        generated,
        scanned,
        conversion: generated > 0 ? Math.round((scanned / generated) * 100) : 0,
      }
    })
  }, [data])

  if (isLoading) {
    return <PageLoadingState message="Cargando historicas..." />
  }

  if (error || !data) {
    return <PageErrorState description="No se pudieron cargar las metricas historicas." />
  }

  const maxValue = Math.max(...trend.map((item) => Math.max(item.generated, item.scanned)), 1)

  return (
    <div className="director-page director-historical-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Historicas</h3>
          <p className="text-muted director-page__subtitle">Evolucion mensual de generacion y asistencia.</p>
        </div>
      </header>

      <section className="card director-history-chart">
        <h4 className="director-section-title">Tendencia mensual</h4>
        <p className="text-muted director-history-chart__legend">Generados (azul) vs escaneados (verde)</p>
        <div className="director-history-bars" role="img" aria-label="Comparativo mensual generado vs escaneado">
          {trend.map((item) => (
            <article key={item.month} className="director-history-bars__item">
              <div className="director-history-bars__group">
                <div
                  className="director-history-bars__bar director-history-bars__bar--generated"
                  style={{ height: `${(item.generated / maxValue) * 100}%` }}
                  title={`Generados ${item.generated}`}
                />
                <div
                  className="director-history-bars__bar director-history-bars__bar--scanned"
                  style={{ height: `${(item.scanned / maxValue) * 100}%` }}
                  title={`Escaneados ${item.scanned}`}
                />
              </div>
              <p className="text-muted director-history-bars__label">{item.month}</p>
              <p className="text-muted director-history-bars__meta">{item.conversion}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="director-grid">
        <article className="card">
          <h4 className="director-section-title">Resumen ultimo periodo</h4>
          {trend.length === 0 ? (
            <p className="text-muted">No hay datos historicos para mostrar.</p>
          ) : (
            <div className="director-history-summary">
              {trend.slice(-3).map((item) => (
                <div key={`summary-${item.month}`} className="panel">
                  <strong>{item.month}</strong>
                  <p className="text-muted">Generados: {item.generated}</p>
                  <p className="text-muted">Escaneados: {item.scanned}</p>
                  <p className="text-muted">Conversion: {item.conversion}%</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card">
          <h4 className="director-section-title">Referencia</h4>
          <p className="text-muted">Generados representa accesos emitidos por evento.</p>
          <p className="text-muted">Escaneados refleja confirmaciones de ingreso en cortes.</p>
          <p className="text-muted">Conversion compara escaneados sobre generados por periodo.</p>
        </article>
      </section>
    </div>
  )
}
