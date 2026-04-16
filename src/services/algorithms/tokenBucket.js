// src/services/algorithms/tokenBucket.js
const { redisClient } = require('../../config/redis');
const { logger } = require('../../utils/logger');

/**
 * TOKEN BUCKET ALGORITHM
 *
 * How it works:
 * - Each identifier gets a bucket with a max capacity
 * - Tokens refill at a fixed rate over time
 * - Each request consumes one token
 * - If no tokens available → request is blocked
 * - Unused tokens accumulate up to the max capacity
 *
 * Key difference from Fixed/Sliding Window:
 * - Allows bursting — if you haven't made requests in a while
 *   your bucket fills up and you can send multiple requests
 *   all at once without being blocked
 *
 * Real world example:
 * - Stripe uses token bucket for their API
 * - If you haven't called their API in a while you can
 *   make several calls in quick succession
 * - But sustained high traffic will eventually drain the bucket
 *
 * Storage in Redis:
 * - We store two values per identifier:
 *   1. Current token count
 *   2. Last refill timestamp
 * - On every request we calculate how many tokens should
 *   have been added since the last request and add them
 */

const tokenBucket = async (identifier, maxRequests, windowSizeSeconds) => {
  const key = `tb:${identifier}`;

  // Calculate refill rate — how many tokens per second
  // maxRequests is our bucket capacity
  // windowSizeSeconds defines how long it takes to fully refill
  const refillRate = maxRequests / windowSizeSeconds;

  const now = Date.now();

  try {
    // Get current bucket state from Redis
    const bucketData = await redisClient.hGetAll(key);

    let tokens;
    let lastRefill;

    if (!bucketData || !bucketData.tokens) {
      // First request — bucket starts full
      tokens = maxRequests;
      lastRefill = now;
    } else {
      tokens = parseFloat(bucketData.tokens);
      lastRefill = parseInt(bucketData.lastRefill);

      // Calculate how much time has passed since last request
      const timePassed = (now - lastRefill) / 1000; // convert to seconds

      // Calculate how many tokens to add based on time passed
      const tokensToAdd = timePassed * refillRate;

      // Add tokens but don't exceed max capacity
      tokens = Math.min(maxRequests, tokens + tokensToAdd);
    }

    const allowed = tokens >= 1;

    if (allowed) {
      // Consume one token
      tokens -= 1;
    }

    // Save updated bucket state back to Redis
    // hSet stores multiple fields in a Redis hash
    await redisClient.hSet(key, {
      tokens: tokens.toString(),
      lastRefill: now.toString(),
    });

    // Set expiry — clean up inactive buckets after double the window size
    await redisClient.expire(key, windowSizeSeconds * 2);

    const result = {
      allowed,
      currentTokens: parseFloat(tokens.toFixed(2)),
      maxTokens: maxRequests,
      refillRate: parseFloat(refillRate.toFixed(2)),
      remainingRequests: Math.floor(tokens),
      algorithm: 'token_bucket',
      identifier,
    };

    if (!allowed) {
      logger.debug(`Token bucket empty for ${identifier} — tokens: ${tokens}/${maxRequests}`);
    }

    return result;
  } catch (err) {
    logger.error('Token bucket error:', err.message);
    return {
      allowed: true,
      error: 'Rate limiter unavailable',
      algorithm: 'token_bucket',
    };
  }
};

module.exports = tokenBucket;