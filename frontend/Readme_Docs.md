# MonoPass Club - Documentación de Flujos de Usuario

Este documento describe los flujos principales de la plataforma **MonoPass Club**, diseñado para el equipo de Marketing.

## Introducción
MonoPass Club es una plataforma integral para la gestión de accesos y eventos en clubes nocturnos. Permite la coordinación entre Gerentes (Managers), Relaciones Públicas (RPs) y el personal de seguridad (Scanners) para agilizar la entrada y el control de aforo.

---

## 1. Acceso a la Plataforma (Login)
Todos los usuarios acceden a través de un portal unificado. Dependiendo de sus credenciales, el sistema los redirige automáticamente a su panel correspondiente.

![Login Page](docs_assets/login_mockup_1769439615268.png)

**Credenciales Demo:**
- `manager.demo`: Acceso total al dashboard de administración.
- `rp.demo`: Acceso limitado para generación de tickets.
- `scanner.demo`: Acceso exclusivo para la validación en puerta.

---

## 2. Flujo de Manager (Gerente)
El Manager tiene una visión completa de la operación del club en tiempo real.

### Dashboard Principal
El panel de control permite monitorear:
- **KPIs en tiempo real**: Eventos activos, tickets generados vs. confirmados, y porcentaje de asistencia.
- **Actividad Semanal**: Gráfico de barras con la afluencia de los últimos 7 días.
- **Top RPs**: Ranking de desempeño del equipo de promoción.
- **Acciones Rápidas**: Creación de eventos y gestión de personal.

![Manager Dashboard](docs_assets/manager_dashboard_mockup_1769439638944.png)

---

## 3. Flujo de RP (Relaciones Públicas)
Los RPs son los encargados de distribuir los accesos. Su interfaz está optimizada para dispositivos móviles ("Mobile First") para ser usada cómodamente desde cualquier lugar.

### Generación de Accesos
1.  **Selección de Evento**: El RP elige el evento activo (ej. "Neon Party").
2.  **Tipo de Invitado**: Selecciona la categoría del boleto (General, VIP, Cortesía).
3.  **Personalización**: Puede agregar notas (ej. "Mesa 5").
4.  **Confirmación**: Al generar el acceso, recibe una confirmación visual inmediata y opciones para compartir el QR por WhatsApp.

![RP Flow](docs_assets/rp_generate_mockup_1769439664288.png)

---

## 4. Flujo de Scanner (Seguridad)
El persona de seguridad en la puerta utiliza una herramienta rápida para validar los códigos QR presentados por los invitados.

### Validación de Tickets
- **Escaneo QR**: Uso de la cámara del dispositivo para leer el código.
- **Feedback Inmediato**:
    -   ✅ **Verde (Acceso Permitido)**: Ticket válido. Muestra nombre y tipo de boleto.
    -   ❌ **Rojo (Denegado)**: Ticket inválido o ya usado.
    -   ⚠️ **Amarillo (Alerta)**: Ticket con nota especial (ej. "Cobrar cover extra").

![Scanner Flow](docs_assets/scanner_validate_mockup_1769439679080.png)
