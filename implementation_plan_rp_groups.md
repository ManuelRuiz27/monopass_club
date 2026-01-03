# Plan de Implementación: Grupos de RPs (Listas de Distribución)

## Objetivo
Permitir a los Managers crear grupos de RPs (ej. "RPs VIP", "Equipo Jueves") para facilitar la asignación masiva en eventos, evitando seleccionar RPs uno por uno.

## Estrategia Técnica
Implementaremos los grupos como una **herramienta de organización**, no como una entidad estricta de asignación. Esto significa que al asignar un grupo a un evento, el sistema simplemente "traducirá" el grupo a una lista de RPs individuales. Esto simplifica la lógica de eventos y reportes.

---

## 1. Base de Datos (Core API)

### Schema Update
Agregar el modelo `RpGroup` en `schema.prisma`:

```prisma
model RpGroup {
  id        String      @id
  name      String
  manager   User        @relation(fields: [managerId], references: [id], onDelete: Cascade)
  managerId String
  members   RpProfile[] @relation("RpGroupMembers") // Many-to-Many implícita o explícita
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

// Actualizar RpProfile para incluir la relación inversa
model RpProfile {
  // ...
  groups RpGroup[] @relation("RpGroupMembers")
}
```

---

## 2. Backend (Core API)

### Endpoints Nuevos (`/manager/rp-groups`)
- `GET /` - Listar grupos del manager.
- `POST /` - Crear grupo (Nombre + IDs de RPs).
- `GET /:id` - Detalle de grupo.
- `PUT /:id` - Actualizar miembros/nombre.
- `DELETE /:id` - Eliminar grupo.

---

## 3. Frontend (Manager)

### Nueva Sección: Gestión de Grupos
- **Ruta:** `/manager/team/groups` (Se agregará al `TeamLayout`).
- **UI:**
    - Lista de grupos creados.
    - Modal/Pantalla de creación: Input nombre + Lista seleccionable de todos los RPs activos.

### Integración en Event Wizard
- En el paso **"3. Asignar RPs"**:
    - Agregar un selector/botón: "Cargar desde grupo...".
    - Al seleccionar un grupo, el sistema marcará automáticamente los checkboxes de los RPs que pertenecen a ese grupo.
    - El Manager puede luego desmarcar o añadir extras manualmente (flexibilidad total).

---

## 4. Pasos de Ejecución

1.  **DB:** Modificar `schema.prisma` y ejecutar migración.
2.  **API:** Crear Service y Controller para `RpGroups`.
3.  **Frontend - Gestión:** Crear `RpGroupsPage` y actualizar `TeamLayout`.
4.  **Frontend - Wizard:** Conectar selector de grupos en `EventWizard`.

## Estimación
- **Complejidad:** Media-Baja.
- **Riesgo:** Bajo (no toca lógica crítica de tickets o cortes).
