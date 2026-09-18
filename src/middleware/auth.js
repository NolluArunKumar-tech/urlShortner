/**
 * API Key authentication middleware.
 * Reads the X-API-Key header and compares against process.env.API_KEY.
 * Returns 401 if missing, 403 if invalid.
 */
function auth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'MISSING_API_KEY',
      message: 'X-API-Key header is required',
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      error: 'INVALID_API_KEY',
      message: 'The provided API key is not valid',
    });
  }

  // Attach the key label for audit purposes
  req.apiKey = apiKey;
  return next();
}

module.exports = auth;
