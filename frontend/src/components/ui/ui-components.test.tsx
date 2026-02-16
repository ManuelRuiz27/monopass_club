import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Button } from './Button'
import { Input } from './Input'
import { Toast } from './Toast'
import { BottomSheet } from './BottomSheet'
import { CardEmptyState, PageErrorState, PageLoadingState } from './StateViews'

describe('ui components', () => {
  test('Button renders loading state', () => {
    render(<Button loading>Guardar</Button>)

    const button = screen.getByRole('button', { name: /guardar/i })
    expect(button).toBeDisabled()
    expect(button.querySelector('.ui-btn__spinner')).not.toBeNull()
  })

  test('Input renders error helper when provided', () => {
    render(<Input label="Correo" error="Campo obligatorio" name="email" />)

    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByText(/campo obligatorio/i)).toBeInTheDocument()
  })

  test('Toast renders title and close button', () => {
    render(<Toast title="Guardado" description="Todo ok" onClose={() => {}} />)

    expect(screen.getByText(/guardado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar notificacion/i })).toBeInTheDocument()
  })

  test('BottomSheet renders dialog when open', () => {
    render(
      <BottomSheet open onClose={() => {}} title="Filtros">
        <p>Contenido</p>
      </BottomSheet>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/filtros/i)).toBeInTheDocument()
  })

  test('Page state components render loading and error', () => {
    render(
      <>
        <PageLoadingState message="Cargando datos" />
        <PageErrorState description="No se pudo cargar" />
      </>,
    )

    expect(screen.getByText(/cargando datos/i)).toBeInTheDocument()
    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
  })

  test('CardEmptyState renders action button when provided', () => {
    render(
      <CardEmptyState
        title="Sin datos"
        description="No hay registros"
        actionLabel="Reintentar"
        onAction={() => {}}
      />,
    )

    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})
