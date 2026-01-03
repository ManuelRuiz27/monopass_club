# Checklist de Validacion - MonoPass Club (MVP)

## 0) Build & Arranque (BLOQUEANTE)
- [x] `npm install --workspaces core-api scanner-service frontend` completa sin errores
- [x] Base de datos levanta (Docker o local)
- [x] Migraciones aplicadas correctamente
- [x] Seed ejecutado (manager, rp, scanner, club, evento)
- [x] Core API responde `/health`
- [x] Scanner Service responde `/health`
- [x] Frontend levanta sin errores y carga rutas

---

## 1) Seguridad / Tenancy (BLOQUEANTE)
- [x] Sin token -> 401 en rutas protegidas
- [x] RP no accede a vistas/endpoints de Manager
- [x] Scanner no accede a vistas/endpoints de Manager/RP
- [x] Scanner A no valida tickets de Manager B (403)
- [x] RP solo ve eventos asignados

---

## 2) Reglas Criticas del Negocio (BLOQUEANTE)
- [x] Ticket inicia en `PENDING`
- [x] Confirmar -> cambia a `SCANNED`
- [x] No existe reversion de estado
- [x] Reconfirmar QR -> 409 `ALREADY_SCANNED`
- [x] `qrToken` es opaco, unico e inmutable (constraint DB)

---

## 3) Idempotencia del Scanner (BLOQUEANTE)
- [x] `/scan/confirm` requiere `clientRequestId`
- [x] Reintento con mismo `clientRequestId` no duplica scan
- [x] Existe un solo `TicketScan` por `ticketId`

---

## 4) Limite por RP-Evento (BLOQUEANTE)
- [x] `limitAccesses = null` -> ilimitado
- [x] `limitAccesses = N` -> permite exactamente N tickets
- [x] Ticket N+1 -> error 409 visible en UI
- [x] El limite se valida por `assignmentId`

---

## 5) Cortes (BLOQUEANTE)
- [x] Cortes se calculan en vivo desde `TicketScan.scannedAt`
- [x] Filtros: evento, RP, rango horario
- [x] Totales cuadran: general + vip + other = total
- [x] Breakdown visible en UI de Manager

---

## 6) Plantilla + Drag & Drop QR (BLOQUEANTE)
- [x] Manager sube imagen base del evento
- [x] QR es draggable sobre canvas
- [x] QR no sale del canvas
- [x] QR es escalable
- [x] Se guardan `qrX`, `qrY`, `qrScale` como porcentaje
- [x] Al recargar, el QR mantiene su posicion

---

## 7) PNG con QR embebido (BLOQUEANTE)
- [x] Endpoint `GET /tickets/:id/png` responde imagen
- [x] PNG incluye QR embebido segun plantilla
- [x] RP puede descargar/compartir PNG
- [x] Mismo ticket genera misma imagen

---

## 8) Flujos E2E minimos (BLOQUEANTE)
- [x] RP genera ticket -> obtiene PNG
- [x] Scanner valida -> confirma -> queda SCANNED
- [x] Revalidar QR -> "YA USADO"
- [x] Manager ve corte reflejando el scan

---

## 9) UX Operativa (IMPORTANTE)
- [x] Estados loading/error/success visibles
- [x] Botones deshabilitados durante requests
- [x] Toasts o feedback claro
- [x] Scanner full-screen y alto contraste
- [x] Confirm solo visible si ticket es `PENDING`

---

## 10) Pruebas Automatizadas (IMPORTANTE)
- [x] Tests backend: no reutilizable, tenancy, idempotencia
- [x] E2E frontend: RP -> Scanner -> Manager
- [x] Reportes de ejecucion disponibles

---

## 11) Documentacion (IMPORTANTE)
- [x] README con pasos reales de instalacion
- [x] OpenAPI core y scanner actualizados
- [x] SRS, QA Plan y criterios de aceptacion en `/docs`

---

**Criterio de Aceptacion Final del MVP**
- Todos los puntos BLOQUEANTES completados
- Ningun QR reutilizable
- Ninguna accion reversible
- Tenancy estricta por manager
