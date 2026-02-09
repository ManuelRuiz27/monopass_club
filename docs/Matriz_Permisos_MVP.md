# Matriz De Permisos MVP (Frontend + API)

Fecha de validacion: 2026-02-09

## 1. Reglas Globales
- Todas las rutas privadas requieren token JWT.
- Frontend aplica guard por rol en `frontend/src/router.tsx`.
- Backend aplica RBAC con `authenticate` y `authorize*` en `core-api/src/plugins/auth.ts` y `scanner-service/src/plugins/auth.ts`.

## 2. Permisos Por Rol

| Rol | Rutas Frontend permitidas | API permitida principal | Bloqueos esperados |
|---|---|---|---|
| `MANAGER` | `/manager`, `/manager/team/*`, `/manager/events`, `/manager/template`, `/manager/cuts`, `/manager/settings` | `/clubs`, `/events`, `/rps`, `/rp-groups`, `/scanners`, `/cuts`, `/settings/*` | `403` en `/rp/*` y `/scanner/*` |
| `RP` | `/rp`, `/rp/history`, `/rp/profile` | `/rp/events`, `/tickets`, `/tickets/:ticketId/png`, `/tickets/:ticketId/image`, `/rp/tickets/history` | `403` en APIs de manager y scanner |
| `SCANNER` | `/scanner`, `/scanner/cuts` | Scanner Service: `/scan/validate`, `/scan/confirm`, `/cuts`, `/cuts/:eventId/rps/:rpId` | `403` en Core manager/RP; bloqueo cross-manager |

## 3. Notas De Seguridad Operativa
- Usuario inactivo no debe operar aunque tenga token vigente.
- Scanner solo valida tickets de su manager (aislamiento tenant).
- Confirmacion de escaneo no es reversible.

## 4. Evidencia Tecnica
- Guards frontend: `frontend/src/router.tsx`.
- Rutas manager: `frontend/src/shells/ManagerShell.tsx`.
- Rutas RP: `frontend/src/shells/RpShell.tsx`.
- Rutas scanner: `frontend/src/shells/ScannerShell.tsx`.
- RBAC core: `core-api/src/plugins/auth.ts`.
- RBAC scanner: `scanner-service/src/plugins/auth.ts`.
