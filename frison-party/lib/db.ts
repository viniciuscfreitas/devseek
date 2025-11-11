import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'convidados.db');

let db: Database.Database | null = null;

export interface Convidado {
  id: number;
  nome: string;
  telefone: string | null;
  entrou: number;
  total_confirmados: number;
  acompanhantes_presentes: number;
  created_at: string;
}

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS convidados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT,
      total_confirmados INTEGER DEFAULT 1,
      acompanhantes_presentes INTEGER DEFAULT 0,
      entrou INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = db.prepare('PRAGMA table_info(convidados)').all() as Array<{ name: string }>;
  const hasTotalColumn = columns.some((column) => column.name === 'total_confirmados');
  const hasAcompanhantesColumn = columns.some(
    (column) => column.name === 'acompanhantes_presentes'
  );

  if (!hasTotalColumn) {
    db.exec('ALTER TABLE convidados ADD COLUMN total_confirmados INTEGER DEFAULT 1');
  }

  if (!hasAcompanhantesColumn) {
    db.exec('ALTER TABLE convidados ADD COLUMN acompanhantes_presentes INTEGER DEFAULT 0');
  }

  return db;
}

export function getAllConvidados(search?: string): Convidado[] {
  const database = getDb();

  if (search?.trim()) {
    const stmt = database.prepare(`
      SELECT * FROM convidados
      WHERE nome LIKE ? OR telefone LIKE ?
      ORDER BY nome ASC
    `);
    const searchTerm = `%${search.trim()}%`;
    return stmt.all(searchTerm, searchTerm) as Convidado[];
  }

  const stmt = database.prepare('SELECT * FROM convidados ORDER BY nome ASC');
  return stmt.all() as Convidado[];
}

export function createConvidado(
  nome: string,
  telefone?: string,
  totalConfirmados = 1
): Convidado {
  const database = getDb();
  const stmt = database.prepare(
    'INSERT INTO convidados (nome, telefone, total_confirmados, acompanhantes_presentes) VALUES (?, ?, ?, 0)'
  );
  const result = stmt.run(nome.trim(), telefone?.trim() || null, Math.max(1, totalConfirmados));

  const getStmt = database.prepare('SELECT * FROM convidados WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as Convidado;
}

export function updateConvidadoStatus(
  id: number,
  entrou: boolean,
  acompanhantesPresentes?: number
): Convidado | null {
  const database = getDb();
  const acompanhantes = acompanhantesPresentes ?? null;
  const stmt = acompanhantes !== null
    ? database.prepare(
        'UPDATE convidados SET entrou = ?, acompanhantes_presentes = ? WHERE id = ?'
      )
    : database.prepare('UPDATE convidados SET entrou = ? WHERE id = ?');
  const result =
    acompanhantes !== null
      ? stmt.run(entrou ? 1 : 0, Math.max(0, acompanhantes), id)
      : stmt.run(entrou ? 1 : 0, id);

  if (result.changes === 0) {
    return null;
  }

  const getStmt = database.prepare('SELECT * FROM convidados WHERE id = ?');
  return getStmt.get(id) as Convidado;
}



