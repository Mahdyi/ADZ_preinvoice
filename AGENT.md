# ADZ Preinvoice Agent Guide

## Project Shape

- This is an Angular + PostgREST project for calibration preinvoices and equipment receipt workflows.
- The Angular app lives in `ui/`.
- Feature code lives under `ui/src/app/features`.
- Shared reusable UI lives under `ui/src/app/shared`.
- The Sakai-ready app shell lives under `ui/src/app/core/layout`.
- Do not create `ui/src/app/layout`.
- Do not create `ui/src/app/shared/layout`.
- Public images are served from `ui/public`, so `ui/public/adzir.png` is available as `/adzir.png`.

## Current Routes

Clean routes:

- `/preinvoices/new`
- `/preinvoices`
- `/equipment-receipts/new`
- `/equipment-receipts`

Compatibility redirects:

- `/` -> `/preinvoices/new`
- `/preinvoices-list` -> `/preinvoices`
- `/equipment-receipt` -> `/equipment-receipts/new`
- `/equipment-receipts-list` -> `/equipment-receipts`

## Commands

- Build UI: `cd ui && npm run build`
- Build UI with Angular persistent cache disabled: `cd ui; $env:CI='true'; npm run build`
- Mojibake guard: `rg "[\x{00d8}\x{00d9}\x{00da}\x{00db}\x{00c3}\x{00c2}\x{00e2}]" ui\src\app\features ui\src\app\shared ui\src\app\core`
- Rebuild Docker-served UI: `docker compose up --build --pull never -d ui`
- Copy local UI build into the running container: `docker compose cp ui\dist\preinvoice-ui\browser\. ui:/usr/share/nginx/html`
- Docker-served UI: `http://localhost:18080`
- Angular dev server: `http://localhost:4200`

## Build And Docker Notes

- Prefer Node 22 or 24 for Angular work. Avoid odd-numbered Node versions.
- If `npm run build` exits without useful Angular diagnostics, retry with `$env:CI='true'` to avoid persistent `.angular/cache` issues.
- If Docker rebuild cannot reach Docker Hub but the UI container is already running, use the local build plus `docker compose cp` fallback.
- After copying a fresh build into the container, hard refresh the browser with `Ctrl + F5`.

## Working Rules

- Keep Persian text clean UTF-8. If terminal output looks garbled, verify with the mojibake guard before assuming files are corrupted.
- Protect print layouts. Do not convert print-only invoice or receipt output wholesale to PrimeNG.
- Do not modify invoice/receipt print components unless the task explicitly requires it.
- Use PrimeNG incrementally for screen controls and keep imports local to standalone components.
- Keep components standalone.
- Page/container components own state and API calls; child components receive inputs and emit events.
- Avoid broad preinvoice refactors unless the task explicitly asks for them.
- Do not touch `ui/angular.json` when it has local modifications unless the user explicitly asks.
- Do not rename routes or remove compatibility redirects unless requested.
