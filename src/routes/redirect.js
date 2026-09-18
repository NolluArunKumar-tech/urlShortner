const { Router } = require('express');
const { resolveUrl } = require('../services/urlService');

module.exports = function redirectRouter(db) {
  const router = Router();

  /**
   * GET /:code
   * Resolves the short code and redirects to the original URL (302).
   * Records a click asynchronously.
   */
  router.get('/:code', (req, res, next) => {
    const { code } = req.params;
    try {
      const originalUrl = resolveUrl(db, code, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer,
      });
      return res.redirect(302, originalUrl);
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Short code "${code}" does not exist`,
        });
      }
      if (err.status === 410) {
        return res.status(410).json({
          error: 'EXPIRED',
          message: `Short code "${code}" has expired`,
        });
      }
      return next(err);
    }
  });

  return router;
};
