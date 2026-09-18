const crypto = require('crypto');
const { nanoid } = require('nanoid');
const urlRepository = require('../db/urlRepository');
const clickRepository = require('../db/clickRepository');

const MAX_RETRIES = 5;
const CODE_LENGTH = 7;

/**
 * Hashes an IP address with SHA-256 for privacy compliance.
 * @param {string} ip
 * @returns {string}
 */
function hashIp(ip) {
  return crypto.createHash('sha256').update(ip || '').digest('hex');
}

/**
 * Shortens a URL, optionally using a custom alias.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} originalUrl
 * @param {string|undefined} alias
 * @param {string} apiKey - used as createdBy label
 * @returns {{ shortCode: string, originalUrl: string, shortUrl: string }}
 */
function shortenUrl(db, originalUrl, alias, apiKey) {
  const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

  // If alias provided, check for conflict
  if (alias) {
    const existing = urlRepository.findByCode(db, alias);
    if (existing) {
      const err = new Error(`Alias "${alias}" is already taken`);
      err.status = 409;
      err.code = 'ALIAS_CONFLICT';
      throw err;
    }
    const record = urlRepository.create(db, {
      shortCode: alias,
      originalUrl,
      createdBy: apiKey || 'anonymous',
    });
    return {
      shortCode: record.short_code,
      originalUrl: record.original_url,
      shortUrl: `${baseUrl}/${record.short_code}`,
    };
  }

  // Random code generation with collision retry
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const code = nanoid(CODE_LENGTH);
    const existing = urlRepository.findByCode(db, code);
    if (!existing) {
      const record = urlRepository.create(db, {
        shortCode: code,
        originalUrl,
        createdBy: apiKey || 'anonymous',
      });
      return {
        shortCode: record.short_code,
        originalUrl: record.original_url,
        shortUrl: `${baseUrl}/${record.short_code}`,
      };
    }
  }

  const err = new Error('Failed to generate a unique short code after multiple attempts');
  err.status = 503;
  err.code = 'CODE_GENERATION_FAILED';
  throw err;
}

/**
 * Resolves a short code to its original URL and records a click.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} shortCode
 * @param {{ ip: string, userAgent: string, referer: string }} meta
 * @returns {string} The original URL
 */
function resolveUrl(db, shortCode, { ip, userAgent, referer } = {}) {
  const record = urlRepository.findByCode(db, shortCode);

  if (!record) {
    const err = new Error(`Short code "${shortCode}" not found`);
    err.status = 404;
    err.code = 'SHORT_CODE_NOT_FOUND';
    throw err;
  }

  // Check expiry
  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    const err = new Error(`Short code "${shortCode}" has expired`);
    err.status = 410;
    err.code = 'SHORT_CODE_EXPIRED';
    throw err;
  }

  // Record click asynchronously (don't block the redirect)
  setImmediate(() => {
    try {
      clickRepository.record(db, {
        shortCode,
        ipHash: hashIp(ip),
        userAgent: userAgent || '',
        referer: referer || '',
      });
    } catch (err) {
      console.error('Failed to record click:', err.message);
    }
  });

  return record.original_url;
}

module.exports = { shortenUrl, resolveUrl, hashIp };
