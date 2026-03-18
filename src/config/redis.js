// src/config/redis.js
const redis = require('redis');
const env = require('./env');
const { logger } = require('../utils/logger');

const redisClient = redis.createClient({
  socket: {
    host: env.redis.host,
    port: env.redis.port,
    reconnectStrategy: (retries) => {
      // Exponential backoff — prevents hammering a down Redis server
      if (retries > 10) {
        logger.error('Redis max retries reached. Giving up.');
        return new Error('Max retries reached');
      }
      const wait = Math.min(retries * 100, 3000);
      logger.warn(`Redis retry attempt ${retries}, waiting ${wait}ms...`);
      return wait;
    },
  },
  password: env.redis.password || undefined,
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready to accept commands');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err.message);
});

redisClient.on('end', () => {
  logger.warn('Redis client connection closed');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis PING successful');
    return true;
  } catch (err) {
    logger.error('Redis connection failed:', err.message);
    return false;
  }
};

module.exports = { redisClient, connectRedis };