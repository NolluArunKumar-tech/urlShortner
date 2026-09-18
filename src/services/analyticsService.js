const clickRepository = require('../db/clickRepository');
const urlRepository = require('../db/urlRepository');

/**
 * Returns analytics for a specific short code.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} shortCode
 * @param {number} [limit=100]
 * @returns {{ shortCode, totalClicks, clicks[] }}
 */
function getCodeAnalytics(db, shortCode, limit = 100) {
  const url = urlRepository.findByCode(db, shortCode);
  if (!url) {
    const err = new Error(`Short code "${shortCode}" not found`);
    err.status = 404;
    err.code = 'SHORT_CODE_NOT_FOUND';
    throw err;
  }

  const totalClicks = clickRepository.countByCode(db, shortCode);
  const clicks = clickRepository.listByCode(db, shortCode, limit);

  return {
    shortCode,
    originalUrl: url.original_url,
    createdAt: url.created_at,
    totalClicks,
    clicks,
  };
}

/**
 * Returns the top N short codes by click count, enriched with original URL.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {number} [n=10]
 * @returns {Array}
 */
function getTopUrls(db, n = 10) {
  const top = clickRepository.topN(db, n);
  return top.map((row) => {
    const url = urlRepository.findByCode(db, row.short_code);
    return {
      shortCode: row.short_code,
      clickCount: row.click_count,
      originalUrl: url ? url.original_url : null,
      createdAt: url ? url.created_at : null,
    };
  });
}

module.exports = { getCodeAnalytics, getTopUrls };
