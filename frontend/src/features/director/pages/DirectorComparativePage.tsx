import { useMemo, useState } from 'react'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useDirectorData } from '../useDirectorData'

type SortKey = 'generated' | 'scanned' | 'conversion' | 'pending'

const DEFAULT_SORT: SortKey = 'generated'

export function DirectorComparativePage() {
  const { data, isLoading, error } = useDirectorData()
  const [sortBy, setSortBy] = useState<SortKey>(DEFAULT_SORT)
  const [activeOnly, setActiveOnly] = useState(false)

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pendingSortBy, setPendingSortBy] = useState<SortKey>(DEFAULT_SORT)
  const [pendingActiveOnly, setPendingActiveOnly] = useState(false)

  const rows = useMemo(() => {
    if (!data) return []
    const filtered = activeOnly ? data.byClub.filter((club) => club.clubActive) : data.byClub
    return [...filtered].sort((a, b) => b[sortBy] - a[sortBy])
  }, [activeOnly, data, sortBy])

  const hasFilter = activeOnly || sortBy !== DEFAULT_SORT

  const resetFilters = () => {
    setSortBy(DEFAULT_SORT)
    setActiveOnly(false)
  }

  const openFilterSheet = () => {
    setPendingSortBy(sortBy)
    setPendingActiveOnly(activeOnly)
    setIsFilterSheetOpen(true)
  }

  const applyPendingFilters = () => {
    setSortBy(pendingSortBy)
    setActiveOnly(pendingActiveOnly)
    setIsFilterSheetOpen(false)
  }

  if (isLoading) {
    return <PageLoadingState message="Cargando comparativo..." />
  }

  if (error || !data) {
    return <PageErrorState description="No se pudo cargar el comparativo de clubs." />
  }

  return (
    <div className="director-page director-comparative-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Comparativo</h3>
          <p className="text-muted director-page__subtitle">Compara desempeno operativo entre clubs.</p>
        </div>
      </header>

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
            Ordenar por
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
              <option value="generated">Generados</option>
              <option value="scanned">Escaneados</option>
              <option value="conversion">Conversion</option>
              <option value="pending">Pendientes</option>
            </select>
          </label>

          <Button
            type="button"
            variant={activeOnly ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveOnly((current) => !current)}
          >
            {activeOnly ? 'Mostrando activos' : 'Mostrar solo activos'}
          </Button>

          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </section>

      {rows.length === 0 ? (
        <CardEmptyState
          title="No hay datos para este filtro"
          description="Ajusta la vista para ver mas resultados."
          actionLabel="Limpiar filtro"
          onAction={resetFilters}
        />
      ) : (
        <>
          <div className="director-table-wrap director-comparative-table-wrap">
            <table className="director-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Eventos</th>
                  <th>RPs</th>
                  <th>Generados</th>
                  <th>Escaneados</th>
                  <th>Pendientes</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((club) => (
                  <tr key={club.clubId}>
                    <td>{club.clubName}</td>
                    <td>{club.events}</td>
                    <td>{club.activeRps}</td>
                    <td>{club.generated}</td>
                    <td>{club.scanned}</td>
                    <td>{club.pending}</td>
                    <td>{club.conversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="director-mobile-list">
            {rows.map((club) => (
              <article key={`mobile-${club.clubId}`} className="card director-mobile-card">
                <header className="director-mobile-card__header">
                  <h4 className="director-mobile-card__title">{club.clubName}</h4>
                  <span className="badge">{club.conversion}%</span>
                </header>
                <div className="stats-row director-mobile-card__stats">
                  <div>
                    <strong>{club.generated}</strong>
                    <span>Generados</span>
                  </div>
                  <div>
                    <strong>{club.scanned}</strong>
                    <span>Escaneados</span>
                  </div>
                  <div>
                    <strong>{club.pending}</strong>
                    <span>Pendientes</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar comparativo"
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
            Ordenar por
            <select value={pendingSortBy} onChange={(event) => setPendingSortBy(event.target.value as SortKey)}>
              <option value="generated">Generados</option>
              <option value="scanned">Escaneados</option>
              <option value="conversion">Conversion</option>
              <option value="pending">Pendientes</option>
            </select>
          </label>

          <label className="director-sheet__toggle">
            <input
              type="checkbox"
              checked={pendingActiveOnly}
              onChange={(event) => setPendingActiveOnly(event.target.checked)}
            />
            <span>Solo clubs activos</span>
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingSortBy(DEFAULT_SORT)
              setPendingActiveOnly(false)
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
