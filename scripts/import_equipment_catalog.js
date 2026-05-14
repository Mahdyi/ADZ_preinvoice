const fs = require('fs');
const path = require('path');
const ExcelJS = require('../ui/node_modules/exceljs');

const DEFAULT_FILE = 'D:/Projects/Abzar_Daqiq/Abzar_Daqiq_Excel/main/1405-01-26پیش فاکتور کالیبراسیون.xlsx';
const DEFAULT_API_URL = 'http://localhost:3000';

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    if (value.richText) {
      value = value.richText.map((item) => item.text).join('');
    } else if (value.text) {
      value = value.text;
    } else if (value.result !== undefined) {
      value = value.result;
    } else {
      value = '';
    }
  }

  return String(value)
    .replace(/\u0643/g, 'ک')
    .replace(/\u064A/g, 'ی')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    file: args.find((arg) => !arg.startsWith('--')) || DEFAULT_FILE,
    dryRun: args.includes('--dry-run'),
    apiUrl: (args.find((arg) => arg.startsWith('--api-url=')) || '').replace('--api-url=', '') || DEFAULT_API_URL
  };
}

async function readCatalog(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const sheet = workbook.worksheets[0];
  const rows = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const equipmentName = normalizeText(row.getCell(4).value);
    if (!equipmentName) {
      return;
    }

    rows.push({
      sheet_name: normalizeText(row.getCell(2).value) || null,
      measurement_quantity: normalizeText(row.getCell(3).value) || null,
      equipment_name: equipmentName,
      price: Number(normalizeText(row.getCell(5).value).replace(/,/g, '')) || 0,
      location: normalizeText(row.getCell(6).value) || null
    });
  });

  return rows;
}

async function main() {
  const { file, dryRun, apiUrl } = parseArgs();
  const resolved = path.resolve(file);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const rows = await readCatalog(resolved);
  if (dryRun) {
    console.log(`Would import ${rows.length} equipment catalog rows.`);
    return;
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  let response = await fetch(`${baseUrl}/equipment_catalog`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to clear catalog: ${response.status} ${await response.text()}`);
  }

  response = await fetch(`${baseUrl}/equipment_catalog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    throw new Error(`Failed to import catalog: ${response.status} ${await response.text()}`);
  }

  console.log(`Imported ${rows.length} equipment catalog rows.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
