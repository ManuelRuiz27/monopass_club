# Plan de Respuesta ante Incidentes

Este documento define los protocolos para manejar interrupciones en el servicio MonoPass Club.

## Niveles de Severidad

| Nivel | Definición | Ejemplo | Tiempo de Respuesta (SLA) |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Crítico)** | El sistema está caído o la función principal (escanear en puerta) no funciona. | "No podemos validar gente en la entrada". Base de datos inalcanzable. | **< 15 minutos** |
| **SEV-2 (Alto)** | Funcionalidad degradada. Workarounds disponibles pero difíciles. | "El dashboard de Manager carga lento". "No llegan las imágenes por WhatsApp". | **< 1 hora** |
| **SEV-3 (Medio/Bajo)** | Bugs menores que no impiden la operación crítica. | Error ortográfico en un label. Glitch visual. | **Próximo día hábil** |

---

## Protocolos de Respuesta SEV-1

### Escenario A: Caída del Scanner Service
**Síntoma**: La App de scanner muestra "Error de Red" constante al intentar validar.

**Pasos de Respuesta**:
1.  **Verificar Status Page** del proveedor de nube (Render).
2.  **Reiniciar Servicio**: Forzar un redeploy manual del servicio `scanner-service` desde el panel de control.
3.  **Logs**: Revisar logs de los últimos 10 minutos buscando "Out of Memory" o "Connection Timeout". do
4.  **Workaround**: Si el servicio no levanta, activar el **Modo de Contingencia** (validación visual manual de las firmas de los tickets, si aplica, o lista impresa de emergencia si se generó pre-evento).

### Escenario B: Base de Datos Inaccesible
**Síntoma**: Todos los servicios (Core y Scanner) fallan.

**Pasos de Respuesta**:
1.  **Verificar Conectividad**: Intentar conectar directo vía CLI (`psql`).
2.  **Failover**: Si es un problema de la instancia principal, promover la réplica de lectura a maestra (si existe configuración HA).
3.  **Restore**: Si hubo corrupción de datos, iniciar procedimiento de restauración PITR al punto previo al incidente.

---

## Escalación
1.  **Ingeniero de Guardia (On-Call)**: Recibe la alerta inicial.
2.  **Tech Lead**: Se involucra si el SEV-1 persiste > 30 mins.
3.  **CTO / Stakeholders**: Notificados si hay impacto en eventos en vivo (fin de semana noche).

## Post-Mortem
Todo incidente SEV-1 o SEV-2 requiere un documento **Post-Mortem** en las 48 horas siguientes, detallando:
- Línea de tiempo del incidente.
- Causa raíz (5 Whys).
- Acciones correctivas para evitar recurrencia.
