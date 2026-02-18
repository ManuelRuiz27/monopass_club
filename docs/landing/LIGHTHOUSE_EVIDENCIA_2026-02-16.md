# Evidencia Lighthouse Landing (2026-02-16)

## Contexto de ejecucion
- Fecha: 2026-02-16
- URL auditada: `http://127.0.0.1:4173/`
- Modo de app: `vite build` + `vite preview --host 127.0.0.1 --port 4173`
- Lighthouse CLI: `npx lighthouse` en modo headless

## Resultado criterio >= 85 (Performance)
- Mobile Performance: 93
- Desktop Performance: 99
- Estado: CUMPLE (ambos >= 85)

## Scorecards

| Perfil | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Mobile | 93 | 95 | 100 | 91 |
| Desktop | 99 | 94 | 100 | 91 |

## Metricas clave

| Perfil | FCP | LCP | Speed Index | TBT | CLS |
|---|---:|---:|---:|---:|---:|
| Mobile | 2.5s | 2.7s | 3.0s | 0ms | 0 |
| Desktop | 0.8s | 0.8s | 0.8s | 0ms | 0.001 |

## Artefactos
- `docs/landing/lighthouse/2026-02-16/landing-mobile.html`
- `docs/landing/lighthouse/2026-02-16/landing-mobile.json`
- `docs/landing/lighthouse/2026-02-16/landing-desktop.html`
- `docs/landing/lighthouse/2026-02-16/landing-desktop.json`

## Comandos usados
```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npx lighthouse http://127.0.0.1:4173/ --chrome-flags="--headless=new --no-sandbox" --output json --output-path docs/landing/lighthouse/2026-02-16/landing-mobile.json
npx lighthouse http://127.0.0.1:4173/ --chrome-flags="--headless=new --no-sandbox" --output html --output-path docs/landing/lighthouse/2026-02-16/landing-mobile.html
npx lighthouse http://127.0.0.1:4173/ --preset=desktop --chrome-flags="--headless=new --no-sandbox" --output json --output-path docs/landing/lighthouse/2026-02-16/landing-desktop.json
npx lighthouse http://127.0.0.1:4173/ --preset=desktop --chrome-flags="--headless=new --no-sandbox" --output html --output-path docs/landing/lighthouse/2026-02-16/landing-desktop.html
```
