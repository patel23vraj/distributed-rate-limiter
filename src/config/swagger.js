// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Distributed Rate Limiter API',
      version: '1.0.0',
      description: `
A production-grade Distributed Rate Limiter REST API built with Node.js, Express, PostgreSQL, and Redis.

## Features
- Four rate limiting algorithms: Fixed Window, Sliding Window, Token Bucket, Leaky Bucket
- Per-user and per-IP rate limiting
- API key authentication
- Real-time metrics and monitoring
- Fully containerized with Docker

## Authentication
Some endpoints require an API key. Pass it in the \`X-API-Key\` header:
\`\`\`
X-API-Key: rl_your_api_key_here
\`\`\`
      `,
      contact: {
        name: 'Vraj Patel',
        url: 'https://github.com/YOUR_USERNAME/distributed-rate-limiter',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'vrajpatel' },
            email: { type: 'string', example: 'vraj@example.com' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            key: { type: 'string', example: 'rl_abc123...' },
            name: { type: 'string', example: 'My First Key' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            expires_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        RateLimitConfig: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'strict' },
            algorithm: {
              type: 'string',
              enum: ['fixed_window', 'sliding_window', 'token_bucket', 'leaky_bucket'],
            },
            max_requests: { type: 'integer', example: 100 },
            window_size_seconds: { type: 'integer', example: 60 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  // Tell swagger-jsdoc where to find the JSDoc comments
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;