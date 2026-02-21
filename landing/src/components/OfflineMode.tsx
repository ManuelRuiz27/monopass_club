import { WifiOff, Download, RefreshCw } from 'lucide-react'

export function OfflineMode() {
    return (
        <section className="section-dark" id="offline">
            <div className="container content-stack">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-16px' }}>
                    <span className="panel-tag">
                        <WifiOff size={14} style={{ marginRight: '6px' }} />
                        VENTAJA TÉCNICA
                    </span>
                </div>
                <h2 className="section-title">Modo Offline</h2>
                <p className="section-subtitle">
                    Sabemos cómo es operar en el underground a las 2 AM sin señal. Tu puerta no puede fallar.
                </p>

                <div className="bento-grid">
                    <article className="panel-card panel-card--bento">
                        <div style={{ color: 'var(--acid)', marginBottom: '16px' }}>
                            <Download size={36} strokeWidth={1.5} />
                        </div>
                        <h3>Descarga local</h3>
                        <p>El escáner guarda el listado del evento en el dispositivo antes de empezar.</p>
                    </article>
                    <article className="panel-card panel-card--bento panel-card--highlight">
                        <div style={{ color: 'var(--acid)', marginBottom: '16px' }}>
                            <WifiOff size={36} strokeWidth={1.5} />
                        </div>
                        <h3>Funciona sin señal</h3>
                        <p>Escanea QR sin internet a máxima velocidad. Previene duplicados y accesos reenviados.</p>
                    </article>
                    <article className="panel-card panel-card--bento">
                        <div style={{ color: 'var(--acid)', marginBottom: '16px' }}>
                            <RefreshCw size={36} strokeWidth={1.5} />
                        </div>
                        <h3>Auto sinc.</h3>
                        <p>Sincroniza automáticamente los accesos al servidor cuando vuelve la conexión.</p>
                    </article>
                </div>
            </div>
        </section>
    )
}
