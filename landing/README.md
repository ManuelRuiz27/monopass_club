# Landing Pass Monkey

Aplicacion de landing separada del frontend operativo principal.

## Documentacion relacionada

La documentacion de estrategia, copy y cambios de landing se concentra en `../docs/landing/`.
Los planes generales del repo ahora viven en `../docs/plans/`.

## Objetivo actual

La landing opera en modo prospeccion:

- Captura prospectos para agenda comercial.
- Guarda el registro en BD via Core API.
- El equipo comercial contacta al lead para la reunion.

## Variables de entorno

Usa `landing/.env.example` como base.

- `VITE_CORE_API_BASE_URL`: URL del Core API (ej. `http://localhost:4000`)
- `VITE_LANDING_MOCK_BACKEND`: `true` para mockear backend de landing en frontend.

## Endpoint requerido para prospeccion

- `POST /landing/leads`

## Desarrollo local

```bash
npm run dev -w landing
```

## Pruebas con backend 100% mock

1. Copia `landing/.env.example` a `landing/.env`.
2. Configura `VITE_LANDING_MOCK_BACKEND=true`.
3. Levanta la app: `npm run dev -w landing`.

Mock principal usado en este flujo:

- `POST /landing/leads`

## Tracking de conversion

La landing envia eventos a `window.dataLayer` (si existe) y tambien conserva copia local en `window.__landingEventLog` para QA.

Eventos principales de embudo:

- `landing_page_view`
- `landing_section_view`
- `lead_form_started`
- `lead_form_submit_attempt`
- `lead_form_submit_validation_error`
- `lead_form_submit_success`
- `lead_form_submit_error`
- `cta_schedule_demo_click`

## Build

```bash
npm run build -w landing
```
