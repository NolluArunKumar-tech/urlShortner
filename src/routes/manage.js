const { Router } = require('express');
const auth = require('../middleware/auth');
const urlRepository = require('../db/urlRepository');

module.exports = function manageRouter(db) {
  const router = Router();

  /**
   * DELETE /api/urls/:code
   * Removes a short URL record. Requires API key auth.
   */
  router.delete('/urls/:code', auth, (req, res) => {
    const { code } = req.params;
    const existing = urlRepository.findByCode(db, code);

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Short code "${code}" does not exist`,
      });
    }

    urlRepository.deleteByCode(db, code);
    return res.status(200).json({
      message: `Short code "${code}" has been deleted`,
      shortCode: code,
    });
  });

  /**
   * GET /api/urls
   * Lists all shortened URLs. Requires API key auth.
   */
  router.get('/urls', auth, (_req, res) => {
    const urls = urlRepository.listAll(db);
    return res.status(200).json({ urls, total: urls.length });
  });

  return router;
};
