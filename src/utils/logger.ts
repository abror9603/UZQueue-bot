/**
 * Winston logger configuration
 * Centralized logging for the entire application
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'uzqueue-bot' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// Helper methods for structured logging
export const log = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  error: (message: string, error?: Error | any, meta?: any) => {
    if (error instanceof Error) {
      logger.error(message, {
        ...meta,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      });
    } else {
      logger.error(message, { ...meta, error });
    }
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
  
  // Specialized loggers
  userAction: (userId: number, action: string, details?: any) => {
    logger.info('User action', {
      type: 'user_action',
      userId,
      action,
      ...details
    });
  },
  
  aiEvent: (event: string, details?: any) => {
    logger.info('AI event', {
      type: 'ai_event',
      event,
      ...details
    });
  },
  
  requestEvent: (requestId: string, event: string, details?: any) => {
    logger.info('Request event', {
      type: 'request_event',
      requestId,
      event,
      ...details
    });
  },
  
  databaseEvent: (event: string, details?: any) => {
    logger.info('Database event', {
      type: 'database_event',
      event,
      ...details
    });
  }
};

export default logger;

