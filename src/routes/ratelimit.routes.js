// src/routes/ratelimit.routes.js
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