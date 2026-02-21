import { Check, X } from 'lucide-react';
import { trackLandingEvent } from '../lib/analytics.ts'

export const Comparison = () => {
  return (
    <section className="section-dark comparison" id="comparison">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="section-title">TU ELECCIÓN: CAOS O CONTROL</h2>
          <p className="section-subtitle">Seguir igual te cuesta dinero cada fin de semana. Tú decides.</p>
        </div>

        <div className="comparison-table">
          {/* Header */}
          <div className="comparison-row comparison-row--head">
            <span style={{ color: '#ff2f66' }}>EL CAOS (LO DE SIEMPRE)</span>
            <span style={{ color: 'var(--acid)' }}>MONOPASS (CONTROL)</span>
          </div>

          {/* Rows */}
          <div className="comparison-row">
            <span>
              <X size={16} color="#ff2f66" style={{ display: 'inline', marginRight: '8px' }} />
              Boletos inseguros y listas de papel confusas
            </span>
            <span>
              <Check size={16} color="var(--acid)" style={{ display: 'inline', marginRight: '8px' }} />
              QR único encriptado. Imposible de clonar.
            </span>
          </div>

          <div className="comparison-row">
            <span>
              <X size={16} color="#ff2f66" style={{ display: 'inline', marginRight: '8px' }} />
              Cuentas que no cuadran o ingresos sin registrar
            </span>
            <span>
              <Check size={16} color="var(--acid)" style={{ display: 'inline', marginRight: '8px' }} />
              Ingresos auditados vs aforo real en tu celular.
            </span>
          </div>

          <div className="comparison-row">
            <span>
              <X size={16} color="#ff2f66" style={{ display: 'inline', marginRight: '8px' }} />
              Accesos lentos y fricción en la entrada
            </span>
            <span>
              <Check size={16} color="var(--acid)" style={{ display: 'inline', marginRight: '8px' }} />
              Acceso fluido (0.8s por persona). Cero drama.
            </span>
          </div>

          <div className="comparison-row">
            <span>
              <X size={16} color="#ff2f66" style={{ display: 'inline', marginRight: '8px' }} />
              Horas contando papeles al cierre de turno
            </span>
            <span>
              <Check size={16} color="var(--acid)" style={{ display: 'inline', marginRight: '8px' }} />
              Cierre automático al instante con un clic.
            </span>
          </div>
        </div>

        <div className="mt-12 text-center" style={{ marginTop: '48px' }}>
          <a
            href="#formulario"
            className="btn btn--primary"
            onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'comparison' })}
          >
            QUIERO UNA REUNION
          </a>
        </div>
      </div>
    </section>
  );
};
