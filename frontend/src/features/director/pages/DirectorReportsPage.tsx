import { Button, PageErrorState, PageLoadingState } from '@/components/ui'
import { useDirectorData } from '../useDirectorData'

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
    .join(',')
}

export function DirectorReportsPage() {
  const { data, isLoading, error } = useDirectorData()

  if (isLoading) {
    return <PageLoadingState message="Cargando reportes..." />
  }

  if (error || !data) {
    return <PageErrorState description="No se pudieron preparar los reportes." />
  }

  const exportClubsCsv = () => {
    const header = toCsvRow(['Club', 'Eventos', 'RPs Activos', 'Generados', 'Escaneados', 'Pendientes', 'Conversion'])
    const rows = data.byClub.map((club) =>
      toCsvRow([club.clubName, club.events, club.activeRps, club.generated, club.scanned, club.pending, `${club.conversion}%`]),
    )
    downloadFile('director_clubs_report.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8')
  }

  const exportSummaryJson = () => {
    downloadFile('director_summary.json', JSON.stringify(data.overview, null, 2), 'application/json;charset=utf-8')
  }

  const exportAlertsCsv = () => {
    const header = toCsvRow(['Nivel', 'Titulo', 'Descripcion'])
    const rows = data.alerts.map((alert) => toCsvRow([alert.level, alert.title, alert.description]))
    downloadFile('director_alerts.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8')
  }

  return (
    <div className="director-page director-reports-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Reportes</h3>
          <p className="text-muted director-page__subtitle">Exportes ejecutivos para seguimiento y reuniones.</p>
        </div>
      </header>

      <section className="director-grid">
        <article className="card director-report-card">
          <h4 className="director-section-title">Resumen ejecutivo</h4>
          <p className="text-muted">Incluye estado global de clubs, eventos, RPs, scanners y conversion total.</p>
          <Button type="button" variant="secondary" className="director-report-card__action" onClick={exportSummaryJson}>
            Exportar JSON resumen
          </Button>
        </article>

        <article className="card director-report-card">
          <h4 className="director-section-title">Comparativo de clubs</h4>
          <p className="text-muted">Totales por club: generados, escaneados, pendientes y conversion.</p>
          <Button type="button" variant="secondary" className="director-report-card__action" onClick={exportClubsCsv}>
            Exportar CSV clubs
          </Button>
        </article>

        <article className="card director-report-card">
          <h4 className="director-section-title">Alertas operativas</h4>
          <p className="text-muted">Lista de alertas para seguimiento semanal de operacion.</p>
          <Button type="button" variant="secondary" className="director-report-card__action" onClick={exportAlertsCsv}>
            Exportar CSV alertas
          </Button>
        </article>
      </section>

      <section className="card director-report-preview">
        <h4 className="director-section-title">Vista previa</h4>
        <p className="text-muted">Clubs analizados: {data.byClub.length}</p>
        <p className="text-muted">Alertas activas: {data.alerts.length}</p>
        <p className="text-muted">Conversion global: {data.overview.conversion}%</p>
      </section>
    </div>
  )
}
