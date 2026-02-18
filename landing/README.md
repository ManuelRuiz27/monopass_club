# Landing Pass Monkey

Aplicacion de landing separada del frontend operativo principal.

## Variables de entorno

Usa `landing/.env.example` como base.

- `VITE_CORE_API_BASE_URL`: URL del Core API (ej. `http://localhost:4000`)
- `VITE_LANDING_MOCK_BACKEND`: `true` para mockear el backend completo de landing en frontend.

## Endpoints usados por la landing (fase actual)

- `GET /landing/pricing`
- `POST /landing/leads`

## Desarrollo local

```bash
npm run dev -w landing
```

### Pruebas con backend 100% mock

1. Copia `landing/.env.example` a `landing/.env`.
2. Configura `VITE_LANDING_MOCK_BACKEND=true`.
3. Levanta la app: `npm run dev -w landing`.

Endpoints mockeados:
- `GET /landing/pricing`
- `POST /landing/leads`
- `POST /landing/events/activation`
- `GET /landing/orders/:orderId`

Notas de simulacion:
- Si en `clubName` o `city` escribes `pending`, el checkout redirige a `/checkout/pending`.
- Si escribes `fail` o `failure`, redirige a `/checkout/failure`.
- Por defecto redirige a `/checkout/success`.

## Tracking de conversion

La landing envia eventos a `window.dataLayer` (si existe) y tambien conserva copia local en `window.__landingEventLog` para QA.

Eventos principales de embudo:
- `landing_page_view`
- `landing_section_view`
- `lead_form_started`
- `lead_form_submit_attempt`
- `lead_form_submit_validation_error`
- `lead_form_submit_success`
- `activation_modal_open` / `activation_modal_close`
- `activation_submit_attempt`
- `activation_redirect_checkout`
- `checkout_status_view`
- `checkout_status_loaded` / `checkout_status_error`

## Build

```bash
npm run build -w landing
```
