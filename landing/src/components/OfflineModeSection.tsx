import { Download, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react'

const offlinePoints = [
  {
    title: 'Cache por evento',
    description: 'Antes de abrir puertas, el dispositivo descarga la lista de accesos del evento.',
    icon: Download,
  },
  {
    title: 'La puerta no se detiene',
    description: 'Si falla internet, el escaneo sigue operando y conserva el control del acceso.',
    icon: WifiOff,
  },
  {
    title: 'Sincronizacion segura',
    description: 'Cuando vuelve la conexion, se sincronizan movimientos sin perder trazabilidad.',
    icon: RefreshCw,
  },
  {
    title: 'Control de duplicados',
    description: 'El sistema evita validaciones repetidas y ayuda a mantener cortes limpios.',
    icon: ShieldCheck,
  },
]

export function OfflineModeSection() {
  return (
    <section className="landing-section" id="modo-offline" aria-labelledby="offline-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Modo offline</p>
          <h2 className="section-header__title" id="offline-title">
            Sin internet, tu puerta sigue avanzando.
          </h2>
          <p className="section-header__description">
            Pass Monkey prepara el evento en el dispositivo, opera en puerta y sincroniza cuando regresa la señal.
          </p>
        </header>

        <div className="cards-grid" role="list">
          {offlinePoints.map((point) => {
            const Icon = point.icon
            return (
              <article className="panel-card" key={point.title} role="listitem" data-reveal>
                <Icon size={20} aria-hidden="true" />
                <h3>{point.title}</h3>
                <p>{point.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
