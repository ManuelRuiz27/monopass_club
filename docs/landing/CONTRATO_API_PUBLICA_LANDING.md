# Contrato API publica de landing (fase inicial)

Fecha: 2026-02-16

## Base URL

`{CORE_API_BASE_URL}`

## 1) GET /landing/pricing

Respuesta esperada:

```json
{
  "event_price": 750,
  "base_price": 2999,
  "pro_price": 5000,
  "currency": "MXN"
}
```

## 2) POST /landing/leads

Request:

```json
{
  "name": "Juan Perez",
  "club": "Club Norte",
  "city": "CDMX",
  "phone": "+525511223344",
  "email": "juan@clubnorte.mx",
  "eventDate": "2026-03-20",
  "estimatedVolume": 250,
  "utm": {
    "source": "instagram",
    "medium": "paid",
    "campaign": "lanzamiento_q2"
  }
}
```

Response:

```json
{
  "id": "lead_xxx",
  "status": "created"
}
```

## 3) POST /landing/events/activation

Estado actual:
- Crea orden `PENDING` en DB.
- Si falta `MP_ACCESS_TOKEN`, responde `503 configuration_error`.
- Si MP responde correctamente, regresa `201` con `paymentUrl`.

Request objetivo:

```json
{
  "clubName": "Club Norte",
  "city": "CDMX",
  "ownerName": "Juan Perez",
  "ownerEmail": "juan@clubnorte.mx",
  "phone": "+525511223344",
  "utm": {
    "source": "instagram",
    "medium": "paid",
    "campaign": "lanzamiento_q2"
  }
}
```

Response cuando falta configuracion:

```json
{
  "status": "configuration_error",
  "orderId": "ord_xxx",
  "message": "MP_ACCESS_TOKEN is not configured."
}
```

## 4) POST /webhooks/mercadopago

Estado actual:
- Si falta `MP_ACCESS_TOKEN`, responde `501`.
- Si hay configuracion, intenta resolver `payment_id`, actualizar orden y ejecutar provisioning.
- Si existe `MP_WEBHOOK_SECRET`, valida firma (`x-signature` + `x-request-id`) y responde `401` cuando es invalida.

Provisioning actual al pago aprobado:
1. Crea usuario `MANAGER`.
2. Crea `Club`.
3. Crea `Evento inicial`.
4. Crea licencia `EVENT` (billing `MANUAL`, `eventsRemaining=1`).
5. Marca orden como provisionada.
6. Envia email de credenciales temporales si hay configuracion de Resend.

Variables requeridas para email:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `APP_LOGIN_URL` (opcional; fallback derivado de `APP_PUBLIC_BASE_URL`)

Si falta configuracion de email:
- El provisioning se completa.
- Se guarda trazabilidad de error en la orden (`credentialsEmailError=email_not_configured`).

## 5) Rate limit publico

Endpoints con limite:
- `POST /landing/leads`
- `POST /landing/events/activation`

Respuesta de limite:

```json
{
  "status": "rate_limited",
  "message": "Too many requests. Please retry later."
}
```

## 6) GET /landing/orders/:orderId

Consulta estatus de pago/provisioning para pantalla de retorno de checkout.

Response:

```json
{
  "orderId": "ord_xxx",
  "paymentStatus": "PAID",
  "provisioningStatus": "PROVISIONED",
  "amount": 750,
  "currency": "MXN",
  "createdAt": "2026-02-16T18:10:00.000Z",
  "paidAt": "2026-02-16T18:12:00.000Z",
  "credentialsEmailSentAt": "2026-02-16T18:12:05.000Z",
  "credentialsEmailError": null
}
```

Response actual:

```json
{
  "success": false,
  "message": "Webhook handler not implemented yet."
}
```
