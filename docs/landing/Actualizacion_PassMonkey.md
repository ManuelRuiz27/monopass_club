# Actualización Pass_Mokey

**Contexto**

- El repositorio `ManuelRuiz27/monopass_club` incluye la aplicación web (*frontend*) de Pass Monkey pero no contiene el código del backend (API). La estructura está organizada por aplicaciones y componentes.
- Se creará una **landing page** dentro del mismo monorepo en la carpeta `/landing` (fuera del frontend) y se publicará de forma independiente (ej. Vercel/Cloudflare Pages).
- La landing debe convertir tráfico en **leads** y en **compras del “evento de prueba”** ($750), y después moverlos a **suscripción mensual**.

## Cambios en la API (Core)

### 1) Nuevo módulo público de Landing
Crear un módulo/namespace público en la API (recomendado: `/public` o `/landing`) que agrupe servicios consumidos por `/landing`.

#### Endpoints propuestos

| Endpoint | Método | Descripción | Request (JSON) | Respuesta (JSON) |
|---|---|---|---|---|
| `/landing/pricing` | GET | Devuelve precios vigentes para prueba pagada, plan base y plan pro. Debe leerse desde config para cambios sin redeploy. | N/A | `{ "event_price": 750, "base_price": 2999, "pro_price": 5000, "currency": "MXN" }` |
| `/landing/leads` | POST | Registra un lead desde landing. Guarda info + UTMs. | `{ "name":"", "club":"", "city":"", "phone":"", "eventDate":"YYYY-MM-DD", "estimatedVolume":250, "utm":{...} }` | `{ "id":"lead_123", "status":"created" }` |
| `/landing/events/activation` | POST | Crea checkout para “Activar 1 evento” ($750). Integra Mercado Pago y devuelve `paymentUrl`. | `{ "clubName":"", "city":"", "ownerName":"", "ownerEmail":"", "phone":"", "utm":{...} }` | `{ "paymentUrl":"https://...","orderId":"order_789" }` |
| `/webhooks/mercadopago` | POST | Webhook proveedor. Valida firma, idempotencia y confirma pago. Dispara provisioning (crear usuario/club/licencia/evento). | payload MP | `{ "success": true }` |
| `/landing/forms/contact` *(opcional)* | POST | Formulario “Agendar demo”/contacto secundario. | `{ "name":"", "email":"", "message":"" }` | `{ "status":"received" }` |

**Notas obligatorias:**
- CORS restringido a dominio de landing.
- Rate limit para endpoints públicos.
- Idempotencia por `payment_id`/`orderId`.
- Sanitización de inputs.
- Logs de auditoría.

---

### 2) Configuración (precios y CTAs)
Los precios y URLs deben salir de configuración/variables, no hardcode.

Variables sugeridas (backend):
- `PRICING_EVENT=750`
- `PRICING_BASE=2999`
- `PRICING_PRO=5000`
- `MP_ACCESS_TOKEN=...`
- `MP_WEBHOOK_SECRET=...` (si aplica)
- `APP_PUBLIC_BASE_URL=...` (para redirects y links)

Variables sugeridas (landing):
- `NEXT_PUBLIC_API_BASE_URL=...`

> La landing puede leer pricing por `GET /landing/pricing` para mostrar valores actuales.

---

### 3) Base de datos mínima
Crear/actualizar tablas:

**`leads`**
- `id`, `name`, `club`, `city`, `phone`, `event_date`, `estimated_volume`
- `utm_source`, `utm_medium`, `utm_campaign`, `created_at`

**`orders`**
- `id/orderId`, `provider`(mercadopago), `payment_id`, `amount`, `currency`
- `status`(pending/paid/failed), `created_at`, `paid_at`
- datos del club/owner/email/phone (mínimos para provisioning)

**`licenses` / `subscriptions`** (según modelo actual)
- soportar `plan_type` = `event` (evento individual), `base`, `pro`
- soportar `billing_type` = `manual` | `subscription` (si aplica)
- `status` active/grace/suspended, `period_start/period_end`, `events_remaining` (si aplica)

---

### 4) Provisioning post-pago (obligatorio)
Al recibir “paid/approved” del webhook:
1. Crear Organizer/Club (si no existe)
2. Crear User owner (password temporal)
3. Asignar licencia `plan_type=event` con vigencia definida
4. Crear evento inicial (o habilitar creación inmediata en panel)
5. Enviar email con acceso (link login + credenciales temporales)

---

### 5) Tracking mínimo (landing)
Eventos mínimos:
- `cta_activate_event_click`
- `cta_view_pricing_click`
- `cta_schedule_demo_click`
- `pricing_plan_selected`

UTM debe guardarse en localStorage y enviarse a `/landing/leads` o `/landing/events/activation`.

---

## Estructura sugerida de `/landing` (monorepo)
- `/landing/package.json`
- `/landing/src` (o `/app` si Next)
- `/landing/.env.example`
- `/landing/README.md`

La landing se despliega independiente, pero vive en el mismo repo.

---

## Criterio de aceptación (E2E)
Listo cuando:
- Botón “Activar 1 evento” abre checkout real
- Pago aprobado dispara webhook
- Se crea usuario/club/licencia/evento automáticamente
- Llega email con acceso
- Landing cumple performance (Lighthouse ≥ 85)
- Endpoints documentados con ejemplos request/response

---
FIN
