import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('manager.demo')
  const [password, setPassword] = useState('changeme123')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const session = await login({ username, password })
      const destination = session.role === 'MANAGER' ? '/manager' : session.role === 'RP' ? '/rp' : '/scanner'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticacion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>MonoPass Club</h2>
      <p className="text-muted">
        Usa cualquiera de las credenciales demo segun el rol disponible: <strong>manager.demo</strong>,{' '}
        <strong>rp.demo</strong> o <strong>scanner.demo</strong> (password <code>changeme123</code>).
      </p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-danger">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
