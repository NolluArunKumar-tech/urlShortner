const { Router } = require('express');
const auth = require('../middleware/auth');
const { getCodeAnalytics, getTopUrls } = require('../services/analyticsService');

module.exports = function analyticsRouter(db) {
  const router = Router();

  /**
   * GET /api/analytics/top
   * Returns top N URLs by click count. Defaults to 10, max 100.
   */
  router.get('/analytics/top', auth, (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
      const top = getTopUrls(db, limit);
      return res.status(200).json({ top, total: top.length });
    } catch (err) {
      return next(err);
    }
  });

  /**
   * GET /api/analytics/:code
   * Returns click analytics for a specific short code.
   */
  router.get('/analytics/:code', auth, (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '100', 10), 100);
      const analytics = getCodeAnalytics(db, req.params.code, limit);
      return res.status(200).json(analytics);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
