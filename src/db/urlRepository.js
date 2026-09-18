/**
 * Data Access Layer for the `urls` table.
 * All functions accept the `db` instance as the first argument
 * to enable easy injection in tests.
 *
 * Uses positional ? parameters (node-sqlite3-wasm requirement).
 */

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {number} id
 */
function findById(db, id) {
  return db.get('SELECT * FROM urls WHERE id = ?', [id]) || undefined;
}

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {{ shortCode: string, originalUrl: string, createdBy?: string, expiresAt?: string }} data
 */
function create(db, {
  shortCode, originalUrl, createdBy = 'anonymous', expiresAt = null,
}) {
  const info = db.run(
    `INSERT INTO urls (short_code, original_url, created_by, expires_at)
     VALUES (?, ?, ?, ?)`,
    [shortCode, originalUrl, createdBy, expiresAt],
  );
  return findById(db, info.lastInsertRowid);
}

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {string} shortCode
 */
function findByCode(db, shortCode) {
  return db.get('SELECT * FROM urls WHERE short_code = ?', [shortCode]) || undefined;
}

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {string} originalUrl
 */
function findByOriginalUrl(db, originalUrl) {
  return db.get('SELECT * FROM urls WHERE original_url = ?', [originalUrl]) || undefined;
}

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @returns {Array}
 */
function listAll(db) {
  return db.all('SELECT * FROM urls ORDER BY created_at DESC');
}

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {string} shortCode
 * @returns {{ changes: number }}
 */
function deleteByCode(db, shortCode) {
  const info = db.run('DELETE FROM urls WHERE short_code = ?', [shortCode]);
  return { changes: info.changes };
}

module.exports = {
  create,
  findById,
  findByCode,
  findByOriginalUrl,
  listAll,
  deleteByCode,
};
