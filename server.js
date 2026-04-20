// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const env = require('./src/config/env');
const { logger, morganMiddleware } = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const swaggerSpec = require('./src/config/swagger');

const healthRoutes = require('./src/routes/health.routes');
const userRoutes = require('./src/routes/user.routes');
const apiKeyRoutes = require('./src/routes/apikey.routes');
const rateLimitRoutes = require('./src/routes/ratelimit.routes');
const protectedRoutes = require('./src/routes/protected.routes');
const metricsRoutes = require('./src/routes/metrics.routes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Rate Limiter API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Expose raw swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/', healthRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users/:userId/keys', apiKeyRoutes);
app.use('/api/v1/configs', rateLimitRoutes);
app.use('/api/v1/protected', protectedRoutes);
app.use('/api/v1/metrics', metricsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  const dbConnected = await connectDB();
  const redisConnected = await connectRedis();

  if (!dbConnected) logger.warn('Starting without PostgreSQL — some features unavailable');
  if (!redisConnected) logger.warn('Starting without Redis — rate limiting unavailable');

  const server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    logger.info(`API Docs: http://localhost:${env.port}/api-docs`);
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
