// src/routes/health.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { redisClient } = require('../config/redis');

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns basic server information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Distributed Rate Limiter API is running 🚀',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of all services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: string
 *                   example: 120 seconds
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     redis:
 *                       type: string
 *                       example: connected
 *       503:
 *         description: One or more services unhealthy
 */
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  let redisStatus = 'disconnected';
  try {
    const pong = await redisClient.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'disconnected';
  } catch {
    redisStatus = 'disconnected';
  }

  const allHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? 'healthy' : 'degraded',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

module.exports = router;