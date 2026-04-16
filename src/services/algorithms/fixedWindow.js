// src/services/algorithms/fixedWindow.js
const { redisClient } = require('../../config/redis');
const { logger } = require('../../utils/logger');

/**
 * FIXED WINDOW ALGORITHM
 *
 * How it works:
 * - Time is divided into fixed windows (e.g. every 60 seconds)
 * - Each window has a counter starting at 0
 * - Every request increments the counter
 * - If counter exceeds the limit, the request is blocked
 * - When the window expires, the counter resets to 0
 *
 * Example: limit 100 requests per 60 seconds
 * - Window 1: 12:00:00 - 12:01:00 → counter resets at 12:01:00
 * - Window 2: 12:01:00 - 12:02:00 → fresh counter starts
 *
 * Weakness: A user can send 100 requests at 12:00:59 and
 * another 100 at 12:01:01 — 200 requests in 2 seconds.
 * We'll solve this with Sliding Window in Day 5.
 */

const fixedWindow = async (identifier, maxRequests, windowSizeSeconds) => {
  // The key uniquely identifies this rate limit window
  // Format: fw:<identifier>:<current_window_number>
  // The window number changes every windowSizeSeconds
  // so the key automatically represents a new window
  const windowNumber = Math.floor(Date.now() / 1000 / windowSizeSeconds);
  const key = `fw:${identifier}:${windowNumber}`;

  try {
    // INCR atomically increments the counter
    // If the key doesn't exist, Redis creates it starting at 0
    // then increments to 1. This is atomic — no race conditions.
    const currentCount = await redisClient.incr(key);

    // On the first request in a window, set the expiry
    // We only do this on count === 1 to avoid resetting
    // the expiry on every single request
    if (currentCount === 1) {
      await redisClient.expire(key, windowSizeSeconds);
    }

    // Calculate how many seconds remain in this window
    const ttl = await redisClient.ttl(key);

    const result = {
      allowed: currentCount <= maxRequests,
      currentCount,
      maxRequests,
      windowSizeSeconds,
      remainingRequests: Math.max(0, maxRequests - currentCount),
      resetInSeconds: ttl,
      algorithm: 'fixed_window',
      identifier,
    };

    if (!result.allowed) {
      logger.debug(`Rate limit exceeded for ${identifier} — count: ${currentCount}/${maxRequests}`);
    }

    return result;
  } catch (err) {
    logger.error('Fixed window error:', err.message);
    // If Redis fails, we fail open — allow the request
    // Better to let a request through than to block
    // your entire API because Redis is down
    return {
      allowed: true,
      error: 'Rate limiter unavailable',
      algorithm: 'fixed_window',
    };
  }
};

module.exports = fixedWindow;