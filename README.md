# MonoPass Club Monorepo

## Requisitos
- Node.js 22+
- Docker y Docker Compose (para Postgres/Redis locales)

## Levantar infraestructura local
```bash
# 1) Contenedores de base de datos y Redis
docker compose up -d

# 2) Dependencias por workspace
npm install --workspaces core-api scanner-service frontend

# 3) Variables (.env) basadas en los .env.example de cada paquete
```

### Migraciones y seed
```bash
npm run prisma:generate
npm run prisma:migrate -w core-api
npm run prisma:seed -w core-api
```
La configuracion `prisma.config.ts` ya apunta al comando `tsx` que usa el adapter `@prisma/adapter-pg` sobre la conexion Docker (`postgresql://postgres:postgres@localhost:5432/monopass`).

Cada vez que el schema cambie, `npm run prisma:generate` (o `npm run prisma:generate -w core-api`) ejecuta `scripts/sync-prisma-client.cjs`, copiando los artefactos de `@prisma/client` y `.prisma` hacia `node_modules` raiz y el workspace `scanner-service` (si existe su `node_modules`). Esto evita pasos manuales para que ambos servicios compartan exactamente el mismo cliente.

Credenciales demo sembradas (`changeme123` como password):
- `manager.demo`
- `rp.demo`
- `scanner.demo`

## Servicios
- `npm run dev -w core-api`
- `npm run dev -w scanner-service`
- `npm run dev -w frontend`

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
```
