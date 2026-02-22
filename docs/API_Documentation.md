# Documentación de API - MonoPass Club

Esta referencia describe los endpoints públicos de **Core API** y **Scanner Service**.

**Base URL (Prod):** `https://api.monopass.club`  
**Auth Header:** `Authorization: Bearer <token>`

---

## Autenticación

### Login
`POST /auth/login`
Obtiene un token JWT para acceder al sistema.
- **Body**: `{ "username": "...", "password": "..." }`
- **Response**: `{ "token": "eyJ...", "role": "MANAGER" }`

---

## Core API (Gestión)

### Eventos
**Listar Eventos**
`GET /events`
- Retorna todos los eventos activos del manager logueado.

**Crear Evento**
`POST /events`
- **Body**: `{ "name": "Fiesta Neon", "clubId": "...", "startsAt": "..." }`

### RPs y Accesos
**Generar Acceso (RP)**
`POST /tickets`
- Genera un nuevo ticket QR.
- **Body**: `{ "eventId": "...", "guestType": "GENERAL | VIP", "note": "Mesa 5" }`
- **Error 409**: Si el RP alcanzó su límite asignado.

**Consultar Cortes**
`GET /cuts`
- Obtiene el resumen de accesos escaneados vs generados.

---

## Scanner Microservice (Validación)

### Validación
**Validar QR (Solo lectura)**
`POST /scan/validate`
- Verifica si un ticket es válido sin marcarlo como usado.
- **Body**: `{ "qrToken": "xyz..." }`
- **Response**:
  - `valid`: `true/false`
  - `status`: `PENDING` (listo para usar) o `SCANNED` (ya usado).
  - `ticket`: Datos del invitado para mostrar en pantalla.

### Confirmación
**Confirmar Entrada (Escritura)**
`POST /scan/confirm`
- Marca irrevocablemente el ticket como usado.
- **Body**: `{ "qrToken": "xyz...", "clientRequestId": "uuid..." }`
- **Response Multi-estado**:
  - `200 OK`: Entrada exitosa.
  - `409 Conflict`: El ticket ya fue usado previamente (intento de reuso).
  - `403 Forbidden`: El ticket pertenece a otro club/manager.

---

## Códigos de Error Comunes

| Código | Descripción |
| :--- | :--- |
| `401 Unauthorized` | Token faltante o expirado. |
| `403 Forbidden` | El usuario no tiene el rol necesario o intenta acceder datos de otro tenant. |
| `409 Conflict` | Violación de reglas de negocio (ej. ticket ya usado, límite alcanzado). |
| `429 Too Many Requests` | Exceso de peticiones (Rate Limit activado). |

---

## Director Monetizacion (Director-only)

Estas rutas requieren JWT con rol `DIRECTOR`.

### Planes
- `GET /director/plans`
- `POST /director/plans`
- `GET /director/plans/:id`
- `PATCH /director/plans/:id`
- `DELETE /director/plans/:id` (archivo logico -> `status=archived`)

### Suscripciones por club
- `GET /director/subscriptions`
- `POST /director/subscriptions`
- `PATCH /director/subscriptions/:id`

### Facturacion / Pagos / Refunds
- `GET /director/invoices?status=&clubId=&dateFrom=&dateTo=&page=&pageSize=`
- `GET /director/invoices/:id`
- `POST /director/invoices`
- `POST /director/invoices/:id/payments`
- `POST /director/payments/:id/refund`

### Ledger / Finanzas MX (estimador interno)
- `GET /director/ledger-entries`
- `POST /director/ledger-entries`
- `PATCH /director/ledger-entries/:id`
- `DELETE /director/ledger-entries/:id`
- `GET /director/finance/summary?dateFrom=&dateTo=&presetId=`
- `GET /director/finance-presets`
- `POST /director/finance-presets`
- `PATCH /director/finance-presets/:id`
- `DELETE /director/finance-presets/:id`

### Revenue / Reportes monetizacion
- `GET /director/revenue-dashboard`
- `GET /director/reports/monetization`

### Webhook provider-agnostico (placeholder)
- `POST /payments/webhook/:provider`
- `provider`: `manual | stripe | conekta | mercadopago | openpay`
- Firma por provider: `TODO` hasta configurar llaves/SDK.
