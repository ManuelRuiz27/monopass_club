import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Button, Input } from '@/components/ui'
import './auth-pages.css'

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
      const destination =
        session.role === 'MANAGER'
          ? '/manager'
          : session.role === 'RP'
            ? '/rp'
            : session.role === 'DIRECTOR'
              ? '/director'
              : '/scanner'
      navigate(destination, { replace: true })
    } catch (err) {
      console.warn('Login failed', err)
      setError('No se pudo iniciar sesion. Verifica usuario y contrasena.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen auth-screen--split">
      <section className="auth-hero">
        <div>
          <p className="auth-hero__eyebrow">PassMonkey</p>
          <h1 className="auth-hero__title">Gestion de Accesos Premium</h1>
          <p className="auth-hero__description">
            Controla eventos, valida tickets en tiempo real y analiza performance por rol.
          </p>
          <ul className="auth-hero__list">
            <li>QR unico y seguro por invitado</li>
            <li>Flujo optimizado para puerta</li>
            <li>Metricas en vivo por evento</li>
          </ul>
        </div>
        <p className="auth-hero__footer">MonoPass Club - Plataforma operativa para nightlife</p>
      </section>

      <section className="auth-panel">
        <h2 className="auth-panel__title">Bienvenido</h2>
        <p className="auth-panel__subtitle">Usa las credenciales de tu rol para ingresar.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            label="Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error ? <p className="text-danger">{error}</p> : null}
          <Button type="submit" loading={isSubmitting} block>
            {isSubmitting ? 'Ingresando...' : 'Entrar'}
          </Button>
        </form>
        <p className="auth-panel__switch">
          <Link to="/staff/login-token">Ingresar como Staff con token</Link>
        </p>
      </section>
    </main>
  )
}
