# 📘 Historias Técnicas Frontend — MonoPass Club (React)

**Stack**
- React 19.3.0+
- TypeScript
- Vite
- React Router
- TanStack Query
- Zod + React Hook Form
- Zustand (auth/session)
- Tailwind CSS (opcional)

---

## EPIC FE-0 — Base & Arquitectura

### FE-001 — Inicializar proyecto frontend
**Descripción**
- Crear proyecto React + TS con Vite
- Configurar rutas base y estructura por roles

**Criterios**
- Proyecto levanta en local
- Build producción OK

---

### FE-002 — Cliente HTTP centralizado
**Descripción**
- Wrapper fetch/axios con JWT
- Manejo global de errores

**Criterios**
- Todas las requests pasan por el cliente
- 401 redirige a login

---

### FE-003 — Router por rol
**Descripción**
- Guards por rol (Manager, RP, Scanner)

**Criterios**
- Acceso bloqueado por rol incorrecto

---

## EPIC FE-1 — Autenticación

### FE-010 — Login
**UI**
- Usuario
- Contraseña
- Botón Entrar

**Endpoint**
- POST /auth/login

**Criterios**
- Redirige según rol

---

## EPIC FE-2 — Manager App

### FE-020 — Dashboard Gerente
**UI**
- Tarjetas resumen
- Navegación a módulos

**Criterios**
- Skeleton loaders

---

### FE-021 — Gestión de Centros
**Pantallas**
- Listado
- Crear
- Editar

**Endpoints**
- GET /clubs
- POST /clubs
- PATCH /clubs/:id
- PATCH /clubs/:id/deactivate

---

### FE-022 — Gestión de Eventos
**Pantallas**
- Listado
- Crear
- Editar
- Desactivar

**Endpoints**
- GET /events
- POST /events
- PATCH /events/:id

---

### FE-023 — Eventos Recurrentes
**Pantalla**
- Wizard simple

**Endpoint**
- POST /events/recurring

---

### FE-024 — Plantilla y QR
**Pantalla**
- Upload imagen
- Drag & drop QR

**Endpoints**
- POST /events/:id/template
- PATCH /events/:id/template/qr-position

---

### FE-025 — Gestión de RPs
**Pantallas**
- Listado
- Crear
- Editar
- Desactivar

**Endpoints**
- GET /rps
- POST /rps

---

### FE-026 — Asignar RP a Evento
**UI**
- Tabla RPs
- Límite opcional

**Endpoints**
- GET /events/:id/rps
- POST /events/:id/rps/:rpId

---

### FE-027 — Staff Scanner
**Pantallas**
- Listado
- Crear

**Endpoints**
- GET /scanners
- POST /scanners

---

### FE-028 — Settings (OTRO)
**Pantalla**
- Input label OTRO

**Endpoint**
- PATCH /settings/guest-types/other-label

---

### FE-029 — Cortes
**Pantallas**
- Dashboard
- Detalle RP

**Endpoints**
- GET /cuts
- GET /cuts/:eventId/rps/:rpId

---

## EPIC FE-3 — RP App

### FE-040 — Eventos asignados
**Endpoint**
- GET /rp/events

---

### FE-041 — Generar Acceso
**UI**
- Tipo invitado
- Nota
- Contadores

**Endpoint**
- POST /tickets

---

### FE-042 — Preview y descarga
**Endpoint**
- GET /tickets/:id/image

---

### FE-043 — Compartir WhatsApp
**Acción**
- wa.me link

---

## EPIC FE-4 — Scanner App

### FE-060 — Escáner
**Endpoint**
- POST /scan/validate

---

### FE-061 — Modal validación
**UI**
- Label
- Nota
- Confirmar

---

### FE-062 — Confirmar entrada
**Endpoint**
- POST /scan/confirm

---

## EPIC FE-5 — UX Hardening

### FE-080 — Componentes compartidos
- Shell
- Modals
- Toasts

---

### FE-081 — Accesibilidad
- Modo oscuro
- Textos grandes

---

## Definition of Done
- Tipado completo
- Manejo errores
- Mobile-first
