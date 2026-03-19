const { query } = require('../config/database');

const ApiKeyModel = {
  // Get all API keys for a specific user
  async getByUserId(userId) {
    const result = await query(
      `SELECT id, user_id, key, name, is_active, created_at, expires_at 
       FROM api_keys 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Find one API key by its UUID
  async getById(id) {
    const result = await query(
      `SELECT id, user_id, key, name, is_active, created_at, expires_at 
       FROM api_keys 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Find one API key by the actual key string
  // This is used on every incoming request to validate the key
  async getByKey(key) {
    const result = await query(
      `SELECT id, user_id, key, name, is_active, created_at, expires_at 
       FROM api_keys 
       WHERE key = $1`,
      [key]
    );
    return result.rows[0];
  },

  // Create a new API key for a user
  async create(userId, key, name, expiresAt = null) {
    const result = await query(
      `INSERT INTO api_keys (user_id, key, name, expires_at) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, user_id, key, name, is_active, created_at, expires_at`,
      [userId, key, name, expiresAt]
    );
    return result.rows[0];
  },

  // Activate or deactivate a key without deleting it
  async updateStatus(id, isActive) {
    const result = await query(
      `UPDATE api_keys 
       SET is_active = $1 
       WHERE id = $2 
       RETURNING id, user_id, key, name, is_active, created_at, expires_at`,
      [isActive, id]
    );
    return result.rows[0];
  },

  // Permanently delete an API key
  async delete(id) {
    const result = await query(
      `DELETE FROM api_keys 
       WHERE id = $1 
       RETURNING id, name, key`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = ApiKeyModel;