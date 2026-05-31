# ADZ Preinvoice Agent Guide

## Project Shape
- This is an Angular + PostgREST project for calibration preinvoices and equipment receipt drafts.
- The Angular app lives in `ui/`; feature code lives under `ui/src/app/features`.
- Current active routes are `/`, `/preinvoices-list`, and `/equipment-receipt`.
- Public images are served from `ui/public`, so `ui/public/adzir.png` is available as `/adzir.png`.

## Commands
- Build UI: `cd ui && npm run build`
- Mojibake guard: `rg "Ø|Ù|Ú|Û|Ã|Â|â" ui\src\app\features`
- Rebuild Docker-served UI: `docker compose up --build --pull never -d ui`

## Working Rules
- Keep Persian text clean UTF-8. If terminal output looks garbled, verify with the mojibake guard before assuming files are corrupted.
- Protect print layouts. Do not convert print-only invoice or receipt output wholesale to PrimeNG.
- Use PrimeNG incrementally for screen controls and keep imports local to standalone components.
- Page/container components own state and API calls; child components receive inputs and emit events.
- Avoid broad preinvoice refactors unless the task explicitly asks for them.
- Keep equipment receipt v1 draft-only until persistence is explicitly requested.
