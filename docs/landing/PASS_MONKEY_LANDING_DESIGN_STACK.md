# Pass Monkey — Landing Design Stack (UI/UX + Motion + Handoff)
**Versión:** 1.0  
**Repo:** `monopass_club`  
**Ruta sugerida:** `/docs/landing/PASS_MONKEY_LANDING_DESIGN_STACK.md`  
**Audiencia de este documento:** Diseñador/a web (UI/UX) + apoyo a Frontend (GSAP)

---

## 0) Resumen ejecutivo
**Pass Monkey** es un sistema profesional de control de acceso para operación nocturna (clubs/eventos).  
La landing es **transaccional** y debe convertir a:
1) **Compra “Activar 1 evento”** ($750 MXN)  
2) **Planes mensuales** ($2,999 MXN / 4 eventos, ~$5,000 MXN / 12 eventos)  
3) **Agendar demo / lead** (secundario)

**Tono:** confrontativo-operativo, premium nocturno, sin promesas riesgosas, sin “startup genérica”.  
**Regla:** no usar cifras de “clientes/eventos” (sin métricas públicas por ahora).

---

## 1) Modelo comercial vigente (para copy y jerarquía)
### Productos/planes
- **Evento Individual (Prueba pagada):** **$750 MXN / evento**
- **Plan Club (Mensual):** **$2,999 MXN / mes** (incluye **4 eventos**)
- **Plan Pro (Mensual):** **~$5,000 MXN / mes** (incluye **12 eventos**)

### Conversión primaria (CTA)
**CTA 1:** “Activar 1 evento por $750” → **pago directo**  
**CTA 2:** “Ver planes mensuales” → ancla a pricing  
**CTA 3:** “Agendar demo” → formulario / contacto

> Nota: No ofrecer “free trial”. Solo “prueba pagada”.

---

## 2) Arquitectura de información (IA) — Orden final recomendado
1. **Hero (impacto + demo visual + CTA compra)**
2. **Cómo funciona (3 pasos, educativo)**
3. **Beneficios clave (3–4 bullets operativos)**
4. **Pricing (3 cards) + CTAs por plan**
5. **Comparativo Tradicional vs Pass Monkey (tabla simple)**
6. **FAQ (objeciones operativas)**
7. **CTA final (Activar 1 evento) + contacto secundario**
8. **Footer (legal y contacto)**

---

## 3) Copy base por sección (texto listo para Figma)
### 3.1 Hero (confrontativo, sin cifras)
**Headline:**  
> Deja de imprimir boletos.

**Subheadline:**  
> Controla accesos en tiempo real con QR dinámico y escaneo profesional en puerta.

**CTA primario:**  
> Activar 1 evento por $750

**CTA secundario:**  
> Ver planes mensuales

**Microcopy (debajo de CTAs):**  
> Activo en minutos. Sin contratos. Pago por evento o mensual.

**Notas de copy (NO usar):**  
- “100% antifraude”, “cero comisiones”, “sin internet”, “el mejor”

---

### 3.2 Cómo funciona (3 pasos)
**Título:**  
> Digitaliza tu próximo evento en 3 pasos.

**Pasos:**
1) **Crea tu evento**  
2) **Genera accesos digitales**  
3) **Valida en puerta en segundos**

**Microcopy opcional (1 línea):**  
> Operación clara. Sin papel. Sin caos.

---

### 3.3 Beneficios clave (operativos)
- **Menos filas y menos broncas en puerta**  
- **Reduce clonaciones y reingresos**  
- **Escaneo rápido + auditoría de accesos**  
- **Dashboard del evento (confirmados / escaneados)**

---

### 3.4 Pricing (cards)
**Evento Individual**  
- **$750 MXN / evento**  
- Ideal para probar en tu próximo evento  
- CTA: **Activar 1 evento**

**Plan Club**  
- **$2,999 MXN / mes**  
- Incluye **4 eventos**  
- CTA: **Contratar Plan Club**

**Plan Pro**  
- **~$5,000 MXN / mes**  
- Incluye **12 eventos**  
- CTA: **Quiero el Plan Pro**

**Microcopy común:**  
> Pago automático o mensual manual. Cancelación flexible.

---

### 3.5 Comparativo (tabla simple)
| Tradicional | Pass Monkey |
|---|---|
| Impresión y talonarios | QR dinámico |
| Control manual | Escaneo en tiempo real |
| Sin métricas | Dashboard |
| Riesgo de clonación | Validación + auditoría |

---

### 3.6 FAQ (corto, operativo)
- **¿Qué necesito en puerta?** → 1 celular por scanner.  
- **¿Puedo usarlo solo una vez?** → Sí, $750 por evento.  
- **¿Cuánto tarda en activarse?** → Inmediato tras pago.  
- **¿Funciona sin internet?** → Requiere conexión activa.  
- **¿Puedo cambiar a plan mensual después?** → Sí, upgrade desde el panel.

---

## 4) UI Kit — Design tokens (para Figma)
> Ajustar nombres a tu sistema de tokens si ya existe.

### 4.1 Colores (base nocturna premium)
**Background**
- `bg/0`: `#0B0B12` (base)
- `bg/1`: `rgba(255,255,255,0.02)` (surface)
- `bg/2`: `rgba(255,255,255,0.04)` (surface hover)

**Brand**
- `brand/primary`: `#5B2EFF`
- `brand/accent`: `#7A5CFF`

**Text**
- `text/primary`: `rgba(234,234,240,0.92)`
- `text/secondary`: `rgba(234,234,240,0.72)`
- `text/muted`: `rgba(234,234,240,0.56)`

**Borders**
- `border/1`: `rgba(255,255,255,0.08)`
- `border/2`: `rgba(255,255,255,0.12)`

**State**
- `state/success`: `#00E676` (solo “VALIDADO”)
- `state/danger`: `#FF4D4D` (solo “RECHAZADO” si se usa)

### 4.2 Tipografía (recomendación)
- **Headings:** Sans moderna (Inter / Plus Jakarta / Sora)  
- **Body:** Inter / System UI  
- **Peso:** H1 700–800, Body 400–500  
- **Tracking:** Headings +0.2% a +0.8% (sutil)

**Escalas sugeridas**
- H1: 52–64 (desktop), 36–44 (mobile)
- H2: 32–40
- H3: 18–22
- Body: 16–18
- Caption: 12–13

### 4.3 Grid y spacing
- Layout max width: **1100–1200px**
- Gutter: 20–24px
- Sección vertical: 56–72px
- Cards padding: 18–26px
- Radius: 18–24px (2xl feel)

### 4.4 Sombras / glow (controlado)
- `glow/primary`: `0 0 60px rgba(122,92,255,0.10)`
- `glow/border`: `0 0 0 1px rgba(91,46,255,0.14)`
> No usar glow en todos los elementos; solo CTAs y card activa.

---

## 5) Componentes UI (definición para diseñador)
### 5.1 Botones
**Primary CTA**
- Fondo: `brand/primary`
- Texto: blanco
- Hover: aumentar brillo + glow sutil
- Tamaño: 44–48px alto
- Texto: “Activar 1 evento por $750”

**Secondary**
- Fondo: transparente
- Borde: `border/2`
- Hover: `bg/2`

**Tertiary link**
- Texto: `text/secondary`
- Subrayado hover

### 5.2 Cards
- Fondo `bg/1`
- Borde `border/1`
- Hover: `border/2` + micro lift (solo desktop)
- Pricing card “recomendada”: borde brand/primary + glow/border

### 5.3 Pricing cards (estructura)
- Label (Plan)
- Price (grande)
- Subtext (periodo)
- 2–4 bullets max
- CTA dentro de card

---

## 6) Visual system — Assets requeridos
### 6.1 Hero media (impacto)
**Recomendación:** video corto 5–6s loop (WebM, sin audio) con escena real de puerta + escaneo.  
- Desktop: video
- Mobile: fallback imagen (poster) + mockup animado

**Requisitos:**
- Sin texto incrustado en video
- Sin stock obvio
- Contraste bajo control (no “neón” exagerado)

### 6.2 Mockups
Screenshots/frames (ya los tienes):
- Staff: Scan
- Staff: Validado
- Staff: Nota/Resultado
- Dashboard mini (si existe, opcional)

**Formato:** PNG/WebP @2x, recorte consistente.

### 6.3 Marca
- Logo (SVG)
- Isotipo Mono (SVG) en uso discreto (esquina, watermark, favicon)

---

## 7) Motion design (GSAP) — Guía para diseño + dev
### 7.1 Principios
- Animación = refuerzo de claridad, no decoración
- Nada elástico, nada rebotón
- Duraciones: 0.6–0.9s
- Ease: `power2.out`
- En mobile: reducir movimiento (o desactivar en low-end)

### 7.2 Hero timeline (6–7s total)
1) Headline reveal (0–1.2s)  
2) Mockup aparece (1.2–2.4s)  
3) Estado “VALIDADO” (2.4–3.8s)  
4) Beneficios 3 bullets (3.8–5.4s)  
5) CTA glow + focus (5.4–6.6s)  
Luego: se detiene la animación, video loop continúa.

### 7.3 Scroll reveals (todas las secciones)
- Fade in + translateY 24px
- Stagger en bullets/cards
- Pricing: reveal suave al entrar, sin pin excesivo

### 7.4 Accesibilidad motion
- `prefers-reduced-motion`: desactivar timelines, mantener solo layout estático

---

## 8) Responsive (comportamiento esperado)
### Breakpoints
- Mobile: 360–430
- Tablet: 768
- Desktop: 1024+
- Wide: 1440+

### Reglas
- Mobile: layout 1 columna, CTAs grandes, sin video pesado
- Pricing: cards en stack vertical (orden: Evento → Club → Pro)
- Tablas: convertir comparativo a cards (o scroll horizontal suave)

---

## 9) Estados y microinteracciones
### Form (si aplica en v1 como secundario)
- `loading`: botón disabled + spinner
- `success`: mensaje breve “Recibido”
- `error`: “No se pudo enviar, intenta de nuevo”

### Pricing CTA
- Primary CTA siempre visible (sticky en mobile opcional):
  - Sticky bottom con “Activar 1 evento” (solo si no estorba UX)

---

## 10) Accesibilidad y contenido legal
- Contraste AA (texto principal)
- Focus visible en inputs/botones
- Labels accesibles (no solo placeholder)
- Footer con:
  - Aviso de privacidad
  - Términos
  - Contacto

---

## 11) Handoff: lo que el diseñador debe entregar
### Archivos Figma
1) **Frame Desktop (1440)** — landing completa
2) **Frame Mobile (390)** — landing completa
3) **Components page** — botones, cards, inputs, chips, badges
4) **Tokens page** — colores, type scale, radii, shadows, spacing
5) **Motion notes** — por sección (timeline + scroll reveal)

### Exportables
- Logo SVG + Mono SVG
- Posters/frames del hero (WebP)
- Mockups UI (WebP)
- Íconos usados (SVG)

### Especificación
- Medidas de paddings/margins por sección
- Estados hover/focus para botones
- Orden de secciones (IA) respetado

---

## 12) Criterio de aceptación (diseño)
El diseño se considera “listo” cuando:
- Se entiende el producto en 10s
- El CTA $750 domina sin verse barato
- Pricing se percibe premium (no plantilla SaaS)
- Mobile se ve limpio y rápido
- Motion es sobrio y no causa lag
- No hay claims riesgosos

---

## 13) Notas de no-promesa (obligatorio)
No afirmar:
- Offline
- “100% antifraude”
- “cero comisiones”
- “garantizado”
Usar formulaciones tipo:
- “reduce clonación”
- “validación + auditoría”
- “operación en tiempo real” (si está implementado)

---
**Fin del documento**
