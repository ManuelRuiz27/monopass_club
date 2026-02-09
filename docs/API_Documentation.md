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
