import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { managerApi } from '../api'
import { useToast } from '@/components/ToastProvider'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const settingsQuery = useQuery({ queryKey: ['settings', 'otherLabel'], queryFn: managerApi.getOtherLabel })
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (settingsQuery.data) {
      setLabel(settingsQuery.data.otherLabel)
    }
  }, [settingsQuery.data])

  const updateLabel = useMutation({
    mutationFn: () => managerApi.updateOtherLabel(label),
    onSuccess: () => {
      toast.showToast({ title: 'Etiqueta actualizada', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings', 'otherLabel'] })
    },
  })

  return (
    <div>
      <h3>Settings</h3>
      <p>Renombra el tipo de invitado OTHER para reflejar tus necesidades.</p>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          updateLabel.mutate()
        }}
      >
        <label>
          Etiqueta
          <input value={label} onChange={(e) => setLabel(e.target.value)} required />
        </label>
        <button type="submit" disabled={updateLabel.isPending}>
          {updateLabel.isPending ? 'Guardando...' : 'Actualizar'}
        </button>
      </form>
      {settingsQuery.data ? (
        <p style={{ marginTop: '1rem' }}>
          Etiqueta actual: <strong>{settingsQuery.data.otherLabel}</strong>
        </p>
      ) : null}
    </div>
  )
}
