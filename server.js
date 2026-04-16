const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./src/config/env');
const { logger, morganMiddleware } = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

// Routes
const healthRoutes = require('./src/routes/health.routes');
const userRoutes = require('./src/routes/user.routes');
const apiKeyRoutes = require('./src/routes/apikey.routes');
const rateLimitRoutes = require('./src/routes/ratelimit.routes');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', healthRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users/:userId/keys', apiKeyRoutes);
app.use('/api/v1/configs', rateLimitRoutes);


// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  const dbConnected = await connectDB();
  const redisConnected = await connectRedis();

  if (!dbConnected) logger.warn('Starting without PostgreSQL — some features unavailable');
  if (!redisConnected) logger.warn('Starting without Redis — rate limiting unavailable');

  const server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    logger.info(`Health check: http://localhost:${env.port}/health`);
  });

  const shutdown = async (signal) => {
    logger.warn(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

module.exports = app;