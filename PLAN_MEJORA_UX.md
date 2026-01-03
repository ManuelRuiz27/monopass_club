# Plan de Mejora UI/UX - MonoPass Club

Este documento describe la estrategia para elevar la calidad visual y la experiencia de usuario de **MonoPass Club**, enfocándose en una estética oscura premium, navegación intuitiva y minimalismo funcional.

## 1. Identidad Visual: "Dark Premium"
El objetivo es transformar la interfaz actual (clara y utilitaria) en una experiencia inmersiva y moderna.

### Paleta de Colores
Restructuraremos los variables en CSS para soportar un modo oscuro nativo y profundo.
*   **Fondo Principal:** `#0B1120` (Slate 950) - Profundo pero no negro total para evitar fatiga visual.
*   **Superficies (Tarjetas/Paneles):** `#1E293B` (Slate 800) con opacidad para efectos de "Glassmorphism".
*   **Acento Principal:** `#3B82F6` (Blue 500) -> `#60A5FA` (Blue 400) para mejor contraste en fondos oscuros.
*   **Texto Principal:** `#F1F5F9` (Slate 100).
*   **Texto Secundario:** `#94A3B8` (Slate 400).
*   **Bordes:** `#334155` (Slate 700) - Sutiles.

### Tipografía
Mantendremos **Inter**, pero ajustaremos los pesos:
*   Reducir el uso de negritas pesadas en cuerpos de texto.
*   Aumentar el espaciado (tracking) en títulos pequeños para elegancia.
*   Tamaño base de 16px para legibilidad óptima.

## 2. Navegación Intuitiva (Layout)
La navegación actual lateral es funcional pero puede ser rígida.
*   **Sidebar Flotante:** Desacoplar la barra lateral del borde total, haciéndola flotar con bordes redondeados y un sutil "glass effect".
*   **Iconografía Activa:** Uso de iconos rellenos para el estado activo y lineales para inactivo.
*   **Agrupación Lógica:** Separar claramente las acciones principales de las de configuración/perfil.
*   **Breadcrumbs:** Implementar migas de pan simplificadas para que el usuario siempre sepa dónde está sin saturar la cabecera.

## 3. Minimalismo en Componentes
Eliminar el "ruido visual" (exceso de líneas divisorias y contenedores anidados).

*   **Tarjetas (Cards):** Eliminar sombras pesadas (`box-shadow`) y sustituirlas por bordes sutiles de 1px o fondos ligeramente más claros que el base.
*   **Inputs:** Estilo "underlined" o con fondo `#0F172A` (más oscuro que la superficie) para invitar a escribir, sin bordes grises duros.
*   **Botones:**
    *   *Primarios:* Gradientes sutiles o colores sólidos vibrantes con sombra de resplandor (`glow`).
    *   *Secundarios:* Solo texto o borde muy tenue.
*   **Tablas:** Eliminar las líneas verticales, dejar solo divisores horizontales muy sutiles (`opacity: 0.1`).

## 4. Micro-interacciones (El factor "Wow")
El software debe sentirse vivo.
*   **Hover:** Efecto suave de elevación y abrillantado en tarjetas clickable.
*   **Transiciones:** `transition: all 0.2s ease` en todos los elementos interactivos.
*   **Feedback:** Botones que reaccionan al click (scale 0.98).

## 5. Implementación Técnica
Se propone una refactorización progresiva de `index.css`:
1.  Definir variables CSS (`:root`) con la nueva paleta.
2.  Actualizar el componente `AppShell` para el nuevo layout.
3.  Aplicar estilos base a formularios y tipografía.

---
*Este plan busca no solo "pintar" la app, sino reestructurar cómo se siente usarla.*
