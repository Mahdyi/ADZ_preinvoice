--------------------------------------------------------------------------------
-- ROLES
--------------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'todo_user') THEN
    CREATE ROLE todo_user NOLOGIN;
  END IF;
END
$$;

--------------------------------------------------------------------------------
-- SCHEMA
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS api;

--------------------------------------------------------------------------------
-- TABLES
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api.customers (
  id serial primary key,
  national_id varchar(50),
  economic_code varchar(50),
  postal_code varchar(50),
  address text,
  phone varchar(100),
  code varchar(50),
  title text not null,
  created_at timestamptz not null default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_code_key'
      AND conrelid = 'api.customers'::regclass
  ) THEN
    ALTER TABLE api.customers
    ADD CONSTRAINT customers_code_key UNIQUE (code);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS api.preinvoices (
  id serial primary key,
  customer_id int not null references api.customers(id) on delete restrict,
  preinvoice_number text not null unique,
  status text not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS api.preinvoice_items (
  id serial primary key,
  preinvoice_id int not null references api.preinvoices(id) on delete cascade,
  description text not null,
  note text,
  cal_position text,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

ALTER TABLE api.preinvoice_items
ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE api.preinvoice_items
ADD COLUMN IF NOT EXISTS cal_position text;

CREATE TABLE IF NOT EXISTS api.equipment_catalog (
  id serial primary key,
  sheet_name text,
  measurement_quantity text,
  equipment_name text not null,
  price numeric(12,2) not null default 0,
  location text,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS equipment_catalog_name_idx
ON api.equipment_catalog (equipment_name);

--------------------------------------------------------------------------------
-- VIEW
--------------------------------------------------------------------------------

DROP VIEW IF EXISTS api.preinvoice_with_totals;

CREATE VIEW api.preinvoice_with_totals AS
SELECT
  p.id,
  p.preinvoice_number,
  p.customer_id,
  c.title AS customer_title,
  c.code AS customer_code,
  c.national_id AS customer_national_id,
  c.economic_code AS customer_economic_code,
  c.postal_code AS customer_postal_code,
  c.address AS customer_address,
  c.phone AS customer_phone,
  p.status,
  p.issue_date,
  p.due_date,
  p.notes,
  COALESCE(SUM(i.line_total), 0) AS subtotal,
  COALESCE(SUM(i.line_total), 0) AS total,
  p.created_at,
  p.updated_at
FROM api.preinvoices p
JOIN api.customers c ON p.customer_id = c.id
LEFT JOIN api.preinvoice_items i ON p.id = i.preinvoice_id
GROUP BY
  p.id,
  p.preinvoice_number,
  p.customer_id,
  c.title,
  c.code,
  c.national_id,
  c.economic_code,
  c.postal_code,
  c.address,
  c.phone,
  p.status,
  p.issue_date,
  p.due_date,
  p.notes,
  p.created_at,
  p.updated_at;

--------------------------------------------------------------------------------
-- PERMISSIONS
--------------------------------------------------------------------------------

GRANT USAGE ON SCHEMA api TO web_anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON api.customers TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.preinvoices TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.preinvoice_items TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE
ON api.equipment_catalog TO web_anon;
GRANT SELECT ON api.preinvoice_with_totals TO web_anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO web_anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA api
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA api
GRANT USAGE, SELECT ON SEQUENCES TO web_anon;
