// src/routes/health.routes.js
const express = require('express');
const router = express.Router();

/**
 * GET /
 * Basic health check — confirms the server is running
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
 * GET /health
 * Extended health check — will include DB + Redis status in future phases
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    services: {
      database: 'not connected yet',
      redis: 'not connected yet',
    },
  });
});

module.exports = router;