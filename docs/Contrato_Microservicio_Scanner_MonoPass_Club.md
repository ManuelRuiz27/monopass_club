# 📡 Contrato — Microservicio Scanner (Aislado) — MonoPass Club
**Versión:** 1.0.0 (MVP)  
**Propósito:** Servicio dedicado a validación y confirmación de accesos en puerta (QR), optimizado para baja latencia y alta concurrencia.  
**Stack recomendado:** Node.js 22 LTS · TypeScript · Prisma 7 · PostgreSQL · Redis (opcional para rate-limit / idempotencia)  
**Consumidores:** App Staff Scanner (React 19.3.0+), Panel Manager (solo lectura de métricas indirectas), API Gateway (si existe).

---

## 1) Alcance y responsabilidades

### Incluye
- Validación de QR (`validate`) sin mutar estado
- Confirmación de entrada (`confirm`) con **mutación irreversible**
- Respuesta con:
  - `guestType` (GENERAL/VIP/OTHER)
  - `displayLabel` (incluye label renombrado de OTHER)
  - `note` (nota logística)
  - estatus (PENDING/SCANNED)
- Controles:
  - Anti-reuso (ya escaneado)
  - Idempotencia en confirm
  - Rate limit (recomendado)

### No incluye
- Creación de tickets
- Edición de eventos o asignaciones RP
- Reversión / anulaciones
- Pagos
- Generación de imágenes del ticket

---

## 2) Dependencias y modo de integración

### 2.1 Fuente de verdad de datos
- El microservicio Scanner usa **la misma base PostgreSQL** (o una réplica de lectura + escritura limitada) con tablas:
  - `Ticket`
  - `TicketScan`
  - `ManagerSetting` (para `otherLabel`)
  - `Event`, `Club` (opcional para mostrar datos de evento/club)

### 2.2 Autenticación y autorización
- JWT Bearer
- Rol requerido: `SCANNER`
- JWT debe incluir:
  - `sub` = userId
  - `role` = SCANNER
  - `managerId` (recomendado, para multi-tenant)
- El scanner solo puede validar tickets del `managerId` asociado.

> **Si no quieres meter managerId en JWT:** resolver por `ScannerProfile.managerId` consultando DB con `userId`.

---

## 3) SLA, performance, resiliencia

### Objetivo de latencia
- `validate`: **p95 < 150ms**
- `confirm`: **p95 < 250ms**

### Concurrencia esperada
- Puerta con 1–3 scanners simultáneos por evento
- Picos: 10–30 confirmaciones/seg en entrada (depende del club)

### Resiliencia
- Reintentos: solo en errores 5xx o timeouts, nunca en 4xx
- Confirm debe ser **idempotente** para evitar dobles escaneos por doble tap.

---

## 4) Endpoints del Microservicio

**Base URL sugerida:** `/scanner-api`  
**Content-Type:** `application/json`  
**Auth header:** `Authorization: Bearer <token>`

---

### 4.1 POST `/scan/validate`
Valida el QR **sin** marcar entrada.  
Debe usarse cuando la cámara detecta un QR para mostrar el modal de info.

#### Request
```json
{ "qrToken": "opaque-string" }
```

#### Response 200 — Válido (pendiente)
```json
{
  "valid": true,
  "reason": null,
  "ticket": {
    "ticketId": "t1",
    "eventId": "e1",
    "guestType": "VIP",
    "displayLabel": "VIP",
    "note": "Mesa 3, botella",
    "status": "PENDING",
    "scannedAt": null
  }
}
```

#### Response 200 — Ya escaneado
```json
{
  "valid": false,
  "reason": "ALREADY_SCANNED",
  "ticket": {
    "ticketId": "t1",
    "eventId": "e1",
    "guestType": "VIP",
    "displayLabel": "VIP",
    "note": "Mesa 3, botella",
    "status": "SCANNED",
    "scannedAt": "2026-01-02T01:10:00-06:00"
  }
}
```

#### Response 200 — Token inválido
```json
{
  "valid": false,
  "reason": "INVALID_TOKEN",
  "ticket": null
}
```

#### Response codes
- `200` siempre para outcomes de negocio (válido/ya usado/inválido)
- `401` token inválido
- `403` rol incorrecto o scanner fuera de tenant
- `429` rate-limit (si aplica)
- `500` error interno

---

### 4.2 POST `/scan/confirm`
Confirma la entrada: crea `TicketScan` y marca `Ticket.status=SCANNED`.  
**No reversible.**  
Debe llamarse solo al presionar el botón “Confirmar entrada”.

#### Request
```json
{
  "qrToken": "opaque-string",
  "clientRequestId": "uuid-v4"
}
```

- `clientRequestId` es recomendado para idempotencia.  
  Si no se usa Redis, se puede guardar en DB (ver sección 6).

#### Response 200 — Confirmación exitosa
```json
{
  "confirmed": true,
  "reason": null,
  "ticket": {
    "ticketId": "t1",
    "eventId": "e1",
    "guestType": "VIP",
    "displayLabel": "VIP",
    "note": "Mesa 3, botella",
    "status": "SCANNED",
    "scannedAt": "2026-01-02T01:10:00-06:00"
  }
}
```

#### Response 409 — Ya escaneado
```json
{
  "confirmed": false,
  "reason": "ALREADY_SCANNED",
  "ticket": {
    "ticketId": "t1",
    "status": "SCANNED",
    "scannedAt": "2026-01-02T01:10:00-06:00"
  }
}
```

#### Response 404 — Token inválido
```json
{
  "confirmed": false,
  "reason": "INVALID_TOKEN",
  "ticket": null
}
```

#### Response codes
- `200` confirmación exitosa
- `404` token inválido
- `409` ya usado
- `401/403/429/500` según corresponda

---

### 4.3 GET `/health`
Healthcheck para deploy.

#### Response 200
```json
{ "status": "ok" }
```

---

## 5) Formato de `displayLabel` (regla OTRO)
- Si `guestType = GENERAL` → `"General"`
- Si `guestType = VIP` → `"VIP"`
- Si `guestType = OTHER` → usar:
  1) `Ticket.otherLabel` si existe
  2) de lo contrario `ManagerSetting.otherLabel`
  3) fallback `"Otro"`

> Nota: El gerente puede renombrar OTRO. El scanner **debe reflejarlo**.

---

## 6) Idempotencia y consistencia (crítico)

### 6.1 Garantía “no doble escaneo”
Se logra con:
- `TicketScan.ticketId` **UNIQUE** en DB
- Confirm ejecutado en **transacción**
- Orden recomendado:
  1) buscar ticket por `qrToken`
  2) si `status=SCANNED` o existe `scan` → 409
  3) crear `TicketScan`
  4) update ticket status

### 6.2 Idempotencia por `clientRequestId` (recomendado)
Opción A (Redis):
- Key: `scan:confirm:<clientRequestId>`
- TTL 60s
- Si existe, devolver respuesta cacheada

Opción B (DB):
- Agregar tabla `ScannerIdempotency`:
  - `id`, `clientRequestId` UNIQUE, `ticketId`, `responseJson`, `createdAt`
- Antes de confirmar:
  - si existe `clientRequestId`, devolver `responseJson`

> MVP puede vivir con solo UNIQUE en TicketScan, pero en puerta te evita dobles taps.

---

## 7) Multi-tenant (seguridad)
El scanner **solo** valida tickets del gerente correcto.

Regla:
- `ticket.event.club.managerId` debe coincidir con:
  - `ScannerProfile.managerId` (resuelto por `userId` del JWT), o
  - `managerId` en JWT (si se incluye)

Si no coincide:
- responder `403` (sin filtrar info del ticket)

---

## 8) Rate Limit (recomendado)
- `validate`: 30 req/s por scanner
- `confirm`: 10 req/s por scanner
- `429` con:
```json
{ "statusCode": 429, "error": "Too Many Requests", "message": "Rate limit exceeded" }
```

---

## 9) Logs y auditoría mínima
Registrar:
- `scan.validate` outcomes (solo métricas, no PII)
- `scan.confirm` (ticketId, scannerId, timestamp, guestType)
- Errores 4xx/5xx

---

## 10) Contrato UI/UX en puerta (para el frontend Scanner)
### Flujo recomendado
1) Cámara detecta QR → `POST /scan/validate`
2) Si `valid=true` y `status=PENDING` → mostrar modal con:
   - badge grande: `displayLabel`
   - nota (si existe)
   - botón `Confirmar entrada`
3) Tap confirm → `POST /scan/confirm`
4) Mostrar resultado:
   - verde (confirmado)
   - rojo (ya usado / inválido)
5) Auto-cerrar modal en 1.5s

### Importante
- Si `validate` ya devuelve `ALREADY_SCANNED`, **no mostrar botón** de confirmar.
- No existe “deshacer”.

---

## 11) Requisitos de despliegue (mínimo)
Variables:
- `DATABASE_URL`
- `JWT_PUBLIC_KEY` o `JWT_SECRET` (según firmes)
- `PORT`
- `REDIS_URL` (opcional)

---

## 12) Definition of Done (DoD)
- `validate` y `confirm` implementados
- No reuso garantizado (unique + transacción)
- Sin reversión
- Multi-tenant enforceado
- Healthcheck OK
- Latencia p95 dentro del objetivo en pruebas locales
