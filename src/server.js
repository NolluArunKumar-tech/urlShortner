require('dotenv').config();

const { openDb } = require('./db');
const createApp = require('./app');

const PORT = process.env.PORT || 3000;

const db = openDb();
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.info(`URL Shortener running on http://localhost:${PORT}`);
  console.info(`  API docs : http://localhost:${PORT}/docs`);
  console.info(`  Dashboard: http://localhost:${PORT}/dashboard`);
  console.info(`  Health   : http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM received. Closing HTTP server...');
  server.close(() => {
    db.close();
    console.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.info('SIGINT received. Closing HTTP server...');
  server.close(() => {
    db.close();
    console.info('Server closed.');
    process.exit(0);
  });
});

module.exports = server;
