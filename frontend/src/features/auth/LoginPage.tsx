import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
      console.warn('Login failed', err)
      setError('No se pudo iniciar sesion. Verifica usuario y contrasena.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>MonoPass Club</h2>
      <p className="text-muted">
        Usa las credenciales de tu rol para ingresar.
      </p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Usuario
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
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
