const UserModel = require('../models/user.model');
const { logger } = require('../utils/logger');

const UserController = {
  // GET /api/v1/users
  async getAll(req, res) {
    try {
      const users = await UserModel.getAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching users:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // GET /api/v1/users/:id
  async getById(req, res) {
    try {
      const user = await UserModel.getById(req.params.id);

      // If no user found, return 404 not 500
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${req.params.id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching user:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // POST /api/v1/users
  async create(req, res) {
    try {
      const { username, email } = req.body;

      // Check if email is already taken
      const existingEmail = await UserModel.getByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if username is already taken
      const existingUsername = await UserModel.getByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'A user with this username already exists',
          timestamp: new Date().toISOString(),
        });
      }

      const user = await UserModel.create(username, email);
      logger.info(`New user created: ${user.username} (${user.id})`);

      // 201 Created is the correct status for successful resource creation
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error creating user:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // PUT /api/v1/users/:id
  async update(req, res) {
    try {
      const { username, email } = req.body;
      const { id } = req.params;

      // Make sure the user exists before trying to update
      const existing = await UserModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const updated = await UserModel.update(id, username, email);
      logger.info(`User updated: ${updated.username} (${updated.id})`);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error updating user:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // DELETE /api/v1/users/:id
  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await UserModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const deleted = await UserModel.delete(id);
      logger.info(`User deleted: ${deleted.username} (${deleted.id})`);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: deleted,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error deleting user:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        timestamp: new Date().toISOString(),
      });
    }
  },
};

module.exports = UserController;