import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { managerApi } from '../api'
import { useToast } from '@/components/ToastProvider'
import { Button } from '@/components/ui'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const settingsQuery = useQuery({ queryKey: ['settings', 'otherLabel'], queryFn: managerApi.getOtherLabel })
  const [label, setLabel] = useState<string | null>(null)
  const currentLabel = label ?? settingsQuery.data?.otherLabel ?? ''

  const updateLabel = useMutation({
    mutationFn: () => managerApi.updateOtherLabel(currentLabel),
    onSuccess: () => {
      toast.showToast({ title: 'Etiqueta actualizada', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings', 'otherLabel'] })
    },
  })

  return (
    <div className="manager-settings-page">
      <header className="manager-settings-page__header">
        <h3 className="manager-settings-page__title">Configuracion</h3>
        <p className="text-muted manager-settings-page__subtitle">
          Renombra el tipo de invitado OTHER para reflejar tus necesidades.
        </p>
      </header>

      <section className="card manager-settings-card">
        <form
          className="form-grid manager-settings-form"
          onSubmit={(event) => {
            event.preventDefault()
            updateLabel.mutate()
          }}
        >
          <label>
            Etiqueta
            <input value={currentLabel} onChange={(event) => setLabel(event.target.value)} required />
          </label>

          <Button type="submit" loading={updateLabel.isPending}>
            {updateLabel.isPending ? 'Guardando...' : 'Actualizar'}
          </Button>
        </form>

        {settingsQuery.data ? (
          <p className="manager-settings-card__current text-muted">
            Etiqueta actual: <strong>{settingsQuery.data.otherLabel}</strong>
          </p>
        ) : null}
      </section>
    </div>
  )
}
