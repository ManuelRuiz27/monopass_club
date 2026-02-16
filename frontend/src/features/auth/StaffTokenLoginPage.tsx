import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Button, Input } from '@/components/ui'
import './auth-pages.css'

export function StaffTokenLoginPage() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await loginWithToken({ token })
      navigate('/scanner', { replace: true })
    } catch {
      setError('Token invalido o expirado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="staff-token-screen">
      <section className="staff-token-card">
        <p className="staff-token-card__brand">PassMonkey</p>
        <h1 className="staff-token-card__title">Staff Scanner</h1>
        <p className="staff-token-card__subtitle">Ingresa tu token de acceso para habilitar el escaner.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            label="Token de acceso"
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Ingresa tu token"
            autoCapitalize="characters"
            autoCorrect="off"
          />
          {error ? <p className="text-danger">{error}</p> : null}
          <Button type="submit" loading={isSubmitting} variant="success" block>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
        <p className="staff-token-card__footer">
          <Link to="/login">Volver al login general</Link>
        </p>
      </section>
    </main>
  )
}
