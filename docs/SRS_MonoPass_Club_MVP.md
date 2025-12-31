# SRS — MonoPass Club (MVP)
Versión: 1.0  
Estado: CERRADO PARA DESARROLLO MVP

---

## 1. Introducción

### 1.1 Propósito
Este documento define los **requerimientos funcionales y no funcionales** del sistema **MonoPass Club**, orientado a la gestión de accesos por QR en **centros nocturnos**, con operación mediante **Gerente**, **RP** y **Staff Scanner**.

El SRS está diseñado para que un equipo técnico pueda implementar el MVP **sin ambigüedades**.

### 1.2 Alcance
MonoPass Club permite:
- Crear centros nocturnos y eventos
- Asignar RPs a eventos
- Generar accesos QR no reutilizables
- Escanear accesos en puerta sin posibilidad de reversión
- Obtener cortes de accesos por RP clasificados por tipo

No incluye pagos, monetización ni reembolsos.

---

## 2. Definiciones y Roles

### 2.1 Roles del sistema
- **Gerente**
  - Administra centros, eventos, RPs y staff scanner
  - Define límites de accesos
  - Consulta cortes

- **RP (Relaciones Públicas)**
  - Genera accesos para eventos asignados
  - Comparte accesos en formato imagen

- **Staff Scanner**
  - Escanea y confirma accesos en puerta
  - No puede revertir entradas

---

## 3. Reglas de Negocio (Críticas)

1. Un acceso **NO puede reutilizarse** una vez escaneado.
2. El staff scanner **NO puede revertir** una entrada confirmada.
3. Los tipos de invitado son:
   - GENERAL (fijo)
   - VIP (fijo)
   - OTRO (renombrable por el gerente)
4. No existe límite global de accesos.
5. El gerente **puede definir un límite opcional** de accesos por RP y evento.
6. Si no hay límite definido, el RP puede generar accesos ilimitados.
7. El corte:
   - Es solo conteo (no dinero)
   - Clasifica accesos en GENERAL / VIP / OTRO
8. El sistema es **multi-evento y multi-centro** por gerente.

---

## 4. Requerimientos Funcionales

### 4.1 Gestión de Centros (Gerente)
- Crear, editar y desactivar centros nocturnos
- Definir capacidad informativa del centro

### 4.2 Gestión de Eventos
- Crear eventos manuales
- Crear eventos recurrentes (por días de la semana)
- Asignar imagen base del acceso
- Definir posición del QR sobre la imagen

### 4.3 Gestión de RPs
- Crear, editar y desactivar RPs
- Asignar RPs a eventos
- Definir límite de accesos opcional por evento

### 4.4 Generación de Accesos (RP)
- Seleccionar evento asignado
- Elegir tipo de invitado
- Agregar nota logística opcional
- Generar QR único
- Descargar acceso como imagen
- Compartir acceso por WhatsApp (vía enlace)

### 4.5 Escaneo de Accesos (Staff)
- Escanear QR
- Validar acceso (válido / ya usado / inválido)
- Confirmar entrada
- Visualizar tipo de invitado y nota logística

### 4.6 Cortes (Gerente)
- Consultar accesos por rango de tiempo
- Ver cortes por RP
- Visualizar totales clasificados:
  - General
  - VIP
  - Otro

---

## 5. Requerimientos No Funcionales

### 5.1 Seguridad
- Autenticación JWT
- Control de acceso por rol
- Scanner aislado como microservicio

### 5.2 Performance
- Validación QR < 150ms (p95)
- Confirmación < 250ms (p95)

### 5.3 Disponibilidad
- El scanner debe poder operar aunque el core tenga alta carga
- Arquitectura desacoplada

### 5.4 Usabilidad
- Mobile-first
- UI clara en ambientes de baja luz
- Feedback visual inmediato en scanner

---

## 6. Restricciones Técnicas

- Backend: Node.js 22 LTS
- ORM: Prisma 7
- DB: PostgreSQL
- Frontend: React 19.3.0+
- API REST documentada en OpenAPI
- Scanner como microservicio independiente

---

## 7. Fuera de Alcance (Explícito)

- Pagos
- Monetización
- Estadísticas financieras
- Edición o anulación de accesos
- Integración con WhatsApp API oficial
- Control de aforo automático

---

## 8. Criterios de Aceptación Globales

- No existen accesos reutilizables
- No existe reversión de escaneos
- Los límites de RP se respetan
- Los cortes coinciden con escaneos reales
- El sistema funciona en móvil en puerta

---

## 9. Estado del Documento

Este SRS se considera **cerrado** para el desarrollo del MVP.  
Cualquier cambio posterior deberá registrarse como **Change Request**.

---
