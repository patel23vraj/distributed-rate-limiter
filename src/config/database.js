// src/config/database.js
const { Pool } = require('pg');
const env = require('./env');
const { logger } = require('../utils/logger');

// Pool maintains multiple connections — much more efficient than
// creating a new connection for every single query
const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err.message);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    logger.info(`PostgreSQL connected — DB time: ${result.rows[0].current_time}`);
    client.release();
    return true;
  } catch (err) {
    logger.error('PostgreSQL connection failed:', err.message);
    return false;
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms — rows: ${result.rowCount}`);
    return result;
  } catch (err) {
    logger.error('Query error:', err.message);
    throw err;
  }
};

module.exports = { pool, query, connectDB };