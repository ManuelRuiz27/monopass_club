import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { managerApi } from '../api'

export function TemplatePage() {
  const queryClient = useQueryClient()
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const [selection, setSelection] = useState({
    eventId: '',
    templateImageUrl: '',
    qrPositionX: 0.5,
    qrPositionY: 0.5,
    qrSize: 0.4,
  })

  const updateTemplate = useMutation({
    mutationFn: () =>
      managerApi.updateTemplate(selection.eventId, {
        templateImageUrl: selection.templateImageUrl || null,
        qrPositionX: selection.qrPositionX,
        qrPositionY: selection.qrPositionY,
        qrSize: selection.qrSize,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  return (
    <div>
      <h3>Plantilla / QR</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          updateTemplate.mutate()
        }}
      >
        <label>
          Evento
          <select
            value={selection.eventId}
            onChange={(e) => setSelection((prev) => ({ ...prev, eventId: e.target.value }))}
            required
          >
            <option value="" disabled>
              Selecciona evento
            </option>
            {eventsQuery.data?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          URL imagen base
          <input
            value={selection.templateImageUrl}
            placeholder="https://..."
            onChange={(e) => setSelection((prev) => ({ ...prev, templateImageUrl: e.target.value }))}
          />
        </label>
        <label>
          Posición X (0-1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={selection.qrPositionX}
            onChange={(e) => setSelection((prev) => ({ ...prev, qrPositionX: Number(e.target.value) }))}
          />
        </label>
        <label>
          Posición Y (0-1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={selection.qrPositionY}
            onChange={(e) => setSelection((prev) => ({ ...prev, qrPositionY: Number(e.target.value) }))}
          />
        </label>
        <label>
          Escala QR
          <input
            type="number"
            min={0.1}
            max={1}
            step={0.05}
            value={selection.qrSize}
            onChange={(e) => setSelection((prev) => ({ ...prev, qrSize: Number(e.target.value) }))}
          />
        </label>
        <button type="submit" disabled={updateTemplate.isPending || !selection.eventId}>
          {updateTemplate.isPending ? 'Guardando…' : 'Guardar plantilla'}
        </button>
      </form>
    </div>
  )
}