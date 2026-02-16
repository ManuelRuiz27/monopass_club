# Pass Monkey — Rediseño UI/UX Integral
Documento de Alcance para Diseño en Figma

---

## 1. Objetivo del documento
Definir **todas las interfaces necesarias** para una actualización completa de Pass Monkey, eliminando pantallas redundantes, flujos confusos y decisiones innecesarias para el usuario final.

El diseñador debe usar este documento como **única fuente de verdad** para crear el archivo Figma del rediseño.

---

## 2. Principios UX del rediseño (base del proyecto)

- Cada rol tiene **una experiencia independiente**
- Una pantalla = una tarea principal
- Menos pantallas, más claridad
- Priorizar uso real en eventos
- Reducir decisiones del usuario
- Diseño escalable (design system)

---

## 3. Roles del sistema

1. Staff (Scanner / Puerta)
2. RP (Relaciones Públicas)
3. Manager (Gerente de Evento)
4. Director (Plataforma / Negocio)

---

## 4. Arquitectura global de pantallas

Las pantallas se organizan por **rol**, no por módulos técnicos.

No deben mezclarse estilos ni patrones entre roles.

---

# 5. STAFF (Scanner)

### Contexto
- Uso en puerta
- Baja luz
- Estrés operativo
- Uso continuo

### Objetivo UX
Validar accesos **rápido, claro y sin errores**.

---

### Pantallas STAFF

#### S1. Login por Token
- Input único (token)
- CTA principal: “Ingresar”
- Estado: token inválido

---

#### S2. Scanner Activo
- Cámara full screen
- Marco de escaneo visible
- Estado base: esperando QR

---

#### S3. Escaneo Válido
- Overlay verde
- Feedback visual + háptico
- Auto-retorno a scanner

---

#### S4. Escaneo Inválido
- Overlay rojo
- Motivo corto (texto mínimo)
- Auto-retorno

---

#### S5. Ticket con Nota
- Pantalla completa
- Mostrar nota
- CTAs:
  - Permitir acceso
  - Rechazar acceso

---

#### S6. Estados del sistema (variantes)
- Cámara no disponible
- Sin permisos
- Error de red

> NOTA: no son pantallas nuevas, son variantes visuales.

---

# 6. RP (Relaciones Públicas)

### Contexto
- Uso previo y durante evento
- Generación masiva
- Compartición rápida

### Objetivo UX
Generar accesos **sin fricción ni confusión**.

---

### Pantallas RP

#### R1. Lista de Eventos Asignados
- Cards simples por evento
- Estado: activo / cerrado
- Indicador de accesos restantes

---

#### R2. Generar Acceso
- Selección de tipo (chips grandes)
  - General
  - VIP
  - Otro
- Campo de nota (opcional, colapsable)
- CTA: “Generar acceso”

---

#### R3. Acceso Generado
- Preview del ticket
- CTAs:
  - Compartir
  - Descargar
  - Generar otro

---

#### R4. Límite Alcanzado
- Mensaje claro
- CTA deshabilitado
- Explicación corta

---

#### R5. Estados RP
- Sin eventos asignados
- Error al generar
- Sesión expirada

---

# 7. MANAGER (Gerente de Evento)

### Contexto
- Supervisión
- Control operativo
- Toma de decisiones rápidas

### Objetivo UX
Sentir **control y claridad**, no complejidad técnica.

---

### Pantallas MANAGER

#### M1. Dashboard del Evento
- KPIs principales:
  - Eventos activos
  - Accesos generados
  - Accesos validados
  - % asistencia
- Acciones rápidas

---

#### M2. Gestión de Eventos
- Lista de eventos
- Crear / editar evento
- Estado del evento

---

#### M3. Detalle de Evento
- Resumen
- Accesos
- Staff asignado
- RPs asignados

---

#### M4. Gestión de Staff
- Lista de scanners
- Estado: activo / inactivo
- Última actividad

---

#### M5. Gestión de RPs
- Lista de RPs
- Accesos asignados / usados
- Activar / desactivar

---

#### M6. Cortes y Métricas
- Totales
- Por evento
- Por RP

---

#### M7. Ajustes del Evento
- Activar / cerrar accesos
- Configuraciones básicas

---

#### M8. Estados MANAGER
- Sin datos
- Evento cerrado
- Error de red

---

# 8. DIRECTOR (Plataforma)

### Contexto
- Post-evento
- Análisis
- Estrategia

### Objetivo UX
Visualizar el negocio, no la operación.

---

### Pantallas DIRECTOR

#### D1. Dashboard Global
- Total de eventos
- Total de accesos
- Asistencia promedio
- KPIs clave

---

#### D2. Comparativo de Eventos
- Tabla / gráfica comparativa
- Filtros por fecha

---

#### D3. Métricas Históricas
- Tendencias
- Gráficas temporales

---

#### D4. Reportes y Exportes
- Exportar CSV / PDF
- Selección de periodo

---

#### D5. Estados DIRECTOR
- Sin información
- Error de carga

---

# 9. Sistema Visual (obligatorio)

El diseñador debe definir:

- Paleta de color por rol
- Tipografía
- Escalas
- Espaciado
- Estados de componentes
- Botones
- Cards
- Badges
- Overlays

---

# 10. Restricciones Técnicas

- Frontend: React
- Mobile web / PWA
- Scanner con cámara del navegador
- Animaciones simples (CSS)
- No dependencias visuales complejas

---

# 11. Qué NO diseñar

- Pantallas no listadas aquí
- Flujos alternos no definidos
- Funciones “por si acaso”
- UI genérica compartida entre roles

---

## 12. Entregables esperados del diseñador

- Archivo Figma organizado por rol
- Wireframes → UI final
- Design System incluido
- Estados y variantes
- Mobile / Desktop según rol

---

## 13. Referencia técnica
Repositorio (solo lectura):
https://github.com/ManuelRuiz27/monopass_club

Este diseño debe alinearse al estado real del proyecto.
