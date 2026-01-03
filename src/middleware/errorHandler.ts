/**
 * Error Handler Middleware
 * Centralized error handling for the bot
 */

import { Context } from 'telegraf';
import { ExtendedContext } from '../types/context';
import { AppError, ValidationError, DatabaseError, AIError } from '../types';
import { ERROR_MESSAGES } from '../config/constants';
import { log } from '../utils/logger';
import { SystemLog } from '../models';

/**
 * Global error handler for Telegraf bot
 * 
 * CRITICAL: Must handle cases where ctx might be undefined or incomplete
 */
export function errorHandler(err: unknown, ctx?: ExtendedContext) {
  // Convert unknown error to Error
  const error = err instanceof Error ? err : new Error(String(err));
  // Defensive check: Handle undefined context
  if (!ctx) {
    log.error('Bot error occurred (no context)', error);
    return;
  }

  const language = ctx.language || 'uz';
  const userId = ctx.from?.id;
  const updateType = ctx.updateType || 'unknown';
  const chatId = ctx.chat?.id;

  // Log error
  log.error('Bot error occurred', error, {
    userId,
    updateType,
    chatId
  });

  // Log to database
  SystemLog.logEvent('error', 'bot_error', {
    error: error.message,
    stack: error.stack,
    updateType: ctx.updateType
  }, {
    userId,
    result: 'failure',
    errorMessage: error.message
  }).catch(logError => {
    log.error('Failed to log error to database', logError);
  });

  // Determine error message based on error type
  let message: string;

  if (error instanceof ValidationError) {
    message = ERROR_MESSAGES[language].validation || ERROR_MESSAGES.uz.validation;
  } else if (error instanceof DatabaseError) {
    message = ERROR_MESSAGES[language].database || ERROR_MESSAGES.uz.database;
  } else if (error instanceof AIError) {
    message = ERROR_MESSAGES[language].ai || ERROR_MESSAGES.uz.ai;
  } else if (error instanceof AppError) {
    message = error.message;
  } else {
    message = ERROR_MESSAGES[language].unknown || ERROR_MESSAGES.uz.unknown;
  }

  // Send user-friendly error message (only if context supports replies)
  if (ctx.chat && ctx.from) {
    ctx.reply(`❌ ${message}`).catch(sendError => {
      log.error('Failed to send error message to user', sendError);
    });
  }
}

/**
 * Async error wrapper for handlers
 */
export function asyncHandler(
  fn: (ctx: ExtendedContext) => Promise<void>
) {
  return async (ctx: ExtendedContext) => {
    try {
      await fn(ctx);
    } catch (error) {
      errorHandler(error, ctx);
    }
  };
}

/**
 * Try-catch wrapper for promises
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    log.error(errorMessage, error);
    return null;
  }
}

