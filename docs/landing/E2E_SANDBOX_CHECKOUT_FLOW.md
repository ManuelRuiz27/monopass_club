# E2E local del flujo checkout landing (sin credenciales reales)

## Objetivo
Validar extremo a extremo:
1. `POST /landing/events/activation`
2. callback de webhook (`POST /webhooks/mercadopago`)
3. provisioning (`manager + club + evento + licencia`)
4. estado público (`GET /landing/orders/:orderId`)

## Prueba automatizada incluida

Archivo:
- `core-api/src/modules/landing/landing-payment-flow.e2e.test.ts`

Comando:

```bash
npm exec -w core-api vitest run src/modules/landing/landing-payment-flow.e2e.test.ts
```

## Qué simula esta prueba

- Levanta un servidor fake de Mercado Pago local.
- Simula:
  - `POST /checkout/preferences`
  - `GET /v1/payments/:id`
- Ejecuta flujo real del API de landing.
- Verifica que:
  - activation responde `201` con `paymentUrl`
  - webhook deja la orden en `PAID`
  - provisioning queda `PROVISIONED`
  - se crean entidades de dominio
  - endpoint `/landing/orders/:orderId` refleja estado correcto

## Nota

Para validar contra sandbox real de Mercado Pago, se debe configurar:
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET` (si se usa firma)
- `APP_PUBLIC_BASE_URL`

