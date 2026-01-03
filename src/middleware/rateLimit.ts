/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per user
 */

import { Context } from 'telegraf';
import { RATE_LIMIT } from '../config/constants';
import { log } from '../utils/logger';

interface UserRequest {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private userLimits = new Map<number, UserRequest[]>();
  private readonly windowMs: number = 60 * 60 * 1000; // 1 hour
  private readonly maxRequests: number = RATE_LIMIT.REQUESTS_PER_HOUR;

  /**
   * Check if user has exceeded rate limit
   */
  checkLimit(userId: number): boolean {
    const now = Date.now();
    const userRequests = this.userLimits.get(userId) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      req => now - req.timestamp < this.windowMs
    );

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      log.warn('Rate limit exceeded', { userId, count: recentRequests.length });
      return false;
    }

    // Add current request
    recentRequests.push({ timestamp: now, count: 1 });
    this.userLimits.set(userId, recentRequests);

    return true;
  }

  /**
   * Get remaining requests for user
   */
  getRemaining(userId: number): number {
    const now = Date.now();
    const userRequests = this.userLimits.get(userId) || [];
    const recentRequests = userRequests.filter(
      req => now - req.timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Reset user's rate limit (for testing or admin actions)
   */
  reset(userId: number): void {
    this.userLimits.delete(userId);
  }

  /**
   * Clean up old entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, requests] of this.userLimits.entries()) {
      const recentRequests = requests.filter(
        req => now - req.timestamp < this.windowMs
      );
      
      if (recentRequests.length === 0) {
        this.userLimits.delete(userId);
      } else {
        this.userLimits.set(userId, recentRequests);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Cleanup every 30 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 30 * 60 * 1000);

/**
 * Rate limiting middleware for Telegraf
 */
export function rateLimitMiddleware() {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Defensive check: Only rate limit updates with user information
    if (!ctx || !ctx.from || !ctx.from.id) {
      return next();
    }

    try {
      const userId = ctx.from.id;

      if (!rateLimiter.checkLimit(userId)) {
        const remaining = rateLimiter.getRemaining(userId);
        const language = (ctx as any).language || 'uz';
        
        const messages = {
          uz: `⚠️ Juda ko'p so'rov yuborildi. Iltimos, ${Math.ceil(60 - (Date.now() % 3600000) / 60000)} daqiqa kuting.`,
          ru: `⚠️ Слишком много запросов. Пожалуйста, подождите ${Math.ceil(60 - (Date.now() % 3600000) / 60000)} минут.`,
          en: `⚠️ Too many requests. Please wait ${Math.ceil(60 - (Date.now() % 3600000) / 60000)} minutes.`
        };

        await ctx.reply(messages[language as keyof typeof messages] || messages.uz).catch(() => {});
        return;
      }

      return next();
    } catch (error) {
      // Don't break request flow on rate limit errors
      log.error('Rate limit middleware error', error);
      return next();
    }
  };
}

export { rateLimiter };

