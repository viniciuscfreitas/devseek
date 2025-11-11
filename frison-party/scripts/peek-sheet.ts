import { existsSync } from 'fs';
import { join, resolve } from 'path';
import XLSX from 'xlsx';

const args = process.argv.slice(2);
const pathArg = args.find((arg) => !arg.startsWith('--'));
const sheetArg = args.find((arg) => arg.startsWith('--sheet='));
const sheetIndexArg = args.find((arg) => arg.startsWith('--sheet-index='));
const listOnly = args.includes('--lista') || args.includes('--list');

const [rawPath, rawSheetFromPath] = pathArg?.includes('#')
  ? pathArg.split('#', 2)
  : [pathArg, undefined];

const candidates = rawPath
  ? [resolve(process.cwd(), rawPath)]
  : [
      '/app/dados/ListaOficial_FestaFrison (2).xlsx',
      join(process.cwd(), 'dados', 'ListaOficial_FestaFrison (2).xlsx'),
      join(process.cwd(), 'dados', 'ListaOficial_FestaFrison.xlsx'),
    ];

const filePath = candidates.find((candidate) => existsSync(candidate));

if (!filePath) {
  console.error('Arquivo XLSX não encontrado. Informe o caminho explícito.');
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);

if (listOnly) {
  console.log('Arquivo usado:', filePath);
  console.log('Abas disponíveis:', workbook.SheetNames);
  process.exit(0);
}

let sheetName = rawSheetFromPath || sheetArg?.replace('--sheet=', '');

if (!sheetName && sheetIndexArg) {
  const index = Number(sheetIndexArg.replace('--sheet-index=', ''));
  if (Number.isInteger(index) && index >= 0 && index < workbook.SheetNames.length) {
    sheetName = workbook.SheetNames[index];
  }
}

if (!sheetName) {
  sheetName = workbook.SheetNames[0];
}

if (!workbook.SheetNames.includes(sheetName)) {
  console.error(`Aba "${sheetName}" não encontrada. Abas: ${workbook.SheetNames.join(', ')}`);
  process.exit(1);
}

const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('Arquivo usado:', filePath);
console.log('Planilha:', sheetName);
console.log('Cabeçalho bruto:', rows[0]);

