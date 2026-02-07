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
 * Convert PostgreSQL-style $N params to SQLite ? params,
 * expanding the params array when $N values are reused.
 */
function convertParams(text, params) {
  const expandedParams = [];
  const sql = text.replace(/\$(\d+)/g, (match, num) => {
    const idx = parseInt(num, 10) - 1; // $1 → index 0
    expandedParams.push(params[idx]);
    return '?';
  });
  return { sql, params: expandedParams };
}

/**
 * Compatibility wrapper that mimics pg.Pool's query interface.
 */
const pool = {
  query(text, params = []) {
    const { sql: rawSql, params: expandedParams } = convertParams(text, params);

    // Replace PostgreSQL-specific functions
    let sql = rawSql
      .replace(/gen_random_uuid\(\)/g, `'${generateId()}'`)
      .replace(/NOW\(\)/gi, "datetime('now')");

    const trimmed = sql.trim().toUpperCase();
    const hasReturning = /\bRETURNING\b/i.test(sql);

    if (hasReturning && !trimmed.startsWith('SELECT')) {
      // Strip RETURNING clause for the write operation
      const returningMatch = sql.match(/\s+RETURNING\s+(.+?)$/is);
      const returningCols = returningMatch ? returningMatch[1].trim() : '*';
      const writeSQL = sql.replace(/\s+RETURNING\s+.+$/is, '');

      const info = db.prepare(writeSQL).run(...expandedParams);

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
        const whereMatch = writeSQL.match(/\bWHERE\s+(.+)$/is);
        if (tableName && whereMatch) {
          const whereClause = whereMatch[1];
          const beforeWhere = writeSQL.substring(0, writeSQL.search(/\bWHERE\b/i));
          const paramsBefore = (beforeWhere.match(/\?/g) || []).length;
          const whereParams = expandedParams.slice(paramsBefore);
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
      const rows = db.prepare(sql).all(...expandedParams);
      return { rows };
    }

    // Write operations (INSERT, UPDATE, DELETE without RETURNING)
    const info = db.prepare(sql).run(...expandedParams);
    return { rows: [], rowCount: info.changes };
  },
};

export default pool;
