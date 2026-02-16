import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  args: {
    label: 'Usuario',
    placeholder: 'usuario@ejemplo.com',
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Error: Story = {
  args: {
    error: 'Campo obligatorio',
  },
}

export const Success: Story = {
  args: {
    state: 'success',
    hint: 'Formato valido',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    hint: 'Validando disponibilidad...',
  },
}
