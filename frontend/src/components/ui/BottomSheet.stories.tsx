import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

const meta = {
  title: 'UI/BottomSheet',
  component: BottomSheet,
  args: {
    title: 'Filtros',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BottomSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: false,
    onClose: () => {},
    children: null,
  },
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ padding: 24 }}>
        <Button onClick={() => setOpen(true)}>Abrir Bottom Sheet</Button>
        <BottomSheet
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>Aplicar</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>Configura filtros para eventos y fechas.</p>
          <p className="text-muted">Este componente cubre el baseline mobile para filtros secundarios.</p>
        </BottomSheet>
      </div>
    )
  },
}
