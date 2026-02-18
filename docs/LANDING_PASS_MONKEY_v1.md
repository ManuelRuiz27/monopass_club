# PASS MONKEY – Landing Page Oficial v1
Versión: 1.0
Tipo: Landing de conversión (Modelo SaaS continuo – Acceso por invitación)
Objetivo: Generación de leads calificados

---

# 1. OBJETIVO ESTRATÉGICO

La landing NO es informativa.
Es una página de conversión para organizadores y managers de eventos exclusivos.

Debe:

- Comunicar posicionamiento premium
- Explicar qué es Pass Monkey en menos de 10 segundos
- Reforzar modelo por invitación
- Convertir visitas en solicitudes de acceso

No incluir:
- Blog
- Precios públicos
- Comparativas
- Roadmap
- Funciones técnicas extensas

---

# 2. POSICIONAMIENTO DE MARCA

Pass Monkey es:

> Plataforma privada de control de acceso digital para eventos exclusivos.

No es:
- App genérica
- Sistema masivo
- Herramienta económica

Narrativa:
Aliado tecnológico para organizadores que operan con estándar premium.

---

# 3. ESTRUCTURA DE LA LANDING

Orden obligatorio:

1. Hero
2. Statement
3. Problema / Solución
4. Cómo Opera (3 pasos)
5. Modo Staff (demo visual)
6. Acceso por Invitación
7. CTA + Formulario
8. Footer

---

# 4. SECCIONES DETALLADAS

---

## 4.1 HERO

Contenido:

Headline:
El acceso define la experiencia.

Subheadline:
Control de acceso digital para eventos exclusivos. Plataforma privada por invitación.

Botones:
- Solicitar acceso privado (Primario)
- Agendar conversación (Secundario)

Elementos visuales:
- Mockup real del scanner en modo oscuro
- Estado validado (verde)
- Glow morado sutil

Requisitos técnicos:
- Animación de entrada con GSAP
- Split reveal para headline
- Fade + translate Y para mockup
- Duración total animación hero: máximo 1.2s

---

## 4.2 STATEMENT

Texto único centrado:

Diseñado para organizadores que operan con estándar premium.

Animación:
Fade in + translate Y

---

## 4.3 PROBLEMA / SOLUCIÓN

Layout: 2 columnas (responsive stack en mobile)

Columna izquierda – Problema:
- Papel y listas improvisadas
- Duplicidad de accesos
- Fricción en puerta
- Falta de visibilidad operativa

Columna derecha – Solución:
- Accesos digitales elegantes
- Validación instantánea
- Operación optimizada
- Control por sede

Animación:
- Reveal por scroll (ScrollTrigger)
- Highlight progresivo en bloque solución

---

## 4.4 CÓMO OPERA

Formato: 3 cards horizontales

01 – Configura sede y evento  
02 – Emite accesos digitales  
03 – Staff valida en segundos  

Requisito:
- Barra de progreso animada por scroll
- No usar animaciones exageradas

---

## 4.5 MODO STAFF

Mostrar screenshots reales:

Estados:
- Scan
- Validado
- Nota / Resultado

Texto acompañante:
Optimizado para baja luz y operación rápida.

No usar video pesado.
Preferible crossfade controlado entre imágenes.

---

## 4.6 ACCESO POR INVITACIÓN

Explicación simple en 3 pasos:

1. Solicitas acceso
2. Validamos tu operación
3. Recibes cuenta de prueba privada

Importante:
Reforzar exclusividad sin sonar restrictivo.

No usar palabras como:
- Beta
- Limitado
- Nuevo

---

## 4.7 FORMULARIO (LEAD)

Campos obligatorios:

- Nombre
- Rol (Organizador / Manager / Productora)
- Ciudad
- Número estimado de sedes
- Teléfono
- Email

Campo opcional:
- Instagram del evento

Botón:
Enviar solicitud

Requisitos:

- Validación frontend
- Endpoint POST /api/leads
- Guardar en DB organizada por fecha
- Respuesta automática tipo:
  "Solicitud recibida. Nuestro equipo responderá en 24–48h."

No integrar CRM complejo en v1.

---

# 5. DISEÑO Y SISTEMA VISUAL

Fondo principal:
#0B0B12

Color primario:
#5B2EFF

Acento:
#7A5CFF

Validación:
Verde solo en estados UI (no branding)

Estilo:
- Minimalista
- Oscuro
- Profesional
- Espacios amplios
- Sin saturación

No usar:
- Gradientes agresivos
- Glassmorphism excesivo
- Neon fuerte
- Efectos 3D innecesarios

---

# 6. ANIMACIÓN (GSAP)

Bibliotecas:

- GSAP
- ScrollTrigger

Requisitos:

- Soporte para prefers-reduced-motion
- Desactivar pinning en mobile
- No usar más de 1 sección pinned
- Evitar jank

Eases:
power2.out
none (para scrub)

Duraciones:
0.6s – 0.9s promedio

---

# 7. PERFORMANCE

Obligatorio:

- Lighthouse > 85 en Performance
- Lazy load imágenes
- WebP
- Sin videos pesados en hero
- CSS optimizado

No usar librerías innecesarias.

---

# 8. RESPONSIVE

Breakpoints mínimos:

- Mobile
- Tablet
- Desktop

Mobile:
- Sin pin scroll
- Sin animaciones pesadas
- Layout en columna única

---

# 9. SEO BÁSICO

Title:
Pass Monkey | Control de acceso digital para eventos exclusivos

Meta description:
Plataforma privada de control de acceso digital para organizadores y managers que operan eventos exclusivos.

---

# 10. ENTREGABLES DEL DEV

- Página funcional en entorno staging
- Código modular
- Componente Landing limpio
- Animaciones desacopladas
- Endpoint de leads funcionando
- Pruebas básicas de envío de formulario

---

# 11. CRITERIO DE ACEPTACIÓN

La landing está lista cuando:

- Se entiende qué es Pass Monkey en 10 segundos
- La animación no distrae
- El formulario funciona
- La página se siente premium
- No parece SaaS genérico

---

FIN DEL DOCUMENTO
