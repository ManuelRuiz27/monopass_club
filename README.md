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

Cada vez que el schema cambie, `npm run prisma:generate` (o `npm run prisma:generate -w core-api`) ejecuta `scripts/sync-prisma-client.cjs`, copiando los artefactos de `@prisma/client` y `.prisma` hacia `node_modules` raiz y el workspace `scanner-service` (si existe su `node_modules`). Esto evita pasos manuales para que ambos servicios compartan exactamente el mismo cliente.

## Deploy Render + Supabase (sin Docker)
Usa el blueprint `render.yaml` o configura el servicio manualmente con estos comandos:
- Build: `npm install && npm run prisma:generate -w core-api && npm run build -w core-api`
- Start: `npm run prisma:migrate -w core-api && npm run start -w core-api`

Variables en Render:
- `DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres?sslmode=require`
- `JWT_SECRET=<min-16-chars>`
- `CORE_API_BASE_URL=https://<tu-servicio>.onrender.com`
- `SCANNER_API_BASE_URL=https://<tu-scanner>.onrender.com` (si aplica)

Render provee `PORT`. Verifica `GET /health` luego del deploy.

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
