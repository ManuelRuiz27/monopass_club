# Kickoff tecnico para iniciar actualizacion de landing

Fecha: 2026-02-16

## Alcance completado para iniciar

- API publica inicial registrada en `core-api`:
  - `GET /landing/pricing`
  - `POST /landing/leads`
  - `POST /landing/events/activation` (crea orden `PENDING`; `201/503/502`)
  - `POST /webhooks/mercadopago` (valida firma opcional y actualiza orden si hay `MP_ACCESS_TOKEN`)
- Configuracion de entorno agregada:
  - pricing por variables
  - `CORS_ALLOWED_ORIGINS`
  - variables base de Mercado Pago
  - rate limit configurable para endpoints publicos
- Esquema `Lead` extendido para payload de landing (club, fecha evento, volumen, UTMs).
- Migracion SQL creada para cambios de `Lead`.
- Landing conectada a contrato nuevo de leads:
  - `createLandingLead()`
  - captura y envio de UTMs desde `localStorage`.
- Landing migrada a arquitectura de secciones del diseno base.
- Sticky CTA mobile y paginas legales (`/legal/aviso-privacidad`, `/legal/terminos`) operativas.
- Formulario conectado a:
  - flujo lead (`POST /landing/leads`)
  - flujo activacion (`POST /landing/events/activation`)
- Provisioning post-pago con licencia `EVENT` y envio de credenciales por email (si provider configurado).

## Pendiente inmediato (siguiente bloque)

1. Completar checkout real en `POST /landing/events/activation` con token MP de staging/prod.
2. Endurecer validacion de firma de webhook segun configuracion productiva final de MP.
3. QA E2E de pago completo con sandbox.
4. Evolucionar provisioning hacia licencia/suscripcion segun modelo comercial final.
5. Integrar monitoreo/alertas de fallos en envio de credenciales.

Validacion local E2E disponible:
- `core-api/src/modules/landing/landing-payment-flow.e2e.test.ts`
- Guia: `docs/landing/E2E_SANDBOX_CHECKOUT_FLOW.md`

## Validaciones recomendadas antes de continuar

1. Ejecutar migraciones y `prisma generate`.
2. Probar manualmente:
   - `GET /landing/pricing`
   - `POST /landing/leads` con y sin UTM.
3. Verificar CORS con dominio real de landing en staging.
