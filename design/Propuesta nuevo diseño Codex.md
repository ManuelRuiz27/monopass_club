# Propuesta nuevo diseno Codex (MVP)

Fecha: 2026-02-06

## 1) Fuente de verdad y contexto revisado
- Documento: `docs/actualizacion ui-ux` (fuente de verdad).
- Codigo: rutas y pantallas en `frontend/src`.
- UI actual en Pencil: `design/passmonkey_v1Codex.pen`.

## 2) Alcance MVP (documento + pantallas existentes en codigo)
### RP (mobile-first)
1. RP - Home / Generar acceso
2. RP - QR generado
3. RP - Historial
4. RP - Perfil

### Gerente (desktop-first)
1. Gerente - Dashboard
2. Gerente - Gestion de RPs
3. Gerente - Eventos
4. Gerente - Editor de plantilla
5. Gerente - Cortes
6. Gerente - Clubs
7. Gerente - Settings
8. Gerente - Team / RP Groups
9. Gerente - Team / Scanner Staff

### Director
1. Director - Dashboard Global

### Scanner
1. Scanner - Escanear
2. Scanner - Cortes (si aplica al rol en MVP)

### Auth
1. Login

### Flujos obligatorios (frames de flujo)
1. RP -> Generar acceso -> Compartir -> Invitado entra
2. Gerente -> Crear evento -> Asignar RP -> Ver corte
3. Scanner -> Escanear -> Confirmar

### Estados transversales (aplican a todas las pantallas)
1. Loading
2. Success
3. Error
4. Disabled
5. Empty state

## 3) Gaps detectados (documento vs codigo vs UI actual)
### Documento que NO esta 100% reflejado en el codigo
- Gerente - Editor de plantilla existe como `TemplatePage.tsx` pero NO esta en `managerRoutes`.

### UI actual en Pencil vs documento/codigo
- Pencil ya cubre: RP Home, RP QR, RP Historial, RP Perfil, Gerente Dashboard, Gerente RPs, Gerente Eventos, Gerente Plantilla, Gerente Cortes, Director Dashboard, User Flows.
- Pendientes en Pencil para cubrir todo el alcance MVP: Clubs, Settings, RP Groups, Scanner Staff, Scanner, Scanner/Cuts, Login.

## 4) Propuesta UX senior (sin agregar pantallas nuevas fuera del MVP)
### Principios aplicados
- Mobile-first para RP, desktop-first para Gerente y Director.
- Alta legibilidad en bajo contraste ambiental.
- CTA unicos y claros (evitar doble foco).
- Feedback inmediato y estados visibles.

### Ajustes recomendados por pantalla (MVP)
RP - Home / Generar acceso
- Jerarquia fuerte: evento asignado -> tipo de invitado -> CTA.
- VIP visible pero no dominante.

RP - QR generado
- QR al centro, acciones primarias horizontales (WhatsApp / Copiar).
- Confirmacion de exito visible antes de compartir.

RP - Historial
- Cards limpias con estado claro (pendiente/escaneado).
- Reenvio rapido como accion secundaria.

RP - Perfil
- Contenido minimo, acceso rapido a cerrar sesion.

Gerente - Dashboard
- KPIs claros, sin graficas complejas.
- Acceso rapido a Eventos y Cortes.

Gerente - Gestion de RPs
- Tabla simple + drawer lateral para crear/editar.
- Filtros por evento y estado.

Gerente - Eventos
- Lista de eventos + estado activo/cerrado.
- Asignacion de RPs como accion directa.

Gerente - Editor de plantilla
- Canvas central con guia de area segura.
- QR draggable y escalable (limite dentro del canvas).

Gerente - Cortes
- Filtros + totales por tipo.
- Exportar marcado como futuro.

Gerente - Clubs
- Vista simple con lista + estado del club + accion primaria (crear/editar).
- Evitar tablas densas; priorizar lectura rapida.

Gerente - Settings
- Formulario minimo con descripciones claras (solo lo que el negocio usa).
- Confirmacion visual de cambios.

Gerente - Team / RP Groups
- Cards por grupo con miembros y CTA para editar.
- Crear grupo en modal/drawer para no perder contexto.

Gerente - Team / Scanner Staff
- Tabla ligera con estado y ultima actividad.
- Acciones criticas con confirmacion.

Director - Dashboard Global
- KPI agregados + tendencia simple + ranking.
- Filtros por club/fecha.

Scanner - Escanear
- Flujo lineal: escanear -> validar -> confirmar.
- Feedback inmediato con estados grandes (success/error).

Scanner - Cortes
- Resumen por evento/RP y filtros por rango de fecha.
- Listado corto con totales visibles.

Login
- Acceso rapido por rol con minimo friccion.
- Mensajes de error no tecnicos.

## 5) Plan de trabajo propuesto
Fase 0: Validacion de alcance
- Confirmado: incluir TODO el MVP y pantallas actuales del codigo.

Fase 1: Design system
- Paleta, tipografia, botones, inputs, chips, cards, estados.

Fase 2: RP (mobile)
- Home, QR generado, Historial, Perfil.
- Estados loading/success/error por flujo principal.

Fase 3: Gerente (desktop)
- Dashboard, Gestion de RPs, Eventos, Plantilla, Cortes, Clubs, Settings, Team (RP Groups, Scanner Staff).

Fase 4: Director (desktop)
- Dashboard Global con filtros y ranking.

Fase 5: Scanner y Auth
- Scanner (Escanear, Cortes)
- Login

Fase 6: Flujos visuales
- 3 flujos obligatorios.

Fase 7: Handoff
- Nombres de frames, anotaciones y prototipos basicos.

## 6) Decision requerida
Alcance confirmado: incluir todo el MVP y las pantallas existentes en el codigo.
