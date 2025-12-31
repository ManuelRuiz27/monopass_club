import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { RequireAuth } from './RequireAuth'
import { useAuth } from './AuthContext'

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>

describe('RequireAuth', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset()
  })

  test('redirecciona a /login cuando no hay sesion', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false })

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route path="/login" element={<div>pantalla login</div>} />
          <Route
            path="/manager"
            element={
              <RequireAuth>
                <div>privado</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/pantalla login/i)).toBeInTheDocument()
  })

  test('renderiza hijos cuando la sesion es valida', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true })

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route
            path="/manager"
            element={
              <RequireAuth>
                <div>zona segura</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/zona segura/i)).toBeInTheDocument()
  })
})
