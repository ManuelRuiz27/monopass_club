# 🧱 Backlog Técnico — MonoPass Club (MVP)

**Stack**
- Backend: Node.js 22 LTS · Prisma 7 · PostgreSQL
- Frontend: React 19.3.0+ · TypeScript · Vite
- Auth: JWT
- API: REST (OpenAPI definido)

---

## 🟢 EPIC 0 — Setup & Base

### T-001 — Inicializar repositorio backend
**Descripción**
- Crear proyecto Node.js
- Configurar TypeScript
- Instalar Prisma 7
- Configurar variables de entorno

**Criterios de aceptación**
- Proyecto corre en local
- `prisma generate` funciona
- Conexión a DB establecida

---

### T-002 — Configurar Prisma schema y migraciones
**Descripción**
- Implementar `schema.prisma` entregado
- Ejecutar migración inicial
- Verificar constraints y relaciones

**Criterios**
- Migración aplicada sin errores
- Todas las tablas creadas
- Índices y uniques correctos

---

### T-003 — Seed inicial
**Descripción**
- Crear usuario gerente demo
- Crear `ManagerSetting` con `otherLabel = "Otro"`
- Crear club y evento de ejemplo

**Criterios**
- `npx prisma db seed` ejecuta sin error
- Datos visibles desde DB

---

## 🔐 EPIC 1 — Autenticación & Roles

### T-010 — Login JWT
**Descripción**
- Endpoint `/auth/login`
- Validar credenciales
- Generar JWT con rol

**Criterios**
- Token válido
- Payload incluye `userId` y `role`
- Expiración configurada

---

### T-011 — Middleware de roles
**Descripción**
- Middleware para validar JWT
- Middleware para roles: MANAGER, RP, SCANNER

**Criterios**
- Rutas protegidas correctamente
- Accesos indebidos bloqueados (403)

---

## 🏢 EPIC 2 — Centros Nocturnos

### T-020 — CRUD de Clubs
**Descripción**
- GET /clubs
- POST /clubs
- PATCH /clubs/:id
- Desactivar club

**Criterios**
- Solo MANAGER accede
- Clubs asociados al gerente logueado

---

## 🎉 EPIC 3 — Eventos

### T-030 — Crear evento manual
**Descripción**
- Endpoint POST /events
- Validar fechas
- Asociar a club

**Criterios**
- Evento creado
- Visible en listado

---

### T-031 — Eventos recurrentes
**Descripción**
- POST /events/recurring
- Generar múltiples eventos por días

**Criterios**
- Se crean instancias correctas
- Fechas y horas válidas

---

### T-032 — Imagen base y QR
**Descripción**
- Subir imagen base del acceso
- Guardar posición del QR en porcentaje

**Criterios**
- Imagen accesible por URL
- Coordenadas guardadas correctamente

---

## 🧑‍💼 EPIC 4 — RPs

### T-040 — CRUD de RPs
**Descripción**
- Crear RP (usuario + perfil)
- Editar nombre
- Desactivar RP

**Criterios**
- RP puede iniciar sesión
- Solo MANAGER administra RPs

---

### T-041 — Asignar RP a Evento
**Descripción**
- Asignar RP ↔ Evento
- Configurar límite opcional

**Criterios**
- Solo una asignación por RP-evento
- Límite puede ser null (ilimitado)

---

## 🎟️ EPIC 5 — Accesos / Tickets

### T-050 — Generar acceso (RP)
**Descripción**
- POST /tickets
- Validar asignación RP-evento
- Aplicar límite si existe

**Criterios**
- Ticket creado con QR único
- Error 409 si límite alcanzado

---

### T-051 — Render de imagen del acceso
**Descripción**
- Generar PNG con imagen base + QR
- Endpoint GET /tickets/:id/image

**Criterios**
- Imagen descargable
- QR legible

---

### T-052 — Compartir acceso
**Descripción**
- Intento de share (solo tracking)
- No integración directa WhatsApp

**Criterios**
- Evento registrado (opcional)

---

## 📸 EPIC 6 — Scanner

### T-060 — Validar QR
**Descripción**
- POST /scan/validate
- Detectar:
  - válido
  - ya usado
  - inválido

**Criterios**
- Respuesta inmediata
- Info logística visible

---

### T-061 — Confirmar entrada
**Descripción**
- POST /scan/confirm
- Crear TicketScan
- Cambiar estado a SCANNED

**Criterios**
- No reversible
- 409 si se intenta reusar

---

## 🧑‍🚪 EPIC 7 — Staff Scanner

### T-070 — CRUD de Scanner
**Descripción**
- Crear cuentas scanner
- Desactivar scanner

**Criterios**
- Scanner solo accede a /scan/*
- Sin acceso a datos administrativos

---

## 📊 EPIC 8 — Cortes

### T-080 — Dashboard de cortes
**Descripción**
- GET /cuts
- Filtros por evento y rango

**Criterios**
- Conteo correcto
- Clasificación:
  - General
  - VIP
  - Otro

---

### T-081 — Detalle de corte por RP
**Descripción**
- GET /cuts/:eventId/rps/:rpId
- Lista de accesos escaneados

**Criterios**
- Solo lectura
- Sin edición

---

## ⚙️ EPIC 9 — Settings

### T-090 — Renombrar tipo OTRO
**Descripción**
- PATCH /settings/guest-types/other-label

**Criterios**
- Label actualizado
- Impacta en frontend y scanner

---

## 🧪 EPIC 10 — Calidad

### T-100 — Tests críticos
**Descripción**
- Test doble escaneo
- Test límite RP
- Test roles

**Criterios**
- Tests pasan
- Reglas clave cubiertas

---

## 🚀 EPIC 11 — Deploy

### T-110 — Deploy backend
**Descripción**
- Configurar entorno productivo
- Variables seguras
- Migración productiva

**Criterios**
- API accesible
- Logs activos

---

## ✅ Definición de Done (DoD)
- Endpoints documentados
- Reglas del negocio cumplidas
- Sin lógica ambigua
- Sin endpoints huérfanos
