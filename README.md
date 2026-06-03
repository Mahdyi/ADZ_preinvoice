# ADZ Preinvoice

Angular 21 + PrimeNG 21 + PostgREST project for calibration preinvoices and equipment receipt workflows.

## Project Shape

- Angular app: `ui/`
- Feature code: `ui/src/app/features`
- Shared reusable UI: `ui/src/app/shared`
- App shell/layout: `ui/src/app/core/layout`
- Database schema/init scripts: `db/init`
- Docker entry point: `docker-compose.yml`

Do not create `ui/src/app/layout` or `ui/src/app/shared/layout`; layout code belongs under `ui/src/app/core/layout`.

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

## Run With Docker

From the project root:

```powershell
docker compose up -d
```

Open:

- UI: `http://localhost:18080`
- PostgREST: `http://localhost:3000`
- Swagger UI: `http://localhost:18082`
- Postgres host port: `localhost:55432`

To rebuild the Docker-served UI:

```powershell
docker compose up --build --pull never -d ui
```

If Docker cannot reach Docker Hub but the UI container is already running, build locally and copy the output into the container:

```powershell
cd ui
$env:CI='true'
npm run build
cd ..
docker compose cp ui\dist\preinvoice-ui\browser\. ui:/usr/share/nginx/html
```

Then hard refresh the browser with `Ctrl + F5`.

## Angular Development

Install dependencies:

```powershell
cd ui
npm install
```

Start only the backend services:

```powershell
cd ..
docker compose up -d db postgrest
```

Start Angular dev server:

```powershell
cd ui
npm start
```

Open `http://localhost:4200`. The Angular proxy sends `/api/*` requests to PostgREST.

## Build Notes

Normal build:

```powershell
cd ui
npm run build
```

If Angular cache permissions or local Node issues cause a silent build failure, run with persistent cache disabled for that command:

```powershell
cd ui
$env:CI='true'
npm run build
```

Node 22 or 24 is recommended. Avoid odd-numbered Node versions for Angular work.

## Useful Checks

Mojibake guard:

```powershell
rg "[\x{00d8}\x{00d9}\x{00da}\x{00db}\x{00c3}\x{00c2}\x{00e2}]" ui\src\app\features ui\src\app\shared ui\src\app\core
```

TypeScript check:

```powershell
cd ui
npx tsc -p tsconfig.app.json --noEmit
```

## Working Rules

- Keep Persian text UTF-8.
- Protect invoice and receipt print layouts.
- Keep components standalone.
- Keep page/container state and API calls in page components.
- Child components should receive inputs and emit events.
- Use PrimeNG incrementally.
- Avoid broad preinvoice refactors unless explicitly requested.
- Do not touch `ui/angular.json` when it has local modifications unless explicitly requested.
