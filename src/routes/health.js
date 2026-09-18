const { Router } = require('express');

module.exports = function healthRouter(db) {
  const router = Router();

  /**
   * GET /health
   * Returns service health status. No authentication required.
   * Used by load balancers and uptime monitors.
   */
  router.get('/', (_req, res) => {
    let dbStatus = 'connected';
    let httpStatus = 200;

    try {
      db.get('SELECT 1');
    } catch (err) {
      dbStatus = `error: ${err.message}`;
      httpStatus = 503;
    }

    return res.status(httpStatus).json({
      status: httpStatus === 200 ? 'ok' : 'degraded',
      db: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};
