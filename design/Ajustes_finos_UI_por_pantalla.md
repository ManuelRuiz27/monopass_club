# Ajustes finos UI por pantalla (capturas vs `passmonkey_v1Claude.pen`)

## 1) Alcance de esta revision
- Fuente de diseno: `design/passmonkey_v1Claude.pen`
- Baseline evaluado: `docs/screenshots/manuales/*.png` (desktop + mobile por rol)
- Objetivo: listar ajustes finos por pantalla para cerrar brecha hacia el `.pen`

## 2) Estado global actual

### 2.1 Avance real
- Ya no hay bloqueos masivos por `Cargando...` en Director y Manager.
- La mayoria de rutas capturadas renderiza contenido real y consistente con el flujo funcional.
- Se normalizo captura mobile por viewport (sin stitching de `fullPage`).

### 2.2 Gaps transversales pendientes

#### P0 (bloquea cierre de paridad)
- `rp-mobile-02-generar-acceso.png` sale en negro completo (pantalla vacia). Debe quedar funcional y capturable.
- Desviacion fuerte de lenguaje visual/estructura respecto al `.pen` en varios modulos (sobre todo Scanner y Team Manager): si el objetivo es paridad estricta, falta una ronda de alineacion de layout y componentes base.

#### P1 (calidad visual y consistencia)
- En `rp-mobile-03-ticket-generado.png` hay superposicion de toast/header sobre el contenido.
- Persisten labels de carga no finales en contexto de exito (`Cargando vista previa...` dentro del ticket generado).
- Varias vistas con densidad alta en tablas/listas (Manager desktop) que necesitan pulido de ritmo visual.

#### P2 (acabado)
- Unificar microcopy, estados de botones (`hover/active/disabled/loading`) y contraste secundario.
- Revisar safe area derecha inferior por icono flotante de terceros (si aplica en entorno real).

## 3) Ajustes por pantalla

## 3.1 Manager desktop

### `manager-desktop-01-dashboard.png` (frame `.pen`: `5jb3g`)
- Ajustar lectura del bloque de actividad semanal: definir mejor estado `sin datos` vs grafica real.
- Unificar altura percibida entre cards KPI y paneles inferiores.
- Afinar contraste de CTAs secundarios en `Acciones rapidas`.

### `manager-desktop-02-eventos.png` (frame `.pen`: `0HJAM`)
- Reducir ruido en tabla: mayor separacion vertical por fila y acciones mas compactas.
- Mantener toolbar de filtros alineada con ancho de tabla.
- Verificar truncado estable de nombres largos para evitar saltos de layout.

### `manager-desktop-03-detalle-activo.png` (frame `.pen`: `MoDx9`)
- Mejorar ritmo vertical entre `Volver`, titulo y subtitulo del evento.
- Homologar peso visual entre KPIs y bloque `RPs Activos`.
- Reforzar jerarquia del formulario de asignacion (label, campo, CTA).

### `manager-desktop-04-detalle-cerrado.png` (frame `.pen`: `32lxJ`)
- El `.pen` usa estado cerrado con foco modal/overlay; la captura usa bloque informativo inline.
- Definir criterio final y unificar (modal + backdrop o banner inline, no mixto entre vistas).
- Mantener campos editables realmente bloqueados en estado cerrado.

### `manager-desktop-05-team-rps.png` (frame `.pen`: `kyR7i`)
- Sigue mas cargada que el `.pen` (form + tabla extensa).
- Mantener paginacion visible y clara en listas largas.
- Ajustar toolbar de filtros para no competir visualmente con el formulario de alta.

### `manager-desktop-06-team-grupos.png` (frame `.pen`: `0rgK9`)
- Vista estable. Ajustes finos:
- Centrar mejor el empty state.
- Balancear peso entre `Nuevo Grupo` y CTA interno `Crear primer grupo`.

### `manager-desktop-07-team-staff.png` (frame `.pen`: `6FVmJ`)
- Separar mejor bloque de alta vs bloque de tabla para reducir saturacion vertical.
- Alinear filtros (`Estado`, `Limpiar`) al borde de la tabla.
- Revisar truncado de columna `Ultima actividad` en anchos intermedios.

### `manager-desktop-08-clubs.png` (frame `.pen`: `2YJLh`)
- Estandarizar ancho de botones de accion (`Editar`, `Desactivar`, `Eliminar`).
- Mejorar distancia entre bloque `Crear club`, filtros y tabla para lectura secuencial.

### `manager-desktop-09-plantilla.png` (frame `.pen`: `0NXwm`)
- Mejoro el upload custom. Pendiente:
- Afinar contraste de metadata de preview (`X`, `Y`, `Tamano`) en fondo oscuro.
- Mantener feedback explicito al guardar/restablecer (success/error/loading).

### `manager-desktop-10-cortes.png` (frame `.pen`: `ZEQkm`)
- Mejoro respecto a baseline anterior (ya no captura infinita).
- Pendiente: separar visualmente KPIs globales de bloques por evento para reducir densidad.
- Confirmar paginacion/virtualizacion visible en detalle de cortes por RP.

### `manager-desktop-11-settings.png` (frame `.pen`: `5n1YB`)
- Diferencia funcional importante vs `.pen` (perfil/notificaciones/timezone en diseno vs etiqueta unica actual).
- Definir si se implementa paridad completa del `.pen` o se mantiene alcance reducido.

## 3.2 Manager mobile

### `manager-mobile-01-dashboard.png` (frame `.pen`: `pTy2H`)
- Pantalla estable.
- Ajustar aire entre cards y bloques inferiores para reducir sensacion de apilado.

### `manager-mobile-02-eventos.png` (frame `.pen`: `Kvr1c`)
- Correcta funcionalmente.
- Afinar espaciado de acciones secundarias en card (`Plantilla`, `Duplicar`) para tap targets.

### `manager-mobile-03-team-rps.png` (frame `.pen`: `PWWqk`)
- Muestra vista de gestion completa (tabs + formulario), mas compleja que la variante simple del `.pen`.
- Si se busca paridad estricta mobile, simplificar a patron lista + estado + accion primaria.

### `manager-mobile-04-cortes.png` (frame `.pen`: `hFDQ2`)
- Correcta y util.
- Afinar distancia entre bloque de KPIs y primer card de evento para lectura continua.

### Pendientes de cobertura mobile manager (sin captura en baseline actual)
- `Tomjg` (Crear Evento)
- `Y1NMI` (Detalle)
- `ZBxmj` (Detalle Cerrado)
- `7Pmjs` (Staff)
- `i6dZq` (Grupos)
- `iNo9A` (Clubs)
- `bnCdZ` (Plantilla)
- `voMEq` (Configuracion)

## 3.3 RP mobile

### `rp-mobile-01-eventos.png` (frame `.pen`: `vdecl`)
- Correcta.
- Revisar consistencia de chips de tipo (`General/VIP/Otro`) en cards largas.

### `rp-mobile-02-generar-acceso.png` (frame `.pen`: `S3TAo`)
- P0: imagen negra completa.
- Investigar crash/render null/ruta rota antes de cerrar baseline.

### `rp-mobile-03-ticket-generado.png` (frame `.pen`: `febab`)
- Pantalla funcional, pero con superposicion de toast/header.
- Eliminar texto de carga residual en estado de exito (`Cargando vista previa...`).
- Revisar safe area inferior para CTAs stacked + bottom nav.

### `rp-mobile-04-historial.png` (frame `.pen`: `xfxbI`)
- Correcta.
- Mejorar jerarquia visual de filtros para no competir con encabezado de tabla.

### `rp-mobile-05-perfil.png` (frame `.pen`: `6YZdD`)
- Correcta.
- Unificar estilo de CTA `Cerrar sesion` con resto de botones secundarios del rol.

## 3.4 Scanner mobile

### `scanner-mobile-01-home.png` (frame `.pen`: `6vI8G`)
- Funciona, pero se aleja del `.pen` (que prioriza scanner full focus).
- Reducir ruido del header + tabs cuando el objetivo principal es escanear.

### `scanner-mobile-02-validacion-exitosa.png` (frame `.pen`: `u66xz`)
- Estado positivo visible.
- En el `.pen` el estado de validacion es pantalla dedicada mas limpia.
- Evaluar simplificar y reforzar CTA principal post validacion.

### `scanner-mobile-03-ticket-reutilizado.png` (frame `.pen`: `SnCjM`)
- Estado invalido correcto.
- Ajustar contraste de bloque rojo y jerarquia de mensaje/accion.

### `scanner-mobile-04-cortes.png` (frame `.pen`: variante cortes staff)
- Correcta funcionalmente.
- Pulir orden visual de filtros para uso rapido en operacion.

## 3.5 Director desktop

### `director-desktop-01-dashboard.png` (frame `.pen`: `oXITZ`)
- Correcta.
- Ajustar balance de anchos en fila de KPIs para mejorar simetria.

### `director-desktop-02-comparativo.png` (frame `.pen`: `BO6ZK`)
- Correcta.
- El `.pen` combina comparativo + visualizacion; validar inclusion de componente grafico final o placeholder formal.

### `director-desktop-03-historicas.png` (frame `.pen`: `YnNxy`)
- Correcta.
- Ajustar espaciado entre grafica y paneles inferiores para ritmo uniforme.

### `director-desktop-04-reportes.png` (frame `.pen`: `UfDAc`)
- Correcta.
- Homologar altura de cards de exportacion y separar mejor `Vista previa`.

### `director-desktop-05-estados.png` (frame `.pen`: `6BWCU`)
- Correcta.
- Revisar equilibrio entre tabla de estado por club y panel de alertas.

## 3.6 Director mobile

### `director-mobile-01-dashboard.png` (frame `.pen`: `bf8ch`)
- Correcta.
- Reforzar legibilidad de labels secundarios con brillo bajo.

### `director-mobile-02-comparativo.png` (frame `.pen`: `VqbdM`)
- Correcta.
- Ajustar boton `Filtrar` para mantener alineacion con card principal.

### `director-mobile-03-historicas.png` (frame `.pen`: `GlsvF`)
- Correcta.
- Ajustar separacion entre grafica y resumen para evitar bloque compacto.

### `director-mobile-04-reportes.png` (frame `.pen`: `IbTqL`)
- Correcta.
- Estandarizar paddings verticales entre cards de exportacion.

### `director-mobile-05-estados.png` (frame `.pen`: `XKq5b`)
- Correcta.
- Revisar recorte de bottom nav por icono flotante externo.

## 4) Priorizacion ejecutable inmediata

### Sprint inmediato (P0)
- Corregir `rp-mobile-02-generar-acceso.png` (pantalla negra).
- Definir decision de paridad estricta vs paridad funcional para diferencias grandes con `.pen` (sobre todo Scanner/Team/Settings).

### Sprint siguiente (P1)
- Corregir overlays en `rp-mobile-03-ticket-generado.png`.
- Pulir densidad y jerarquia visual en `manager-desktop-02`, `05`, `07`, `10`.
- Cerrar micro-ajustes de layout en Director desktop/mobile.

### Sprint de cierre (P2)
- Unificar copy final y estados de componentes.
- Completar capturas faltantes de Manager mobile (8 pantallas pendientes).

## 5) Criterio de cierre por pantalla
- Sin pantallas negras ni `loading` permanente.
- Sin overlays involuntarios sobre contenido principal.
- Estados `loading/empty/error/success` visibles y consistentes.
- La captura final queda mapeada al frame objetivo del `.pen` con desviaciones documentadas.
