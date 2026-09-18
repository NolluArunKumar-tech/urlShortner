const { Database } = require('node-sqlite3-wasm');
const fs = require('fs');
const path = require('path');

/**
 * Opens (or creates) the SQLite database, runs schema migrations, and
 * enables WAL mode for better concurrent read performance.
 *
 * Uses node-sqlite3-wasm â€” a pure WASM build of SQLite that requires
 * no native compilation (compatible with any Node.js version).
 *
 * @param {string} [dbPath] - Override path (e.g. ':memory:' for tests)
 * @returns {Database}
 */
function openDb(dbPath) {
  const resolvedPath = dbPath
    || process.env.DATABASE_PATH
    || path.join(__dirname, '..', '..', 'data', 'urls.db');

  // Ensure the directory exists (skip for in-memory)
  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new Database(resolvedPath);

  // Enable WAL mode for better concurrent read performance
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  // Run schema SQL (exec handles multi-statement SQL)
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  return db;
}

module.exports = { openDb };
