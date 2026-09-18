require('dotenv').config();

const express = require('express');
const path = require('path');
const YAML = require('js-yaml');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

const healthRouter = require('./routes/health');
const shortenRouter = require('./routes/shorten');
const manageRouter = require('./routes/manage');
const analyticsRouter = require('./routes/analytics');
const redirectRouter = require('./routes/redirect');

function createApp(db) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Serve static public files (dashboard)
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check (no auth)
  app.use('/health', healthRouter(db));

  // OpenAPI / Swagger UI
  try {
    const openapiDoc = YAML.load(
      fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'),
    );
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, {
      swaggerOptions: { tryItOutEnabled: true },
    }));
  } catch (err) {
    console.warn('OpenAPI spec not found, /docs will be unavailable:', err.message);
  }

  // Analytics dashboard (served as static HTML)
  app.get('/dashboard', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });

  // API routes (auth-protected)
  app.use('/api', shortenRouter(db));
  app.use('/api', manageRouter(db));
  app.use('/api', analyticsRouter(db));

  // Redirect route â€” MUST be last to avoid shadowing /api/* and /health
  app.use('/', redirectRouter(db));

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    });
  });

  return app;
}

module.exports = createApp;
