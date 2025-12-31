# MonoPass Club - Scanner Service

Microservicio dedicado a `validate` y `confirm` para el equipo de puerta.

## Scripts

```bash
npm install
npm run dev
npm run test
```

## Variables (`.env`)

```
PORT=4100
CORE_API_BASE_URL=http://localhost:4000
SCANNER_API_KEY=change-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/monopass?schema=public
```

Los endpoints `/scan/validate` y `/scan/confirm` consultan la misma base de datos que el Core (`Ticket`, `TicketScan`, `ManagerSetting`, etc.) para garantizar reglas anti reuso e informacion en tiempo real. Recuerda alinear `SCANNER_API_KEY` con el `JWT_SECRET` del Core para que los tokens emitidos por `/auth/login` funcionen en ambos servicios.
