# MonoPass Club Frontend

Workspace React + Vite que reúne Manager, RP y Scanner shells junto con Storybook y pruebas.

## Scripts

```bash
npm install
npm run dev        # Vite dev server
npm run test       # Vitest + happy-dom
npm run storybook  # Componentes aislados
```

## Arquitectura

- React Router define tres dominios (`/manager`, `/rp`, `/scanner`) con vistas para Sprint 1.
- TanStack Query + cliente HTTP centralizado (`src/lib/httpClient.ts`) manejan JWT y base URLs (`VITE_CORE_API_BASE_URL`, `VITE_SCANNER_API_BASE_URL`).
- Storybook 10 ya configurado con addon de accesibilidad y pruebas via Vitest.

## Login
Usa `manager.demo / changeme123` (semilla local) para autenticarse. Las credenciales se guardan en `localStorage`.

## Storybook + Playwright
1. Instala los navegadores una sola vez:
   ```bash
   npx playwright install chromium
   ```
2. Ejecuta los tests de stories:
   ```bash
   # PowerShell
   $env:STORYBOOK_TESTS='true'; npm run test -w frontend; Remove-Item Env:STORYBOOK_TESTS

   # Bash
   STORYBOOK_TESTS=true npm run test -w frontend
   ```

Configura tus variables en `.env` usando el ejemplo incluido.