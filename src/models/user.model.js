const { query } = require('../config/database');

const UserModel = {
  async getAll() {
    const result = await query(
      `SELECT id, username, email, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

async getById(id) {
    const result = await query(
        `SELECT id, username, email create_at, updated_at
        FROM users
        WHERE id = $1`,
        [id]
    );
    return result.rows[0];
},

// Find one user by their email address
async getByEmail(email) {
    const result = await query(
        `SELECT id, username, email, created_at, updated_at 
        FROM users 
        WHERE email = $1`,
        [email]
    );
    return result.rows[0];
},

// Find one user by their username
  async getByUsername(username) {
    const result = await query(
      `SELECT id, username, email, created_at, updated_at 
       FROM users 
       WHERE username = $1`,
      [username]
    );
    return result.rows[0];
  },

  // Insert a new user and return the created row
  async create(username, email) {
    const result = await query(
      `INSERT INTO users (username, email) 
       VALUES ($1, $2) 
       RETURNING id, username, email, created_at, updated_at`,
      [username, email]
    );
    return result.rows[0];
  },

  // Update a user's info and refresh updated_at
  async update(id, username, email) {
    const result = await query(
      `UPDATE users 
       SET username = $1, email = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, username, email, created_at, updated_at`,
      [username, email, id]
    );
    return result.rows[0];
  },

    // Delete a user by ID and return the deleted row
  async delete(id) {
    const result = await query(
      `DELETE FROM users 
       WHERE id = $1 
       RETURNING id, username, email`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = UserModel;
