const { Router } = require('express');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const { validateUrl, validateAlias } = require('../middleware/validate');
const { shortenUrl } = require('../services/urlService');

module.exports = function shortenRouter(db) {
  const router = Router();

  /**
   * POST /api/shorten
   * Body: { url: string, alias?: string }
   * Response: { shortUrl, shortCode, originalUrl }
   */
  router.post('/shorten', auth, rateLimit, validateUrl, validateAlias, (req, res, next) => {
    const { url, alias } = req.body;
    try {
      const result = shortenUrl(db, url, alias, req.apiKey);
      return res.status(201).json({
        shortUrl: result.shortUrl,
        shortCode: result.shortCode,
        originalUrl: result.originalUrl,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
