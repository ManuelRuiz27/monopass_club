# MonoPass Club Monorepo

## Requisitos
- Docker y Docker Compose
- Node.js 22+ (solo si quieres correr servicios fuera de Docker)

## Levantar frontend + backend en Docker (local)
```bash
# 1) Construir imagen y levantar servicios
docker compose up --build -d
```

Servicios expuestos:
- Frontend: `http://localhost:5173`
- Core API: `http://localhost:4000/health`
- Scanner API: `http://localhost:4100/health`
- Postgres: `localhost:5432`

`db-migrate` corre automaticamente al levantar el stack y aplica migraciones Prisma.

### Seed demo (opcional)
```bash
# Carga usuarios demo (reinicia tablas funcionales)
docker compose --profile seed run --rm db-seed
```

Credenciales demo sembradas (`changeme123` como password):
- `manager.demo`
- `rp.demo`
- `scanner.demo`

## Flujo local fuera de Docker (opcional)
```bash
npm install --workspaces core-api scanner-service frontend
npm run prisma:generate
npm run prisma:migrate -w core-api
npm run prisma:seed -w core-api
npm run dev -w core-api
npm run dev -w scanner-service
npm run dev -w frontend
```

Importante: usa el mismo valor de `JWT_SECRET` en `core-api` y `scanner-service`; si no coinciden, `/scan/validate` y `/scan/confirm` responderan `401 Unauthorized`.

Cada vez que el schema cambie, `npm run prisma:generate` (o `npm run prisma:generate -w core-api`) ejecuta `scripts/sync-prisma-client.cjs`, copiando los artefactos de `@prisma/client` y `.prisma` hacia `node_modules` raiz y el workspace `scanner-service` (si existe su `node_modules`). Esto evita pasos manuales para que ambos servicios compartan exactamente el mismo cliente.

## Deploy en Render con Blueprint (monorepo completo)
El archivo `render.yaml` despliega:
- `monopass-db` (PostgreSQL administrado en Render)
- `core-api` (Fastify + Prisma)
- `scanner-service` (Fastify)
- `monopass-frontend` (sitio estatico Vite)
- `monopass-landing` (sitio estatico Vite)

Pasos:
1. En Render: `New +` -> `Blueprint`.
2. Conecta el repo y selecciona la rama.
3. Render detectara `render.yaml` y creara los 5 recursos.
4. Completa las variables marcadas con `sync: false`:
   - `core-api`: `CORS_ALLOWED_ORIGINS`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `APP_PUBLIC_BASE_URL`, `APP_LOGIN_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
   - `scanner-service`: `CORE_API_BASE_URL` (URL publica de `core-api`).
   - `monopass-frontend`: `VITE_CORE_API_BASE_URL`, `VITE_SCANNER_API_BASE_URL`.
   - `monopass-landing`: `VITE_CORE_API_BASE_URL`.
5. Despues del primer deploy, valida:
   - `GET https://<core-api>.onrender.com/health`
   - `GET https://<scanner-service>.onrender.com/health`
   - `GET https://<core-api>.onrender.com/landing/pricing`

Notas:
- `JWT_SECRET` en `core-api` se genera automaticamente y `scanner-service` lo hereda desde el blueprint.
- `DATABASE_URL` se enlaza automaticamente desde `monopass-db`.
- Los sitios estaticos incluyen rewrite SPA a `index.html`, necesario para rutas como `/checkout/success`.

## Deploy en Render solo para Landing (sin frontend manager/rp/scanner)
Si por ahora solo quieres produccion de landing, usa `render.landing.yaml` en el Blueprint de Render.
Ese blueprint crea un stack minimo:
- `monopass-db`
- `core-api`
- `monopass-landing`

## Storybook + pruebas
Instala los navegadores una sola vez:
```bash
cd frontend
npx playwright install chromium
```
Luego ejecuta los tests automáticos de las stories cuando lo requieras:
```bash
$env:STORYBOOK_TESTS='true'; npm run test -w frontend; Remove-Item Env:STORYBOOK_TESTS   # PowerShell
# ó (bash)
STORYBOOK_TESTS=true npm run test -w frontend
```

## Limpieza
```bash
docker compose down
# Si quieres borrar datos de Postgres/Redis:
docker compose down -v
```
