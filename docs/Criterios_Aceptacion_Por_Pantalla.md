
# Criterios de Aceptación por Pantalla – MonoPass Club (MVP)

Este documento **deriva directamente** de la auditoría UX y baja los requerimientos a **criterios de aceptación claros**, listos para desarrollo y QA.

Incluye separación por **módulo/rol** y un **manejo de usuarios explícito**.

---

## 1. MÓDULO: AUTENTICACIÓN Y USUARIOS (GLOBAL)

### Login
**Criterios de aceptación**
- El sistema permite login con usuario y contraseña.
- Al autenticar:
  - Gerente → `/manager`
  - RP → `/rp`
  - Scanner → `/scanner`
- Si las credenciales son incorrectas:
  - Se muestra error claro
  - No se navega
- El token se guarda de forma segura.
- Sin token no se puede acceder a rutas privadas.

---

## 2. MÓDULO GERENTE

### 2.1 Gestión de Usuarios (RPs y Scanner Staff)

#### Pantalla: RpsPage
**Criterios de aceptación**
- El gerente puede:
  - Crear RP
  - Activar / desactivar RP
- Un RP desactivado:
  - No puede generar accesos
- El gerente puede asignar:
  - Límite de accesos por evento (opcional)
- Se muestra:
  - Nombre del RP
  - Estado (activo/inactivo)
  - Total de accesos generados por evento

#### Pantalla: ScannerStaffPage
**Criterios de aceptación**
- El gerente puede:
  - Crear scanner
  - Activar / desactivar scanner
- Un scanner desactivado:
  - No puede validar QR
- Se muestra:
  - Última actividad del scanner

---

### 2.2 ClubsPage
**Criterios de aceptación**
- El gerente puede:
  - Crear club
  - Editar club
  - Activar / desactivar club
- Un club desactivado:
  - No permite crear eventos nuevos
- Acciones críticas requieren confirmación modal.

---

### 2.3 EventsPage
**Criterios de aceptación**
- El gerente puede:
  - Crear evento manual
  - Ver eventos automáticos (recurrentes)
- El evento muestra:
  - Fecha
  - Estado (activo/cerrado)
- Se pueden asignar RPs al evento.
- Un evento cerrado:
  - No permite generar accesos
  - Sí permite ver cortes

---

### 2.4 TemplatePage (EDITOR DE PLANTILLA – CRÍTICO)

**Criterios de aceptación**
- El gerente puede:
  - Subir imagen base del evento
  - Ver un lienzo (canvas)
- El QR:
  - Es draggable
  - No puede salir del canvas
  - Puede escalarse
- El gerente puede:
  - Guardar posición del QR
  - Restablecer posición
- Al guardar:
  - La configuración queda asociada al evento
- Preview en tiempo real obligatorio.

---

### 2.5 SettingsPage
**Criterios de aceptación**
- El gerente puede renombrar el tipo OTRO.
- El cambio:
  - Afecta nuevos accesos
  - Se refleja en el scanner
- Feedback visual al guardar.

---

### 2.6 CutsPage
**Criterios de aceptación**
- El gerente puede filtrar cortes por:
  - Evento
  - RP
  - Rango horario
- El corte muestra:
  - Total de accesos
  - Total GENERAL
  - Total VIP
  - Total OTRO
- Los totales se actualizan según scans reales.
- No se permite edición manual.

---

## 3. MÓDULO RP

### 3.1 AssignedEventsPage
**Criterios de aceptación**
- El RP solo ve eventos asignados.
- Eventos cerrados:
  - Se muestran como solo lectura.

---

### 3.2 GenerateAccessPage
**Criterios de aceptación**
- El RP puede:
  - Seleccionar tipo de invitado
  - Agregar nota opcional
- Al generar acceso:
  - Si hay límite y se excede → error claro
  - Si es exitoso → feedback positivo
- Se muestra:
  - Preview del QR
  - Botón compartir (imagen)
- No se puede generar acceso si el evento está cerrado.

---

### 3.3 HistoryPage
**Criterios de aceptación**
- El RP puede ver:
  - Historial de accesos generados
- Cada acceso muestra:
  - Tipo
  - Estado (pendiente / escaneado)
- Filtros por tipo de invitado.

---

## 4. MÓDULO SCANNER (STAFF)

### 4.1 ScannerPage
**Criterios de aceptación**
- Pantalla full-screen.
- Scanner valida QR:
  - Válido → verde
  - Inválido/usado → rojo
- Se muestra:
  - Tipo de invitado
  - Nota
- Botón Confirmar:
  - Solo si es válido y no usado
- Confirmar:
  - Marca acceso como escaneado
  - No es reversible
- Reintento sobre QR usado:
  - Muestra error
  - No permite acción

---

## 5. CRITERIOS TRANSVERSALES (GLOBAL UX)

- Estados obligatorios:
  - Loading
  - Error
  - Success
- Botones deshabilitados durante requests.
- Evitar doble submit.
- Toasts / mensajes claros.
- Manejo correcto de permisos por rol.
- Ningún rol puede acceder a vistas de otro rol.

---

## 6. DEFINICIÓN DE MANEJO DE USUARIOS (RESUMEN)

- Gerente:
  - Crea y administra RPs y Scanners
- RP:
  - Solo genera accesos
- Scanner:
  - Solo valida y confirma accesos
- Usuarios desactivados:
  - No pueden operar
- Seguridad por rol obligatoria (frontend + backend).

---

Este documento es la **fuente de verdad para QA y Frontend**.
No debe haber decisiones implícitas fuera de estos criterios.
