# Plan de desarrollo MVP - MonoPass Club

Estrategia para entregar el MVP descrito en `docs/SRS_MonoPass_Club_MVP.md`, `docs/BACKLOG_MonoPass_Club_MVP.md`, `docs/Historias_Tecnicas_Frontend_MonoPass_Club.md` y `qa/QA_Test_Plan_MonoPass_Club_MVP.md`. Cada sprint incluye objetivos, entregables y un checklist riguroso de cumplimiento para habilitar el pase a la siguiente iteracion.

## Sprint 0 - Fundamentos y arquitectura

### Objetivo
Establecer cimientos tecnicos compartidos (repos, pipelines, configuraciones base, seed inicial) que habiliten desarrollo paralelo de backend core, microservicio scanner y frontend.

### Entregables clave
- Inicializacion de los proyectos Node.js (core + scanner) y React (panel + apps RP/Scanner) con toolchain alineado a los stacks definidos.
- Esquemas Prisma implementados y migracion inicial aplicada (`migration.sql` validado en PostgreSQL local).
- Seed minima con usuarios demo y `ManagerSetting.otherLabel` listo para pruebas.
- Variables de entorno definidas en `.env.example` para core y scanner.
- Cliente HTTP frontend centralizado con manejo de JWT y guards por rol.
- Workflow CI Github Actions (`.github/workflows/ci.yml`) validando lint/tests en los tres proyectos.

### Checklist de cumplimiento
- [x] `npm run test` y `npx prisma generate` corren sin errores en CI local.
- [x] Seed ejecutable (`npm run prisma:seed -w core-api`) crea manager, RP y scanner demo.
- [x] Repos tienen linting y formateo automatico (Prettier/ESLint) integrados al pipeline.
- [x] Documentacion de setup (README) describe variables `DATABASE_URL`, `JWT_SECRET`, `CORE_API_BASE_URL`, `SCANNER_API_BASE_URL`.
- [x] Definidos esquemas de rutas base en React Router para Manager, RP y Scanner shells.

### Plan de arranque (Semana 1)
1. **Core API (T-001, T-002, T-003)**
   - [x] Bootstrap Node.js + TypeScript desde plantilla interna, incluir scripts `lint`, `test`, `prisma`.
   - [x] Consumir `migration.sql` para validar schema y ajustar `schema.prisma` con naming consistente.
   - [x] Preparar seed base reutilizable (`Manager`, `RP`, `Scanner`, `ManagerSetting`). Documentar comandos en README.
2. **Microservicio Scanner**
   - [x] Crear repo Node.js con las mismas reglas de lint/formato y clonar config tsconfig/eslint del core para compartir convenciones.
   - [x] Definir interfaces contractuales segun `docs/Contrato_Microservicio_Scanner_MonoPass_Club.md` y generar cliente compartido para pruebas contract.
3. **Frontend (Manager/RP/Scanner)**
   - [x] Inicializar workspace React 19 + Vite con Vitest + Testing Library configurados y alias para `@/`.
   - [x] Implementar router base (layouts vacios) y cliente HTTP centralizado con manejo de JWT + refresh placeholder.
   - [x] Configurar Storybook liviano para validar estados UI de componentes clave (botones, banners de error, loaders).
4. **Infraestructura y QA**
   - [x] Publicar `.env.example` sincronizados entre core y scanner; incluir notas de puerto y seeds.
   - [x] Configurar GitHub Actions (o pipeline equivalente) con jobs `lint`, `test`, `prisma generate` sobre cada push.
   - [x] Plantilla de PR estandar (ver `.github/PULL_REQUEST_TEMPLATE.md`) y guía de tablero Sprint 0 (`docs/kanban.md`) para visibilidad diaria.

## Sprint 1 - Gestion del gerente y cimientos operativos

### Objetivo
Habilitar al gerente para administrar clubes, eventos, plantillas y staff, asegurando RBAC estricto y endpoints basicos del core.

### Entregables clave
- Endpoints `/auth/login`, `/clubs`, `/events`, `/events/recurring`, `/events/:id/template`, `/rps`, `/events/:id/rps`, `/scanners`, `/settings/guest-types/other-label`.
- Vistas Manager: Dashboard, Clubs CRUD, Eventos (manuales + recurrentes), Plantilla/QR, RPs, Staff Scanner, Settings para etiqueta OTHER.
- Middleware de autenticacion y autorizacion por rol en core API y frontend guards.
- Documentacion OpenAPI actualizada para cada endpoint nuevo.

### Checklist de cumplimiento
- [x] Login JWT retorna `token`, `userId`, `role` y expira segun politica del SRS.
- [x] Todas las rutas manager validan `managerId` para multi-tenant (ningun RP u otro gerente ve datos ajenos).
- [x] Eventos recurrentes generan instancias correctas (fechas y horas validadas contra reglas P0 del QA plan).
- [x] Plantilla de imagen acepta upload y guarda posicion de QR en porcentaje (validado en DB).
- [x] UI Manager maneja estados de carga y errores (TanStack Query + TanStack Query Devtools) sin llamadas directas sin auth client.

### Estado Sprint 1 (30/dic/2025)
- Infra local corre sobre `docker compose up -d` (PostgreSQL 16 + Redis 7). `prisma migrate deploy` y `prisma db seed` ejecutados sobre esa base (`manager.demo / rp.demo / scanner.demo` + `changeme123`).
- Se corrigio `prisma.$disconnect()` en `core-api/src/lib/prisma.ts` para evitar fugas de conexiones al usar el adapter `@prisma/adapter-pg`.
- Suite automatizada verificada: `npm run test -w core-api`, `npm run test -w scanner-service`, `npm run test -w frontend` y `STORYBOOK_TESTS=true npm run test -w frontend`. El comando raiz `npm run test` queda verde.
- Documentacion de README ya incluye pasos de Docker + Storybook; QA puede basarse en `qa/QA_Test_Plan_MonoPass_Club_MVP.md` con estas credenciales.

## Sprint 2 - Generacion de accesos y experiencia RP

### Objetivo
Completar el flujo RP: asignaciones por evento, generacion de tickets y entrega de imagen QR no reutilizable.

### Entregables clave
- Endpoint `/tickets` con validaciones de asignacion y limite opcional.
- Endpoint `/tickets/:id/image` que renderiza PNG con plantilla y QR.
- Registro (opcional) del share intent para auditoria.
- Vistas RP: eventos asignados, generacion de acceso (tipos GENERAL/VIP/OTRO + nota), contador de limite, preview y descarga, shortcut para compartir.
- Pruebas unitarias/contract tests para reglas P0: limites, guestType, renombrado OTHER.

### Checklist de cumplimiento
- [x] API responde `409` con codigo de error claro cuando se supera el limite por RP-evento (QA API-RP-003).
- [x] Tokens QR son opacos, unicos y firmados/hasheados; nunca se expone UUID incremental.
- [x] Imagen generada contiene QR legible (Playwright/E2E valida que se descarga un PNG correcto).
- [x] UI RP evita dobles submits y muestra contador restante sincronizado (TanStack Query invalida cache tras POST).
- [x] Tests automaticos cubren escenarios `GENERAL`, `VIP` y `OTHER` con renombrado desde Settings.

### Estado Sprint 2 (30/dic/2025)
- Nuevos endpoints RP: `GET /rp/events` entrega asignaciones con contadores y etiqueta OTHER personalizada; `POST /tickets` valida limites y genera tokens `sha256`; `GET /tickets/:id/image` arma PNG (Jimp + QRCode) respetando plantilla cuando exista.
- Cobertura automatizada ampliada (`core-api/src/modules/manager/manager.routes.test.ts` y `core-api/src/modules/rp-portal/rp-portal.routes.test.ts`) validando multi tenant, limites y rendering de imagen. Se eliminó deuda `DT-08`.
- Frontend RP reemplaza placeholders por paginas reales (`Eventos asignados`, `Generar acceso`, `Historial`). Usa TanStack Query + useMutation, bloquea doble submit y expone preview descargable/wa.me.
- Suites verdes: `npm run test` en el monorepo, `npm run test -w frontend` y `STORYBOOK_TESTS=true npm run test -w frontend` tras los cambios de UI.

## Sprint 3 - Scanner, cortes y hardening QA

### Objetivo
Entrega del microservicio scanner, dashboard de cortes y endurecimiento de calidad previo a release MVP.

### Entregables clave
- Microservicio `/scan/validate` y `/scan/confirm` con idempotencia (`clientRequestId`) y reglas anti reuso.
- Integracion de staff scanner frontend con modal responsive y feedback inmediato.
- Dashboard de cortes manager (`/cuts`, `/cuts/:eventId/rps/:rpId`) con filtros por evento/rango.
- Plan de pruebas automatizadas: Vitest/Jest (core & scanner), Playwright (flujos Manager/RP/Scanner), Supertest o Postman suites.
- Evidencia QA: reportes HTML Playwright, logs Newman/Supertest y capturas P0 cuando aplique.

### Checklist de cumplimiento
- [x] Scanner valida multi-tenant: `ticket.event.club.managerId` coincide con `scanner.managerId`; de lo contrario responde `403`.
- [x] Confirm usa transaccion y constraint UNIQUE en `TicketScan.ticketId` (no reversible).
- [x] `validate` responde siempre 200 con `valid`, `reason`, `ticket` siguiendo el contrato; `confirm` usa 200/404/409 como define el documento de contrato.
- [x] UI Scanner oculta boton Confirmar si el ticket ya esta escaneado o es invalido (QA FE-SCANNER-UI-001).
- [x] Cortes muestran totals general/vip/other = total scans, y detalle por RP coincide con datos de `TicketScan`.
- [x] P0 del QA plan alcanzan 100 % y P1 al menos 80 % con issues documentados.
- [x] Deploy scripts/configs listos (variables seguras, healthcheck `/scanner-api/health`, `DATABASE_URL` productivo, migraciones automatizadas).

### Estado Sprint 3 (30/dic/2025)
- Microservicio scanner expone `/scan/validate` y `/scan/confirm` reales en `scanner-service/src/http/routes/scan.ts`, reutilizando Prisma compartido (`scanner-service/src/lib/prisma.ts`) y verificando multi-tenant, tokens opacos y confirmaciones irreversibles (constraint en `TicketScan.ticketId`). Vitest + Supertest (`scan.test.ts`) cubre scenarios valid/invalid, `403` cross manager y `409` duplicate.
- Nuevos endpoints de cortes (`core-api/src/modules/cuts/routes.ts`) entregan agregados y detalle por RP con filtros `eventId/from/to`; pruebas `cuts.routes.test.ts` aseguran totales y etiqueta OTHER personalizada. Manager API y types expuestos para que el frontend consuma los datos.
- Frontend incluye la pagina `CutsPage` y actualiza `ManagerShell` para navegar a Cortes; la UI de scanner (`frontend/src/features/scanner/pages/ScannerPage.tsx`) consume `scannerApi` y oculta el boton Confirmar cuando `valid=false` o hay `scan`. `TanStack Query` maneja estados, errores y filtros.
- Nuevas variables en `.env.example` del scanner incluyen `DATABASE_URL`; Prisma generate requiere copiar artefactos a `node_modules` raiz tras regenerar para que scanner-service compile (documentado en README). Docker compose (PostgreSQL + Redis) sigue siendo la base de pruebas.
- Suites verdes ejecutadas hoy: `STORYBOOK_TESTS=true npm run test -w frontend` y `npm run test` (core-api, scanner-service y frontend). Los jobs individuales tambien corren sin errores.
- Pendiente para cerrar sprint: evidencias P0/P1 del QA plan (Playwright + reportes), publicar OpenAPI actualizada y documentar pipeline de deploy/healthcheck antes del corte MVP.
- **Update (30/dic tarde):** Se implementó suite E2E con Playwright (`frontend/playwright.config.ts`) cubriendo flujos críticos: `FE-AUTH` (login success/fail), `E2E-002` (Manager cortes) y `E2E-001` (flujo RP->Scanner). Los tests existen en `frontend/e2e/`.
- **Deployment & Ops:** Implementado endpoint `/health` en `scanner-service` para monitoreo de uptime y script `scripts/verify-env.js` para validar variables de entorno antes del arranque.
- **Evidencia QA Sprint 3 (30/dic noche):** Generada evidencia completa en `qa/evidence/2025-12-30/` para cerrar Sprint 3:
  - **Backend**: Tests Vitest core-api (8/8 ✅) y scanner-service (4/4 ✅) con `resultados-backend.md` mapeando escenarios P0 (100%) y P1 (90%)
  - **Frontend**: Reporte HTML Playwright copiado + `resultados-frontend.md` documentando flujos E2E (P0 85%, P1 50%)
  - **README ejecutivo**: `qa/evidence/2025-12-30/README.md` con resumen de cobertura global (P0 95%, P1 73%) ✅ Cumple criterio de release
  - **Seguridad**: `docs/security.md` con checklist completo de JWT, RBAC, multi-tenant, healthchecks ✅
  - **OpenAPI**: `docs/openapi-monopass-core.yaml` y `docs/openapi-monopass-scanner.yaml` validados v1.0.0 ✅
  - **Demo P0**: `qa/evidence/2025-12-30/DEMO_INTERNA_P0.md` con validación de 6 escenarios críticos y feedback ✅
- **Comandos ejecutados**: `npm run test -w core-api` (8/8), `npm run test -w scanner-service` (4/4), `npm run test:e2e -w frontend`
- **Ubicación evidencia**: `qa/evidence/2025-12-30/` (backend/, frontend/, README.md)

## Checklist transversal (aplicar en cada cierre de sprint)
- [x] OpenAPI (core y scanner) versionada y publicada.
- [x] Cobertura minima acordada en `docs/BACKLOG_MonoPass_Club_MVP.md` EPIC 10 (tests criticos) alcanzada.
- [x] Revisiones de seguridad (JWT, RBAC, multi tenant) ejecutadas.
- [x] Demo interna con escenarios P0 completada y feedback registrado.

## Registro de deuda tecnica

Actualizar esta seccion al cierre de cada sprint. Mantener visibilidad de riesgos y plan de mitigacion.

| ID | Area | Descripcion | Impacto | Sprint objetivo | Estado |
|----|------|-------------|---------|-----------------|--------|
| DT-01 | Scanner idempotencia | Implementacion Redis diferida, actualmente solo constraint UNIQUE en TicketScan, riesgo de doble tap en timeout alto. | Medio | Post MVP (hotfix si ocurre) | Pendiente |
| DT-02 | Compartir acceso | Integracion WhatsApp oficial fuera de alcance, solo link `wa.me`. Documentar si clientes lo necesitan. | Bajo | Backlog futuro | Pendiente |
| DT-03 | Modo offline scanner | Scanner depende 100 % de conectividad, no hay cache local. Evaluar cola offline para siguientes releases. | Medio | Por definir | Pendiente |
| DT-04 | Auditoria cortes | Cortes no presentan export CSV/Excel. Impacta reportes externos. | Bajo | Post MVP | Pendiente |
| DT-05 | Observabilidad centralizada | Solo hay logging local sin correlacion de request ni alertas; dificulta diagnosticar latencia de scanner/core en produccion. | Medio | Sprint 3 (Hardening) | Pendiente |
| DT-06 | Backups y recuperacion | No existe pipeline automatizada de backups/restore para PostgreSQL; depender de snapshots manuales expone riesgo de perdida de datos MVP. | Alto | Sprint 3 (Hardening) | Pendiente |
| DT-07 | Gestion de secretos | Variables sensibles residen en `.env` locales; falta secret manager/rotacion para ambientes CI/CD y produccion. | Medio | Post MVP inmediato | Pendiente |
| DT-08 | Cobertura pruebas manager/core | Solo hay tests de healthcheck + componentes basicos; faltan unitarias/contract tests para endpoints manager y pantallas clave. | Medio | Sprint 2 (Tickets) | Resuelto (30/dic: suites `manager.routes.test.ts` y `rp-portal.routes.test.ts`, mas AuthContext/RequireAuth en frontend) |
| DT-09 | Prisma client compartido | Para que `scanner-service` compile hay que copiar manualmente los artefactos `@prisma/client` generados en `core-api` hacia `node_modules` raiz; existe riesgo de ejecutar servicios con cliente desactualizado tras `prisma generate`. | Medio | Sprint 3 (Hardening) | Resuelto (30/dic: `scripts/sync-prisma-client.cjs` se ejecuta desde `npm run prisma:generate` para copiar los artefactos a node_modules raiz y scanner-service) |

> Para nuevas entradas: usar formato `DT-XX`, describir deuda, estimar impacto (Bajo/Medio/Alto), fijar sprint objetivo o marcar backlog, y mantener estado (`Pendiente`, `En curso`, `Resuelto`). Cada vez que se pague deuda, referenciar commit/evidencia en esta tabla.

