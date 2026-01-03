
# Auditoría del Repositorio y Plan de Cambios UX – MonoPass Club

## 1. Contexto
El repositorio **monopass_club** ya cuenta con una estructura funcional (monorepo con Core API, Scanner Service y Frontend en React).  
Sin embargo, el frontend actualmente implementa flujos **mínimos** y carece de varias funcionalidades de UX necesarias para operar el sistema en un entorno real de club nocturno.

Este documento define:
- Cambios necesarios en el frontend
- Ajustes de estructura
- Mejoras de UX obligatorias
- Funcionalidad de **drag & drop para posicionar el QR**
- Preguntas abiertas (si aplica)

---

## 2. Auditoría del estado actual (Frontend)

### 2.1 Lo que YA existe
- Routing por rol (Manager, RP, Scanner)
- Shells separados por rol
- Páginas base:
  - Manager: Clubs, Events, RPs, Scanner Staff, Cuts, Settings, Template
  - RP: Eventos asignados, Generar acceso, Historial
  - Scanner: ScannerPage
- Comunicación básica con API
- Estructura limpia por `features`

### 2.2 Carencias detectadas
- UX muy básica (formularios sin feedback claro)
- No hay estados de carga, error o éxito
- No hay confirmaciones visuales (toast/modals)
- No existe edición visual de plantillas
- El QR no se puede posicionar visualmente
- Falta consistencia visual entre roles
- El scanner no prioriza legibilidad en ambiente nocturno
- No hay protección UX contra acciones inválidas (doble click, reintentos)

---

## 3. Cambios funcionales requeridos (Frontend)

### 3.1 Manager

#### ClubsPage
- Agregar:
  - Editar club
  - Activar / desactivar club
  - Confirmación modal al eliminar/desactivar

#### EventsPage
- Agregar:
  - Estado del evento (activo / cerrado)
  - Asignación visual de RPs
  - Indicador de eventos automáticos (jueves–sábado)

#### RpsPage
- Agregar:
  - Activar / desactivar RP
  - Límite de accesos por RP (opcional)
  - Indicador de cuántos accesos lleva

#### ScannerStaffPage
- Agregar:
  - Activar / desactivar scanner
  - Última actividad del scanner

#### CutsPage
- Agregar:
  - Filtros por fecha, evento, RP
  - Totales grandes y legibles
  - Breakdown:
    - Total
    - Generales
    - VIP
    - OTRO

#### SettingsPage
- Agregar:
  - Edición del nombre del tipo OTRO
  - Guardado con feedback visual

---

## 4. UX CRÍTICA: Editor de Plantillas con Drag & Drop de QR

### 4.1 Nueva funcionalidad obligatoria
En **TemplatePage**, el gerente debe poder:

1. Subir una imagen base (flyer / fondo)
2. Ver un lienzo (canvas / board)
3. Arrastrar el QR libremente sobre la imagen
4. Ajustar:
   - Posición (x, y)
   - Tamaño (scale)
5. Guardar la configuración por evento

### 4.2 Comportamiento UX esperado
- El QR se representa como un bloque draggable
- Snap opcional a grid (on/off)
- Límites: el QR no puede salir del canvas
- Preview en tiempo real
- Botón:
  - “Guardar plantilla”
  - “Restablecer posición”

### 4.3 Datos a persistir
Por evento:
- `qrPositionX`
- `qrPositionY`
- `qrScale`
- `backgroundImageUrl`

---

## 5. UX – RP

### GenerateAccessPage
- Selector claro de tipo de invitado
- Campo de nota opcional
- Botón “Generar acceso”
- Feedback inmediato:
  - Éxito
  - Error por límite
- Preview del QR generado
- Botón “Compartir” (imagen)

### HistoryPage
- Lista clara
- Estados:
  - Pendiente
  - Escaneado
- Filtro por tipo de invitado

---

## 6. UX – Scanner

### ScannerPage
- Pantalla full-screen
- Colores de alto contraste
- Estados claros:
  - Verde: válido
  - Rojo: inválido / usado
- Mostrar:
  - Tipo de invitado
  - Nota
- Botón Confirmar:
  - Solo visible si es válido y no usado
- Confirmación no reversible (UX explícita)

---

## 7. Cambios técnicos sugeridos (Frontend)

- Implementar:
  - Toast system global
  - Loader global
  - Error boundary
- Deshabilitar botones mientras hay requests
- Evitar doble submit
- Normalizar estados (loading, success, error)

---

## 8. Preguntas abiertas (solo si se desea afinar)

1. ¿El QR debe poder rotarse o solo escalar?
2. ¿Se permite más de una plantilla por evento?
3. ¿El RP puede ver la plantilla final o solo el QR?
4. ¿El scanner debe vibrar / sonar al validar?

(Si no se responde, se asumen defaults simples)

---

## 9. Resultado
Con estos cambios:
- El frontend queda alineado al SRS
- El dev no interpreta decisiones de UX
- El sistema es usable en entorno real
- El flujo de QR queda controlado y visual

Este documento debe considerarse **obligatorio** para el desarrollo del frontend MVP.
