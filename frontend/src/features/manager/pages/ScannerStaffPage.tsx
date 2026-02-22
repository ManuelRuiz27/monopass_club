import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ScannerDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import {
  buildWelcomeMessage,
  buildWhatsappShareUrl,
  createUserWithAutoCredentials,
} from '../utils/userCredentials'

const defaultForm = { name: '' }
function formatLastScan(value: string | null) {
  if (!value) return 'Sin registros'
  return new Date(value).toLocaleString()
}

export function ScannerStaffPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const scannersQuery = useQuery({ queryKey: ['scanners'], queryFn: managerApi.getScanners })
  const [form, setForm] = useState(defaultForm)
  const [recentUsernames, setRecentUsernames] = useState<string[]>([])
  const [lastScannerInvite, setLastScannerInvite] = useState<{
    name: string
    username: string
    password: string
    message: string
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingStatusFilter, setPendingStatusFilter] = useState('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const takenScannerUsernames = useMemo(() => {
    const taken = new Set<string>()
    ;(scannersQuery.data ?? []).forEach((scanner) => taken.add(scanner.user.username.toLowerCase()))
    recentUsernames.forEach((username) => taken.add(username.toLowerCase()))
    return taken
  }, [recentUsernames, scannersQuery.data])

  const createScanner = useMutation({
    mutationFn: async () => {
      const name = form.name.trim()
      if (!name) {
        throw new Error('Escribe el nombre del scanner.')
      }
      const loginUrl = `${window.location.origin}/login`
      const { username, password } = await createUserWithAutoCredentials({
        displayName: name,
        takenUsernames: new Set(takenScannerUsernames),
        createUser: ({ username: generatedUsername, password: generatedPassword }) =>
          managerApi.createScanner({
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
          role: 'scanner',
        }),
      }
    },
    onSuccess: (invite) => {
      toast.showToast({ title: 'Scanner creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['scanners'] })
      setForm(defaultForm)
      setRecentUsernames((previous) => [...previous, invite.username])
      setLastScannerInvite(invite)
    },
    onError: (error: unknown) => {
      toast.showToast({
        title: 'No se pudo crear el scanner',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      })
    },
  })

  const updateScanner = useMutation({
    mutationFn: ({ scannerId, payload }: { scannerId: string; payload: { active?: boolean; name?: string } }) =>
      managerApi.updateScanner(scannerId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scanners'] }),
  })

  const handleToggle = (scanner: ScannerDTO) => {
    const message = scanner.active ? 'Desactivar scanner impedira validar QR. Continuar?' : 'Activar scanner?'
    if (!window.confirm(message)) return
    updateScanner.mutate({ scannerId: scanner.id, payload: { active: !scanner.active } })
  }

  const filteredScanners = useMemo(() => {
    const scanners = scannersQuery.data ?? []
    if (statusFilter === 'active') return scanners.filter((scanner) => scanner.active)
    if (statusFilter === 'inactive') return scanners.filter((scanner) => !scanner.active)
    return scanners
  }, [scannersQuery.data, statusFilter])

  const hasFilter = Boolean(statusFilter)
  const showEmpty = scannersQuery.isSuccess && filteredScanners.length === 0
  const canRenderList = scannersQuery.isSuccess

  const copyInviteMessage = async () => {
    if (!lastScannerInvite) return
    try {
      await navigator.clipboard.writeText(lastScannerInvite.message)
      toast.showToast({ title: 'Mensaje copiado', variant: 'success' })
    } catch {
      toast.showToast({ title: 'No se pudo copiar el mensaje', variant: 'warning' })
    }
  }

  return (
    <div className="manager-scanners-page">
      <header className="manager-scanners-page__header">
        <div>
          <h3 className="manager-scanners-page__title">Staff Scanner</h3>
        </div>
      </header>

      <section className="card manager-scanners-create">
        <h4 className="manager-scanners-create__title">Crear miembro de staff</h4>
        <form
          className="form-grid manager-scanners-form"
          onSubmit={(event) => {
            event.preventDefault()
            createScanner.mutate()
          }}
        >
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ej. Puerta Norte"
              required
            />
          </label>
          <Button type="submit" loading={createScanner.isPending}>
            {createScanner.isPending ? 'Creando...' : 'Crear scanner'}
          </Button>
        </form>
        {lastScannerInvite ? (
          <div className="manager-credentials-share">
            <p className="manager-credentials-share__title">Mensaje para WhatsApp</p>
            <textarea className="manager-credentials-share__message" value={lastScannerInvite.message} readOnly rows={4} />
            <div className="manager-credentials-share__actions">
              <Button type="button" variant="secondary" size="sm" onClick={copyInviteMessage}>
                Copiar mensaje
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => window.open(buildWhatsappShareUrl(lastScannerInvite.message), '_blank', 'noopener,noreferrer')}
              >
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="manager-scanners-toolbar">
        <div className="manager-scanners-toolbar__mobile">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setPendingStatusFilter(statusFilter)
              setIsFilterSheetOpen(true)
            }}
          >
            Filtrar
          </Button>
          {hasFilter ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="manager-scanners-toolbar__desktop">
          <label>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
            Limpiar filtros
          </Button>
        </div>
      </section>

      {scannersQuery.isLoading ? <PageLoadingState message="Cargando scanners..." /> : null}
      {scannersQuery.error ? <PageErrorState description="No se pudo cargar el staff." /> : null}

      {showEmpty ? (
        <CardEmptyState
          title="No hay scanners para este filtro"
          description="Ajusta el estado o limpia la busqueda para ver todo el staff."
          actionLabel="Limpiar filtros"
          onAction={() => setStatusFilter('')}
        />
      ) : null}

      {canRenderList && !showEmpty ? (
        <>
          <div className="manager-scanners-table-wrap">
            <table className="manager-scanners-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Estado</th>
                  <th>Ultima actividad</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filteredScanners.map((scanner) => (
                  <tr key={scanner.id}>
                    <td>{scanner.user.name}</td>
                    <td>{scanner.user.username}</td>
                    <td>
                      <span className={`badge ${scanner.active ? 'badge--success' : 'badge--danger'}`}>
                        {scanner.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{formatLastScan(scanner.lastScanAt)}</td>
                    <td>
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleToggle(scanner)}>
                        {scanner.active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="manager-scanners-mobile-list">
            {filteredScanners.map((scanner) => (
              <article key={`mobile-${scanner.id}`} className="card manager-scanners-mobile-card">
                <header className="manager-scanners-mobile-card__header">
                  <div>
                    <h4 className="manager-scanners-mobile-card__title">{scanner.user.name}</h4>
                    <p className="text-muted manager-scanners-mobile-card__username">{scanner.user.username}</p>
                  </div>
                  <span className={`badge ${scanner.active ? 'badge--success' : 'badge--danger'}`}>
                    {scanner.active ? 'Activo' : 'Inactivo'}
                  </span>
                </header>
                <p className="text-muted manager-scanners-mobile-card__last-scan">Ultima actividad: {formatLastScan(scanner.lastScanAt)}</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => handleToggle(scanner)}>
                  {scanner.active ? 'Desactivar' : 'Activar'}
                </Button>
              </article>
            ))}
          </div>
        </>
      ) : null}

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar scanners"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setStatusFilter(pendingStatusFilter)
                setIsFilterSheetOpen(false)
              }}
            >
              Aplicar
            </Button>
          </>
        }
      >
        <div className="form-grid manager-scanners-sheet">
          <label>
            Estado
            <select value={pendingStatusFilter} onChange={(event) => setPendingStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingStatusFilter('')
              setStatusFilter('')
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
