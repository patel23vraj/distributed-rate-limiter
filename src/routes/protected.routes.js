// src/routes/protected.routes.js
const express = require('express');
const router = express.Router();
const identify = require('../middleware/identify.middleware');
const rateLimiterMiddleware = require('../middleware/rateLimiter.middleware');

/**
 * These routes are protected by the rate limiter
 * Every request goes through:
 * 1. identify — figure out who is making the request
 * 2. rateLimiterMiddleware — check if they're within their limit
 * 3. Route handler — process the request
 */

// A simple protected endpoint using the default config
router.get(
  '/default',
  identify,
  rateLimiterMiddleware('default'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Request successful — you are within your rate limit',
      identifier: req.identifier,
      identifierType: req.identifierType,
      timestamp: new Date().toISOString(),
    });
  }
);

// A strict protected endpoint using the strict config
router.get(
  '/strict',
  identify,
  rateLimiterMiddleware('strict'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Request successful — you are within your rate limit',
      identifier: req.identifier,
      identifierType: req.identifierType,
      timestamp: new Date().toISOString(),
    });
  }
);

// An endpoint protected by API key with token bucket
router.get(
  '/premium',
  identify,
  rateLimiterMiddleware('token'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Premium endpoint — token bucket rate limiting active',
      identifier: req.identifier,
      identifierType: req.identifierType,
      apiKey: req.apiKey ? req.apiKey.name : null,
      timestamp: new Date().toISOString(),
    });
  }
);

module.exports = router;