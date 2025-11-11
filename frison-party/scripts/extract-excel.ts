import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { padronizarNome, padronizarTelefone } from '../lib/convidado-normalize';
import { createConvidado, getDb } from '../lib/db';

const csvPath = join(process.cwd(), 'dados', 'ListaOficial_FestaFrison.csv');

async function extractCsv() {
  console.log(`Procurando arquivo CSV em: ${csvPath}`);

  if (!existsSync(csvPath)) {
    console.error(`Erro: Arquivo não encontrado em ${csvPath}`);
    return;
  }

  const fileContent = readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    console.log('Aviso: CSV vazio ou sem dados.');
    return;
  }

  // Pula cabeçalho
  const dataLines = lines.slice(1);
  console.log(`Total de linhas lidas do CSV: ${dataLines.length}`);

  const database = getDb();
  const checkStmt = database.prepare('SELECT COUNT(*) as count FROM convidados');
  const existingCount = checkStmt.get() as { count: number };

  if (existingCount.count > 0) {
    console.log(`Banco já possui ${existingCount.count} convidados. Pulando importação.`);
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const line of dataLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      skipped++;
      continue;
    }

    // Parse CSV simples (considera vírgulas, mas trata nomes com vírgulas)
    const parts = trimmedLine.split(',');

    if (parts.length < 1) {
      skipped++;
      continue;
    }

    // Nome é tudo antes da última vírgula (ou primeira se só tiver 2 partes)
    // Telefone é a última parte
    let nome = '';
    let telefone = '';

    if (parts.length === 2) {
      nome = parts[0].trim();
      telefone = parts[1].trim();
    } else if (parts.length > 2) {
      // Nome pode ter vírgulas, telefone é sempre a última parte
      nome = parts.slice(0, -1).join(',').trim();
      telefone = parts[parts.length - 1].trim();
    } else {
      nome = parts[0].trim();
    }

    const nomePadronizado = padronizarNome(nome);

    if (!nomePadronizado || nomePadronizado.length < 2) {
      skipped++;
      continue;
    }

    const telefonePadronizado = padronizarTelefone(telefone);
    createConvidado(nomePadronizado, telefonePadronizado, 1);
    imported++;
  }

  console.log(`Importados ${imported} convidados com sucesso.`);
  if (skipped > 0) {
    console.log(`Pulados ${skipped} registros sem nome válido.`);
  }
}

extractCsv().catch(console.error);
