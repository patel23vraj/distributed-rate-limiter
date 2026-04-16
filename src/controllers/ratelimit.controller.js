// src/controllers/ratelimit.controller.js
const RateLimitModel = require('../models/ratelimit.model');
const { logger } = require('../utils/logger');

// These are the only algorithms we support
// If someone sends anything else we reject it
const VALID_ALGORITHMS = [
  'fixed_window',
  'sliding_window',
  'token_bucket',
  'leaky_bucket',
];

const RateLimitController = {
  // GET /api/v1/configs
  async getAll(req, res) {
    try {
      const configs = await RateLimitModel.getAll();
      res.status(200).json({
        success: true,
        count: configs.length,
        data: configs,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching configs:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rate limit configs',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // GET /api/v1/configs/:id
  async getById(req, res) {
    try {
      const config = await RateLimitModel.getById(req.params.id);
      if (!config) {
        return res.status(404).json({
          success: false,
          message: `Config with ID ${req.params.id} not found`,
          timestamp: new Date().toISOString(),
        });
      }
      res.status(200).json({
        success: true,
        data: config,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching config:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch config',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // POST /api/v1/configs
  async create(req, res) {
    try {
      const { name, algorithm, max_requests, window_size_seconds } = req.body;

      // Validate all required fields
      if (!name || !algorithm || !max_requests || !window_size_seconds) {
        return res.status(400).json({
          success: false,
          message: 'name, algorithm, max_requests, and window_size_seconds are all required',
          timestamp: new Date().toISOString(),
        });
      }

      // Validate algorithm is one we support
      if (!VALID_ALGORITHMS.includes(algorithm)) {
        return res.status(400).json({
          success: false,
          message: `Invalid algorithm. Must be one of: ${VALID_ALGORITHMS.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Validate numbers are positive integers
      if (max_requests < 1 || window_size_seconds < 1) {
        return res.status(400).json({
          success: false,
          message: 'max_requests and window_size_seconds must be positive integers',
          timestamp: new Date().toISOString(),
        });
      }

      // Check for duplicate name
      const existing = await RateLimitModel.getByName(name);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `A config with the name "${name}" already exists`,
          timestamp: new Date().toISOString(),
        });
      }

      const config = await RateLimitModel.create(
        name,
        algorithm,
        max_requests,
        window_size_seconds
      );

      logger.info(`New rate limit config created: ${config.name}`);

      res.status(201).json({
        success: true,
        message: 'Rate limit config created successfully',
        data: config,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error creating config:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create config',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // PUT /api/v1/configs/:id
  async update(req, res) {
    try {
      const { name, algorithm, max_requests, window_size_seconds } = req.body;
      const { id } = req.params;

      if (!name || !algorithm || !max_requests || !window_size_seconds) {
        return res.status(400).json({
          success: false,
          message: 'name, algorithm, max_requests, and window_size_seconds are all required',
          timestamp: new Date().toISOString(),
        });
      }

      if (!VALID_ALGORITHMS.includes(algorithm)) {
        return res.status(400).json({
          success: false,
          message: `Invalid algorithm. Must be one of: ${VALID_ALGORITHMS.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }

      const existing = await RateLimitModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Config with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const updated = await RateLimitModel.update(
        id,
        name,
        algorithm,
        max_requests,
        window_size_seconds
      );

      logger.info(`Rate limit config updated: ${updated.name}`);

      res.status(200).json({
        success: true,
        message: 'Rate limit config updated successfully',
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error updating config:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update config',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // DELETE /api/v1/configs/:id
  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await RateLimitModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Config with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const deleted = await RateLimitModel.delete(id);
      logger.info(`Rate limit config deleted: ${deleted.name}`);

      res.status(200).json({
        success: true,
        message: 'Rate limit config deleted successfully',
        data: deleted,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error deleting config:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete config',
        timestamp: new Date().toISOString(),
      });
    }
  },
};

module.exports = RateLimitController; 