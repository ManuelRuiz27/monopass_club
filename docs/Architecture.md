# Arquitectura del Sistema - MonoPass Club

## Visión General
MonoPass Club es una plataforma distribuida diseñada para la gestión operativa y de control de acceso en centros nocturnos. La arquitectura prioriza la **seguridad**, la **baja latencia** en el escaneo y el **aislamiento de datos** por manager.

---

## Diagrama de Contexto (Nivel 1)
```mermaid
graph TD
    UserM[Manager] -->|Gestiona| Frontend
    UserRP[RP] -->|Genera Tickets| Frontend
    UserS[Scanner Staff] -->|Valida en Puerta| Frontend
    
    Frontend[Frontend SPA] -->|HTTPS| API[API Gateway / Load Balancer]
    
    API -->|Gestión| Core[Core API Service]
    API -->|Validación| Scanner[Scanner Microservice]
    
    Core -->|Persistencia| DB[(PostgreSQL)]
    Scanner -->|Lectura/Escritura| DB
    Scanner -->|Cache/RateLimit (Opcional)| Redis[(Redis)]
```

---

## Diagrama de Componentes del Sistema

### 1. Frontend SPA
- **Tecnología**: React 19, TypeScript, Vite.
- **Responsabilidad**: Interfaz única que adapta su funcionalidad según el rol (Manager, RP, Scanner).
- **Roles**:
    - **Manager**: Dashboard administrativo.
    - **RP**: Mobile-first UI para generar accesos.
    - **Scanner**: Interfaz minimalista optimizada para cámara y feedback rápido.

### 2. Core API Service
- **Tecnología**: Node.js 22, Fastify.
- **Responsabilidad**: Lógica de negocio administrativa.
- **Funciones**:
    - Autenticación (Login).
    - CRUD de Clubs, Eventos, RPs.
    - Cálculo de Cortes y reportes.

### 3. Scanner Microservice
- **Tecnología**: Node.js 22, Fastify.
- **Responsabilidad**: Validación crítica en tiempo real.
- **Características**:
    - Aislado para garantizar uptime independiente.
    - Rate limiting agresivo.
    - Lógica de anti-reuso (Double-spend protection).

### 4. Capa de Datos
- **Base de Datos**: PostgreSQL 16.
- **ORM**: Prisma 7.
- **Estrategia**:
    - Esquema relacional con integridad referencial fuerte.
    - Índices optimizados para búsquedas por `qrToken`.

---

## Protocolos de Seguridad

### Autenticación y Autorización
- **JWT (JSON Web Tokens)**: Stateless authentication.
- **RBAC**: Roles estrictos (MANAGER, RP, SCANNER) validados en cada request.
- **Multi-tenant**:
    - Aislamiento lógico.
    - Cada consulta filtra obligatoriamente por `managerId`.
    - Un scanner *nunca* puede validar un ticket de otro manager.

### Protección de Datos
- **Tránsito**: Todo el tŕafico encriptado vía TLS 1.2+.
- **Reposo**: Contraseñas hasheadas con `bcrypt`.
- **Sanitización**:
    - Prevención de SQL Injection vía Prisma ORM.
    - Headers de seguridad (Helmet) y CORS restringido.

---

## Decisiones Técnicas Clave

| Decisión | Justificación |
| :--- | :--- |
| **Separación Core vs Scanner** | Permite escalar el servicio de escaneo independientemente y asegura que la validación en puerta siga funcionando aunque el dashboard administrativo tenga carga elevada. |
| **Monorepo (Frontend)** | Facilita compartir componentes de UI y lógica de tipos entre los distintos roles sin duplicar código. |
| **PostgreSQL** | Robustez ACID necesaria para garantizar que un ticket no se pueda usar dos veces (transacciones). |
