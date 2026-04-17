// src/controllers/metrics.controller.js
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const MetricsController = {

  // GET /api/v1/metrics
  // Overall system summary
  async getOverview(req, res) {
    try {
      // Total requests
      const totalResult = await query(
        `SELECT COUNT(*) as total FROM request_logs`
      );

      // Total blocked requests
      const blockedResult = await query(
        `SELECT COUNT(*) as total FROM request_logs WHERE was_blocked = true`
      );

      // Requests in last 24 hours
      const last24hResult = await query(
        `SELECT COUNT(*) as total FROM request_logs 
         WHERE created_at > NOW() - INTERVAL '24 hours'`
      );

      // Blocked in last 24 hours
      const blocked24hResult = await query(
        `SELECT COUNT(*) as total FROM request_logs 
         WHERE was_blocked = true 
         AND created_at > NOW() - INTERVAL '24 hours'`
      );

      // Requests in last hour
      const lastHourResult = await query(
        `SELECT COUNT(*) as total FROM request_logs 
         WHERE created_at > NOW() - INTERVAL '1 hour'`
      );

      // Total unique identifiers
      const uniqueResult = await query(
        `SELECT COUNT(DISTINCT ip_address) as total FROM request_logs`
      );

      const total = parseInt(totalResult.rows[0].total);
      const blocked = parseInt(blockedResult.rows[0].total);

      res.status(200).json({
        success: true,
        data: {
          total_requests: total,
          total_blocked: blocked,
          total_allowed: total - blocked,
          block_rate_percent: total > 0
            ? parseFloat(((blocked / total) * 100).toFixed(2))
            : 0,
          last_24_hours: parseInt(last24hResult.rows[0].total),
          blocked_24_hours: parseInt(blocked24hResult.rows[0].total),
          last_hour: parseInt(lastHourResult.rows[0].total),
          unique_ips: parseInt(uniqueResult.rows[0].total),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching metrics overview:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch metrics',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // GET /api/v1/metrics/requests
  // Request volume broken down by hour
  async getRequestVolume(req, res) {
    try {
      // Default to last 24 hours, allow override via query param
      const hours = parseInt(req.query.hours) || 24;

      const result = await query(
        `SELECT 
           DATE_TRUNC('hour', created_at) as hour,
           COUNT(*) as total_requests,
           SUM(CASE WHEN was_blocked THEN 1 ELSE 0 END) as blocked_requests,
           SUM(CASE WHEN NOT was_blocked THEN 1 ELSE 0 END) as allowed_requests
         FROM request_logs
         WHERE created_at > NOW() - INTERVAL '${hours} hours'
         GROUP BY DATE_TRUNC('hour', created_at)
         ORDER BY hour DESC`
      );

      res.status(200).json({
        success: true,
        period_hours: hours,
        count: result.rows.length,
        data: result.rows.map(row => ({
          hour: row.hour,
          total_requests: parseInt(row.total_requests),
          blocked_requests: parseInt(row.blocked_requests),
          allowed_requests: parseInt(row.allowed_requests),
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching request volume:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch request volume',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // GET /api/v1/metrics/blocked
  // Detailed blocked request stats
  async getBlockedStats(req, res) {
    try {
      // Most blocked endpoints
      const endpointsResult = await query(
        `SELECT 
           endpoint,
           method,
           COUNT(*) as blocked_count
         FROM request_logs
         WHERE was_blocked = true
         GROUP BY endpoint, method
         ORDER BY blocked_count DESC
         LIMIT 10`
      );

      // Blocked requests over time
      const timeResult = await query(
        `SELECT 
           DATE_TRUNC('hour', created_at) as hour,
           COUNT(*) as blocked_count
         FROM request_logs
         WHERE was_blocked = true
         AND created_at > NOW() - INTERVAL '24 hours'
         GROUP BY DATE_TRUNC('hour', created_at)
         ORDER BY hour DESC`
      );

      res.status(200).json({
        success: true,
        data: {
          most_blocked_endpoints: endpointsResult.rows.map(row => ({
            endpoint: row.endpoint,
            method: row.method,
            blocked_count: parseInt(row.blocked_count),
          })),
          blocked_over_time: timeResult.rows.map(row => ({
            hour: row.hour,
            blocked_count: parseInt(row.blocked_count),
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching blocked stats:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blocked stats',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // GET /api/v1/metrics/top-users
  // Most active IP addresses and API keys
  async getTopUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      // Top IPs by request count
      const ipResult = await query(
        `SELECT 
           ip_address,
           COUNT(*) as total_requests,
           SUM(CASE WHEN was_blocked THEN 1 ELSE 0 END) as blocked_requests
         FROM request_logs
         WHERE ip_address IS NOT NULL
         GROUP BY ip_address
         ORDER BY total_requests DESC
         LIMIT $1`,
        [limit]
      );

      // Top API keys by request count
      const keyResult = await query(
        `SELECT 
           ak.name as key_name,
           ak.key,
           COUNT(*) as total_requests,
           SUM(CASE WHEN rl.was_blocked THEN 1 ELSE 0 END) as blocked_requests
         FROM request_logs rl
         JOIN api_keys ak ON rl.api_key_id = ak.id
         GROUP BY ak.id, ak.name, ak.key
         ORDER BY total_requests DESC
         LIMIT $1`,
        [limit]
      );

      res.status(200).json({
        success: true,
        data: {
          top_ips: ipResult.rows.map(row => ({
            ip_address: row.ip_address,
            total_requests: parseInt(row.total_requests),
            blocked_requests: parseInt(row.blocked_requests),
          })),
          top_api_keys: keyResult.rows.map(row => ({
            key_name: row.key_name,
            total_requests: parseInt(row.total_requests),
            blocked_requests: parseInt(row.blocked_requests),
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching top users:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top users',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // GET /api/v1/metrics/algorithms
  // Breakdown of requests by algorithm
  async getAlgorithmStats(req, res) {
    try {
      const result = await query(
        `SELECT 
           algorithm_used,
           COUNT(*) as total_requests,
           SUM(CASE WHEN was_blocked THEN 1 ELSE 0 END) as blocked_requests,
           SUM(CASE WHEN NOT was_blocked THEN 1 ELSE 0 END) as allowed_requests,
           ROUND(
             SUM(CASE WHEN was_blocked THEN 1 ELSE 0 END)::numeric / 
             COUNT(*)::numeric * 100, 2
           ) as block_rate_percent
         FROM request_logs
         WHERE algorithm_used IS NOT NULL
         GROUP BY algorithm_used
         ORDER BY total_requests DESC`
      );

      res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows.map(row => ({
          algorithm: row.algorithm_used,
          total_requests: parseInt(row.total_requests),
          blocked_requests: parseInt(row.blocked_requests),
          allowed_requests: parseInt(row.allowed_requests),
          block_rate_percent: parseFloat(row.block_rate_percent),
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Error fetching algorithm stats:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch algorithm stats',
        timestamp: new Date().toISOString(),
      });
    }
  },
};

module.exports = MetricsController;