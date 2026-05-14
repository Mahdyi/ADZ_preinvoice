from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import requests
import xlrd


HEADER_MAP = {
    "شناسه/کد ملی": "national_id",
    "کد اقتصادی": "economic_code",
    "کد پستی": "postal_code",
    "آدرس": "address",
    "تلفن": "phone",
    "کد": "code",
    "عنوان": "title",
}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, float) and value.is_integer():
        value = int(value)

    return (
        str(value)
        .replace("\u0643", "ک")
        .replace("\u064A", "ی")
        .replace("\xa0", " ")
        .strip()
    )


def read_customers(path: Path) -> tuple[list[dict[str, str | None]], int]:
    workbook = xlrd.open_workbook(path)
    sheet = workbook.sheet_by_index(0)

    headers: dict[int, str] = {}
    for col_index in range(sheet.ncols):
        header = normalize_text(sheet.cell_value(0, col_index))
        field = HEADER_MAP.get(header)
        if field:
            headers[col_index] = field

    if "title" not in headers.values():
        raise ValueError("Column 'عنوان' was not found in the first row.")

    customers: list[dict[str, str | None]] = []
    skipped = 0

    for row_index in range(1, sheet.nrows):
        customer = {
            "national_id": None,
            "economic_code": None,
            "postal_code": None,
            "address": None,
            "phone": None,
            "code": None,
            "title": "",
        }

        for col_index, field in headers.items():
            value = normalize_text(sheet.cell_value(row_index, col_index))
            customer[field] = value or None

        if customer["title"]:
            customers.append(customer)
        else:
            skipped += 1

    return customers, skipped


def postgrest_import(api_url: str, customers: list[dict[str, str | None]], dry_run: bool) -> tuple[int, int]:
    with_code = [customer for customer in customers if customer.get("code")]
    without_code = [customer for customer in customers if not customer.get("code")]

    if dry_run:
        return len(with_code), len(without_code)

    base_url = api_url.rstrip("/")
    session = requests.Session()

    if with_code:
        response = session.post(
            f"{base_url}/customers",
            params={"on_conflict": "code"},
            headers={"Prefer": "resolution=merge-duplicates"},
            json=with_code,
            timeout=60,
        )
        response.raise_for_status()

    if without_code:
        response = session.post(
            f"{base_url}/customers",
            headers={"Prefer": "return=minimal"},
            json=without_code,
            timeout=60,
        )
        response.raise_for_status()

    return len(with_code), len(without_code)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import legacy .xls customers into PostgREST.")
    parser.add_argument("file", type=Path, help="Path to the .xls customer workbook")
    parser.add_argument("--api-url", default="http://localhost:3000", help="PostgREST base URL")
    parser.add_argument("--dry-run", action="store_true", help="Read and validate only")
    args = parser.parse_args()

    customers, skipped = read_customers(args.file)
    upserted, inserted = postgrest_import(args.api_url, customers, args.dry_run)

    action = "Would import" if args.dry_run else "Imported"
    print(f"{action} {len(customers)} customers.")
    print(f"Upsert by code: {upserted}")
    print(f"Insert without code: {inserted}")
    print(f"Skipped rows without title: {skipped}")


if __name__ == "__main__":
    main()
