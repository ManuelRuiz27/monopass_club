# Landing Changelog - Pass Monkey

Fecha: 2026-02-22

## Secciones agregadas/modificadas
- `HeroSection` (modificada): copy orientado a beneficio economico + tranquilidad en corte; beneficios clave arriba del fold.
- `StickyMobileCta` (modificada e integrada): CTA principal persistente en movil + CTA secundaria.
- `BenefitsSection` (modificada): convertida a seccion de beneficio economico (fugas, cortes, control de caja).
- `HowItWorksSection` (modificada): flujo en 3 pasos con colaborador de venta y corte automatico.
- `OfflineModeSection` (nueva): cache por evento, operacion sin internet, sincronizacion segura y control de duplicados.
- `SocialProofSection` (nueva): placeholders de testimonios/metricas/casos sin inventar datos.
- `FaqSection` (modificada): objeciones clave de staff, internet, confianza en corte, retorno y efectivo.
- `MonoticketsHandoffSection` (nueva): card de redireccion a Monotickets con sello "Soft-Monkey recomienda".
- `MonoticketsComingSoonPage` (nueva): pagina `/monotickets` con mensaje de marketplace en construccion y animacion de Mono construyendo.
- Pantallas de estado (`404` y `en construccion`) alineadas al arte de referencia `design/pantallas 404 y en contrsuccion.png`.
- `FinalCtaSection` (modificada): CTA principal "Agenda tu demo privada" + secundaria "Primer evento $700".
- `LandingPage` (modificada): nuevo orden de secciones para conversion B2B nocturno.
- Reemplazo de termino `RP` por `colaborador de venta` en textos de `landing`.

## Copy final implementado

### Hero
- Kicker: `Pass Monkey | Control de acceso para noches en efectivo`
- Badge: `Corte claro por colaborador de venta. Sin papel. Sin caos.`
- Titulo: `Cuida tu ingreso en puerta y cierra con corte confiable.`
- Subtitulo: `Controla accesos en tiempo real, evita fugas del efectivo y revisa cortes por colaborador de venta sin discutir al final de la noche.`
- CTA principal: `Agenda tu demo privada`
- CTA secundaria: `Primer evento $700` (dinamico por pricing cuando aplica)
- Beneficios arriba del fold:
- `Corte automatico por colaborador de venta`
- `Menos fugas por reingresos y duplicados`
- `Operacion estable en puerta, incluso sin internet`

### Beneficio economico
- Eyebrow: `Beneficio economico`
- Titulo: `Menos fugas en efectivo, mas tranquilidad al cerrar la noche.`
- Descripcion: `Cuando la puerta depende de papel y memoria, el margen de perdida puede crecer. Pass Monkey ordena acceso y corte para que cada fecha cierre con claridad.`
- Lista clave:
- `Fugas de 5-10% suelen venir de papel, reingresos no controlados y cierres tardios.`
- `Cada acceso queda registrado para revisar diferencias sin discusiones en caja.`
- `El corte por colaborador de venta sale claro para pago y seguimiento.`
- `Menos tiempo en arqueo nocturno y mas foco en operar la siguiente fecha.`

### Modo Offline
- Titulo: `Sin internet, tu puerta sigue avanzando.`
- Descripcion: `Pass Monkey prepara el evento en el dispositivo, opera en puerta y sincroniza cuando regresa la señal.`
- Puntos:
- `Cache por evento`
- `La puerta no se detiene`
- `Sincronizacion segura`
- `Control de duplicados`

### FAQ
- `Que necesita mi staff para operar en puerta?`
- `Si falla internet, se detiene la entrada?`
- `Como confio en el corte por colaborador de venta?`
- `En cuanto tiempo veo retorno?`
- `Puedo usar Pass Monkey si la mayoria del flujo es en efectivo?`
- `Puedo empezar con un solo evento y luego escalar?`

### Card Monotickets (handoff)
- Encabezado: `Soft-Monkey recomienda Monotickets para venta abierta al publico.`
- Subtexto: `Pass Monkey se enfoca en puerta, control interno y flujo en efectivo. Si necesitas preventa online, pasarela y marketplace, el siguiente paso es Monotickets.`
- Sello/lockup: `assets/logos/softmonkeybar-lockup-placeholder.svg` (placeholder listo para reemplazo).
- CTA: `Conoce Monotickets`
- Separacion funcional explicita:
- `Pass Monkey`: puerta/control interno/corte por colaborador de venta.
- `Monotickets`: boletera online/pagos/publico general.
- Ruta actual de CTA: `/monotickets` (coming soon interno).

## Checklist QA visual (mobile/desktop)
- [ ] Hero mantiene jerarquia visual y CTA principal visible sin scroll en desktop.
- [ ] Hero en movil muestra CTA principal y secundaria sin overflow.
- [ ] Sticky CTA solo aparece en movil (`<=768px`) y no tapa modal de activacion.
- [ ] Secciones nuevas (`beneficio-economico`, `modo-offline`, `prueba-social`, `handoff-monotickets`) respetan paleta/tipografia actuales.
- [ ] Card Monotickets se visualiza como handoff separado de Pass Monkey.
- [ ] FAQ abre/cierra correctamente en movil y desktop.
- [ ] No hay cortes de texto en botones largos ni en chips/listas.
- [ ] Build de landing compila sin errores.
- [ ] Lint de landing corre sin errores.
- [ ] Buscar `RP` en `landing` no devuelve textos visibles pendientes.
