// Codes that must not be usable as short codes / aliases
const RESERVED_CODES = new Set(['api', 'health', 'dashboard', 'docs', 'static', 'public']);

const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

/**
 * Validates the `url` field on the request body.
 * Must be a valid absolute HTTP/HTTPS URL.
 */
function validateUrl(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'MISSING_URL',
      message: 'Request body must include a "url" field',
    });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({
      error: 'INVALID_URL',
      message: 'The provided URL is not a valid absolute URL',
    });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({
      error: 'INVALID_URL_SCHEME',
      message: 'Only http and https URLs are accepted',
    });
  }

  return next();
}

/**
 * Validates the optional `alias` field on the request body.
 * Must match /^[a-zA-Z0-9_-]{3,32}$/ and not be a reserved word.
 */
function validateAlias(req, res, next) {
  const { alias } = req.body;

  if (!alias) {
    return next(); // alias is optional
  }

  if (typeof alias !== 'string' || !ALIAS_PATTERN.test(alias)) {
    return res.status(400).json({
      error: 'INVALID_ALIAS',
      message: 'Alias must be 3â€“32 characters, only letters, digits, hyphens, and underscores',
    });
  }

  if (RESERVED_CODES.has(alias.toLowerCase())) {
    return res.status(400).json({
      error: 'RESERVED_ALIAS',
      message: `"${alias}" is a reserved word and cannot be used as an alias`,
    });
  }

  return next();
}

module.exports = { validateUrl, validateAlias, RESERVED_CODES };
