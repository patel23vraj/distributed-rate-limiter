// src/routes/health.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { redisClient } = require('../config/redis');

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Distributed Rate Limiter API is running 🚀',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.get('/health', async (req, res) => {
  // Check PostgreSQL
  let dbStatus = 'disconnected';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  // Check Redis
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