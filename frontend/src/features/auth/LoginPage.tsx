import { FormEvent, useState } from 'react'
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
      await login({ username, password })
      navigate('/manager', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '3rem auto', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>Ingreso Manager</h2>
      <p style={{ color: '#475569' }}>Usa las credenciales demo (`manager.demo` / `changeme123`).</p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p style={{ color: '#dc2626' }}>{error}</p>
        ) : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}