/**
 * Data Access Layer for the `clicks` table.
 * All functions accept the `db` instance as the first argument
 * to enable easy injection in tests.
 *
 * Uses positional ? parameters (node-sqlite3-wasm requirement).
 */

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {{ shortCode: string, ipHash: string, userAgent: string, referer: string }} data
 */
function record(db, {
  shortCode, ipHash = '', userAgent = '', referer = '',
}) {
  db.run(
    `INSERT INTO clicks (short_code, ip_hash, user_agent, referer)
     VALUES (?, ?, ?, ?)`,
    [shortCode, ipHash, userAgent, referer],
  );
}

/**
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {string} shortCode
 * @returns {number}
 */
function countByCode(db, shortCode) {
  const row = db.get('SELECT COUNT(*) AS cnt FROM clicks WHERE short_code = ?', [shortCode]);
  return row ? row.cnt : 0;
}

/**
 * Returns the most recent `limit` click records for the given short code.
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {string} shortCode
 * @param {number} [limit=100]
 * @returns {Array}
 */
function listByCode(db, shortCode, limit = 100) {
  return db.all(
    `SELECT id, short_code, clicked_at, user_agent, referer
     FROM clicks
     WHERE short_code = ?
     ORDER BY clicked_at DESC
     LIMIT ?`,
    [shortCode, limit],
  );
}

/**
 * Returns the top N short codes by click count.
 * @param {import('node-sqlite3-wasm').Database} db
 * @param {number} [n=10]
 * @returns {Array<{ short_code: string, click_count: number }>}
 */
function topN(db, n = 10) {
  return db.all(
    `SELECT short_code, COUNT(*) AS click_count
     FROM clicks
     GROUP BY short_code
     ORDER BY click_count DESC
     LIMIT ?`,
    [n],
  );
}

module.exports = {
  record,
  countByCode,
  listByCode,
  topN,
};
