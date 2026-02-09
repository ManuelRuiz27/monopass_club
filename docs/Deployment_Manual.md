# Manual de Despliegue y Operación

Este documento detalla cómo desplegar MonoPass Club tanto en entorno local como en producción (Render).

## 1. Entorno Local (Docker)

Para desarrollo o pruebas locales, utilizamos Docker Compose.

### Requisitos
- Docker Desktop instalado.
- Node.js 20+ (opcional, para scripts locales).

### Pasos
1.  **Clonar repositorio y crear .env**:
    ```bash
    cp .env.example .env
    ```
2.  **Iniciar servicios de infraestructura**:
    ```bash
    docker-compose up -d
    # Esto levanta PostgreSQL (puerto 5432) y Redis (puerto 6379)
    ```
3.  **Instalar dependencias y levantar apps**:
    ```bash
    npm install
    npm run dev
    # Inicia Frontend, Core API y Scanner Service concurrentemente
    ```

---

## 2. Producción (Render.com)

La infraestructura está definida como código en `render.yaml`.

### Servicios Definidos
- **Web Service: `core-api`**
    - Runtime: Node
    - Build: `npm install && npm run build -w core-api`
    - Start: `npm run prisma:migrate && npm run start -w core-api`
- **Web Service: `scanner-service`**
    - Runtime: Node
    - Build: `npm install && npm run build -w scanner-service`
    - Start: `npm run start -w scanner-service`

### Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string a PostgreSQL | `postgres://user:pass@host/db` |
| `JWT_SECRET` | Clave privada para firmar tokens | `long-random-string-min-32-chars` |
| `CORE_API_BASE_URL` | URL pública del Core | `https://api.monopass.club` |
| `SCANNER_API_KEY` | (Opcional) API Key interna | `secret-api-key` |
| `NODE_VERSION` | Versión de Node | `22` |

---

## 3. Política de Backups

### Base de Datos
- **Frecuencia**: Diaria (Automática por proveedor de nube).
- **Retención**: 7 días.
- **PITR (Point-in-Time Recovery)**: Activado para recuperación granular ante errores lógicos graves.

### Logs
- Los logs de aplicación se envían a `stdout` (formato JSON) y son recolectados por el sistema de logging de la plataforma (Render Logs / Datadog opcional).
