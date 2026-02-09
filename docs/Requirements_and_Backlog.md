# Requisitos y Roadmap de Producto

**MonoPass Club**
*La solución moderna para la gestión de accesos en night-life.*

---

## 1. Visión del Producto
MonoPass Club busca digitalizar y asegurar la gestión de entradas en clubes nocturnos, eliminando el fraude por reventa, el robo hormiga en taquilla y optimizando la operación de los RPs mediante tecnología transparente y datos en tiempo real.

---

## 2. Funcionalidades Core (MVP Actual)
Estas funcionalidades están **ya implementadas** y operativas en la versión 1.0.

### Para el Club (Manager)
- **Dashboard en Tiempo Real**: Visualización de aforo, ingresos por RP y actividad de escaneo.
- **Gestión Multi-Tenant**: Administración centralizada de múltiples clubes y eventos.
- **Control de Equipo**: Altas/Bajas de RPs y personal de seguridad.

### Para Promotores (RP)
- **Generación Móvil**: App web para crear tickets QR en segundos desde el celular.
- **Share Nativo**: Envío directo de accesos a clientes vía WhatsApp.
- **Control de Cupo**: Límites asignados por el gerente para evitar sobreventa.

### Para Seguridad (Scanner)
- **Validación Instantánea**: Lectura de QR en < 1 segundo.
- **Anti-Fraude**: Bloqueo automático de tickets duplicados o ya usados.
- **Feedback Claro**: Pantallas verde/rojo inconfundibles para ambientes oscuros.

---

## 3. Backlog y Roadmap Público (Q1-Q2 2026)

Este roadmap alinea nuestras metas de desarrollo con las necesidades del mercado y futuros inversionistas.

### Fase 2: Engagement y Monetización (Q1 2026)
- [ ] **Programa de Lealtad**: Puntos para usuarios frecuentes canjeables por beneficios.
- [ ] **Guestlist Pública**: Links de registro público con aprobación manual del RP.
- [ ] **Data Analytics Avanzado**: Reportes predictivos de asistencia basados en históricos.

### Fase 3: Integraciones y Escala (Q2 2026)
- [ ] **Pagos Integrados**: Venta de tickets (Cover) directamente en la plataforma con Stripe/MercadoPago.
- [ ] **CRM de Clientes**: Base de datos unificada de asistentes con hábitos de consumo.
- [ ] **Modo Offline**: Validación de tickets crítica sin dependencia de internet (Sync posterior).

---

## 4. Requisitos Técnicos de Alto Nivel
- **Disponibilidad**: 99.9% uptime durante fines de semana (Viernes-Sábado noche).
- **Seguridad**: Cumplimiento con estándares de protección de datos (encriptación en reposo y tránsito).
- **Escalabilidad**: Arquitectura serverless/microservicios lista para soportar picos de 10,000 escaneos simultáneos.
