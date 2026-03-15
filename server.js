// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./src/config/env');
const { logger, morganMiddleware } = require('./src/utils/logger');
const healthRoutes = require('./src/routes/health.routes');

// ─── App Initialization ───────────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());           // Secure HTTP headers
app.use(cors());             // Enable CORS for all origins (will restrict later)
app.use(express.json());     // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morganMiddleware);   // HTTP request logging

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', healthRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Express calls this when next(error) is called anywhere in the app
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const server = app.listen(env.port, () => {
  logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  logger.info(`Health check: http://localhost:${env.port}/health`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// When the process is killed (CTRL+C or Kubernetes), close connections cleanly
process.on('SIGTERM', () => {
  logger.warn('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.warn('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

module.exports = app;