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
JWT_SECRET=change-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/monopass?schema=public
```

Los endpoints `/scan/validate` y `/scan/confirm` consultan la misma base de datos que el Core (`Ticket`, `TicketScan`, `ManagerSetting`, etc.) para garantizar reglas anti reuso e informacion en tiempo real. Alinea `JWT_SECRET` del scanner con el `JWT_SECRET` del Core (si omites `JWT_SECRET`, se usa `SCANNER_API_KEY` como fallback) para que los tokens emitidos por `/auth/login` funcionen en ambos servicios. `CORE_API_BASE_URL` puede definirse para futuras integraciones, pero el servicio actual no depende de esa variable para arrancar.
