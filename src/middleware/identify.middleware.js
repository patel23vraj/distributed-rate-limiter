// src/middleware/identify.middleware.js
const ApiKeyModel = require('../models/apikey.model');
const { logger } = require('../utils/logger');

/**
 * Identifies the requester by API key or IP address
 * This runs before the rate limiter middleware
 * so the rate limiter knows who to limit
 *
 * Priority order:
 * 1. API key in Authorization header (Bearer token)
 * 2. API key in X-API-Key header
 * 3. Fall back to IP address
 */
const identify = async (req, res, next) => {
  try {
    let identifier = null;
    let identifierType = null;
    let apiKey = null;

    // Check Authorization header first
    // Format: "Bearer rl_abc123..."
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7); // Remove "Bearer " prefix
    }

    // Check X-API-Key header as fallback
    if (!apiKey) {
      apiKey = req.headers['x-api-key'];
    }

    // If we have an API key validate it against the database
    if (apiKey) {
      const keyRecord = await ApiKeyModel.getByKey(apiKey);

      if (keyRecord) {
        // Check if key is active
        if (!keyRecord.is_active) {
          return res.status(401).json({
            success: false,
            message: 'API key is inactive',
            timestamp: new Date().toISOString(),
          });
        }

        // Check if key has expired
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
          return res.status(401).json({
            success: false,
            message: 'API key has expired',
            timestamp: new Date().toISOString(),
          });
        }

        identifier = `key:${keyRecord.id}`;
        identifierType = 'api_key';
        req.apiKey = keyRecord;
        req.userId = keyRecord.user_id;
      } else {
        // Key provided but not found in database
        return res.status(401).json({
          success: false,
          message: 'Invalid API key',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Fall back to IP address if no API key
    if (!identifier) {
      // x-forwarded-for handles requests behind a proxy/load balancer
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';

      identifier = `ip:${ip}`;
      identifierType = 'ip';
    }

    // Attach identifier info to request object
    // so rate limiter middleware can use it
    req.identifier = identifier;
    req.identifierType = identifierType;

    logger.debug(`Request identified as: ${identifier} (${identifierType})`);

    next();
  } catch (err) {
    logger.error('Identify middleware error:', err.message);
    next(err);
  }
};

module.exports = identify;