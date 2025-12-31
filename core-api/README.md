# MonoPass Club - Core API

Servicios principales para gerente y RP.

## Uso
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Con Docker corriendo (`docker compose up -d` en la raíz) los `.env` pueden apuntar a `postgresql://postgres:postgres@localhost:5432/monopass?schema=public`.

El script `npm run prisma:generate` ejecuta `scripts/sync-prisma-client.cjs` para copiar el cliente generado hacia `node_modules` raíz y el workspace `scanner-service`, evitando sincronizaciones manuales cada vez que cambie el schema.

Variables esperadas (`.env`):
```
DATABASE_URL=
JWT_SECRET=
CORE_API_BASE_URL=
SCANNER_API_BASE_URL=
PORT=4000
```

## Endpoints Sprint 1
- `POST /auth/login`
- `GET/POST/PATCH /clubs`
- `GET/POST /events`, `POST /events/recurring`, `PUT /events/:id/template`, `GET/POST /events/:id/rps`
- `GET/POST/PATCH /rps`
- `GET/POST/PATCH /scanners`
- `GET/PATCH /settings/guest-types/other-label`

Todos los endpoints requieren JWT (`Authorization: Bearer ...`) excepto el login. El seed crea usuarios demo (`manager.demo`, `rp.demo`, `scanner.demo`, password `changeme123`).
