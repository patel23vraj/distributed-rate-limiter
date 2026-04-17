// src/routes/metrics.routes.js
const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/metrics.controller');

// GET /api/v1/metrics              — overall summary
// GET /api/v1/metrics/requests     — request volume over time
// GET /api/v1/metrics/blocked      — blocked request stats
// GET /api/v1/metrics/top-users    — most active identifiers
// GET /api/v1/metrics/algorithms   — usage by algorithm

router.get('/', MetricsController.getOverview);
router.get('/requests', MetricsController.getRequestVolume);
router.get('/blocked', MetricsController.getBlockedStats);
router.get('/top-users', MetricsController.getTopUsers);
router.get('/algorithms', MetricsController.getAlgorithmStats);

module.exports = router;