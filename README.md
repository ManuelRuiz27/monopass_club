# MonoPass Club Monorepo

Monorepo con backend, scanner, frontend operativo y landing comercial.

## Estructura del repo

- `core-api/`: API principal (Fastify + Prisma).
- `scanner-service/`: servicio de validacion y confirmacion de accesos.
- `frontend/`: app operativa para manager, RP, scanner y director.
- `landing/`: sitio comercial publico.
- `docs/`: documentacion canonica del proyecto.
- `qa/`: planes y evidencia de pruebas.
- `scripts/`: utilidades operativas y scripts locales.
- `scratch/`: archivos pequenos de apoyo conservados fuera de la raiz.
- `logs/`: salidas locales; no es documentacion fuente.

Los documentos de producto, planes y notas de landing ya no se mantienen en la raiz. La referencia principal ahora es `docs/`.

## Requisitos

- Docker + Docker Compose para correr el stack completo.
- Node.js 22+ si vas a ejecutar workspaces fuera de Docker.

## Arranque rapido con Docker

```bash
docker compose up --build -d
```

Servicios expuestos:

- Frontend: `http://localhost:5173`
- Core API: `http://localhost:4000/health`
- Scanner API: `http://localhost:4100/health`
- Postgres: `localhost:5432`

`db-migrate` corre al levantar el stack y aplica las migraciones Prisma.

### Seed demo opcional

```bash
docker compose --profile seed run --rm db-seed
```

Usuarios demo sembrados (`changeme123`):

- `director.demo`
- `manager.demo`
- `rp.demo`
- `scanner.demo`

El seed tambien crea el evento `Drift Day SLP (demo)` con:

- 6 scanners: `scanner.demo`, `scanner.a1.2`, `scanner.a2.1`, `scanner.a2.2`, `scanner.a3.1`, `scanner.a3.2`
- 8 puntos de venta RP: `rp.demo`, `rp.2`, `rp.3`, `rp.4`, `rp.5`, `rp.6`, `rp.7`, `rp.8`

## Desarrollo local sin Docker

```bash
npm install --workspaces core-api scanner-service frontend landing
npm run prisma:generate
npm run prisma:migrate -w core-api
npm run prisma:seed -w core-api
npm run dev -w core-api
npm run dev -w scanner-service
npm run dev -w frontend
npm run dev -w landing
```

Usa el mismo `JWT_SECRET` en `core-api` y `scanner-service`; si no coinciden, `/scan/validate` y `/scan/confirm` responderan `401 Unauthorized`.

Cada vez que cambie el schema, `npm run prisma:generate` ejecuta `scripts/sync-prisma-client.cjs` para sincronizar `@prisma/client` y `.prisma` entre la raiz y `scanner-service`.

## Scripts utiles del workspace

- `npm run lint`: lint de `core-api`, `scanner-service` y `frontend`.
- `npm run test`: pruebas de `core-api`, `scanner-service` y `frontend`.
- `npm run qa:quick`: build + pruebas rapidas de backend y scanner.
- `npm run qa:e2e`: E2E de frontend.
- `npm run qa:all`: suite rapida + E2E.

## Deploy en Render

`render.yaml` despliega el monorepo completo:

- `monopass-db`
- `core-api`
- `scanner-service`
- `monopass-frontend`
- `monopass-landing`

Pasos:

1. En Render, crea un `Blueprint`.
2. Conecta el repo y selecciona la rama.
3. Render detectara `render.yaml` y creara los recursos.
4. Completa las variables con `sync: false`:
   - `core-api`: `CORS_ALLOWED_ORIGINS`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `APP_PUBLIC_BASE_URL`, `APP_LOGIN_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
   - `scanner-service`: `CORE_API_BASE_URL`.
   - `monopass-frontend`: `VITE_CORE_API_BASE_URL`, `VITE_SCANNER_API_BASE_URL`.
   - `monopass-landing`: `VITE_CORE_API_BASE_URL`.
5. Valida despues del primer deploy:
   - `GET https://<core-api>.onrender.com/health`
   - `GET https://<scanner-service>.onrender.com/health`
   - `GET https://<core-api>.onrender.com/landing/pricing`

Notas:

- `JWT_SECRET` se genera en `core-api` y `scanner-service` lo hereda desde el blueprint.
- `DATABASE_URL` se enlaza desde `monopass-db`.
- Los sitios estaticos incluyen rewrite SPA a `index.html`.

### Solo landing

Si solo quieres produccion de landing, usa `render.landing.yaml`. Ese blueprint crea:

- `monopass-db`
- `core-api`
- `monopass-landing`

## Documentacion

Empieza en `docs/README.md`. Rutas utiles:

- `docs/Architecture.md`
- `docs/API_Documentation.md`
- `docs/Deployment_Manual.md`
- `docs/security.md`
- `docs/landing/`
- `docs/plans/`
- `core-api/README.md`
- `frontend/README.md`
- `landing/README.md`
- `scanner-service/README.md`

## Storybook y pruebas visuales

```bash
cd frontend
npx playwright install chromium
```

Para ejecutar las pruebas de stories:

```bash
$env:STORYBOOK_TESTS='true'; npm run test -w frontend; Remove-Item Env:STORYBOOK_TESTS
```

En Bash:

```bash
STORYBOOK_TESTS=true npm run test -w frontend
```

## Director monetizacion

- Rutas: `/director/plans`, `/director/subscriptions`, `/director/invoices`, `/director/payments/:id/refund`, `/director/finance/*`, `/director/ledger-entries`, `/director/revenue-dashboard`, `/director/reports/monetization`.
- Webhook agnostico por provider: `POST /payments/webhook/:provider`.
- El dinero se guarda en centavos MXN (`Int`).
- La calculadora financiera MX es un estimador interno, no asesoria fiscal o legal.

Feature flags de adapters de pago stub:

- `DIRECTOR_PAYMENTS_STRIPE_ENABLED=true|false`
- `DIRECTOR_PAYMENTS_CONEKTA_ENABLED=true|false`
- `DIRECTOR_PAYMENTS_MERCADOPAGO_ENABLED=true|false`
- `DIRECTOR_PAYMENTS_OPENPAY_ENABLED=true|false`

Por defecto se soporta `manual`; el resto responde con adapters stub.

## Limpieza

```bash
docker compose down
docker compose down -v
```
