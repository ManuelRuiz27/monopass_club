# Pass Monkey — Requerimientos de Acabados UI/UX (Figma)

## 1. Objetivo del documento
Definir los **acabados obligatorios** que deben entregarse junto con el diseño en Figma para considerar el rediseño **completo, consistente y listo para desarrollo**.

Este documento complementa el brief de pantallas y el checklist UI.

---

## 2. Estados completos por componente (obligatorio)

Para **cada componente reutilizable** se deben definir:

- Default
- Hover
- Active / Pressed
- Disabled
- Loading

Componentes mínimos:
- Botones (primary, secondary, danger)
- Inputs
- Cards
- Badges
- Modales
- Bottom sheets

---

## 3. Estados del sistema (UX real)

Diseñar estados visuales para:

- Loading (spinner o skeleton)
- Empty states (sin eventos, sin accesos, sin datos)
- Error states:
  - Red
  - Permisos
  - Cámara no disponible
- Success / Warning overlays

Estos estados **no son pantallas nuevas**, son variantes.

---

## 4. Animaciones y transiciones (definidas)

Para interacciones clave, especificar:

- Tipo de animación
- Duración (ms)
- Uso (cuándo aplica)

Casos mínimos:
- Escaneo válido / inválido
- Entrada y salida de overlays
- Feedback al presionar botones

No se permiten animaciones decorativas excesivas.

---

## 5. Safe areas y espaciado (mobile)

Definir explícitamente:

- Márgenes mínimos
- Safe area iOS / Android
- Zonas de alcance del pulgar (thumb zones)

Aplicable especialmente a **Staff y RP**.

---

## 6. Modo baja luz (Staff)

Incluir ejemplos de pantallas con:

- Fondo oscuro
- Contraste AA/AAA
- Estados con color plano (verde / rojo / amarillo)

No usar:
- Colores pastel
- Sombras suaves
- Texto gris claro

---

## 7. Uso del logo y branding

Entregar:

- Versiones del logo:
  - Completo
  - Isotipo
  - Monocromo
- Tamaños mínimos
- Safe space

Definir claramente:
- Dónde sí se usa
- Dónde no se usa (ej. pantallas críticas de Staff)

---

## 8. Copy final (no lorem ipsum)

Todas las pantallas deben contener:

- Textos reales en botones
- Mensajes de error definidos
- Estados del sistema con copy final

Frontend **no debe inventar textos**.

---

## 9. Design Tokens (handoff)

Definir y documentar:

- Paleta de colores
- Tipografía
- Espaciados
- Radios
- Elevación (si aplica)

Idealmente entregados como:
- Figma Tokens
- JSON exportable

---

## 10. Componentes documentados

Cada componente debe incluir:

- Uso recomendado
- Variantes
- Estados
- Ejemplos reales en pantallas

Componentes clave:
- Botones
- Cards
- Badges
- Overlays
- Bottom sheets
- Table → Cards (mobile)

---

## 11. Exportes

Entregar assets listos para desarrollo:

- SVG optimizados
- PNG @2x / @3x (solo donde aplique)
- Naming consistente

---

## 12. Cierre y validación

El diseño se considera **aprobado** únicamente cuando:

- Todas las pantallas del brief están diseñadas
- Todos los acabados de este documento están cubiertos
- El checklist UI está completo

---

## Nota final

Este documento define el **nivel de terminado esperado** del diseño.  
No se considera completo un Figma que incluya solo pantallas sin estos acabados.
