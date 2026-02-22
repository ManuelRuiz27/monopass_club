import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type RpDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import {
  buildWelcomeMessage,
  buildWhatsappShareUrl,
  createUserWithAutoCredentials,
} from '../utils/userCredentials'

const defaultRpForm = { name: 'Nuevo RP' }
const RP_PAGE_SIZE = 12
const RP_ASSIGNMENTS_PAGE_SIZE = 10

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

export function RpsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const [form, setForm] = useState(defaultRpForm)
  const [recentUsernames, setRecentUsernames] = useState<string[]>([])
  const [lastRpInvite, setLastRpInvite] = useState<{
    name: string
    username: string
    password: string
    message: string
  } | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [pendingStatusFilter, setPendingStatusFilter] = useState('')
  const [pendingEventFilter, setPendingEventFilter] = useState('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [limitEditor, setLimitEditor] = useState<{
    rpId: string
    eventId: string
    eventName: string
    limit: string
  } | null>(null)

  const [detailRpId, setDetailRpId] = useState<string | null>(null)
  const [rpsPage, setRpsPage] = useState(0)
  const [assignmentsPage, setAssignmentsPage] = useState(0)

  const takenRpUsernames = useMemo(() => {
    const taken = new Set<string>()
    ;(rpsQuery.data ?? []).forEach((rp) => taken.add(rp.user.username.toLowerCase()))
    recentUsernames.forEach((username) => taken.add(username.toLowerCase()))
    return taken
  }, [recentUsernames, rpsQuery.data])

  const createRp = useMutation({
    mutationFn: async () => {
      const name = form.name.trim()
      if (!name) {
        throw new Error('Escribe el nombre del RP.')
      }

      const loginUrl = `${window.location.origin}/login`
      const { username, password } = await createUserWithAutoCredentials({
        displayName: name,
        takenUsernames: new Set(takenRpUsernames),
        createUser: ({ username: generatedUsername, password: generatedPassword }) =>
          managerApi.createRp({
            name,
            username: generatedUsername,
            password: generatedPassword,
          }),
      })

      return {
        name,
        username,
        password,
        message: buildWelcomeMessage({
          profileName: name,
          username,
          password,
          loginUrl,
          role: 'rp',
        }),
      }
    },
    onSuccess: (invite) => {
      toast.showToast({ title: 'RP creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      setForm(defaultRpForm)
      setRecentUsernames((previous) => [...previous, invite.username])
      setLastRpInvite(invite)
    },
    onError: (error: unknown) => {
      toast.showToast({
        title: 'No se pudo crear el RP',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      })
    },
  })

  const updateRp = useMutation({
    mutationFn: ({ rpId, payload }: { rpId: string; payload: { active?: boolean; name?: string } }) =>
      managerApi.updateRp(rpId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rps'] })
    },
  })

  const updateLimitMutation = useMutation({
    mutationFn: ({ eventId, rpId, limit }: { eventId: string; rpId: string; limit: number | null }) =>
      managerApi.updateAssignmentLimit(eventId, rpId, limit),
    onSuccess: () => {
      toast.showToast({ title: 'Limite actualizado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const handleToggleStatus = (rp: RpDTO) => {
    const message = rp.active ? 'Desactivar este RP impedira que genere accesos. Continuar?' : 'Reactivar RP?'
    if (!window.confirm(message)) return
    updateRp.mutate({ rpId: rp.id, payload: { active: !rp.active } })
  }

  const handleLimitUpdate = () => {
    if (!limitEditor) return
    const raw = limitEditor.limit.trim()
    const nextValue = raw === '' ? null : Number(raw)
    if (nextValue !== null && Number.isNaN(nextValue)) {
      toast.showToast({ title: 'Valor invalido', description: 'Ingresa un numero valido.', variant: 'error' })
      return
    }
    updateLimitMutation.mutate(
      { eventId: limitEditor.eventId, rpId: limitEditor.rpId, limit: nextValue },
      {
        onSuccess: () => {
          setLimitEditor(null)
        },
      },
    )
  }

  const openLimitEditor = (rp: RpDTO, assignment: RpDTO['assignments'][number]) => {
    setLimitEditor({
      rpId: rp.id,
      eventId: assignment.event.id,
      eventName: assignment.event.name,
      limit: assignment.limitAccesses === null ? '' : String(assignment.limitAccesses),
    })
  }

  const filteredRps = useMemo(() => {
    const rps = rpsQuery.data ?? []
    return rps.filter((rp) => {
      const statusMatch =
        statusFilter === '' ||
        (statusFilter === 'active' && rp.active) ||
        (statusFilter === 'inactive' && !rp.active)

      const eventMatch =
        eventFilter === '' ||
        rp.assignments.some((assignment) => assignment.event.id === eventFilter)

      return statusMatch && eventMatch
    })
  }, [eventFilter, rpsQuery.data, statusFilter])

  const hasFilter = Boolean(statusFilter || eventFilter)
  const showFilteredEmpty = rpsQuery.isSuccess && filteredRps.length === 0
  const selectedRp = useMemo(() => filteredRps.find((rp) => rp.id === detailRpId) ?? null, [detailRpId, filteredRps])
  const totalRpsPages = Math.max(1, Math.ceil(filteredRps.length / RP_PAGE_SIZE))
  const safeRpsPage = Math.min(rpsPage, totalRpsPages - 1)
  const pagedRps = useMemo(() => {
    const start = safeRpsPage * RP_PAGE_SIZE
    return filteredRps.slice(start, start + RP_PAGE_SIZE)
  }, [filteredRps, safeRpsPage])
  const totalAssignmentsPages = Math.max(1, Math.ceil((selectedRp?.assignments.length ?? 0) / RP_ASSIGNMENTS_PAGE_SIZE))
  const safeAssignmentsPage = Math.min(assignmentsPage, totalAssignmentsPages - 1)
  const pagedAssignments = useMemo(() => {
    if (!selectedRp) return []
    const start = safeAssignmentsPage * RP_ASSIGNMENTS_PAGE_SIZE
    return selectedRp.assignments.slice(start, start + RP_ASSIGNMENTS_PAGE_SIZE)
  }, [safeAssignmentsPage, selectedRp])
  const canRenderList = rpsQuery.isSuccess

  const resetFilters = () => {
    setStatusFilter('')
    setEventFilter('')
    setRpsPage(0)
  }

  const openFilterSheet = () => {
    setPendingStatusFilter(statusFilter)
    setPendingEventFilter(eventFilter)
    setIsFilterSheetOpen(true)
  }

  const applyPendingFilters = () => {
    setStatusFilter(pendingStatusFilter)
    setEventFilter(pendingEventFilter)
    setRpsPage(0)
    setIsFilterSheetOpen(false)
  }

  const copyInviteMessage = async () => {
    if (!lastRpInvite) return
    try {
      await navigator.clipboard.writeText(lastRpInvite.message)
      toast.showToast({ title: 'Mensaje copiado', variant: 'success' })
    } catch {
      toast.showToast({ title: 'No se pudo copiar el mensaje', variant: 'warning' })
    }
  }

  return (
    <div className="manager-rps-page">
      <header className="manager-rps-page__header">
        <div>
          <h3 className="manager-rps-page__title">Integra a tu equipo a Pass Monkey</h3>
          <p className="text-muted manager-rps-page__subtitle">Administra cuentas RP y sus asignaciones por evento.</p>
        </div>
      </header>

      <section className="card manager-rps-form-card">
        <h4 className="manager-rps-form-card__title">Crear RP</h4>
        <p className="text-muted manager-rps-form-card__subtitle">
          Solo escribe el nombre. El sistema genera usuario y contrasena automaticamente.
        </p>
        <form
          className="form-grid manager-rps-form"
          onSubmit={(event) => {
            event.preventDefault()
            createRp.mutate()
          }}
        >
          <label>
            Nombre
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          </label>
          <Button type="submit" loading={createRp.isPending}>
            {createRp.isPending ? 'Creando...' : 'Crear RP'}
          </Button>
        </form>
        {lastRpInvite ? (
          <div className="manager-credentials-share">
            <p className="manager-credentials-share__title">Mensaje para WhatsApp</p>
            <textarea className="manager-credentials-share__message" value={lastRpInvite.message} readOnly rows={4} />
            <div className="manager-credentials-share__actions">
              <Button type="button" variant="secondary" size="sm" onClick={copyInviteMessage}>
                Copiar mensaje
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => window.open(buildWhatsappShareUrl(lastRpInvite.message), '_blank', 'noopener,noreferrer')}
              >
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="manager-rps-toolbar">
        <div className="manager-rps-toolbar__mobile">
          <Button type="button" variant="secondary" size="sm" onClick={openFilterSheet}>
            Filtrar
          </Button>
          {hasFilter ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="manager-rps-toolbar__desktop">
          <label>
            Estado
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setRpsPage(0)
              }}
            >
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>

          <label>
            Evento
            <select
              value={eventFilter}
              onChange={(event) => {
                setEventFilter(event.target.value)
                setRpsPage(0)
              }}
            >
              <option value="">Todos</option>
              {eventsQuery.data?.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </section>

      {rpsQuery.isLoading ? <PageLoadingState message="Cargando RPs..." /> : null}
      {rpsQuery.error ? <PageErrorState description="Error al consultar RPs." /> : null}

      {showFilteredEmpty ? (
        <CardEmptyState
          title="No hay RPs para este filtro"
          description="Ajusta estado o evento para encontrar resultados."
          actionLabel="Limpiar filtros"
          onAction={resetFilters}
        />
      ) : null}

      {canRenderList && !showFilteredEmpty ? (
        <>
          <div className="manager-rps-table-wrap">
            <table className="manager-rps-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Estado</th>
                  <th>Eventos</th>
                  <th>Generados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagedRps.map((rp) => (
                  <tr key={rp.id}>
                    <td>{rp.user.name}</td>
                    <td>{rp.user.username}</td>
                    <td>
                      <span className={`badge ${rp.active ? 'badge--success' : 'badge--danger'}`}>
                        {rp.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{rp.assignments.length}</td>
                    <td>{rp.assignments.reduce((sum, assignment) => sum + assignment.usedAccesses, 0)}</td>
                    <td>
                      <div className="manager-rps-actions">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setAssignmentsPage(0)
                            setDetailRpId(rp.id)
                          }}
                        >
                          Ver asignaciones
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleStatus(rp)}>
                          {rp.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="manager-rps-mobile-list">
            {pagedRps.map((rp) => (
              <article key={`mobile-${rp.id}`} className="card manager-rps-mobile-card">
                <header className="manager-rps-mobile-card__header">
                  <div>
                    <h4 className="manager-rps-mobile-card__title">{rp.user.name}</h4>
                    <p className="text-muted manager-rps-mobile-card__username">{rp.user.username}</p>
                  </div>
                  <span className={`badge ${rp.active ? 'badge--success' : 'badge--danger'}`}>
                    {rp.active ? 'Activo' : 'Inactivo'}
                  </span>
                </header>

                <div className="stats-row manager-rps-mobile-card__stats">
                  <div>
                    <strong>{rp.assignments.length}</strong>
                    <span>Eventos</span>
                  </div>
                  <div>
                    <strong>{rp.assignments.reduce((sum, assignment) => sum + assignment.usedAccesses, 0)}</strong>
                    <span>Generados</span>
                  </div>
                </div>

                <div className="manager-rps-actions manager-rps-actions--mobile">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setAssignmentsPage(0)
                      setDetailRpId(rp.id)
                    }}
                  >
                    Ver asignaciones
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleStatus(rp)}>
                    {rp.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {filteredRps.length > RP_PAGE_SIZE ? (
            <div className="manager-rps-pagination">
              <p className="text-muted">
                Mostrando {safeRpsPage * RP_PAGE_SIZE + 1}-{Math.min((safeRpsPage + 1) * RP_PAGE_SIZE, filteredRps.length)} de {filteredRps.length} RPs
              </p>
              <div className="manager-rps-pagination__actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={safeRpsPage === 0}
                  onClick={() => setRpsPage((current) => Math.max(0, current - 1))}
                >
                  Anterior
                </Button>
                <span className="text-muted">
                  Pagina {safeRpsPage + 1} / {totalRpsPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={safeRpsPage >= totalRpsPages - 1}
                  onClick={() => setRpsPage((current) => Math.min(totalRpsPages - 1, current + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {selectedRp ? (
        <section className="card manager-rps-detail">
          <header className="manager-rps-detail__header">
            <div>
              <h4 className="manager-rps-detail__title">Asignaciones de {selectedRp.user.name}</h4>
              <p className="text-muted manager-rps-detail__subtitle">Ajusta limites por evento y revisa accesos generados.</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDetailRpId(null)}>
              Cerrar
            </Button>
          </header>

          {selectedRp.assignments.length === 0 ? (
            <p className="text-muted">Aun no tiene eventos asignados.</p>
          ) : (
            <>
              <div className="manager-rps-detail-table-wrap">
                <table className="manager-rps-detail-table">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Generados</th>
                      <th>Limite</th>
                      <th>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>{assignment.event.name}</td>
                        <td>{formatDate(assignment.event.startsAt)}</td>
                        <td>
                          <span className={`badge ${assignment.event.active ? 'badge--success' : 'badge--warning'}`}>
                            {assignment.event.active ? 'Activo' : 'Cerrado'}
                          </span>
                        </td>
                        <td>{assignment.usedAccesses}</td>
                        <td>{assignment.limitAccesses ?? 'Sin limite'}</td>
                        <td>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={updateLimitMutation.isPending}
                            onClick={() => openLimitEditor(selectedRp, assignment)}
                          >
                            Ajustar limite
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="manager-rps-detail-mobile-list">
                {pagedAssignments.map((assignment) => (
                  <article key={`mobile-${assignment.id}`} className="panel manager-rps-detail-mobile-item">
                    <header className="manager-rps-detail-mobile-item__header">
                      <strong>{assignment.event.name}</strong>
                      <span className={`badge ${assignment.event.active ? 'badge--success' : 'badge--warning'}`}>
                        {assignment.event.active ? 'Activo' : 'Cerrado'}
                      </span>
                    </header>
                    <p className="text-muted">Fecha: {formatDate(assignment.event.startsAt)}</p>
                    <p className="text-muted">Generados: {assignment.usedAccesses}</p>
                    <p className="text-muted">Limite: {assignment.limitAccesses ?? 'Sin limite'}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={updateLimitMutation.isPending}
                      onClick={() => openLimitEditor(selectedRp, assignment)}
                    >
                      Ajustar limite
                    </Button>
                  </article>
                ))}
              </div>
              {selectedRp.assignments.length > RP_ASSIGNMENTS_PAGE_SIZE ? (
                <div className="manager-rps-pagination manager-rps-pagination--detail">
                  <p className="text-muted">
                    Mostrando {safeAssignmentsPage * RP_ASSIGNMENTS_PAGE_SIZE + 1}-
                    {Math.min((safeAssignmentsPage + 1) * RP_ASSIGNMENTS_PAGE_SIZE, selectedRp.assignments.length)} de {selectedRp.assignments.length}{' '}
                    asignaciones
                  </p>
                  <div className="manager-rps-pagination__actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={safeAssignmentsPage === 0}
                      onClick={() => setAssignmentsPage((current) => Math.max(0, current - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="text-muted">
                      Pagina {safeAssignmentsPage + 1} / {totalAssignmentsPages}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={safeAssignmentsPage >= totalAssignmentsPages - 1}
                      onClick={() => setAssignmentsPage((current) => Math.min(totalAssignmentsPages - 1, current + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar RPs"
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
        <div className="form-grid manager-rps-sheet">
          <label>
            Estado
            <select value={pendingStatusFilter} onChange={(event) => setPendingStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>

          <label>
            Evento
            <select value={pendingEventFilter} onChange={(event) => setPendingEventFilter(event.target.value)}>
              <option value="">Todos</option>
              {eventsQuery.data?.map((event) => (
                <option key={`sheet-event-${event.id}`} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingStatusFilter('')
              setPendingEventFilter('')
              resetFilters()
              setIsFilterSheetOpen(false)
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(limitEditor)}
        onClose={() => setLimitEditor(null)}
        title="Ajustar limite"
        actions={
          <>
          <Button type="button" variant="secondary" onClick={() => setLimitEditor(null)}>
            Cancelar
          </Button>
            <Button type="button" loading={updateLimitMutation.isPending} onClick={handleLimitUpdate}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="form-grid manager-rps-sheet">
          <label>
            Evento
            <input value={limitEditor?.eventName ?? ''} disabled />
          </label>
          <label>
            Limite de accesos
            <input
              type="number"
              min={0}
              value={limitEditor?.limit ?? ''}
              onChange={(event) => setLimitEditor((prev) => (prev ? { ...prev, limit: event.target.value } : null))}
              placeholder="Sin limite si queda vacio"
            />
          </label>
        </div>
      </BottomSheet>
    </div>
  )
}
