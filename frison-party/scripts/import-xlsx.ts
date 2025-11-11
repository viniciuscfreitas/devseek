import { existsSync, readdirSync } from 'fs';
import { join, resolve, isAbsolute } from 'path';
import XLSX from 'xlsx';
import { createConvidado, getDb } from '../lib/db';
import {
  normalizarTotalConfirmados,
  padronizarNome,
  padronizarTelefone,
} from '../lib/convidado-normalize';

function resolveInputPath(): string {
  const [, , maybePath] = process.argv;

  if (maybePath) {
    return isAbsolute(maybePath) ? maybePath : resolve(process.cwd(), maybePath);
  }

  const dadosDir = join(process.cwd(), 'dados');
  const fallbackNames = [
    'ListaOficial_FestaFrison.xlsx',
    'ListaOficial_FestaFrison (2).xlsx',
    'ListaOficial_FestaFrison.csv',
    'ListaOficial_FestaFrison (2).csv',
  ];

  for (const name of fallbackNames) {
    const candidate = join(dadosDir, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  if (existsSync(dadosDir)) {
    const firstXlsx = readdirSync(dadosDir).find((file) =>
      file.toLowerCase().endsWith('.xlsx') || file.toLowerCase().endsWith('.csv')
    );
    if (firstXlsx) {
      return join(dadosDir, firstXlsx);
    }
  }

  throw new Error(
    'Arquivo XLSX não encontrado. Informe o caminho: tsx scripts/import-xlsx.ts /caminho/arquivo.xlsx'
  );
}

function localizarCabecalho(rows: unknown[][]): { index: number; headers: string[] } {
  const headerIndex = rows.findIndex((row) =>
    row.some(
      (cell) =>
        typeof cell === 'string' &&
        cell.toLowerCase().includes('nome') &&
        row.some(
          (inner) =>
            typeof inner === 'string' &&
            inner.toLowerCase().includes('total confirmados')
        )
    )
  );

  if (headerIndex === -1) {
    throw new Error('Cabeçalho com colunas "Nome" e "Total Confirmados" não encontrado.');
  }

  const headers = rows[headerIndex].map((cell) =>
    typeof cell === 'string' ? cell.trim() : String(cell ?? '')
  );

  return { index: headerIndex, headers };
}

function encontrarIndice(headers: string[], termo: string): number {
  return headers.findIndex((header) =>
    header.toLowerCase().includes(termo.toLowerCase())
  );
}

async function main() {
  const inputPath = resolveInputPath();
  console.log(`Importando convidados do arquivo: ${inputPath}`);

  if (!existsSync(inputPath)) {
    throw new Error(`Arquivo não encontrado: ${inputPath}`);
  }

  const workbook = XLSX.readFile(inputPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

  if (rows.length === 0) {
    console.log('Planilha vazia. Nada a importar.');
    return;
  }

  const { index: headerIndex, headers } = localizarCabecalho(rows);
  const nomeIdx = encontrarIndice(headers, 'nome');
  const telefoneIdx = encontrarIndice(headers, 'telefone');
  const totalIdx = encontrarIndice(headers, 'total confirmados');

  if (nomeIdx === -1 || totalIdx === -1) {
    throw new Error('Colunas obrigatórias não encontradas (Nome, Total Confirmados).');
  }

  const database = getDb();
  database.prepare('DELETE FROM convidados').run();

  let importados = 0;
  let registros = 0;
  let ignorados = 0;

  const dataRows = rows.slice(headerIndex + 1);
  for (const row of dataRows) {
    if (
      row.every(
        (cell) => String(cell ?? '').trim() === ''
      )
    ) {
      continue;
    }

    const nomeOriginal = row[nomeIdx];
    const telefoneOriginal = telefoneIdx >= 0 ? row[telefoneIdx] : undefined;
    const totalOriginal = row[totalIdx];

    const nomeBruto =
      typeof nomeOriginal === 'string' ? nomeOriginal : String(nomeOriginal ?? '').trim();
    if (!nomeBruto || ['undefined', 'null', '#value!'].includes(nomeBruto.toLowerCase())) {
      ignorados++;
      continue;
    }

    const nome = padronizarNome(nomeBruto);
    if (!nome || nome.length < 2) {
      ignorados++;
      continue;
    }

    const telefone =
      telefoneOriginal !== undefined && telefoneOriginal !== null
        ? padronizarTelefone(String(telefoneOriginal))
        : undefined;
    const totalConfirmados = normalizarTotalConfirmados(totalOriginal);

    createConvidado(nome, telefone, totalConfirmados);
    registros += 1;
    importados += totalConfirmados;
  }

  console.log(
    `Importação concluída: ${registros} convidados cadastrados (${importados} pessoas).`
  );
  if (ignorados > 0) {
    console.log(`Linhas ignoradas (nome inválido): ${ignorados}`);
  }
}

main().catch((error) => {
  console.error('Falha ao importar XLSX:', error);
  process.exit(1);
});

