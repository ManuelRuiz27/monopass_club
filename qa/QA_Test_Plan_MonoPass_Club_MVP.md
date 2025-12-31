# QA Test Plan — MonoPass Club (MVP)
Versión: 1.0  
Alcance: Frontend (Manager/RP/Scanner) + Backend (Core API + Scanner MS)

---

## 0) Objetivo
Garantizar que el MVP cumple reglas críticas:
- QR **no reutilizable**
- Scanner **no reversible**
- Tipos de invitado: GENERAL, VIP, OTRO (renombrable)
- Límite de accesos por RP-evento **opcional**
- Cortes por RP con clasificación GENERAL/VIP/OTRO
- Multi-tenant: staff scanner solo ve tickets del gerente correcto

---

## 1) Entorno de pruebas

### 1.1 Variables mínimas
- `DATABASE_URL`
- `JWT_SECRET`
- `CORE_API_BASE_URL` (ej: http://localhost:3000/api)
- `SCANNER_API_BASE_URL` (ej: http://localhost:3001/scanner-api)

### 1.2 Datos de seed (recomendado)
Usuarios demo (si seed.ts se usa):
- manager / manager123
- rp / rp123
- scanner / scanner123

Tokens demo:
- `demo-token-general`
- `demo-token-vip`

---

## 2) Herramientas recomendadas

### Backend
- Unit tests: **Vitest** o **Jest**
- E2E API: **Supertest** (Node) o **Postman/Newman**
- DB: PostgreSQL local (docker)
- (Opcional) Contract tests: **Dredd** o **Schemathesis** contra OpenAPI

### Frontend
- Unit tests UI: **Vitest + Testing Library**
- E2E: **Playwright** (recomendado)
- (Opcional) Lighthouse para PWA scanner

---

## 3) Matriz de pruebas (prioridad)

Leyenda:
- P0 = bloqueante
- P1 = importante
- P2 = nice to have

---

## 4) Backend — Core API (E2E)

### API-AUTH-001 (P0) Login gerente exitoso
**Precondición:** usuario manager existe  
**Paso:**
1) POST `/auth/login` con credenciales válidas  
**Esperado:**
- 200, retorna `token` y `role=MANAGER`

### API-AUTH-002 (P0) Login fallido
**Paso:**
1) POST `/auth/login` con password incorrecto  
**Esperado:** 401

### API-RBAC-001 (P0) Rutas protegidas por rol
**Paso:**
1) Acceder a `/clubs` sin token  
2) Acceder con rol RP  
**Esperado:**
- 401 sin token
- 403 con rol incorrecto

---

### API-CLUB-001 (P0) CRUD básico de club
**Paso:**
1) POST `/clubs` crear  
2) GET `/clubs` listar  
3) PATCH `/clubs/:id` editar  
4) PATCH `/clubs/:id/deactivate` desactivar  
**Esperado:**
- Club aparece/actualiza
- active=false al desactivar

---

### API-EVENT-001 (P0) Crear evento manual
**Paso:**
1) POST `/events` con fechas válidas  
**Esperado:** 201 creado

### API-EVENT-002 (P1) Validación fechas
**Paso:** crear evento con `endsAt < startsAt`  
**Esperado:** 400

---

### API-RP-001 (P0) Crear RP y asignarlo a evento sin límite
**Paso:**
1) POST `/rps`  
2) POST `/events/:eventId/rps/:rpId` con `limit=null`  
**Esperado:** asignación creada

### API-RP-002 (P0) Asignación única
**Paso:**
1) Repetir asignación mismo rp-event  
**Esperado:** 409 (duplicado)

### API-RP-003 (P0) Límite opcional: respeta límite
**Precondición:** assignment con limit=2  
**Paso:**
1) RP genera 2 tickets  
2) RP intenta generar tercero  
**Esperado:** 409 “límite alcanzado”

---

### API-TICKET-001 (P0) Generación de ticket: GENERAL/VIP/OTRO
**Paso:**
1) POST `/tickets` con guestType GENERAL  
2) repetir con VIP  
3) repetir con OTHER (con nota)  
**Esperado:** 201 en todos

---

### API-CUTS-001 (P0) Corte clasificado por tipo
**Precondición:** existen scans en rango  
**Paso:**
1) GET `/cuts?eventId&from&to`  
**Esperado:**
- total = general+vip+other
- valores correctos

---

### API-SETTINGS-001 (P0) Renombrar OTRO
**Paso:**
1) PATCH `/settings/guest-types/other-label` con "Influencer"  
2) Crear ticket OTHER sin otherLabel explícito  
**Esperado:**
- Label persistido
- Scanner usa "Influencer" como displayLabel

---

## 5) Backend — Scanner Microservice (E2E)

### SCAN-VAL-001 (P0) Validar token pendiente
**Paso:**
1) POST `/scan/validate` con token válido pendiente  
**Esperado:**
- 200, valid=true, status=PENDING, muestra displayLabel y note

### SCAN-VAL-002 (P0) Validar token inválido
**Paso:**
1) POST `/scan/validate` con token inexistente  
**Esperado:** 200, valid=false, reason=INVALID_TOKEN

### SCAN-CONF-001 (P0) Confirmar entrada (irreversible)
**Paso:**
1) POST `/scan/confirm` con token pendiente  
**Esperado:**
- 200 confirmed=true
- ticket.status=SCANNED
- ticket.scannedAt no null

### SCAN-CONF-002 (P0) Reusar token ya escaneado
**Paso:**
1) Confirmar token 2 veces  
**Esperado:** 409 reason=ALREADY_SCANNED

### SCAN-CONF-003 (P1) Idempotencia con clientRequestId
**Paso:**
1) Enviar confirm 2 veces con mismo clientRequestId  
**Esperado:** misma respuesta, sin crear doble scan

### SCAN-SEC-001 (P0) Multi-tenant
**Paso:**
1) Scanner de gerente A valida ticket de gerente B  
**Esperado:** 403 (sin filtrar info)

---

## 6) Frontend — Unit/UI tests (React)

### FE-AUTH-001 (P0) Login guarda sesión y redirige por rol
**Esperado:** rutas correctas según role

### FE-GUARD-001 (P0) Guards bloquean navegación sin token
**Esperado:** redirect /login

### FE-MANAGER-CLUB-001 (P1) Form create club valida campos
**Esperado:** no envía si capacity <= 0

### FE-RP-TICKET-001 (P0) Generar ticket muestra error límite
**Esperado:** al recibir 409 muestra "Límite alcanzado"

### FE-SCANNER-UI-001 (P0) Modal no muestra Confirmar si ya usado/inválido
**Esperado:** botón oculto en ALREADY_SCANNED e INVALID_TOKEN

---

## 7) Frontend — E2E (Playwright)

### E2E-001 (P0) Flujo completo: RP genera y Scanner confirma
**Pasos:**
1) Login RP
2) Abrir evento asignado
3) Generar ticket VIP con nota
4) Copiar token/abrir imagen (según implementación)
5) Login Scanner
6) Validar token
7) Confirmar entrada
8) Revalidar token
**Esperado:**
- Primer validate pending
- confirm OK
- segundo validate -> ALREADY_SCANNED

### E2E-002 (P0) Manager ve corte clasificado
**Pasos:**
1) Login Manager
2) Ir a Cortes
3) Filtro por evento y rango
**Esperado:**
- Totales reflejan scans del caso E2E-001

### E2E-003 (P1) Renombrar OTRO y reflejar en scanner
**Pasos:**
1) Manager cambia OTRO a "Influencer"
2) RP genera ticket OTHER
3) Scanner valida
**Esperado:** displayLabel = "Influencer" o ticket.otherLabel si se definió

### E2E-004 (P0) Scanner no reversible
**Pasos:**
1) Confirmar token
2) Buscar UI de revertir (no existe)
3) Confirmar otra vez
**Esperado:** 409 y UI en rojo

---

## 8) Criterios de salida (Release Gate)
- 100% P0 pasa
- 80% P1 pasa (resto con issues documentados)
- Cero bugs abiertos de seguridad/tenancy
- Cero casos donde un QR se reutiliza

---

## 9) Evidencia requerida
- Reporte de ejecución (Playwright HTML report)
- Log de pruebas API (Newman/Supertest)
- Capturas de pantalla de casos P0 fallidos (si aplica)
