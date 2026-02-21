# Especificaciones de Diseño: "Panel Card" (Pass Monkey)

Este documento contiene los "Design Tokens" y detalles precisos de UI extraídos de la landing page actual de **Pass Monkey**. Su objetivo es asegurar consistencia pixel-perfect en nuevos diseños que se agreguen al ecosistema.

## 1. Tipografías (Google Fonts)
- **Textos generales y Párrafos:** `Inter` (Regular 400, Medium 500).
- **Títulos dentro de la card:** `Sora` (Bold 700).
- **Etiquetas (Tags) y micro-copy:** `Chakra Petch` (Bold 700).

## 2. Paleta de Colores
- **Texto Principal (Títulos):** `#f4f4fb`
- **Texto Secundario (Párrafos):** `#b2b0c9`
- **Acid Green (Acento cítrico):** `#ccff00`
- **Alert Pink (Acento fucsia):** `#ff2f66`
- **Neon Cyan (Acento cyan):** `#12f5ff`
- **Neon Purple (Acento morado):** `#5b2eff`
- **Void Panel (Fondo base translúcido):** `rgba(18, 18, 34, 0.74)`

## 3. Estructura Base de la Card (Estado Normal)
- **Border-Radius (Esquinas):** `14px`
- **Padding Interior:** `20px` o `24px` dependiento del contenido.
- **Borde:** Línea sólida de `1px` color Blanco al 14% de opacidad `rgba(255, 255, 255, 0.14)`
- **Efecto Glassmorphism:** `backdrop-filter: blur(7px)`
- **Fondo (Background Multicapa):**
  Para lograr el efecto "vidrio de club" se combinan estas capas:
  1. *Color Base:* `rgba(18, 18, 34, 0.74)`
  2. *Gradiente 1 (Ángulo 160°):* De Morado `rgba(91, 46, 255, 0.2)` a Oscuro `rgba(7, 7, 16, 0.72)` (terminando en el 42% del área).
  3. *Gradiente 2 (Ángulo 0° / desde abajo hacia arriba):* De Cyan `rgba(18, 245, 255, 0.05)` a Transparente.

## 4. Efecto Hover (Transición 0.24s ease)
- **Elevación:** Transformación `translateY(-4px)` y pequeña escala `scale(1.01)`.
- **Cambio de Borde:** Transiciona a rosa/fucsia `rgba(255, 47, 102, 0.48)`.
- **Doble Resplandor (Shadow):** 
  - Fucsia/Pink: `0px 0px 26px rgba(255, 47, 102, 0.16)`
  - Cyan: `0px 0px 18px rgba(18, 245, 255, 0.14)`

## 5. Variante Destacada (Highlight)
Si la tarjeta requiere foco principal (ej. un plan Pro o una feature central):
- **Borde Fijo:** Verde ácido `rgba(204, 255, 0, 0.72)`
- **Resplandor Fijo (Box Shadow):**
  - Inner glow/borde extra: `0 0 0 1px rgba(204, 255, 0, 0.24)`
  - Outer glow morado: `0 0 38px rgba(91, 46, 255, 0.28)`

## 6. Panel Tags (Etiquetas Interiores)
Si la tarjeta lleva una "píldora" indicativa (ej. "NUEVO"):
- **Border-Radius:** `999px`
- **Borde:** `1px solid rgba(204, 255, 0, 0.5)`
- **Texto:** Color `#ccff00`, todo en MAYÚSCULAS, font `Chakra Petch`, tracking de letras `0.08em`, tamaño sutil (ej. `12px` / `0.72rem`).
- **Padding:** `4px` vertical, `10px` horizontal.

---

> 💡 **Nota para el creador:** Abre/Ejecuta el archivo `card_demo.html` adjunto en esta misma carpeta para ver e interactuar con la tarjeta programada nativamente con este diseño en CSS.
