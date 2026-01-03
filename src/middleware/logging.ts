/**
 * Logging Middleware
 * Logs all bot interactions for debugging and analytics
 */

import { Context } from 'telegraf';
import { ExtendedContext } from '../types/context';
import { log } from '../utils/logger';

/**
 * Log all incoming updates
 * 
 * CRITICAL: This is the first middleware - must handle undefined context gracefully
 */
export function loggingMiddleware() {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    // Defensive check: Ensure context exists
    if (!ctx) {
      log.warn('loggingMiddleware: Context is undefined');
      return;
    }

    const start = Date.now();
    const updateType = ctx.updateType || 'unknown';
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    try {
      await next();
      
      const duration = Date.now() - start;
      
      log.debug('Update processed', {
        type: updateType,
        userId,
        chatId,
        duration: `${duration}ms`,
        success: true
      });
    } catch (error) {
      const duration = Date.now() - start;
      
      log.error('Update processing failed', error, {
        type: updateType,
        userId,
        chatId,
        duration: `${duration}ms`
      });
      
      throw error; // Re-throw to let error handler deal with it
    }
  };
}

/**
 * Log user actions specifically
 */
export function logUserAction(action: string) {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    if (ctx.from) {
      log.userAction(ctx.from.id, action, {
        chatId: ctx.chat?.id,
        updateType: ctx.updateType
      });
    }
    
    return next();
  };
}

