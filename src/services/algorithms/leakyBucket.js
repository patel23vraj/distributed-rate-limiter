// src/services/algorithms/leakyBucket.js
const { redisClient } = require('../../config/redis');
const { logger } = require('../../utils/logger');

/**
 * LEAKY BUCKET ALGORITHM
 *
 * How it works:
 * - Each identifier has a bucket with a fixed capacity
 * - Requests fill the bucket from the top
 * - The bucket leaks at a constant rate from the bottom
 * - If the bucket is full when a request arrives → blocked
 * - Unlike Token Bucket, the leak rate is fixed regardless
 *   of how many requests are waiting
 *
 * Key difference from Token Bucket:
 * - Token Bucket: you accumulate tokens when idle and can burst
 * - Leaky Bucket: output rate is always constant, no bursting
 *
 * Real world example:
 * - Payment processing systems use leaky bucket
 * - You want transactions processed at a steady rate
 * - Not in bursts that could overwhelm downstream systems
 *
 * Storage in Redis:
 * - We store two values per identifier:
 *   1. Current water level (how full the bucket is)
 *   2. Last leak timestamp
 * - On every request we calculate how much has leaked
 *   since the last request and reduce the level
 * - Then we try to add 1 unit to the bucket
 * - If it would overflow the capacity → blocked
 */

const leakyBucket = async (identifier, maxRequests, windowSizeSeconds) => {
  const key = `lb:${identifier}`;

  // Leak rate — how many requests per second drain out
  const leakRate = maxRequests / windowSizeSeconds;

  const now = Date.now();

  try {
    // Get current bucket state
    const bucketData = await redisClient.hGetAll(key);

    let waterLevel;
    let lastLeak;

    if (!bucketData || !bucketData.waterLevel) {
      // First request — bucket starts empty
      waterLevel = 0;
      lastLeak = now;
    } else {
      waterLevel = parseFloat(bucketData.waterLevel);
      lastLeak = parseInt(bucketData.lastLeak);

      // Calculate how much has leaked since last request
      const timePassed = (now - lastLeak) / 1000;
      const leaked = timePassed * leakRate;

      // Reduce water level by how much leaked
      // Never go below 0
      waterLevel = Math.max(0, waterLevel - leaked);
    }

    // Check if adding one more request would overflow the bucket
    const allowed = waterLevel + 1 <= maxRequests;

    if (allowed) {
      // Add the request to the bucket
      waterLevel += 1;
    }

    // Save updated state back to Redis
    await redisClient.hSet(key, {
      waterLevel: waterLevel.toString(),
      lastLeak: now.toString(),
    });

    // Clean up inactive buckets
    await redisClient.expire(key, windowSizeSeconds * 2);

    const result = {
      allowed,
      currentLevel: parseFloat(waterLevel.toFixed(2)),
      maxLevel: maxRequests,
      leakRate: parseFloat(leakRate.toFixed(2)),
      remainingCapacity: parseFloat(
        Math.max(0, maxRequests - waterLevel).toFixed(2)
      ),
      algorithm: 'leaky_bucket',
      identifier,
    };

    if (!allowed) {
      logger.debug(
        `Leaky bucket full for ${identifier} — level: ${waterLevel}/${maxRequests}`
      );
    }

    return result;
  } catch (err) {
    logger.error('Leaky bucket error:', err.message);
    return {
      allowed: true,
      error: 'Rate limiter unavailable',
      algorithm: 'leaky_bucket',
    };
  }
};

module.exports = leakyBucket;