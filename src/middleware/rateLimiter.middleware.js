// src/middleware/rateLimiter.middleware.js
const RateLimitModel = require('../models/ratelimit.model');
const rateLimiterService = require('../services/rateLimiter.service');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Rate limiter middleware factory
 * Returns a middleware function configured for a specific rate limit config
 *
 * Usage:
 * router.use(rateLimiterMiddleware('default'))
 * router.use(rateLimiterMiddleware('strict'))
 *
 * The config name maps to a rate_limit_configs row in the database
 */
const rateLimiterMiddleware = (configName = 'default') => {
  return async (req, res, next) => {
    try {
      // Get the rate limit config from database
      const config = await RateLimitModel.getByName(configName);

      if (!config) {
        // If config not found log a warning but allow the request
        // Better to let requests through than block everything
        // because of a missing config
        logger.warn(`Rate limit config "${configName}" not found — allowing request`);
        return next();
      }

      // Use identifier set by identify middleware
      const identifier = req.identifier || `ip:${req.socket.remoteAddress}`;

      // Check the rate limit
      const result = await rateLimiterService.checkLimit(identifier, config);

      // Set rate limit headers on every response
      // These are standard headers clients can read
      res.setHeader('X-RateLimit-Limit', config.max_requests);
      res.setHeader('X-RateLimit-Remaining', result.remainingRequests ?? 0);
      res.setHeader('X-RateLimit-Algorithm', config.algorithm);

      if (result.resetInSeconds) {
        res.setHeader('X-RateLimit-Reset', result.resetInSeconds);
      }

      // Log to database asynchronously
      // We don't await this — we don't want logging to slow down the request
      logRequest(req, result, config).catch((err) =>
        logger.error('Failed to log request:', err.message)
      );

      if (!result.allowed) {
        logger.debug(`Request blocked for ${identifier} on config "${configName}"`);

        return res.status(429).json({
          success: false,
          message: 'Too many requests — rate limit exceeded',
          retryAfter: result.resetInSeconds || null,
          limit: config.max_requests,
          algorithm: config.algorithm,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (err) {
      logger.error('Rate limiter middleware error:', err.message);
      // Fail open — if rate limiter breaks allow the request
      next();
    }
  };
};

// Log every request to the database for metrics later
const logRequest = async (req, result, config) => {
  await query(
    `INSERT INTO request_logs 
     (api_key_id, ip_address, endpoint, method, status_code, was_blocked, algorithm_used)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      req.apiKey?.id || null,
      req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress,
      req.path,
      req.method,
      result.allowed ? 200 : 429,
      !result.allowed,
      config.algorithm,
    ]
  );
};

module.exports = rateLimiterMiddleware;