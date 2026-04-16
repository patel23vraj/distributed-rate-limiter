// src/services/rateLimiter.service.js
const fixedWindow = require('./algorithms/fixedWindow');
const slidingWindow = require('./algorithms/slidingWindow');
const tokenBucket = require('./algorithms/tokenBucket');
const leakyBucket = require('./algorithms/leakyBucket');
const { logger } = require('../utils/logger');

const rateLimiterService = {
  async checkLimit(identifier, config) {
    const { algorithm, max_requests, window_size_seconds } = config;

    logger.debug(
      `Checking rate limit — identifier: ${identifier}, algorithm: ${algorithm}`
    );

    switch (algorithm) {
      case 'fixed_window':
        return await fixedWindow(identifier, max_requests, window_size_seconds);

      case 'sliding_window':
        return await slidingWindow(identifier, max_requests, window_size_seconds);

      case 'token_bucket':
        return await tokenBucket(identifier, max_requests, window_size_seconds);

      case 'leaky_bucket':
        return await leakyBucket(identifier, max_requests, window_size_seconds);

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  },
};

module.exports = rateLimiterService;