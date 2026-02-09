# Flujos Técnicos del Escáner

El proceso de escaneo es crítico para la operación. Este documento detalla el comportamiento esperado del microservicio de Scanner.

## Diagrama de Secuencia: Validación y Confirmación

```mermaid
sequenceDiagram
    participant Staff as Staff Scanner
    participant App as Frontend App
    participant API as Scanner Service
    participant DB as PostgreSQL

    Note over Staff, App: Detección de QR
    Staff->>App: Apunta cámara al QR
    App->>API: POST /scan/validate (qrToken)
    API->>DB: SELECT Ticket WHERE token = qrToken
    DB-->>API: Datos del Ticket + Estado

    alt Ticket No Existe / Otro Manager
        API-->>App: 404/403 Invalid
        App-->>Staff: Muestra Error Rojo ❌
    else Ticket Ya Usado (Status = SCANNED)
        API-->>App: 200 OK (valid=false, reason=ALREADY_SCANNED)
        App-->>Staff: Muestra Error Rojo "Ya Usado" ❌
    else Ticket Valido (Status = PENDING)
        API-->>App: 200 OK (valid=true)
        App-->>Staff: Muestra Modal "Confirmar?" + Nota ⚠️
        
        Note over Staff, App: Confirmación Manual
        Staff->>App: Tap "Confirmar Entrada"
        App->>API: POST /scan/confirm (qrToken)
        
        API->>DB: TRANSACTION START
        API->>DB: CHECK Status (Bloqueo Row)
        alt Status cambió a SCANNED concurrentemente
            DB-->>API: Status = SCANNED
            API-->>DB: ROLLBACK
            API-->>App: 409 Conflict "Ya Usado"
            App-->>Staff: Error "Llegaste tarde" ❌
        else Status sigue PENDING
            API->>DB: UPDATE Ticket SET Status = SCANNED
            API->>DB: INSERT TicketScanLog
            DB-->>API: OK
            API->>DB: COMMIT
            API-->>App: 200 OK (Confirmed)
            App-->>Staff: Éxito Verde ✅
        end
    end
```

## Reglas de Comportamiento

### 1. Atomicidad
La operación de confirmación es **atómica**. Utilizamos transacciones de base de datos para asegurar que dos scanners intentando leer el mismo código al mismo tiempo no permitan una doble entrada. Solo uno tendrá éxito, el otro recibirá un error `409 Conflict`.

### 2. Comportamiento Offline
Actualmente **MonoPass Club requiere conexión a internet** para validar.
- Si el dispositivo pierde conexión, la App mostrará un estado de "Reconectando...".
- No se permite validación offline en esta versión para garantizar la seguridad anti-fraude.

### 3. Latencia
- El servicio está optimizado para responder en `< 200ms`.
- Si la respuesta tarda más de `5s` (timeout), la App asumirá error de red y permitirá reintentar.
