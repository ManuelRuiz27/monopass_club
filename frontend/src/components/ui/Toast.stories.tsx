import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toast } from './Toast'

const meta = {
  title: 'UI/Toast',
  component: Toast,
  args: {
    title: 'Accion completada',
    description: 'La configuracion fue guardada correctamente.',
    variant: 'success',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {}

export const Error: Story = {
  args: {
    title: 'No se pudo guardar',
    description: 'Revisa la conexion e intenta de nuevo.',
    variant: 'error',
  },
}

export const Info: Story = {
  args: {
    title: 'Sesion actualizada',
    description: 'Los cambios aplicaran en la siguiente recarga.',
    variant: 'info',
  },
}

export const Warning: Story = {
  args: {
    title: 'Limite cercano',
    description: 'Te quedan pocos accesos disponibles para este evento.',
    variant: 'warning',
  },
}
