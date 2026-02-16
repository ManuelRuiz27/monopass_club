import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import './auth-pages.css'

export function NotFoundPage() {
  return (
    <main className="not-found-screen">
      <section className="not-found-card">
        <p className="not-found-card__code">404</p>
        <h2 className="not-found-card__title">Pagina no encontrada</h2>
        <p className="not-found-card__description">
          La ruta que intentaste abrir no existe o fue movida.
        </p>
        <div className="not-found-card__actions">
          <Link to="/">
            <Button variant="secondary">Volver al inicio</Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
