# Checklist De Ejecucion Local

## 1. Prerequisitos
- Node.js `>=22`
- PostgreSQL local disponible en `postgresql://postgres:postgres@localhost:5432/monopass?schema=public`
- Dependencias instaladas en workspace:

```powershell
npm install
```

## 2. Build Rapido
```powershell
npm run build -w core-api
npm run build -w scanner-service
npm run build -w frontend
```

## 3. Tests Backend
```powershell
npx vitest run src/server.test.ts src/modules/rp-portal/rp-portal.routes.test.ts -w core-api
npx vitest run src/http/routes/scan.test.ts src/http/routes/cuts.test.ts -w scanner-service
```

## 4. E2E Frontend (Playwright)
- Cerrar procesos previos en puertos `4000`, `4100`, `5173` si existen.
- Ejecutar:

```powershell
npx playwright test --project=chromium -w frontend
```

## 5. Validaciones De Permisos (incluidas en E2E)
- `SEC-001`: RP solo descarga PNG de su ticket.
- `SEC-002`: `GET /health/diagnose` y `POST /health/seed` bloqueados para no-manager/no-auth.
- RP->Scanner->Manager: flujo completo confirmado.

## 6. Entorno
- `core-api` usa `ENABLE_HEALTH_SEED` solo si vale `"true"`.
- En Playwright se fuerzan variables locales para evitar mezclar Render/local.
- Prisma en `core-api` y `scanner-service` usa `env.DATABASE_URL` validada.

## 7. Troubleshooting
- Si Playwright falla con puertos ocupados:

```powershell
$ports = 4000,4100,5173; foreach ($p in $ports) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }
```

- Si falla DB en tests:
  - Verificar que PostgreSQL local este arriba.
  - Verificar `DATABASE_URL` local y que la base `monopass` exista.
