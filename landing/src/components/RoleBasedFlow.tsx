import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Monitor, Scan, Smartphone, Ticket } from 'lucide-react'

type Role = 'manager' | 'rp' | 'door' | 'client'

type CarouselItem = {
  src: string
  label: string
}

type RoleConfig = {
  id: Role
  label: string
  icon: typeof Monitor
  title: string
  desc: string
  image: string
  video?: {
    mp4?: string
    webm?: string
  }
  carousel?: CarouselItem[]
  imageFit?: 'cover' | 'contain'
}

const TICKET_REF_SRC = '/assets/logos/ticket-demo-pass-monkey.png'
const RP_CHAT_TICKET_SRC = '/assets/screenshots/ticket-demo-pass-monkey.png'

type RpMessage = {
  id: string
  from: 'hugo' | 'mono' | 'system'
  text?: string
  delay: number
  type?: 'text' | 'ticket' | 'closing'
}



const RP_CHAT_MESSAGES: RpMessage[] = [
  {
    id: 'hugo-ask',
    from: 'hugo',
    text: 'Que onda mono! me vendes un acceso, y puedes pedir que me reserven una mesa, ¿verdad?',
    delay: 0.6,
  },
  {
    id: 'mono-reply',
    from: 'mono',
    text: 'Claro bro, lo de siempre, ¿verdad?',
    delay: 2.2,
  },
  {
    id: 'hugo-vip',
    from: 'hugo',
    text: 'Asi es mono, pero porfa que si diles que es mesa de hugo.',
    delay: 4.0,
  },
  {
    id: 'mono-ticket',
    from: 'mono',
    delay: 6.5,
    type: 'ticket',
    text: 'Ntp, con este ticket ya puedes entrar, y el staff te llevará a tu mesa.',
  },
  {
    id: 'hugo-thanks',
    from: 'hugo',
    text: 'Que fino!, te transfiero como siempre, va?',
    delay: 9.5,
  },
  {
    id: 'system-closing',
    from: 'system',
    text: 'Mismo flujo, mejor experiencia',
    type: 'closing',
    delay: 11.5,
  }
]







const roles: RoleConfig[] = [
  {
    id: 'manager',
    label: 'MANAGER',
    icon: Monitor,
    title: 'Tu panel de control',
    desc: 'Configura eventos en minutos, asigna cupos por colaborador de venta y mira ventas y aforo en tiempo real.',
    image: '/assets/screenshots/manager-dashboard.png',
  },
  {
    id: 'rp',
    label: 'COLABORADOR DE VENTA',
    icon: Smartphone,
    title: 'Venta por WhatsApp',
    desc: 'Tus colaboradores de venta no instalan nada. Generas sus enlaces y lo controlan por WhatsApp. Cero fricción.',
    image: '/assets/screenshots/rp-sharing.png',
    imageFit: 'contain',
  },
  {
    id: 'door',
    label: 'PUERTA (STAFF)',
    icon: Scan,
    title: 'Escaneo en segundos',
    desc: 'Tu staff valida en celular, detecta duplicados y mantiene la fila avanzando con control total.',
    image: '/assets/screenshots/scanner-home.png',
    imageFit: 'contain',
  },
  {
    id: 'client',
    label: 'CLIENTE / INVITADO',
    icon: Ticket,
    title: 'Acceso premium',
    desc: 'Tus asistentes reciben su pase digital, tu colaborador de venta maneja el cover como siempre, pero con la seguridad de tener control en caja al final de la noche.',
    image: TICKET_REF_SRC,
    imageFit: 'contain',
  },
]

const CAROUSEL_INTERVAL_MS = 1200

function ManagerWorkflowSimulation() {
  return (
    <div className="role-flow-manager-sim key-anim-fade" aria-label="Demo del flujo del manager">
      <img src="/assets/screenshots/manager-dashboard.png" alt="Dashboard del Manager" className="role-flow-manager-sim__img" />
    </div>
  )
}

function RpWorkflowSimulation() {
  return (
    <div className="role-flow-rp-sim key-anim-fade" aria-label="Demo del flujo de colaborador de venta">
      <img src="/assets/screenshots/rp-dashboard.png" alt="Dashboard colaborador de venta" className="rp-sim-layer rp-sim-layer--dashboard" />
      <div className="rp-sim-pointer rp-sim-pointer--dash" />

      <img src="/assets/screenshots/rp-form.png" alt="Formulario de Ticket" className="rp-sim-layer rp-sim-layer--form" />
      <div className="rp-sim-pointer rp-sim-pointer--form" />

      <img src="/assets/screenshots/rp-success.png" alt="Ticket Generado" className="rp-sim-layer rp-sim-layer--success" />
      <div className="rp-sim-pointer rp-sim-pointer--success" />

      <img src="/assets/screenshots/rp-sharing.png" alt="Compartir por WhatsApp" className="rp-sim-layer rp-sim-layer--share" />
    </div>
  )
}

function DoorWorkflowSimulation() {
  return (
    <div className="role-flow-scanner-sim key-anim-fade" aria-label="Demo del flujo de Puerta/Staff">
      {/* 2. The Camera Scan Animation (Background) */}
      <div className="scanner-sim-layer scanner-sim-layer--camera">
        <img src="/assets/screenshots/scanner-frame.png" alt="HUD Escáner" className="role-flow-scanner__bg" />
        <div className="role-flow-scanner__viewport">
          <img src={TICKET_REF_SRC} alt="Ticket a escanear" className="role-flow-scanner__ticket-anim" />
          <div className="role-flow-scanner__beam" />
        </div>
      </div>

      {/* 3. Native Validado Full Screen (Middle) */}
      <img src="/assets/screenshots/scanner-validado.png" alt="Acceso Validado" className="scanner-sim-layer scanner-sim-layer--success" />

      {/* 1. Dashboard Foreground (Top) */}
      <img src="/assets/screenshots/staff-scanner-dashboard.png" alt="Dashboard Staff" className="scanner-sim-layer scanner-sim-layer--dashboard" />
      <div className="rp-sim-pointer scanner-sim-pointer--dash" />
    </div>
  )
}

function WhatsappConversationSimulation() {
  return (
    <div className="role-flow-chat key-anim-fade" aria-label="Demo de conversacion por WhatsApp">
      <div className="role-flow-chat__header">
        <p className="role-flow-chat__name">Mono</p>
        <p className="role-flow-chat__status">en linea</p>
      </div>

      <div className="role-flow-chat__body">
        {RP_CHAT_MESSAGES.map((message) => {
          const animationDelay = { '--delay': `${message.delay}s` } as CSSProperties

          if (message.type === 'closing') {
            return (
              <div key={message.id} className="role-flow-chat__closing" style={animationDelay}>
                <p>{message.text}</p>
              </div>
            )
          }

          return (
            <article
              key={message.id}
              className={`role-flow-chat__message role-flow-chat__message--${message.from}`}
              style={animationDelay}
            >
              {message.type === 'ticket' ? (
                <div className="role-flow-chat__ticket-card">
                  <img src={RP_CHAT_TICKET_SRC} alt="Ticket demo VIP enviado por Mono" />
                  <p>{message.text}</p>
                </div>
              ) : (
                <p>{message.text}</p>
              )}
            </article>
          )
        })}
      </div>

      <div className="role-flow-chat__composer" aria-hidden="true">
        Escribe un mensaje...
      </div>
    </div>
  )
}

export function RoleBasedFlow() {
  const [activeRole, setActiveRole] = useState<Role>('manager')
  const [carouselIndex, setCarouselIndex] = useState(0)

  const activeData = useMemo(() => roles.find((role) => role.id === activeRole) ?? roles[0], [activeRole])
  const activeCarousel = activeData.carousel
  const carouselItems = activeCarousel ?? [{ src: activeData.image, label: activeData.title }]
  const activeItem = carouselItems[carouselIndex % carouselItems.length]
  const showTicketRef = activeRole === 'door'
  const isDoorMode = activeRole === 'door'

  useEffect(() => {
    setCarouselIndex(0)
  }, [activeRole])

  useEffect(() => {
    if (!activeCarousel || activeCarousel.length < 2) return
    const interval = window.setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % activeCarousel.length)
    }, CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [activeCarousel])

  const renderActiveFlow = () => {
    switch (activeRole) {
      case 'manager':
        return <ManagerWorkflowSimulation />
      case 'rp':
        return <RpWorkflowSimulation />
      case 'door':
        return <DoorWorkflowSimulation />
      case 'client':
        return <WhatsappConversationSimulation />
      default:
        return (
          <img
            src={activeItem.src}
            alt={activeItem.label}
            className="role-flow__image key-anim-fade"
            key={activeItem.src}
            style={{ objectFit: activeData.imageFit ?? 'cover' }}
          />
        )
    }
  }

  return (
    <section className="section-dark" id="role-flow">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="section-title">EL FLUJO MONOPASS</h2>
          <p className="section-subtitle">Una experiencia conectada para manager, colaborador de venta, staff y cliente.</p>
        </div>

        <div className="role-flow">
          <div className="role-flow__tabs">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.id}
                  type="button"
                  className={`role-tab ${activeRole === role.id ? 'role-tab--active' : ''}`}
                  onClick={() => setActiveRole(role.id)}
                >
                  <Icon size={20} />
                  <span>{role.label}</span>
                </button>
              )
            })}
          </div>

          <div className="role-flow__content">
            <div className="role-flow__visual">
              {activeRole === 'manager' ? (
                <div className="role-flow__browser-window">
                  <div className="role-flow__browser-header">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  <div className="role-flow__browser-body">
                    {renderActiveFlow()}
                  </div>
                </div>
              ) : (
                <div className="role-flow__phone-frame">
                  {renderActiveFlow()}
                  <div className="role-flow__glow" />
                </div>
              )}

              {showTicketRef ? (
                <div className={`role-flow__ticket-ref ${isDoorMode ? 'role-flow__ticket-ref--door' : 'role-flow__ticket-ref--client'}`}>
                  <p>{isDoorMode ? 'Ticket a escanear' : 'Ticket del invitado'}</p>
                  <img src={TICKET_REF_SRC} alt="Ticket demo Pass Monkey" />
                </div>
              ) : null}

              {activeCarousel ? (
                <div className="role-flow__carousel-meta">
                  <p className="role-flow__carousel-label">{activeItem.label}</p>
                  <div className="role-flow__carousel-dots" aria-label="Progreso del flujo de escaneo">
                    {carouselItems.map((item, index) => (
                      <button
                        key={`${item.src}-${index}`}
                        type="button"
                        className={`role-flow__carousel-dot ${index === carouselIndex ? 'is-active' : ''}`}
                        onClick={() => setCarouselIndex(index)}
                        aria-label={`Paso ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="role-flow__info key-anim-slide">
              <div className="role-flow__icon-box">
                <activeData.icon size={32} />
              </div>
              <h3 className="role-flow__title">{activeData.title}</h3>
              <p className="role-flow__desc">{activeData.desc}</p>

              <ul className="role-flow__features">
                {activeRole === 'manager' ? (
                  <>
                    <li>- Dashboard de ventas y aforo en vivo</li>
                    <li>- Control de equipo y trazabilidad completa</li>
                    <li>- Decisiones rapidas en hora pico</li>
                  </>
                ) : null}
                {activeRole === 'rp' ? (
                  <>
                    <li>- Link unico por colaborador de venta para compartir rapido</li>
                    <li>- Seguimiento de accesos por promotor</li>
                    <li>- Cero papel y menos errores manuales</li>
                  </>
                ) : null}
                {activeRole === 'door' ? (
                  <>
                    <li>- Escaneo inmediato en celular</li>
                    <li>- Bloqueo de tickets duplicados</li>
                    <li>- Flujo de puerta estable toda la noche</li>
                  </>
                ) : null}
                {activeRole === 'client' ? (
                  <>
                    <li>- Ticket digital listo para mostrar</li>
                    <li>- Acceso rapido sin filas largas</li>
                    <li>- Experiencia premium desde el ingreso</li>
                  </>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
