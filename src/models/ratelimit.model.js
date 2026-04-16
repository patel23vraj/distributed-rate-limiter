// src/models/ratelimit.model.js
const { query } = require('../config/database');

const RateLimitModel = {
  // Get all rate limit configs
  async getAll() {
    const result = await query(
      `SELECT id, name, algorithm, max_requests, window_size_seconds, created_at, updated_at
       FROM rate_limit_configs
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // Get one config by ID
  async getById(id) {
    const result = await query(
      `SELECT id, name, algorithm, max_requests, window_size_seconds, created_at, updated_at
       FROM rate_limit_configs
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Get one config by name ← this was missing entirely
  async getByName(name) {
    const result = await query(
      `SELECT id, name, algorithm, max_requests, window_size_seconds, created_at, updated_at
       FROM rate_limit_configs
       WHERE name = $1`,
      [name]
    );
    return result.rows[0];
  },

  // Create a new config
  async create(name, algorithm, maxRequests, windowSizeSeconds) {
    const result = await query(
      `INSERT INTO rate_limit_configs (name, algorithm, max_requests, window_size_seconds)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, algorithm, max_requests, window_size_seconds, created_at, updated_at`,
      [name, algorithm, maxRequests, windowSizeSeconds]
    );
    return result.rows[0];
  },

  // Update an existing config
  async update(id, name, algorithm, maxRequests, windowSizeSeconds) {
    const result = await query(
      `UPDATE rate_limit_configs
       SET name = $1, algorithm = $2, max_requests = $3, window_size_seconds = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, algorithm, max_requests, window_size_seconds, created_at, updated_at`,
      [name, algorithm, maxRequests, windowSizeSeconds, id]
    );
    return result.rows[0];
  },

  // Delete a config
  async delete(id) {
    const result = await query(
      `DELETE FROM rate_limit_configs
       WHERE id = $1
       RETURNING id, name, algorithm`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = RateLimitModel;