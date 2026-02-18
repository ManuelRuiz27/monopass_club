# Plan de actualizacion de Landing Pass Monkey por sprints

## 1) Objetivo
Actualizar la landing actual para soportar el nuevo modelo transaccional:
- Conversion primaria: `Activar 1 evento por $750`.
- Conversion secundaria: planes mensuales.
- Conversion terciaria: lead/demo.

Base de diseno obligatoria: `docs/landing/propuestacodex.pen`.
Requerimientos funcionales obligatorios: `docs/landing/Actualizacion_PassMonkey.md`.

## 2) Analisis rapido (gap actual vs objetivo)
Estado actual detectado:
- La landing actual (`landing/src/components/LandingPage.tsx`) usa estructura v1: `Hero`, `Statement`, `ProblemSolution`, `Steps`, `StaffDemo`, `PrivateAccess`, `LeadForm`.
- El backend actual expone `POST /api/leads` (`core-api/src/modules/leads/routes.ts`), pero no existe aun el modulo publico `/landing` con pricing, activacion de evento y webhook.
- CORS esta abierto (`origin: true`) en `core-api/src/server.ts`, no restringido al dominio de landing.

Objetivo segun diseno base `propuestacodex.pen`:
- Layout completo en 3 breakpoints:
  - Desktop: `z9O7O`
  - Tablet: `RQA0D`
  - Mobile: `Ma29U`
- Secciones finales:
  1. Hero
  2. Como funciona
  3. Beneficios
  4. Pricing
  5. Comparativo
  6. FAQ
  7. CTA final
  8. Footer
- Estados/variantes obligatorias:
  - Hero fallback sin video: `gjqp8`
  - FAQ expandido: `LhdJd`
  - Mobile sticky CTA: `ksz3R`
  - Estados Agendar demo: `b5CiZ`
  - Pricing hover/focus: `GPrgI`
  - Vistas legales: `hDAzl`
  - Componentes + tokens: `tb7zg`

## 3) Estrategia de ejecucion
Trabajar en 3 tracks en paralelo por sprint:
- Track A (Landing Frontend): UI, responsive, estados, tracking.
- Track B (Core API + pagos): endpoints publicos, checkout, webhook, provisioning.
- Track C (QA/Observabilidad/Release): pruebas E2E, performance, despliegue y runbooks.

## 4) Plan por sprints

## Sprint 0 (3-4 dias) - Alineacion y base tecnica
Objetivo: cerrar contratos y preparar terreno sin romper produccion.

Entregables:
- Contrato API v1 para:
  - `GET /landing/pricing`
  - `POST /landing/leads`
  - `POST /landing/events/activation`
  - `POST /webhooks/mercadopago`
  - `POST /landing/forms/contact` (opcional)
- Definicion de variables de entorno:
  - Backend: `PRICING_EVENT`, `PRICING_BASE`, `PRICING_PRO`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `APP_PUBLIC_BASE_URL`
  - Landing: `NEXT_PUBLIC_API_BASE_URL` o equivalente Vite (`VITE_CORE_API_BASE_URL`)
- Matriz de eventos de tracking y UTMs.
- Backlog tecnico con historias P0/P1/P2.

Definition of Done:
- Contratos request/response aprobados.
- Lista final de copys congelada con base en `propuestacodex.pen`.
- Riesgos de integracion con Mercado Pago documentados.

## Sprint 1 (1 semana) - UI shell y nueva arquitectura de secciones
Objetivo: mover la landing de la estructura v1 al layout final del pen, sin flujos de pago aun.

Entregables Track A:
- Refactor de `landing/src/components/LandingPage.tsx` a arquitectura por secciones:
  - `HeroSection`
  - `HowItWorksSection`
  - `BenefitsSection`
  - `PricingSection`
  - `ComparisonSection`
  - `FaqSection`
  - `FinalCtaSection`
  - `FooterSection`
- Implementacion de tokens visuales y estados base usando `tb7zg`.
- Responsive completo para Desktop/Tablet/Mobile basado en `z9O7O`, `RQA0D`, `Ma29U`.
- Hero fallback en dispositivo low-end/reduced-motion (`gjqp8`).

Entregables Track C:
- Checklist visual por breakpoint con capturas comparativas.

Definition of Done:
- IA final visible en entorno local/staging.
- No quedan secciones legacy (`Statement`, `ProblemSolution`, `PrivateAccess`) en el flujo principal.
- Validacion visual contra `.pen` aceptada.

## Sprint 2 (1 semana) - Pricing dinamico, leads y CTA de conversion
Objetivo: activar conversion real sin webhook final aun.

Entregables Track B:
- Crear modulo publico en API (`/landing` o `/public/landing`).
- Implementar `GET /landing/pricing` leyendo de config.
- Implementar `POST /landing/leads` con UTMs.
- Mantener compatibilidad temporal con `POST /api/leads` (alias o adaptador) para no romper consumidores actuales.

Entregables Track A:
- `PricingSection` conectado a `GET /landing/pricing`.
- Implementar CTAs:
  - `Activar 1 evento`
  - `Ver planes mensuales`
  - `Agendar demo`
- Implementar estados de formulario de demo (`b5CiZ`): loading/success/error.
- Implementar pricing states default/hover/focus (`GPrgI`).

Entregables Track C:
- Pruebas de contrato API (success/error/timeout).
- Pruebas manuales de conversion y anclas.

Definition of Done:
- Pricing siempre se obtiene via API (sin hardcode de montos en UI).
- Leads guardan UTM source/medium/campaign.
- Flujos de CTA funcionan de punta a punta contra staging.

## Sprint 3 (1 semana) - Checkout y provisioning post pago
Objetivo: cerrar la conversion principal de negocio.

Entregables Track B:
- Implementar `POST /landing/events/activation`:
  - crear orden
  - crear preferencia/checkout Mercado Pago
  - responder `paymentUrl` + `orderId`
- Implementar `POST /webhooks/mercadopago`:
  - validacion de firma
  - idempotencia por `payment_id`/`orderId`
  - actualizacion de estado de orden
- Provisioning obligatorio al estado paid:
  1. Crear Organizer/Club (si no existe)
  2. Crear usuario owner (password temporal)
  3. Asignar licencia `plan_type=event`
  4. Crear/habilitar evento inicial
  5. Enviar email de acceso
- Crear/ajustar tablas:
  - `orders`
  - `licenses/subscriptions` segun modelo final
  - ampliar `leads` con campos de negocio requeridos

Entregables Track A:
- CTA `Activar 1 evento` integrado al endpoint de activacion.
- Mensajeria de estado de pago y fallback UX.

Entregables Track C:
- E2E sandbox Mercado Pago: click CTA -> checkout -> webhook -> provisioning.

Definition of Done:
- Flujo transaccional P0 funcional en ambiente de prueba.
- Ordenes no se duplican ante reintentos de webhook.
- Provisioning confirmado con datos reales en DB.

## Sprint 4 (1 semana) - Hardening, legal, performance y release
Objetivo: dejar la landing lista para produccion.

Entregables Track B:
- CORS restringido al dominio de landing.
- Rate limiting en endpoints publicos.
- Sanitizacion de inputs y auditoria de logs.

Entregables Track A:
- FAQ acorde a estado expandido/cerrado (`LhdJd`).
- Sticky CTA mobile (`ksz3R`) con regla de no interferencia UX.
- Paginas legales wireframe -> version funcional (`hDAzl`).
- Integrar tracking minimo:
  - `cta_activate_event_click`
  - `cta_view_pricing_click`
  - `cta_schedule_demo_click`
  - `pricing_plan_selected`
- Persistencia de UTM en localStorage y envio en requests.

Entregables Track C:
- Lighthouse >= 85 (mobile y desktop).
- QA funcional cross-browser y accesibilidad basica (focus, contraste, labels).
- Runbook de despliegue y rollback para landing independiente.

Definition of Done:
- Criterios E2E del documento `Actualizacion_PassMonkey.md` cumplidos.
- Observabilidad minima operativa (logs y trazabilidad de orden/pago/provisioning).
- Release candidate aprobado para produccion.

## 5) Priorizacion del backlog (resumen)
P0 (bloquea salida):
- Modulo API publico `/landing`
- Pricing dinamico por config
- Activacion checkout + webhook + provisioning
- CTA principal funcional
- CORS/rate-limit/sanitizacion

P1 (alto impacto conversion):
- FAQ interactivo
- Sticky CTA mobile
- Estados de formularios y pricing hover/focus
- Legal pages completas

P2 (mejora continua):
- Optimizaciones de motion avanzadas
- Test E2E ampliado (matriz extensa de edge cases)
- Ajustes finos de copy por A/B test

## 6) Riesgos y mitigaciones
- Riesgo: drift entre diseno y build final.
  - Mitigacion: checklist por frame ID y QA visual por sprint.
- Riesgo: latencia/falla de proveedor de pagos.
  - Mitigacion: manejo robusto de reintentos, estados pendientes y alertas.
- Riesgo: romper flujo actual de leads.
  - Mitigacion: compatibilidad temporal `/api/leads` durante Sprint 2-3.
- Riesgo: deuda tecnica en schema actual para licencias/suscripciones.
  - Mitigacion: migraciones incrementales con rollback plan.

## 7) Criterio de salida global del plan
El plan se considera completado cuando:
1. La landing implementa las 8 secciones y variantes clave de `propuestacodex.pen`.
2. El flujo `Activar 1 evento` opera extremo a extremo con webhook y provisioning.
3. Se cumple performance, seguridad basica y tracking minimo.
4. La landing puede desplegarse independiente del frontend principal.

