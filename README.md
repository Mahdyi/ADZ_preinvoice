# Preinvoice App

Angular + Postgres + PostgREST project for creating calibration preinvoices with customer lookup and an equipment price catalog.

## Requirements

- Docker Desktop
- Node.js LTS 22 recommended for production/development
- npm

Your current Node.js is usable for building here, but it is an odd-numbered version. For normal work, install Node.js 22 LTS.

## Excel Columns

The customer importer reads the first worksheet and maps these headers:

| Excel header | Database column |
| --- | --- |
| شناسه/كد ملي | `national_id` |
| كد اقتصادي | `economic_code` |
| كد پستي | `postal_code` |
| آدرس | `address` |
| تلفن | `phone` |
| كد | `code` |
| عنوان | `title` |

Rows without `عنوان` are skipped. Rows with `كد` are imported with upsert behavior: if that code already exists, the customer is updated; otherwise a new customer is created. Rows without `كد` are inserted as new customers.

The Angular preinvoice screen uses customers that already exist in Postgres. For older legacy `.xls` customer files, use the local import script below.

## Import The Legacy XLS File

Install the import script dependencies once:

```powershell
python -m pip install --user -r scripts/requirements-import.txt
```

Preview the import:

```powershell
python scripts/import_customers.py "D:\Projects\Abzar_Daqiq\Abzar_Daqiq_Excel\main\costumermain.xls" --dry-run
```

Import into the running PostgREST database:

```powershell
python scripts/import_customers.py "D:\Projects\Abzar_Daqiq\Abzar_Daqiq_Excel\main\costumermain.xls"
```

## Import The Equipment Catalog

The preinvoice item dropdown reads from `api.equipment_catalog`. Import the calibration price list with:

```powershell
node scripts/import_equipment_catalog.js "D:\Projects\Abzar_Daqiq\Abzar_Daqiq_Excel\main\1405-01-26پیش فاکتور کالیبراسیون.xlsx"
```

Preview only:

```powershell
node scripts/import_equipment_catalog.js "D:\Projects\Abzar_Daqiq\Abzar_Daqiq_Excel\main\1405-01-26پیش فاکتور کالیبراسیون.xlsx" --dry-run
```

The workbook has 445 rows including the header, so the importer loads 444 equipment records.

## Run Everything With Docker

From the project root:

```powershell
docker compose up -d --build
```

Open:

- Angular preinvoice UI: `http://localhost:8080`
- PostgREST API: `http://localhost:3000/customers`
- Postgres host port: `localhost:55432`

If you change `db/init/01_schema.sql` after the first database start, recreate the database volume:

```powershell
docker compose down -v
docker compose up -d --build
```

## Angular Development

Install dependencies:

```powershell
cd ui
npm install
```

Start only Postgres + PostgREST:

```powershell
cd ..
docker compose up -d db postgrest
```

Start Angular dev server:

```powershell
cd ui
npm start
```

Open `http://localhost:4200`. The Angular dev proxy sends `/api/*` requests to `http://localhost:3000`.

## Useful API Calls

Create a customer:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/customers" `
  -Headers @{ Prefer = "return=representation" } `
  -ContentType "application/json" `
  -Body '[{"title":"شرکت نمونه","code":"1001","phone":"02112345678"}]'
```

List customers:

```powershell
Invoke-RestMethod "http://localhost:3000/customers?order=id.desc"
```

List equipment catalog rows:

```powershell
Invoke-RestMethod "http://localhost:3000/equipment_catalog?select=equipment_name,price&limit=5"
```

Upsert by customer code:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/customers?on_conflict=code" `
  -Headers @{ Prefer = "resolution=merge-duplicates,return=representation" } `
  -ContentType "application/json" `
  -Body '[{"title":"شرکت نمونه ویرایش شده","code":"1001","phone":"02100000000"}]'
```

## Project Layout

```text
.
├── db/init/01_schema.sql
├── docker-compose.yml
└── ui
    ├── src/app
    ├── Dockerfile
    ├── nginx.conf
    └── proxy.conf.json
```
