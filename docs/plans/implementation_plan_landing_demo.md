## Plan de Implementacion - Landing `/demo` (Pass Monkey Demo Ticket + Scanner)

### Objetivo
- Permitir que cualquier visitante de la landing pruebe en minutos la experiencia de Pass Monkey:
- Paso 1: generar un boleto demo para `Demo Event`.
- Paso 2: escanear/validar ese boleto en una vista de scanner demo.
- Todo debe funcionar sin consumir el API real.

### Alcance (hardcodeado)
- Reemplazar el contenido actual de `/demo` por una experiencia de 2 botones:
- `Emitir boleto`
- `Escanear boleto`
- Usar `landing/public/assets/ticket-demo-event.png` como base visual del ticket.
- Insertar QR funcional sobre el ticket.
- Validacion local de tickets (`valido`, `ya usado`, `invalido`, `fuera de semana`).
- Inventario local semanal: `1000` tickets muestra por semana.
- Persistencia local con `localStorage` (por navegador).
- Modo `camara real` opcional con `BarcodeDetector` + fallback al scanner demo manual.
- Modo `camara real` opcional con `BarcodeDetector` y fallback `jsQR` (canvas) para mayor compatibilidad.
- Toggle de `escaneo continuo` para no detener la camara tras el primer QR.
- Limpieza de componentes demo legacy no utilizados por la ruta `/demo`.

### Arquitectura de la Demo
- `landing/src/components/DemoPage.tsx`
- Estado principal de la demo (tab activa, ticket actual, scanner result).
- Emision de tickets hardcodeada.
- Generacion de payload QR demo.
- Validacion del scanner demo.
- Persistencia local.
- `landing/src/landing.css`
- Estilos de la pagina demo, ticket con overlay QR y scanner visual.

### Flujo Funcional
1. Usuario entra a `/demo`.
2. En `Emitir boleto`, genera un ticket para `Demo Event`.
3. Se crea un ticket local con:
   - `ticketId`
   - `code`
   - `weekKey`
   - `status = issued`
   - `qrPayload`
4. Se genera un QR real en frontend usando el `qrPayload`.
5. Usuario cambia a `Escanear boleto`.
6. Al escanear:
   - Si el ticket existe y esta disponible -> `valido` y se marca `used`.
   - Si ya fue validado -> `ya usado`.
   - Si payload/firma no coincide -> `invalido`.
   - Si la semana no coincide -> `fuera de semana`.

### Reglas de Negocio Demo
- Sin llamadas a API real.
- Limite semanal local: `1000` tickets.
- Reinicio automatico por semana ISO.
- Boton manual para reiniciar demo local (limpiar estado en navegador).

### Criterios de Aceptacion
- `/demo` muestra exactamente dos acciones principales: emitir y escanear.
- El ticket de `Demo Event` usa `ticket-demo-event.png` y renderiza un QR encima.
- El scanner demo puede validar el ticket generado en la misma sesion.
- Un segundo escaneo del mismo ticket responde `ya usado`.
- Existe opcion para simular QR invalido.
- Existe toggle de `escaneo continuo` en el modo camara real.
- Si `BarcodeDetector` no existe/no soporta QR, la demo intenta fallback con `jsQR`.
- No se consume API real (solo logica local + `localStorage`).

### Mejoras Futuras (opcional)
- Fallback adicional con libreria QR por `canvas` si `BarcodeDetector` no esta soportado.
- Simular multiples tickets emitidos y cola de acceso.
- Vista de metricas demo (aceptados vs rechazados).
