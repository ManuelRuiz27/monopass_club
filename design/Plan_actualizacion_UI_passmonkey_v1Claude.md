# Plan de actualizacion UI Frontend usando `passmonkey_v1Claude.pen`

## 1. Objetivo
Implementar en el frontend todos los nuevos disenos definidos en `design/passmonkey_v1Claude.pen`, cubriendo desktop y mobile, con trazabilidad pantalla-por-pantalla hasta lograr 100% de adopcion visual y funcional.

## 2. Resultado del analisis del `.pen`

### 2.1 Inventario de diseno
- Total de frames top-level: 54
- Componentes reutilizables: 16
- Variables de diseno: 48

### 2.2 Pantallas por dominio
- Design System: 1 frame
- Auth: 2 (`Auth - Login`, `Auth - 404`)
- Staff Login: 2 (`Staff - Login Token`, `Staff - Login Token (Error)`)
- Scanner: 6 (`Escanear`, `Valido`, `Valido (Nota)`, `Invalido`, `Error Red`, `Sin Permisos`)
- RP: 8 (`Mis Eventos`, `Generar Acceso`, `QR Generado`, `Historial`, `Perfil`, `Sin Eventos`, `Limite Alcanzado`, `Error Generacion`)
- Manager desktop: 11 vistas operativas (incluye `Gerente - Dashboard`, `Detalle Evento`, `Detalle Evento (Cerrado)`)
- Manager mobile: 12
- Director desktop: 5 (`Dashboard Global`, `Comparativo`, `Historicas`, `Reportes`, `Estados`)
- Director mobile: 5
- Estados/auxiliares: 2 (`State - Empty`, `Modal - Crear Evento`)

## 3. Estado actual del frontend (gap analysis)

### 3.1 Rutas y roles actuales
- Roles implementados: `MANAGER`, `RP`, `SCANNER`
- No existe rol ni rutas para `DIRECTOR`
- Login actual es user/password unico, no existe login por token para staff/scanner
- Referencias:
  - `frontend/src/router.tsx`
  - `frontend/src/features/auth/AuthContext.tsx`
  - `frontend/src/features/auth/LoginPage.tsx`

### 3.2 Brechas principales contra el `.pen`
- Falta modulo completo de Director (desktop y mobile).
- Falta flujo de Staff token login y su estado de error.
- Flujo RP esta fusionado en una sola pagina (`GenerateAccessPage`) y no respeta separacion estricta de vistas del diseno.
- Scanner tiene navegacion y layout operativo distinto al flujo visual del diseno (pantallas de estado dedicadas).
- Manager no tiene ruta explicita para `Detalle Evento` y `Detalle Evento (Cerrado)`.
- No hay trazabilidad formal de componentes del Design System del `.pen` a componentes React reutilizables.
- Existe mezcla de estilos legacy y variables CSS no alineadas con tokens del diseno.

### 3.3 Requerimientos finales UI integrados (fuente: `design/Requerimientos_finales_UI.md`)
Se integran como criterios obligatorios y transversales:

- R1 - Estados completos por componente: `default`, `hover`, `active`, `disabled`, `loading`.
- R2 - Estados de sistema: `loading`, `empty`, `error` (red/permisos/camara), `success/warning overlays`.
- R3 - Animaciones definidas: tipo, duracion y uso para interacciones clave.
- R4 - Safe areas y espaciado mobile: margenes minimos, `safe-area-inset`, thumb zones.
- R5 - Modo baja luz para Staff: contraste AA/AAA y paleta funcional (verde/rojo/amarillo).
- R6 - Uso de logo y branding: versiones, tamano minimo, safe space y excepciones.
- R7 - Copy final: textos definitivos por pantalla/estado, sin texto inventado en frontend.
- R8 - Design tokens de handoff: color, tipografia, spacing, radios, elevacion.
- R9 - Componentes documentados: uso, variantes, estados y ejemplos reales.
- R10 - Exportes listos para desarrollo: SVG optimizado y PNG @2x/@3x cuando aplique.
- R11 - Patron table-to-cards mobile documentado para datos densos.
- R12 - Cierre formal: pantallas + acabados + checklist UI al 100%.

## 4. Plan de implementacion para usar TODOS los disenos

## Fase 0 - Base tecnica UI (obligatoria antes de migrar pantallas)
Objetivo: crear cimientos para evitar re-trabajo al migrar 54 frames.

Entregables:
- `ui-tokens.css` generado desde variables del `.pen` (48 tokens) + `ui-tokens.json` exportable para handoff.
- Tokens minimos obligatorios: color, tipografia, spacing, corner radius, elevacion y motion.
- Biblioteca de componentes base alineada a componentes reutilizables del diseno:
  - `Button/Primary`, `Button/Secondary`, `Button/Green`, `Button/Danger`, `Button/Disabled`
  - `Input/Text`, `Input/Select`, `Input/Error`
  - `Nav/Active`, `Nav/Inactive`
  - `Metric Card`
  - `Badge/VIP`, `Badge/Scanned`, `Badge/Pending`
  - `Modal/Base`, `BottomSheet/Base`
  - `Toast/Success`, `Toast/Error`
  - `Empty State`
- Matriz de estados por componente: `default`, `hover`, `active`, `disabled`, `loading`.
- Documentacion de mapping token -> CSS variable -> componente + guia de uso (dos/donts).

Criterio de salida:
- Ninguna pantalla nueva usa estilos inline para colores base, radios o tipografia.
- Todos los componentes obligatorios tienen 5 estados definidos y testeables.
- Existe handoff de tokens consumible por frontend (`css` + `json`).

## Fase 1 - Auth y roles (alineacion estructural)
Objetivo: habilitar arquitectura de rutas para todos los flujos del diseno.

Entregables:
- Extender roles a `DIRECTOR`.
- Separar Auth en variantes:
  - `Auth - Login` (desktop)
  - `Staff - Login Token` + estado error
  - `Auth - 404`
- Definir shells por rol con navegacion y layout propios (sin mezclar patrones entre roles).
- Definir reglas de branding del logo por contexto:
  - variantes `completo`, `isotipo`, `monocromo`
  - tamano minimo y safe space
  - lugares donde no se muestra (pantallas criticas de Staff).
- Crear contrato de copy final por ruta/estado (fuente unica para botones, errores y mensajes de sistema).

Archivos impactados:
- `frontend/src/features/auth/AuthContext.tsx`
- `frontend/src/features/auth/LoginPage.tsx`
- `frontend/src/router.tsx`
- `frontend/src/shells/*`

Criterio de salida:
- Rutas operativas para `manager`, `rp`, `scanner/staff`, `director`.
- Login correcto segun rol y patron visual del `.pen`.
- Branding y copy definidos antes de empezar migracion masiva de pantallas.

## Fase 2 - Scanner + Staff (flujo operativo completo)
Objetivo: llevar scanner a parity exacta con pantallas de estado del diseno.

Cobertura de pantallas:
- `Scanner - Escanear`
- `Scanner - Valido`
- `Scanner - Valido (Nota)`
- `Scanner - Invalido`
- `Scanner - Error Red`
- `Scanner - Sin Permisos`
- `Staff - Login Token`
- `Staff - Login Token (Error)`

Tareas:
- Convertir scanner en state machine UI explicita.
- Sustituir feedback ad-hoc por vistas de estado dedicadas.
- Mantener reglas de auto-retorno y confirmacion de acceso con nota.
- Ajustar permisos de camara y recovery de red como estados visuales definidos.
- Implementar modo baja luz Staff:
  - fondo oscuro real
  - contraste AA/AAA validado
  - colores funcionales planos (verde/rojo/amarillo)
  - sin pastel, sin sombras suaves, sin texto gris claro.
- Definir animaciones de scanner y overlays con especificacion tecnica:
  - `scan-valid`, `scan-invalid`, `overlay-enter`, `overlay-exit`, `button-press`
  - duracion en ms y trigger de uso.
- Aplicar safe areas y thumb zones para uso continuo en mobile.

Criterio de salida:
- 8/8 pantallas staff+scanner replicadas y navegables.
- Todos los estados de sistema de Staff estan cubiertos como variantes (no hacks visuales).
- Contraste y motion de scanner documentados y validados.

## Fase 3 - RP (mobile-first completo)
Objetivo: cubrir las 8 pantallas RP y sus estados.

Cobertura de pantallas:
- `RP - Mis Eventos`
- `RP - Generar Acceso`
- `RP - QR Generado`
- `RP - Historial`
- `RP - Perfil`
- `RP - Sin Eventos`
- `RP - Limite Alcanzado`
- `RP - Error Generacion`

Tareas:
- Separar seleccion de evento y generacion en vistas diferenciadas.
- Crear pantalla dedicada de exito (`QR Generado`) con acciones compartir/descargar/generar otro.
- Implementar estados vacios/error/limite como vistas declarativas, no como solo mensajes embebidos.
- Mantener bottom nav RP segun diseno.
- Usar bottom sheets para filtros/acciones secundarias en mobile cuando aplique.
- Aplicar safe areas (iOS/Android), margenes minimos y thumb zones en vistas RP.
- Implementar copy final en mensajes de error/limite/empty sin placeholders.

Archivos de partida:
- `frontend/src/features/rp/pages/GenerateAccessPage.tsx`
- `frontend/src/features/rp/pages/HistoryPage.tsx`
- `frontend/src/features/rp/pages/ProfilePage.tsx`
- `frontend/src/shells/RpShell.tsx`

Criterio de salida:
- 8/8 pantallas RP implementadas.
- Estados `loading/empty/error/success/warning` implementados como variantes reutilizables.
- Navegacion y acciones principales optimizadas para alcance de pulgar.

## Fase 4 - Manager desktop (core operativo)
Objetivo: migrar 11 vistas manager desktop.

Cobertura:
- `Gerente - Dashboard`
- `Manager - Eventos`
- `Manager - Detalle Evento`
- `Manager - Detalle Evento (Cerrado)`
- `Manager - Cortes`
- `Manager - RPs`
- `Manager - Grupos`
- `Manager - Staff`
- `Manager - Clubs`
- `Manager - Plantilla`
- `Manager - Configuracion`
- `State - Empty`
- `Modal - Crear Evento`

Tareas:
- Introducir ruta de detalle de evento (`/manager/events/:eventId`) y variante cerrado.
- Reestructurar `EventsPage` para separar listado, modal y detalle.
- Alinear layouts de tablas/cards, sidebars y headers al diseno.
- Incorporar estado empty formal (`State - Empty`) en manager.
- Aplicar patron `table -> cards` en mobile para tablas densas de manager.
- Integrar copy final en formularios, errores y confirmaciones.

Archivos de partida:
- `frontend/src/features/manager/pages/*.tsx`
- `frontend/src/shells/ManagerShell.tsx`

Criterio de salida:
- Todas las vistas desktop manager navegables y sin placeholders.

## Fase 5 - Director desktop y mobile
Objetivo: agregar rol completo Director con 10 pantallas (5 desktop + 5 mobile).

Cobertura desktop:
- `Director - Dashboard Global`
- `Director - Comparativo`
- `Director - Historicas`
- `Director - Reportes`
- `Director - Estados`

Cobertura mobile:
- `Director Mobile - Dashboard`
- `Director Mobile - Comparativo`
- `Director Mobile - Historicas`
- `Director Mobile - Reportes`
- `Director Mobile - Estados`

Tareas:
- Crear feature `frontend/src/features/director/` con API, pages y shell.
- Agregar rutas protegidas y navegacion por rol.
- Implementar tablas/graficas/filtros segun diseno (sin degradar IA entre breakpoints).
- Integrar estados `loading/empty/error` y exportes UI de reportes con copy final.

Criterio de salida:
- Rol director funcional de punta a punta.

## Fase 6 - Manager mobile parity
Objetivo: cubrir 12 pantallas mobile manager sin redisenar logica de negocio.

Cobertura:
- `Manager Mobile - Dashboard`
- `Manager Mobile - Eventos`
- `Manager Mobile - Crear Evento`
- `Manager Mobile - Detalle`
- `Manager Mobile - Detalle (Cerrado)`
- `Manager Mobile - RPs`
- `Manager Mobile - Staff`
- `Manager Mobile - Grupos`
- `Manager Mobile - Cortes`
- `Manager Mobile - Clubs`
- `Manager Mobile - Plantilla`
- `Manager Mobile - Configuracion`

Tareas:
- Definir patrones mobile por modulo (cards, listas, formularios).
- Aplicar responsive real en pages manager existentes, evitando ramas duplicadas innecesarias.
- Garantizar patron `table -> cards` y filtros en bottom sheet para mobile.

Criterio de salida:
- 12/12 pantallas mobile manager cubiertas en viewport objetivo.
- Sin tablas densas sin alternativa mobile usable.

## Fase 7 - QA visual, E2E y cierre de cobertura
Objetivo: certificar que no queda ningun frame del `.pen` sin reflejo en el frontend.

Entregables:
- Matriz de trazabilidad `frame .pen -> ruta -> componente -> test`.
- Set minimo de pruebas Playwright por rol (happy path + estados de error).
- Baseline visual (capturas por ruta principal desktop/mobile).
- Catalogo final de componentes documentados:
  - uso recomendado
  - variantes
  - estados
  - ejemplos reales.
- Especificacion de animaciones/transiciones con duracion y trigger.
- Paquete de assets para desarrollo:
  - SVG optimizados
  - PNG @2x/@3x solo cuando aplique
  - naming consistente.
- Matriz de copy final por pantalla/estado y validacion con producto.
- Checklist de branding/logo: variantes, safe space, tamano minimo y excepciones.

Criterio final de exito:
- Cobertura UI: 54/54 frames del `.pen` mapeados.
- Cero pantallas legacy activas fuera de diseno.
- Acabados UI/UX: 12/12 requerimientos de `Requerimientos_finales_UI.md` cumplidos.

## 5. Priorizacion recomendada (orden de ejecucion)
1. Fase 0
2. Fase 1
3. Fase 2 y Fase 3
4. Fase 4
5. Fase 5
6. Fase 6
7. Fase 7

## 6. Riesgos y mitigaciones
- Riesgo: introducir director sin contrato backend listo.
  - Mitigacion: feature flags + mocks de datos para cerrar UI primero.
- Riesgo: refactors grandes rompen rutas existentes.
  - Mitigacion: migracion incremental por shell y pruebas E2E por rol.
- Riesgo: inconsistencia visual por estilos legacy.
  - Mitigacion: bloquear nuevos estilos inline y centralizar tokens/componentes.

## 7. Definicion de terminado (DoD) para este objetivo
- Existe una ruta/UI para cada pantalla del `.pen`.
- Todos los estados importantes del flujo estan modelados como pantalla o variante definida.
- La UI por rol mantiene navegacion y look-and-feel independiente.
- El frontend usa de forma consistente los tokens y componentes del Design System del `.pen`.
- Todos los componentes obligatorios exponen estados `default/hover/active/disabled/loading`.
- Los estados de sistema (`loading`, `empty`, `error`, `success`, `warning`) estan definidos y reutilizados.
- Staff cumple modo baja luz con contraste validado.
- Existe inventario de copy final; frontend no inventa textos.
- Entregables de handoff listos (`tokens`, documentacion de componentes y assets exportables).

## 8. Plan ejecutable por sprints
Duracion sugerida: 8 sprints de 1 semana (o 4 sprints de 2 semanas agrupando pares).

### Sprint 0 - Fundacion UI
Objetivo:
- Dejar lista la base tecnica de tokens, componentes y estados para evitar deuda visual.

Alcance:
- Fase 0 completa.
- Inicio de Fase 1 (scaffold de rutas/rol director sin pantallas finales).

Entregables:
- `ui-tokens.css` + `ui-tokens.json`.
- Componentes base y matriz de estados.
- Guia de branding/logo y contrato de copy base.

Criterio de cierre:
- Cero estilos inline nuevos en superficies base.
- Libreria base utilizable por Scanner/RP/Manager/Director.

### Sprint 1 - Auth y roles
Objetivo:
- Resolver arquitectura de acceso y navegacion por rol.

Alcance:
- Fase 1 completa.

Entregables:
- Rutas y guards para `MANAGER`, `RP`, `SCANNER/STAFF`, `DIRECTOR`.
- Login desktop, login token staff y 404.

Criterio de cierre:
- Flujo de login y redireccion correcto por rol.
- Copy y branding base integrados.

### Sprint 2 - Scanner + Staff
Objetivo:
- Cerrar flujo critico operativo de puerta.

Alcance:
- Fase 2 completa.

Entregables:
- 8/8 pantallas de scanner/staff.
- State machine de escaneo.
- Modo baja luz y animaciones clave.

Criterio de cierre:
- Estados de red/permisos/camara resueltos en UI.
- Safe areas y contraste validados.

### Sprint 3 - RP mobile-first
Objetivo:
- Completar generacion de accesos sin friccion para RP.

Alcance:
- Fase 3 completa.

Entregables:
- 8/8 pantallas RP.
- Estados vacio/error/limite/exito desacoplados.
- Bottom sheets donde aplique.

Criterio de cierre:
- Flujo RP de punta a punta en mobile con copy final.

### Sprint 4 - Manager desktop
Objetivo:
- Cubrir operacion manager en desktop con detalle de evento.

Alcance:
- Fase 4 completa.

Entregables:
- Vistas manager desktop migradas.
- Ruta `/manager/events/:eventId` + variante cerrado.
- Modal de crear evento y state empty integrados.

Criterio de cierre:
- Sin placeholders activos en manager desktop.

### Sprint 5 - Director
Objetivo:
- Habilitar rol director completo desktop/mobile.

Alcance:
- Fase 5 completa.

Entregables:
- Feature `director` con rutas, shell y vistas.
- Dashboards, comparativos, historicas, reportes y estados.

Criterio de cierre:
- Rol director funcional con filtros y estados del sistema.

### Sprint 6 - Manager mobile parity
Objetivo:
- Lograr paridad mobile de manager.

Alcance:
- Fase 6 completa.

Entregables:
- 12/12 pantallas manager mobile.
- Patron table-to-cards y filtros mobile.

Criterio de cierre:
- UX mobile usable en todas las vistas manager.

### Sprint 7 - QA y cierre
Objetivo:
- Certificar cobertura 100% y cerrar acabados.

Alcance:
- Fase 7 completa.

Entregables:
- Matriz `frame -> ruta -> componente -> test`.
- Baseline visual + E2E final por rol.
- Paquete final de assets, copy y documentacion.

Criterio de cierre:
- 54/54 frames cubiertos.
- 12/12 requerimientos de acabados cumplidos.

## 9. Checklist de arranque inmediato (ready-to-start)
Debe quedar completo antes de abrir la implementacion masiva:

- Confirmar rama de trabajo: `feature/ui-refresh-passmonkey-v1claude`.
- Crear epic principal: `UI Refresh 54 frames`.
- Crear 8 epics hijos: `Sprint 0` a `Sprint 7`.
- Definir labels: `role:staff`, `role:rp`, `role:manager`, `role:director`, `mobile`, `desktop`, `design-system`, `qa`.
- Activar feature flags de seguridad:
  - `ui_refresh_enabled`
  - `director_ui_enabled`
  - `scanner_dark_mode_enforced`.
- Congelar baseline actual con capturas de referencia por ruta principal.
- Publicar contrato de copy inicial (archivo versionado en frontend).
- Publicar checklist de branding/logo (uso permitido y no permitido).
- Alinear Definition of Ready para tickets:
  - ruta objetivo
  - referencia frame `.pen`
  - estado(s) incluidos
  - criterio de aceptacion visual y funcional
  - evidencia de test requerida.

## 10. Backlog inicial listo para ejecutar
Tickets recomendados para comenzar hoy.

### Sprint 0 - Tickets
1. `UI-000`: Crear `ui-tokens.css` desde variables del `.pen`.
2. `UI-001`: Generar `ui-tokens.json` para handoff.
3. `UI-002`: Implementar `Button` con 5 estados.
4. `UI-003`: Implementar `Input` con 5 estados.
5. `UI-004`: Implementar `Badge`, `Toast`, `EmptyState`.
6. `UI-005`: Implementar `Modal` y `BottomSheet`.
7. `UI-006`: Guia de uso componentes + dos/donts.
8. `UI-007`: Regla lint/review para bloquear estilos inline de color/tipografia.

### Sprint 1 - Tickets
1. `UI-010`: Extender `UserRole` con `DIRECTOR`.
2. `UI-011`: Actualizar `router.tsx` con rutas protegidas de director.
3. `UI-012`: Implementar login token Staff + error state.
4. `UI-013`: Alinear `Auth - Login` con layout target.
5. `UI-014`: Consolidar 404 final segun diseno.
6. `UI-015`: Integrar contrato de copy inicial en Auth/Staff.

## 11. Primer entregable tecnico (primer PR)
Objetivo del primer PR: dejar el proyecto preparado para empezar migracion de pantallas en paralelo.

Contenido minimo:
- Infra de tokens (`css` + `json`).
- 3 componentes base (`Button`, `Input`, `Toast`) con estados.
- Scaffolding de rol `DIRECTOR` en tipos y router (sin vistas finales).
- Documento de copy inicial y checklist branding.

Validacion minima:
- Build OK.
- Tests unitarios de componentes base.
- Capturas de Storybook o equivalente para estados de componentes.

## 12. Avance actual (2026-02-11)
Estado real de ejecucion para mantener trazabilidad sobre este plan.

Completado:
- Base de tokens creada (`ui-tokens.css` + `ui-tokens.json`).
- Componentes base implementados:
  - `Button`
  - `Input`
  - `Toast`
  - `BottomSheet` (base).
- Stories iniciales para componentes base.
- Tests unitarios iniciales para componentes UI.
- Integracion de tokens en `main.tsx` e inicio de alineacion de `index.css`.
- Scaffolding de rol `DIRECTOR`:
  - tipo de rol
  - rutas protegidas
  - shell
  - paginas base.
- Login Staff por token (UI + ruta) con fallback compatible de backend.
- Paridad visual inicial de auth:
  - `Auth - Login` actualizado con layout split.
  - `Staff - Login Token` actualizado con layout dedicado.
  - `Auth - 404` actualizado con vista dedicada.
- Primer uso productivo de `BottomSheet` en RP:
  - filtros mobile en `RP - Historial`.
- Flujo RP separado en vistas dedicadas:
  - `Mis Eventos`
  - `Generar Acceso`
  - `Acceso Generado`
  - rutas nuevas bajo `/rp/events`, `/rp/generate/:assignmentId`, `/rp/generated`.
- RP con estados visuales dedicados integrados al flujo real:
  - `RP - Sin Eventos` en `Mis Eventos`.
  - `RP - Limite Alcanzado` en `Generar Acceso`.
  - `RP - Error Generacion` en `Generar Acceso`.
  - acciones de recuperacion (`Reintentar`, `Volver a mis eventos`) y copy consolidado.
- Ajuste visual de `RP - QR Generado`:
  - bloque de exito
  - tarjeta QR dedicada
  - acciones `Compartir por WhatsApp`, `Copiar enlace`, `Compartir Acceso`, `Descargar Imagen`
  - CTA final `Generar otro acceso`.
- Inicio efectivo de `Fase 4`:
  - ruta `Manager - Detalle Evento` en `/manager/events/:eventId`.
  - variante `Manager - Detalle Evento (Cerrado)` con estado de solo lectura.
  - acceso desde `Manager - Eventos` mediante accion `Ver detalle`.
- `Manager - Eventos` alineado con estados del diseno:
  - header con CTA `Nuevo Evento`.
  - `State - Empty` integrado con accion `Crear primer evento`.
  - `Modal - Crear Evento` integrado (wizard dentro de modal reutilizable).
  - eliminacion del wizard inline para mantener flujo modal consistente.
- `Manager - Eventos` con paridad estructural desktop/mobile:
  - tabla desktop con columnas `Evento`, `Fecha`, `Accesos`, `RPs`, `Estado`, `Acciones`.
  - cards mobile equivalentes para patron `table -> cards`.
  - filtros `Estado` y `Club` con `BottomSheet` en mobile y controles inline en desktop.
- `Manager - Cortes` migrado a paridad desktop/mobile:
  - filtros mobile con `BottomSheet` + filtros inline en desktop.
  - KPIs y listado por evento con patron `table -> cards`.
  - detalle por RP con tabla desktop y cards mobile.
  - estado vacio filtrado con accion de recuperacion.
- `Manager - Staff` migrado a paridad desktop/mobile:
  - formulario de alta alineado a componentes base.
  - filtros por estado en mobile (`BottomSheet`) y desktop (inline).
  - listado con `table -> cards` y estado vacio filtrado.
- `Manager - Clubs` migrado a paridad desktop/mobile:
  - formulario crear/editar alineado a componentes base (sin estilos inline).
  - filtros por estado en mobile (`BottomSheet`) y desktop (inline).
  - listado con `table -> cards` y acciones de gestion en ambos breakpoints.
- `Manager - RPs` migrado a paridad desktop/mobile:
  - formulario de alta alineado a componentes base.
  - filtros por estado/evento en mobile (`BottomSheet`) y desktop (inline).
  - listado principal `table -> cards` + panel de asignaciones por RP con ajuste de limites.
  - reemplazo de `window.prompt` por `BottomSheet` dedicado para editar limite.
- `Manager - Grupos` migrado y saneado:
  - eliminacion de estilos inline/legacy y caracteres corruptos.
  - paridad desktop/mobile con `table -> cards`.
  - modal de alta/edicion con selector de miembros reutilizable y validacion minima.
- `Manager - Plantilla` actualizado:
  - layout responsive de controles + preview en tiempo real.
  - acciones y estados alineados a componentes base (`Button`, `card`, `form-grid`).
  - metadata visual de posicion y escala QR para ajuste fino.
- Ajuste fino transversal en shell Manager:
  - `Manager - Dashboard` migrado a estilos por clases (sin inline legacy).
  - `Manager - Team Layout` y `Manager - Settings` alineados a estilo y estructura actual.
  - `Modal` compartido normalizado (titulo/close) sin artefactos de encoding.
- Inicio efectivo de `Fase 5` (Director desktop):
  - reemplazo de placeholders en `Dashboard Global`, `Comparativo`, `Historicas`, `Reportes`, `Estados`.
  - nuevo hook de datos compartido para Director con agregaciones por club y alertas operativas.
  - reportes ejecutivos con exportes `CSV/JSON` desde UI.
  - base responsive para vistas Director (cards, tablas y alertas).
- Avance en paridad mobile de Director:
  - `Comparativo` con filtros mobile en `BottomSheet` + patron `table -> cards`.
  - `Estados` con filtros mobile en `BottomSheet` + patron `table -> cards`.
  - `Dashboard` con alternativa mobile para `Top clubs` sin tabla densa.
  - `Historicas` optimizado para mobile con barras scrolleables horizontalmente.
  - `Reportes` optimizado para mobile con CTAs de exportacion a ancho completo.
- Ajustes finales de consistencia en shell:
  - fallback de carga unificado con estilo `text-muted` en shells `manager`, `rp`, `scanner`, `director`.
  - iconografia de navegacion de secciones sin estilos inline.
- Consolidacion de estados reutilizables:
  - nuevos componentes UI para `loading`, `error` y `empty` en vistas de datos.
  - refactor de pantallas Director para usar bloques de estado compartidos.
  - pruebas UI extendidas para cubrir estados base.
- Extension transversal de estados reutilizables fuera de Director:
  - Manager: `Dashboard`, `Eventos`, `Detalle Evento`, `Cortes`, `RPs`, `Clubs`, `Staff`, `Grupos`, `Plantilla`.
  - RP: `Mis Eventos`, `Generar Acceso`, `Historial`.
  - Scanner: `Cortes en tiempo real` con estados `loading/error/empty`.
  - reduccion de duplicaciones legacy de mensajes `Cargando/Error/Sin datos`.
- Ajuste visual de `Scanner - Cortes en tiempo real`:
  - acciones de filtros y paginacion migradas a `Button`.
  - clases CSS dedicadas para cabecera, KPIs, tablas y bloque de detalle (sin estilos inline estructurales).
- Ajustes finales RP:
  - `Perfil` migrado a clases CSS dedicadas (sin estilos inline legacy).
  - `Historial` con estructura visual consistente para toolbar y bottom sheet.
- Saneamiento final de componentes auxiliares:
  - `EventWizard` reescrito con copy limpio, iconografia consistente y sin estilos inline estructurales.
  - `TemplateEditor` migrado a clases CSS dedicadas y acciones con componentes `Button`.
  - en Manager/RP/Scanner se mantienen solo estilos inline dinamicos necesarios (graficos y posicionamiento QR).
- Baseline visual automatizable:
  - specs de Playwright manuales actualizados para UI actual en `frontend/e2e/manual-screenshots*.spec.ts`.
  - cobertura por rol y breakpoint: Manager (desktop/mobile), RP (mobile), Scanner (mobile), Director (desktop/mobile).
  - README operativo versionado en `docs/screenshots/manuales/README.md` con comando y matriz de archivos esperados.
  - para Director se usa sesion de manager con override de rol en frontend para habilitar capturas mientras backend mantiene permisos de datos por token manager.
- Baseline visual ejecutado (2026-02-11):
  - corrida manual completada con `CAPTURE_MANUALS=true`.
  - capturas nuevas generadas en `docs/screenshots/manuales/` para:
    - `manager-desktop-*`, `manager-mobile-*`
    - `rp-mobile-*`
    - `scanner-mobile-*`
    - `director-desktop-*`, `director-mobile-*`.
- Refactor de scanner hacia flujo visual por estados:
  - escaneo base
  - validando
  - valido / invalido
  - ticket con nota (confirmar/rechazar)
  - estados de sistema (`offline`, `sin permisos`, `sin camara`, `error de red`).
- Pipeline local en verde:
  - `npm run lint`
  - `npm run test`
  - `npm run build`.

Siguiente prioridad recomendada:
1. Completar ajuste visual fino de densidad/espaciado tipografico contra `.pen` en vistas Manager y Director ya migradas.
2. Ejecutar baseline visual (desktop/mobile) para validar paridad y detectar desalineaciones menores.
3. Revisar y limpiar estilos inline restantes en componentes auxiliares (`TemplateEditor`, `EventWizard`, `ScannerCuts`) para cierre de consistencia total.
