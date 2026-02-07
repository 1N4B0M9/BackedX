import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data.db');

const db = Database(dbPath);
db.pragma('journal_mode = WAL');

function generateId() {
  return crypto.randomUUID();
}

/**
 * Compatibility wrapper that mimics pg.Pool's query interface.
 */
const pool = {
  query(text, params = []) {
    // Replace PostgreSQL $N placeholders with ?
    let paramIndex = 0;
    const sqliteText = text.replace(/\$\d+/g, () => '?');

    // Replace PostgreSQL-specific functions
    let sql = sqliteText
      .replace(/gen_random_uuid\(\)/g, `'${generateId()}'`)
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/COALESCE/gi, 'COALESCE');

    const trimmed = sql.trim().toUpperCase();
    const hasReturning = sql.toUpperCase().includes('RETURNING');

    if (hasReturning && !trimmed.startsWith('SELECT')) {
      // Strip RETURNING clause for the write operation
      const returningMatch = sql.match(/\s+RETURNING\s+(.+?)$/i);
      const returningCols = returningMatch ? returningMatch[1].trim() : '*';
      const writeSQL = sql.replace(/\s+RETURNING\s+.+$/i, '');

      const info = db.prepare(writeSQL).run(...params);

      // Re-fetch the affected row
      if (trimmed.startsWith('INSERT')) {
        const tableName = writeSQL.match(/INTO\s+(\w+)/i)?.[1];
        if (tableName) {
          const rows = db.prepare(`SELECT ${returningCols} FROM ${tableName} WHERE rowid = ?`).all(info.lastInsertRowid);
          return { rows, rowCount: info.changes };
        }
      }

      if (trimmed.startsWith('UPDATE')) {
        const tableName = writeSQL.match(/UPDATE\s+(\w+)/i)?.[1];
        const whereMatch = writeSQL.match(/WHERE\s+(.+)$/i);
        if (tableName && whereMatch) {
          const whereClause = whereMatch[1];
          const beforeWhere = writeSQL.substring(0, writeSQL.search(/WHERE/i));
          const paramsBefore = (beforeWhere.match(/\?/g) || []).length;
          const whereParams = params.slice(paramsBefore);
          try {
            const rows = db.prepare(`SELECT ${returningCols} FROM ${tableName} WHERE ${whereClause}`).all(...whereParams);
            return { rows, rowCount: info.changes };
          } catch {
            return { rows: [], rowCount: info.changes };
          }
        }
      }

      return { rows: [], rowCount: info.changes };
    }

    if (trimmed.startsWith('SELECT')) {
      const rows = db.prepare(sql).all(...params);
      return { rows };
    }

    // Write operations (INSERT, UPDATE, DELETE without RETURNING)
    const info = db.prepare(sql).run(...params);
    return { rows: [], rowCount: info.changes };
  },
};

export default pool;
