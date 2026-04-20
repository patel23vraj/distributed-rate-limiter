// src/routes/metrics.routes.js
const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/metrics.controller');

/**
 * @swagger
 * /api/v1/metrics:
 *   get:
 *     summary: Get overall metrics overview
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: System metrics overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_requests:
 *                       type: integer
 *                     total_blocked:
 *                       type: integer
 *                     total_allowed:
 *                       type: integer
 *                     block_rate_percent:
 *                       type: number
 *                     last_24_hours:
 *                       type: integer
 *                     last_hour:
 *                       type: integer
 */
router.get('/', MetricsController.getOverview);

/**
 * @swagger
 * /api/v1/metrics/requests:
 *   get:
 *     summary: Get request volume over time
 *     tags: [Metrics]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Number of hours to look back
 *     responses:
 *       200:
 *         description: Request volume by hour
 */
router.get('/requests', MetricsController.getRequestVolume);

/**
 * @swagger
 * /api/v1/metrics/blocked:
 *   get:
 *     summary: Get blocked request statistics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Blocked request stats
 */
router.get('/blocked', MetricsController.getBlockedStats);

/**
 * @swagger
 * /api/v1/metrics/top-users:
 *   get:
 *     summary: Get most active users and IPs
 *     tags: [Metrics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top users by request count
 */
router.get('/top-users', MetricsController.getTopUsers);

/**
 * @swagger
 * /api/v1/metrics/algorithms:
 *   get:
 *     summary: Get usage breakdown by algorithm
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Algorithm usage statistics
 */
router.get('/algorithms', MetricsController.getAlgorithmStats);

module.exports = router;