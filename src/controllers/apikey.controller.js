const ApiKeyModel = require('../models/apikey.model');
const UserModel = require('../models/user.model');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Generates a secure random API key string
// Format: rl_<32 random hex characters>
// "rl" stands for "rate limiter" — helps identify where the key came from
const generateApiKey = () => {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `rl_${randomBytes}`;
};

const ApiKeyController = {
  // GET /api/v1/users/:userId/keys
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;

      // Verify the user exists first
      const user = await UserModel.getById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const keys = await ApiKeyModel.getByUserId(userId);
      res.status(200).json({
        success: true,
        count: keys.length,
        data: keys,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching API keys:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch API keys',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // POST /api/v1/users/:userId/keys
  async create(req, res) {
    try {
      const { userId } = req.params;
      const { name, expiresAt } = req.body;

      // Verify the user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      // Generate a cryptographically secure API key
      const key = generateApiKey();

      const apiKey = await ApiKeyModel.create(
        userId,
        key,
        name,
        expiresAt || null
      );

      logger.info(`New API key created for user ${userId}: ${apiKey.name}`);

      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: apiKey,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error creating API key:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create API key',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // PATCH /api/v1/keys/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_active must be a boolean (true or false)',
          timestamp: new Date().toISOString(),
        });
      }

      const existing = await ApiKeyModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `API key with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const updated = await ApiKeyModel.updateStatus(id, is_active);
      logger.info(`API key ${id} status updated to: ${is_active}`);

      res.status(200).json({
        success: true,
        message: `API key ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error updating API key status:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update API key status',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // DELETE /api/v1/keys/:id
  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await ApiKeyModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `API key with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const deleted = await ApiKeyModel.delete(id);
      logger.info(`API key deleted: ${deleted.name} (${deleted.id})`);

      res.status(200).json({
        success: true,
        message: 'API key deleted successfully',
        data: deleted,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error deleting API key:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete API key',
        timestamp: new Date().toISOString(),
      });
    }
  },
};

module.exports = ApiKeyController;