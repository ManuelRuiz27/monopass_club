# UI Copy Contract - Sprint 0 Baseline

## Purpose
Centralize approved UI copy so frontend does not invent labels, errors, or system messages.

## Scope
Initial baseline for:
- Auth
- Staff token login
- RP mobile core states
- Global 404
- Generic system states

## Conventions
- Keep copy in Spanish.
- Keep labels short and action-oriented.
- Error messages must include recovery action when possible.
- Avoid placeholders like "Lorem ipsum", "Texto pendiente", or "Modulo en construccion".

## Auth
- Login title: `MonoPass Club`
- Login subtitle: `Usa las credenciales de tu rol para ingresar.`
- Username label: `Usuario`
- Password label: `Contrasena`
- Submit button default: `Entrar`
- Submit button loading: `Ingresando...`
- Login error: `No se pudo iniciar sesion. Verifica usuario y contrasena.`

## Staff Token Login
- Title: `Staff Scanner`
- Token label: `Token de acceso`
- Token placeholder: `Ingresa tu token`
- Submit button: `Ingresar`
- Error invalid token: `Token invalido o expirado`

## 404
- Title: `Ups, no encontramos la pagina`
- Description: `Revisa la URL o vuelve a una de las secciones principales.`

## Generic system states
- Loading: `Cargando...`
- Network error: `No se pudo completar la solicitud. Intenta de nuevo.`
- Empty state generic: `No hay datos disponibles.`
- Retry action: `Reintentar`

## RP mobile core states
- Mis eventos empty title: `No tienes eventos asignados`
- Mis eventos empty description: `Contacta a tu manager para que te asigne a un evento activo.`
- Mis eventos load error title: `Error al cargar eventos`
- Mis eventos load error description: `No se pudieron cargar tus eventos asignados. Intenta de nuevo.`
- Limite alcanzado title: `Limite alcanzado`
- Limite alcanzado description: `Has agotado tus accesos disponibles para este evento. Contacta a un manager para solicitar mas.`
- Error generacion title: `Error al generar acceso`
- Error generacion description: `Hubo un problema de conexion. Por favor intenta nuevamente.`
- QR generado title: `Acceso Generado`
- QR generado subtitle pattern: `El pase {TIPO} esta listo para compartir`
- QR generado actions:
  - `Compartir por WhatsApp`
  - `Copiar enlace`
  - `Compartir Acceso`
  - `Descargar Imagen`
  - `<- Generar otro acceso`

## Manager events states
- Events title: `Eventos`
- Events subtitle: `Gestiona los eventos de tu club`
- Empty title: `Sin eventos todavia`
- Empty description: `Crea tu primer evento para empezar a gestionar accesos`
- Empty action: `Crear primer evento`
- Create modal title: `Nuevo Evento`
- Create modal primary action: `Crear Evento`
- Create modal secondary action: `Cancelar`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar eventos`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar`
- Filtered empty title: `No hay eventos para este filtro`
- Filtered empty description: `Ajusta los filtros o limpia la busqueda para ver todos los eventos.`

## Manager cuts states
- Cuts title: `Cortes`
- Cuts subtitle: `Monitorea cortes y escaneos por evento y RP`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar cortes`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar filtros`
- Loading summary: `Cargando cortes...`
- Generic error: `No se pudieron obtener los cortes.`
- Filtered empty title: `No hay cortes para este filtro`
- Filtered empty description: `Prueba con otro evento, RP o rango de fechas.`
- Detail panel title: `Detalle por RP`
- Detail panel subtitle: `Escaneos en el rango seleccionado.`
- Detail loading: `Cargando detalle...`
- Detail error: `No se pudo cargar el detalle.`

## Manager scanner staff states
- Scanner title: `Staff Scanner`
- Scanner subtitle: `Administra cuentas de scanner y su disponibilidad.`
- Create section title: `Crear scanner`
- Create action default: `Crear scanner`
- Create action loading: `Creando...`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar scanners`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar filtros`
- Loading list: `Cargando scanners...`
- Generic error: `No se pudo cargar el staff.`
- Filtered empty title: `No hay scanners para este filtro`
- Filtered empty description: `Ajusta el estado o limpia la busqueda para ver todo el staff.`
- Last activity prefix: `Ultima actividad:`

## Manager clubs states
- Clubs title: `Clubs`
- Clubs subtitle: `Gestiona capacidad y disponibilidad de los clubs.`
- Form title (create): `Crear club`
- Form title (edit): `Editar club`
- Form actions: `Crear club`, `Guardar cambios`, `Cancelar edicion`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar clubs`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar filtros`
- Loading list: `Cargando clubs...`
- Generic error: `No pudimos cargar los clubs.`
- Filtered empty title: `No hay clubs para este filtro`
- Filtered empty description: `Ajusta el estado o limpia la busqueda para ver todos los clubs.`

## Manager RPs states
- RPs title: `Relaciones Publicas`
- RPs subtitle: `Administra cuentas RP y sus asignaciones por evento.`
- Form title: `Crear RP`
- Form actions: `Crear RP`, `Creando...`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar RPs`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar filtros`
- Loading list: `Cargando RPs...`
- Generic error: `Error al consultar RPs.`
- Filtered empty title: `No hay RPs para este filtro`
- Filtered empty description: `Ajusta estado o evento para encontrar resultados.`
- Detail title pattern: `Asignaciones de {NOMBRE_RP}`
- Detail subtitle: `Ajusta limites por evento y revisa accesos generados.`
- Detail empty: `Aun no tiene eventos asignados.`
- Detail action: `Ajustar limite`
- Limit sheet title: `Ajustar limite`
- Limit sheet actions: `Guardar`, `Cancelar`

## Manager RP groups states
- RP groups title: `Grupos de RPs`
- RP groups subtitle: `Crea grupos para organizar equipos de relaciones publicas.`
- Empty title: `Todavia no hay grupos`
- Empty description: `Crea tu primer grupo para gestionar miembros en bloque.`
- Empty action: `Crear primer grupo`
- Loading list: `Cargando grupos...`
- Generic error: `No se pudieron cargar los grupos.`
- Modal titles: `Nuevo Grupo`, `Editar Grupo`
- Modal actions: `Crear Grupo`, `Guardar Cambios`, `Cancelar`
- Member selector validation: `Selecciona al menos un RP`

## Manager template states
- Template title: `Plantilla / QR`
- Template subtitle: `Sube imagen base, posiciona el QR y ajusta escala para cada evento.`
- Loading events: `Cargando eventos...`
- Generic error: `No se pudieron cargar los eventos.`
- Save action default: `Guardar plantilla`
- Save action loading: `Guardando...`
- Reset action: `Restablecer`
- Preview title: `Preview en tiempo real`
- Preview helper: `Arrastra para posicionar y pellizca para escalar.`

## Manager dashboard states
- Dashboard title: `Dashboard`
- Loading state: `Cargando dashboard...`
- Generic error: `No pudimos obtener los datos del dashboard.`
- Sections: `Actividad semanal`, `Top RPs`, `Acciones rapidas`
- Empty top RP fallback: `No hay actividad de RPs aun.`

## Manager settings states
- Settings title: `Configuracion`
- Settings subtitle: `Renombra el tipo de invitado OTHER para reflejar tus necesidades.`
- Primary action default: `Actualizar`
- Primary action loading: `Guardando...`
- Current label prefix: `Etiqueta actual:`

## Manager team layout states
- Team title: `Gestion de equipo`

## Director dashboard states
- Dashboard title: `Dashboard global`
- Dashboard subtitle: `Vista ejecutiva consolidada de operacion y asistencia.`
- Loading state: `Cargando dashboard global...`
- Generic error: `No se pudo cargar el dashboard global.`
- Sections: `Top clubs`, `Alertas operativas`
- Empty alerts fallback: `Sin alertas criticas por ahora.`

## Director comparative states
- Comparative title: `Comparativo`
- Comparative subtitle: `Compara desempeno operativo entre clubs.`
- Loading state: `Cargando comparativo...`
- Generic error: `No se pudo cargar el comparativo de clubs.`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar comparativo`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar filtros`
- Empty title: `No hay datos para este filtro`
- Empty description: `Ajusta la vista para ver mas resultados.`
- Empty action: `Limpiar filtro`

## Director historical states
- Historical title: `Historicas`
- Historical subtitle: `Evolucion mensual de generacion y asistencia.`
- Loading state: `Cargando historicas...`
- Generic error: `No se pudieron cargar las metricas historicas.`
- Main section: `Tendencia mensual`
- Empty trend fallback: `No hay datos historicos para mostrar.`

## Director reports states
- Reports title: `Reportes`
- Reports subtitle: `Exportes ejecutivos para seguimiento y reuniones.`
- Loading state: `Cargando reportes...`
- Generic error: `No se pudieron preparar los reportes.`
- Export actions:
  - `Exportar JSON resumen`
  - `Exportar CSV clubs`
  - `Exportar CSV alertas`

## Director status states
- Status title: `Estados`
- Status subtitle: `Seguimiento de salud operativa por modulo y club.`
- Loading state: `Cargando estados...`
- Generic error: `No se pudieron cargar los estados operativos.`
- Filters trigger (mobile): `Filtrar`
- Filters title: `Filtrar estados`
- Filters actions: `Aplicar`, `Cancelar`, `Limpiar filtros`
- Main sections: `Estado por club`, `Alertas`
- Empty alerts fallback: `Sin alertas activas.`

## Modal shared states
- Close aria-label: `Cerrar`
- Close icon keyword: `close`

## Change control
- Any copy change requires update in this file and product approval.
