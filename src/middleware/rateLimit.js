/**
 * Per-API-key sliding window rate limiter (in-memory).
 *
 * Engineering decision (Ambiguous scenario):
 *   - Window: 60 seconds (sliding)
 *   - Default limit: 60 requests/window (~1 req/sec average)
 *   - Storage: in-memory Map â€” resets on process restart (documented limitation)
 *   - Override: process.env.RATE_LIMIT
 *
 * For production, replace the `store` Map with a Redis-backed implementation
 * without changing the middleware interface.
 */

const WINDOW_MS = 60 * 1000; // 60 seconds

// Map<apiKey, number[]> â€” stores timestamps of requests within the window
const store = new Map();

function getRateLimit() {
  const limit = parseInt(process.env.RATE_LIMIT || '60', 10);
  return Number.isFinite(limit) && limit > 0 ? limit : 60;
}

/**
 * Prunes timestamps outside the current sliding window.
 * @param {number[]} timestamps
 * @param {number} now
 * @returns {number[]}
 */
function pruneWindow(timestamps, now) {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

function rateLimit(req, res, next) {
  const key = req.apiKey || req.headers['x-api-key'] || req.ip;
  const limit = getRateLimit();
  const now = Date.now();

  const current = pruneWindow(store.get(key) || [], now);

  // Set limit/reset headers (always present)
  res.set('X-RateLimit-Limit', String(limit));
  res.set('X-RateLimit-Reset', String(Math.ceil((now + WINDOW_MS) / 1000)));

  if (current.length >= limit) {
    res.set('X-RateLimit-Remaining', '0');
    const retryAfter = Math.ceil(WINDOW_MS / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: `Too many requests. Try again in ${retryAfter} seconds.`,
      retryAfter,
    });
  }

  // Consume one slot, then report remaining
  current.push(now);
  store.set(key, current);
  res.set('X-RateLimit-Remaining', String(Math.max(0, limit - current.length)));
  return next();
}

// Expose internals for testing (eslint-disable needed for test helper pattern)
/* eslint-disable no-underscore-dangle */
rateLimit._store = store;
rateLimit._pruneWindow = pruneWindow;
rateLimit._getRateLimit = getRateLimit;
/* eslint-enable no-underscore-dangle */

module.exports = rateLimit;
