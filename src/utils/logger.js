// src/utils/logger.js
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple console logger with timestamps
const logger = {
  info: (message, meta = '') => {
    console.log(`[${new Date().toISOString()}] [INFO]  ${message}`, meta);
  },
  warn: (message, meta = '') => {
    console.warn(`[${new Date().toISOString()}] [WARN]  ${message}`, meta);
  },
  error: (message, meta = '') => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, meta);
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta);
    }
  },
};

// Morgan HTTP request logger stream (pipes into our logger)
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }
);

module.exports = { logger, morganMiddleware };