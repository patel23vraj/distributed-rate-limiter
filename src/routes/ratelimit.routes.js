// src/routes/ratelimit.routes.js

/**
 * @swagger
 * /api/v1/configs:
 *   get:
 *     summary: Get all rate limit configs
 *     tags: [Rate Limit Configs]
 *     responses:
 *       200:
 *         description: List of all configs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RateLimitConfig'
 */

/**
 * @swagger
 * /api/v1/configs:
 *   post:
 *     summary: Create a rate limit config
 *     tags: [Rate Limit Configs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - algorithm
 *               - max_requests
 *               - window_size_seconds
 *             properties:
 *               name:
 *                 type: string
 *                 example: strict
 *               algorithm:
 *                 type: string
 *                 enum: [fixed_window, sliding_window, token_bucket, leaky_bucket]
 *               max_requests:
 *                 type: integer
 *                 example: 100
 *               window_size_seconds:
 *                 type: integer
 *                 example: 60
 *     responses:
 *       201:
 *         description: Config created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Config name already exists
 */

/**
 * @swagger
 * /api/v1/configs/test:
 *   post:
 *     summary: Test a rate limit config
 *     tags: [Rate Limit Configs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - config_name
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user_123
 *               config_name:
 *                 type: string
 *                 example: strict
 *     responses:
 *       200:
 *         description: Request allowed
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /api/v1/configs/{id}:
 *   get:
 *     summary: Get a config by ID
 *     tags: [Rate Limit Configs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Config found
 *       404:
 *         description: Config not found
 */

/**
 * @swagger
 * /api/v1/configs/{id}:
 *   delete:
 *     summary: Delete a config
 *     tags: [Rate Limit Configs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Config deleted
 *       404:
 *         description: Config not found
 */

const express = require('express');
const router = express.Router();
const RateLimitController = require('../controllers/ratelimit.controller');  // ← removed extra 's'
const validate = require('../middleware/validate.middleware');
const rateLimiterService = require('../services/rateLimiter.service');
const RateLimitModel = require('../models/ratelimit.model');

// GET      /api/v1/configs       - get all configs
// POST     /api/v1/configs       - create a new config
// GET      /api/v1/configs/:id   - get one config
// PUT      /api/v1/configs/:id   - update a config
// DELETE   /api/v1/configs/:id   - delete a config

router.get('/', RateLimitController.getAll);          // ← getALL → getAll
router.post('/', RateLimitController.create);          // ← RateLimiterController → RateLimitController
router.get('/:id', validate.validateUUID, RateLimitController.getById);  // ← valideUUID → validateUUID
router.put('/:id', validate.validateUUID, RateLimitController.update);   // ← '/id' → '/:id'
router.delete('/:id', validate.validateUUID, RateLimitController.delete);

// POST /api/v1/configs/test
router.post('/test', async (req, res) => {
  try {
    const { identifier, config_name } = req.body;

    if (!identifier || !config_name) {
      return res.status(400).json({
        success: false,
        message: 'identifier and config_name are required',
        timestamp: new Date().toISOString(),
      });
    }

    const config = await RateLimitModel.getByName(config_name);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Config "${config_name}" not found`,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await rateLimiterService.checkLimit(identifier, config);

    res.status(result.allowed ? 200 : 429).json({
      success: result.allowed,
      message: result.allowed ? 'Request allowed' : 'Rate limit exceeded',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;