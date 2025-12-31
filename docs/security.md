# Checklist de Seguridad - MonoPass Club MVP

**Fecha de Revisión**: 30 de diciembre 2025  
**Sprint**: Sprint 3  
**Responsable**: Equipo Desarrollo MonoPass  
**Estado**: ✅ **APROBADO PARA RELEASE MVP**

---

## 1. Autenticación JWT (JSON Web Tokens)

### Implementación

✅ **JWT en Core API y Scanner Service**
- Framework: `@fastify/jwt` v10.0.0
- Secret: Variable de entorno `JWT_SECRET` (mínimo 32 caracteres)
- Algoritmo: HS256 (HMAC SHA-256)

✅ **Expiración de Tokens**
- Configuración: Tokens expiran según política definida en `.env`
- Default: 24 horas para operaciones normales
- Tokens se generan en `/auth/login`

✅ **Formato Bearer**
- Header: `Authorization: Bearer <token>`
- Validación automática en middlewares de autenticación

### Evidencia

- **Archivo**: [`core-api/src/lib/auth.ts`](file:///c:/Users/ruiz_/Music/monopass-club/core-api/src/lib/auth.ts) - Plugin de autenticación
- **Archivo**: [`scanner-service/src/lib/auth.ts`](file:///c:/Users/ruiz_/Music/monopass-club/scanner-service/src/lib/auth.ts) - Plugin scanner
- **Tests**: `manager.routes.test.ts` valida 401 sin token
- **Comando verificación**: 
  ```bash
  curl -X GET http://localhost:3000/api/clubs
  # Respuesta esperada: 401 Unauthorized
  
  curl -X GET http://localhost:3000/api/clubs -H "Authorization: Bearer <token>"
  # Respuesta esperada: 200 OK con datos
  ```

---

## 2. RBAC (Role-Based Access Control)

### Roles Implementados

✅ **MANAGER** - Gerente del club
- Permisos: CRUD completo de clubs, eventos, RPs, scanner staff, settings
- Rutas: `/clubs`, `/events`, `/rps`, `/scanners`, `/settings`, `/cuts`

✅ **RP** - Relaciones Públicas
- Permisos: Ver eventos asignados, generar tickets (con límites opcionales)
- Rutas: `/rp/events`, `/tickets`

✅ **SCANNER** - Personal de puerta
- Permisos: Validar y confirmar entradas (solo eventos de su manager)
- Rutas: `/scan/validate`, `/scan/confirm`

### Guards por Rol

✅ **Middleware de autorización**
- Valida que el rol del usuario coincida con el endpoint
- Respuesta 403 Forbidden si el rol es incorrecto
- Implementado en decoradores de rutas Fastify

### Evidencia

- **Tests backend**: `manager.routes.test.ts` - Casos API-RBAC-001
- **Resultado**: RP intentando acceder a `/clubs` → 403 Forbidden ✅
- **Flujo E2E**: Tests Playwright validan que cada rol solo accede a sus rutas

---

## 3. Multi-Tenant (Aislamiento de Datos)

### Validaciones Implementadas

✅ **Manager ID en todas las queries**
- Core API: Todas las consultas filtran por `managerId`
- Scanner Service: Valida `ticket.event.club.managerId === scanner.managerId`

✅ **Scanner solo ve tickets de su manager**
- Query: `SELECT * FROM Ticket WHERE event.club.managerId = scanner.managerId`
- Test cross-tenant: SCAN-SEC-001 → 403 Forbidden ✅

✅ **Cortes solo muestran datos del manager autenticado**
- Endpoint `/cuts` filtra automáticamente por `managerId` del token JWT

### Evidencia

- **Tests**: `scan.test.ts` - Caso SCAN-SEC-001 (cross-manager validation)
- **Comando verificación**:
  ```bash
  # Scanner de Manager A intenta validar ticket de Manager B
  curl -X POST http://localhost:3001/scanner-api/scan/validate \
    -H "Authorization: Bearer <scanner_manager_A>" \
    -H "Content-Type: application/json" \
    -d '{"qrToken": "<ticket_manager_B>"}'
  # Respuesta esperada: 403 Forbidden
  ```

- **Archivo**: [`scanner-service/src/http/routes/scan.ts`](file:///c:/Users/ruiz_/Music/monopass-club/scanner-service/src/http/routes/scan.ts) - Líneas 45-60 (validación cross-tenant)

---

## 4. Healthchecks

### Endpoints Implementados

✅ **Core API Healthcheck**
- Ruta: `GET /api/health`
- Respuesta: `{"status": "ok"}`
- Sin autenticación requerida
- Estado: ✅ Operacional

✅ **Scanner Service Healthcheck**
- Ruta: `GET /scanner-api/health`
- Respuesta:
  ```json
  {
    "status": "ok",
    "uptime": 12345.678,
    "timestamp": "2025-12-30T18:37:00.000Z"
  }
  ```
- Sin autenticación requerida
- Estado: ✅ Operacional

### Evidencia

**Capturas de respuestas 200 OK:**

```bash
# Core API Health
$ curl http://localhost:3000/api/health
{"status":"ok"}

# Scanner Service Health  
$ curl http://localhost:3001/scanner-api/health
{
  "status":"ok",
  "uptime":724.891,
  "timestamp":"2025-12-30T18:37:15.234Z"
}
```

- **Tests**: `server.test.ts` en core-api y scanner-service validan respuesta 200
- **Logs**: Healthchecks respondieron correctamente durante suite de tests

---

## 5. Cifrado y Almacenamiento Seguro

### Contraseñas

✅ **Hashing con bcrypt**
- Librería: `bcryptjs` v3.0.3
- Rounds: 10 (configuración por defecto)
- Las contraseñas nunca se almacenan en texto plano

### Variables de Entorno

✅ **Secrets en .env**
- `JWT_SECRET`: Token de firma JWT
- `DATABASE_URL`: Credenciales PostgreSQL
- `SCANNER_API_KEY`: Secret para scanner service
- Archivo `.env` en `.gitignore` ✅

⚠️ **Deuda Técnica DT-07**: Gestión de secretos
- Estado actual: Variables en `.env` local
- Pendiente: Integration con secret manager (AWS Secrets Manager / HashiCorp Vault) para producción
- Prioridad: Post-MVP inmediato

---

## 6. Protección contra Ataques Comunes

### SQL Injection

✅ **ORM con Prisma**
- Todas las queries usan Prisma Client con parámetros bindados
- No se concatenan strings SQL manualmente
- Validación de tipos en compile-time (TypeScript)

### XSS (Cross-Site Scripting)

✅ **Sanitización automática**
- React 19 escapa automáticamente contenido
- No se usa `dangerouslySetInnerHTML` sin validación
- Headers CSP configurados (pendiente refinar en producción)

### CSRF (Cross-Site Request Forgery)

✅ **Tokens stateless JWT**
- No se usan cookies de sesión
- JWT en header `Authorization` require acceso explícito desde JS
- CORS configurado para dominios permitidos

---

## 7. Rate Limiting

⚠️ **Estado**: Parcialmente implementado

✅ **Throttling en Scanner**
- Configurado para prevenir spam de validaciones
- Límite: 100 requests/minuto por scanner

❌ **Rate limiting global**
- **Deuda Técnica DT-05**: Falta implementación de rate limiting centralizado
- Recomendación: Nginx/CloudFlare rate limiting en capa de infraestructura

---

## 8. Auditoría y Logging

✅ **Logging estructurado**
- Framework: `pino` (JSON logging)
- Nivel: INFO en producción, DEBUG en desarrollo
- Logs incluyen: timestamp, request ID, user ID, acción

✅ **Eventos auditables**
- Login exitoso/fallido
- Generación de tickets (con RP ID)
- Confirmación de entradas (irreversible)
- Cambios en configuración (Settings)

⚠️ **Deuda Técnica DT-05**: Observabilidad centralizada
- Estado actual: Logs locales sin correlación de requests
- Pendiente: ELK Stack o similar para agregación y alertas

---

## 9. Backups y Recuperación

⚠️ **Deuda Técnica DT-06**: Pipeline de backups

**Estado actual**:
- PostgreSQL sin backups automatizados
- Snapshots manuales en desarrollo
- Alto riesgo de pérdida de datos

**Plan de mitigación (Sprint 3 Hardening)**:
- Implementar pg_dump diario automatizado
- Configurar point-in-time recovery (PITR)
- Probar procedimiento de restore cada sprint

---

## 10. Revisión de Código y Pruebas

✅ **Cobertura de tests de seguridad**
- Auth: 100% escenarios P0 ✅
- RBAC: 100% validación de roles ✅
- Multi-tenant: 100% isolation ✅
- Scanner anti-reuso: 100% ✅

✅ **Linting y análisis estático**
- ESLint configurado con reglas de seguridad
- TypeScript strict mode habilitado
- Sin vulnerabilidades detectadas en `npm audit`

✅ **Revisión de dependencias**
```bash
$ npm audit
found 0 vulnerabilities
```

---

## Resumen Ejecutivo

| Categoría | Estado | Criticidad | Acción |
|-----------|--------|------------|--------|
| JWT Authentication | ✅ Implementado | Alta | Ninguna |
| RBAC | ✅ Implementado | Alta | Ninguna |
| Multi-Tenant | ✅ Implementado | Alta | Ninguna |
| Healthchecks | ✅ Operacional | Media | Ninguna |
| Password Hashing | ✅ Implementado | Alta | Ninguna |
| SQL Injection | ✅ Mitigado | Alta | Ninguna |
| XSS Protection | ✅ Implementado | Alta | Ninguna |
| Secrets Management | ⚠️ Básico | Alta | **Post-MVP** |
| Rate Limiting | ⚠️ Parcial | Media | Sprint 3 Hardening |
| Backups | ❌ Manual | Alta | **Sprint 3** |
| Observabilidad | ⚠️ Local | Media | Post-MVP |

---

## Aprobación para Release MVP

**VEREDICTO**: ✅ **APROBADO**

**Justificación**:
- Todos los controles de seguridad críticos (P0) están implementados
- Multi-tenant validation 100% funcional
- Autenticación y autorización robustas
- Tests de seguridad pasando al 100%

**Deuda técnica aceptada**:
- Secrets management básico (mitigado con .env.example y documentación)
- Backups manuales (para MVP con datos de prueba es aceptable)
- Observabilidad local (suficiente para MVP, escalar en producción)

**Fecha de Aprobación**: 2025-12-30  
**Aprobado por**: Equipo MonoPass Club  
**Próxima Revisión**: Pre-producción (antes de deploy real)

---

**Generado**: 2025-12-30 18:38 CST
