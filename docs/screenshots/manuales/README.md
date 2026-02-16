# Baseline visual UI

Este directorio guarda las capturas manuales de referencia para validar paridad UI desktop/mobile por rol.

## Como regenerar

Desde `frontend/`:

```powershell
$env:CAPTURE_MANUALS='true'
npm run test:e2e -- e2e/manual-screenshots*.spec.ts
```

Opcional (solo un bloque):

```powershell
$env:CAPTURE_MANUALS='true'
npm run test:e2e -- e2e/manual-screenshots-manager.spec.ts
npm run test:e2e -- e2e/manual-screenshots.spec.ts
npm run test:e2e -- e2e/manual-screenshots-director.spec.ts
```

Opcional (desktop full-page, puede ser mas lento):

```powershell
$env:CAPTURE_MANUALS='true'
$env:CAPTURE_FULLPAGE_DESKTOP='true'
npm run test:e2e -- e2e/manual-screenshots-manager.spec.ts
```

## Cobertura esperada

- Manager desktop:
  `manager-desktop-01-dashboard.png` .. `manager-desktop-11-settings.png`
- Manager mobile:
  `manager-mobile-01-dashboard.png` .. `manager-mobile-04-cortes.png`
- RP mobile:
  `rp-mobile-01-eventos.png` .. `rp-mobile-05-perfil.png`
- Scanner mobile:
  `scanner-mobile-01-home.png` .. `scanner-mobile-04-cortes.png`
- Director desktop:
  `director-desktop-01-dashboard.png` .. `director-desktop-05-estados.png`
- Director mobile:
  `director-mobile-01-dashboard.png` .. `director-mobile-05-estados.png`

## Notas tecnicas

- El bloque Director usa token de `manager.demo` con override de rol en `localStorage` para habilitar rutas Director en frontend sin bloquear las APIs de datos.
- Las capturas dependen de datos seed (`manager.demo`, `rp.demo`, `scanner.demo`).
- En mobile se captura viewport (no `fullPage`) para evitar duplicacion visual de headers/nav fijos en el stitching de Playwright.
- Los specs esperan estado de pantalla lista antes de capturar (marker por vista + `networkidle`), para evitar baselines en `Cargando...`.
