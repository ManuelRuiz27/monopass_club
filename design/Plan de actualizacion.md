# Plan de actualizacion (UI/UX) - Pass Monkey
Fuente: `design/nuevaUI.md` (alcance base para Figma)
Version checklist: 1.0
Estado: cerrado para implementacion (2026-02-09)

## Objetivo
Convertir el alcance de `nuevaUI.md` en un plan ejecutable de diseno en Figma, validado con el checklist de "Pass Monkey - UI/UX Full Update", asegurando:
- Separacion estricta por rol (IA + estilos + navegacion).
- Una pantalla = una tarea principal (un CTA primario claro cuando aplique).
- Cero pantallas redundantes (los "estados" son variantes, no pantallas nuevas).
- Un design system consistente y reusable (tokens + componentes + estados).
- Mobile-first en todos los roles, con comportamiento responsive para tablet/desktop (expansion progresiva, no redisenos paralelos).

## Principios responsive (mobile-first)
Definicion base para que el archivo Figma sea consistente y el handoff a React/PWA sea directo.

- Frames base (diseno primario): 360x800 (Android) y 390x844 (iPhone) como referencia.
- Breakpoints (web): `sm` 360-430, `md` 768, `lg` 1024+.
- Layout: mobile 1 columna + scroll vertical; tablet/desktop expanden (2 columnas/panel) sin cambiar IA.
- Densidad: en mobile priorizar cards + drilldown/bottom sheet en vez de tablas densas.
- Filtros: bottom sheet con "Aplicar" como CTA primario.
- Tablas/graficas:
  - Tablas: table-to-cards en mobile (una fila = una card). Max 2-3 datos visibles; el resto en expansion/detalle.
  - Graficas: simples en mobile (1 insight por bloque) + detalle bajo demanda; mas contexto solo en tablet/desktop.
- Navegacion por rol:
  - Staff: sin navegacion visible durante scanner.
  - RP/Manager/Director: navegacion simple (tabs/bottom nav o stack con back) consistente por rol.

## Checklist (fuente de validacion)
```json
{
  "project": "Pass Monkey \u2013 UI/UX Full Update",
  "purpose": "Checklist de validaci\u00f3n de dise\u00f1o Figma para redise\u00f1o integral",
  "version": "1.0",
  "global_checks": {
    "roles_separated": {
      "description": "Cada rol tiene experiencia visual y de navegaci\u00f3n independiente",
      "status": "required"
    },
    "no_redundant_screens": {
      "description": "No existen pantallas duplicadas o con funciones solapadas",
      "status": "required"
    },
    "one_primary_action_per_screen": {
      "description": "Cada pantalla tiene un \u00fanico CTA principal claramente identificado",
      "status": "required"
    },
    "design_system_defined": {
      "description": "Existe un sistema visual consistente (tokens, componentes, estados)",
      "status": "required"
    }
  },
  "roles": {
    "staff": {
      "role_goal": "Validar accesos de forma r\u00e1pida y sin errores",
      "screens": {
        "login_token": {
          "exists": true,
          "mobile_first": true,
          "single_input": true,
          "error_state_defined": true
        },
        "scanner_active": {
          "camera_fullscreen": true,
          "high_contrast": true,
          "no_navigation_visible": true
        },
        "scan_valid": {
          "green_state": true,
          "auto_return": true,
          "visual_feedback": true,
          "haptic_or_sound_feedback": true
        },
        "scan_invalid": {
          "red_state": true,
          "short_reason_text": true,
          "auto_return": true
        },
        "ticket_with_note": {
          "fullscreen_overlay": true,
          "two_actions_only": [
            "allow",
            "deny"
          ]
        },
        "system_states": {
          "camera_blocked": true,
          "no_permission": true,
          "network_error": true
        }
      }
    },
    "rp": {
      "role_goal": "Generar y compartir accesos sin fricci\u00f3n",
      "screens": {
        "event_list": {
          "shows_only_assigned_events": true,
          "remaining_access_indicator": true
        },
        "generate_access": {
          "access_type_selection": true,
          "note_optional": true,
          "single_primary_cta": true
        },
        "access_generated": {
          "ticket_preview": true,
          "share_action": true,
          "generate_another_action": true
        },
        "limit_reached": {
          "clear_explanation": true,
          "cta_disabled": true
        },
        "states": {
          "no_events": true,
          "generation_error": true,
          "session_expired": true
        }
      }
    },
    "manager": {
      "role_goal": "Supervisar y controlar la operaci\u00f3n del evento",
      "screens": {
        "event_dashboard": {
          "kpis_visible": true,
          "quick_actions": true
        },
        "events_management": {
          "list_view": true,
          "create_edit_event": true
        },
        "event_detail": {
          "summary_section": true,
          "staff_section": true,
          "rp_section": true
        },
        "staff_management": {
          "scanner_list": true,
          "active_inactive_state": true,
          "last_activity_visible": true
        },
        "rp_management": {
          "rp_list": true,
          "access_usage_visible": true
        },
        "cuts_and_metrics": {
          "totals": true,
          "by_event": true,
          "by_rp": true
        },
        "event_settings": {
          "open_close_access": true,
          "basic_configuration_only": true
        },
        "states": {
          "no_data": true,
          "event_closed": true,
          "network_error": true
        }
      }
    },
    "director": {
      "role_goal": "Analizar desempe\u00f1o y tomar decisiones estrat\u00e9gicas",
      "screens": {
        "global_dashboard": {
          "global_kpis": true,
          "summary_view": true
        },
        "event_comparison": {
          "table_or_chart": true,
          "date_filters": true
        },
        "historical_metrics": {
          "time_series_charts": true
        },
        "reports_exports": {
          "csv_export": true,
          "pdf_export": true,
          "period_selection": true
        },
        "states": {
          "no_information": true,
          "load_error": true
        }
      }
    }
  },
  "design_system": {
    "colors": {
      "role_based_palettes": true,
      "status_colors_defined": [
        "success",
        "error",
        "warning"
      ]
    },
    "typography": {
      "readable_sizes": true,
      "large_numbers_for_staff": true
    },
    "components": {
      "buttons": [
        "primary",
        "danger",
        "disabled"
      ],
      "cards": true,
      "badges": true,
      "overlays": true,
      "toasts_or_banners": true
    },
    "states": {
      "hover": true,
      "active": true,
      "disabled": true,
      "loading": true
    }
  },
  "technical_constraints": {
    "react_friendly": true,
    "mobile_web_ready": true,
    "pwa_compatible": true,
    "simple_css_animations": true,
    "no_heavy_dependencies": true
  },
  "final_validation": {
    "all_screens_listed_are_designed": true,
    "no_extra_screens_added": true,
    "figma_pages_separated_by_role": true,
    "ready_for_frontend_handoff": true
  }
}
```

## Diagnostico rapido: que ya esta definido vs gaps (segun `nuevaUI.md`)
### Global
- Roles separados: definido (Staff/RP/Manager/Director) con principio explicito.
- No redundancias: definido (estados como variantes, no pantallas nuevas).
- Un CTA primario por pantalla: definido con excepciones controladas.
  - Staff login: OK.
  - RP generar acceso: OK.
  - RP acceso generado (R3): primario "Generar otro"; secundario "Compartir"; terciario "Descargar".
  - Staff ticket con nota (S5): primario "Permitir acceso" (verde); secundario "Rechazar acceso" (rojo).
  - Dashboards (Manager/Director): no hay CTA dominante permanente; acciones solo contextuales. CTA primario solo en estados vacios (p.ej. "Crear evento").
- Design system: listado como obligatorio, pero faltan decisiones concretas (tokens, estados, componentes exactos).

### Staff (Scanner)
- Camera fullscreen: definido.
- High contrast: requerido (baja luz/estres).
- No navigation visible: NO explicito (debe definirse para evitar taps accidentales).
- Feedback haptico/sonido: definido para valido (y recomendable tambien para invalido).
  - Regla: fondo oscuro obligatorio + contraste AA/AAA, estados con color plano (verde/rojo/amarillo).
  - Regla: evitar pastel, sombras suaves y texto gris claro (pierde legibilidad en puerta).

### RP
- Event list solo asignados + accesos restantes: definido.
- Generacion: definido (chips grandes + nota opcional + CTA unico).
- Acceso generado: jerarquia definida (primario generar otro; secundario compartir; terciario descargar).

### Manager
- Set de pantallas y secciones: definido.
- Falta definir patron mobile-first para densidad de info (cards vs tablas, filtros, drilldown, jerarquia de KPIs).

### Director
- Set de pantallas: definido.
- Falta especificar nivel de detalle de graficas para mobile (tipos, escalas, estados "empty") y degradacion a cards cuando aplique.

## Plan de actualizacion (ejecutable en Figma)
### Fase 0 - Setup y reglas (bloqueantes)
1. Definir estructura del archivo Figma:
   - `00 Foundations (Tokens)`
   - `01 Components`
   - `10 Staff`
   - `20 RP`
   - `30 Manager`
   - `40 Director`
   - `90 Handoff (Specs)`
2. Reglas de oro (en portada del Figma):
   - "No pantallas fuera de lista" (seccion 11 de `nuevaUI.md`).
   - "Estados = variantes" (no duplicates).
   - "1 tarea principal por pantalla".
3. Reglas responsive (en `00 Foundations`):
   - Frames base + breakpoints.
   - Patrones: table-to-cards, filtros como bottom sheet, expansion tablet/desktop sin duplicar pantallas.
   - Touch targets minimos (44px) + safe areas (PWA).

### Fase 1 - Foundations (Design System minimo viable)
1. Colores:
   - Paleta base neutral compartida + paleta por rol (4 subpaletas).
   - Colores de estado: success/error/warning (y neutral/info si hace falta).
   - Staff (puerta): fondo oscuro por defecto + contraste alto (pensado para baja luz).
2. Tipografia:
   - Escala 1 (RP/Manager/Director): lectura comoda.
   - Escala 2 (Staff): numeros y mensajes grandes (valid/invalid) para lectura rapida.
3. Spacing y grid:
   - Espaciado (p.ej. 4/8/12/16/24/32) + radios + sombras.
4. Componentes (con estados):
   - Buttons: primary, danger, disabled, loading.
   - Cards (event card, kpi card).
   - Badges/Chips (tipo de acceso, estado de evento).
   - Overlays (valid/invalid, ticket con nota).
   - Toasts/Banners (errores de red, permisos, sesion expirada).
   - Bottom sheet (filtros/detalle rapido) + Drawer/Side panel (solo expansion tablet/desktop).
   - Empty states (con CTA primario solo cuando corresponda).
5. Estados:
   - pressed (mobile), focus (accesibilidad), hover (solo cuando aplique en desktop), disabled, loading, empty, error.
6. Copy system (para estados/errores):
   - Max 1 linea, lenguaje directo, sin terminos tecnicos.
   - Ejemplos: "Acceso no valido", "Ya fue utilizado", "Sin conexion", "Reintentar", "Sesion expirada", "No se puede usar la camara".

### Fase 2 - Flujos por rol (wireframe -> UI)
#### Staff (S1-S6)
1. S1 Login por Token:
   - Input unico + error state (invalid token).
2. S2 Scanner activo:
   - Fullscreen, marco de escaneo, alto contraste, sin navegacion visible.
3. S3 Valido / S4 Invalido:
   - Overlay verde/rojo, texto minimo, feedback (visual + haptico/sonido), auto-return.
4. S5 Ticket con nota:
   - Overlay fullscreen, nota legible, 2 acciones only.
   - Jerarquia fija:
     - Primario: Permitir acceso (verde).
     - Secundario: Rechazar acceso (rojo).
5. S6 Estados del sistema:
   - Variantes: camera blocked/no permission/network error (con copy y CTA de resolver cuando aplique).
   - Copy: 1 linea max (p.ej. "No se puede usar la camara", "Sin permisos", "Sin conexion").

#### RP (R1-R5)
1. R1 Lista eventos asignados:
   - Cards simples, estado (activo/cerrado), indicador de accesos restantes.
2. R2 Generar acceso:
   - Chips grandes (General/VIP/Otro), nota opcional colapsable, 1 CTA primario.
3. R3 Acceso generado:
   - Preview ticket.
   - Jerarquia CTAs:
     - Primario: Generar otro.
     - Secundario: Compartir.
     - Terciario: Descargar.
   - Ticket preview (spec):
     - Formato vertical 9:16.
     - Datos minimos: nombre del evento, tipo de acceso, QR dominante, ID corto/folio.
     - QR 40-45% del alto, alto contraste y zona limpia alrededor.
     - No saturar con datos ni branding.
4. R4 Limite alcanzado:
   - Explicacion clara + CTA deshabilitado.
5. R5 Estados RP:
   - No events, generation error, session expired (preferir banner/toast + empty states).
   - Copy ejemplo: "Sesion expirada", "Sin eventos", "Error al generar".

#### Manager (M1-M8)
1. M1 Dashboard evento:
   - KPIs visibles + acciones contextuales (sin CTA dominante permanente).
   - CTA primario solo en empty states (p.ej. "Crear evento").
   - Mobile: KPIs en cards + drilldown ("Ver mas") en lugar de mostrar todo a la vez.
   - KPIs "mobile top" (3-5, arriba del fold):
     - Accesos validados (hoy y/o total del evento).
     - Accesos generados (total).
     - % asistencia.
     - Staff activos (scanners activos).
     - (Opcional si hay espacio) Evento: estado (Abierto/Cerrado) como badge persistente, no KPI.
2. M2 Gestion eventos:
   - Lista + crear/editar.
   - Mobile: lista tipo cards; acciones secundarias en overflow/bottom sheet.
3. M3 Detalle evento:
   - Summary + staff + rp (secciones claras).
   - Mobile: secciones colapsables o tabs internas (Summary/Staff/RP) para evitar scroll infinito.
4. M4 Staff management:
   - Lista scanners + estado + ultima actividad.
   - Mobile: card por scanner; estado como badge; "Ultima actividad" secundario.
5. M5 RP management:
   - Lista + accesos asignados/usados + activar/desactivar.
   - Mobile: card por RP; activar/desactivar como switch o accion secundaria con confirmacion.
6. M6 Cortes y metricas:
   - Totales + por evento + por RP.
   - Mobile: selector de vista (Totales / Por evento / Por RP) + cards; graficas simples.
7. M7 Ajustes evento:
   - Open/close accesos + configuracion basica (sin panel tecnico).
   - Mobile: acciones peligrosas con confirmacion y estado del evento siempre visible.
8. M8 Estados:
   - No data / event closed / network error (componentes reutilizados).

#### Director (D1-D5)
1. D1 Dashboard global:
   - KPIs globales + resumen, sin CTA dominante permanente.
   - CTA primario solo en empty states cuando aplique.
   - Mobile: 3-5 KPIs max arriba, resto por secciones/drilldown.
   - KPIs "mobile top" (3-5, arriba del fold):
     - Total de eventos (periodo seleccionado).
     - Total de accesos generados (periodo).
     - Total de accesos validados (periodo).
     - Asistencia promedio (%).
2. D2 Comparativo eventos:
   - Tabla o chart + filtros de fecha.
   - Mobile: comparativo como cards + ordenamiento; filtros en bottom sheet; tabla completa solo en expansion.
3. D3 Historico:
   - Time-series charts + estados empty.
   - Mobile: graficas simples + selector de rango; detalle por punto via tooltip/bottom sheet.
4. D4 Reportes/exportes:
   - CSV/PDF + seleccion de periodo.
   - Mobile: flujo corto, con confirmacion de export y estado de descarga.
5. D5 Estados:
   - No information / load error.

### Fase 3 - Validaciones finales (antes de handoff)
1. Validacion checklist (marca de cumplimiento por item).
2. Auditoria de pantallas:
   - Todas las pantallas listadas estan disenadas.
   - No hay pantallas extra (solo variantes).
3. Accesibilidad minima:
   - Contraste (Staff especialmente).
   - Tamanos tactiles (min 44px).
   - Jerarquia tipografica.
4. Handoff a frontend (React/PWA):
   - Component naming consistente.
   - Tokens exportables.
   - Estados/loading/error definidos.
   - Reglas responsive documentadas (breakpoints + patrones table-to-cards + filtros en bottom sheet).

## Matriz de cumplimiento (para completar en Figma)
Uso: cuando la pantalla/componente este listo, marcar `OK` y anotar link al frame.

### Global checks
| Check | Estado | Nota |
| --- | --- | --- |
| roles_separated | PENDIENTE | Separar por paginas y por paleta/estilo por rol. |
| no_redundant_screens | PENDIENTE | Estados como variantes, no frames duplicados. |
| one_primary_action_per_screen | PENDIENTE | Resolver excepciones: R3, S5, dashboards. |
| design_system_defined | PENDIENTE | Foundations + Components completos. |

### Riesgos y decisiones que faltan (bloquean definicion visual)
1. Design system aun sin cerrar:
   - Tipografia final y escala (por rol).
   - Tokens de color por rol (incluye staff dark-base).
   - Componentes con variantes (botones, overlays, bottom sheet, empty states).
2. Contenido de dashboards (Manager/Director):
   - Definir exactamente que KPIs entran en "mobile top" (3-5) y que queda en drilldown.

