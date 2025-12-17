const redisClient = require('../config/redis');
const { Appeal } = require('../models');

/**
 * Spam Protection Service
 * Implements rate limiting and abuse protection
 */
class SpamProtectionService {
  /**
   * Check rate limit for user
   * @param {Number} userId - User ID
   * @param {Number} maxRequests - Maximum requests allowed
   * @param {Number} windowMinutes - Time window in minutes
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
   */
  async checkRateLimit(userId, maxRequests = 2, windowMinutes = 60) {
    const key = `rate_limit:${userId}`;
    const windowSeconds = windowMinutes * 60;

    try {
      const current = await redisClient.get(key);
      
      if (!current) {
        // First request in window
        await redisClient.setEx(key, windowSeconds, '1');
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: new Date(Date.now() + windowSeconds * 1000)
        };
      }

      const count = parseInt(current);
      
      if (count >= maxRequests) {
        const ttl = await redisClient.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Date.now() + ttl * 1000)
        };
      }

      // Increment counter
      await redisClient.incr(key);
      const newCount = count + 1;
      const ttl = await redisClient.ttl(key);
      
      return {
        allowed: true,
        remaining: maxRequests - newCount,
        resetAt: new Date(Date.now() + ttl * 1000)
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowSeconds * 1000)
      };
    }
  }

  /**
   * Record appeal submission
   * @param {Number} userId - User ID
   */
  async recordAppeal(userId) {
    const key = `rate_limit:${userId}`;
    const windowSeconds = 10 * 60; // 10 minutes

    try {
      const current = await redisClient.get(key);
      if (current) {
        await redisClient.incr(key);
      } else {
        await redisClient.setEx(key, windowSeconds, '1');
      }
    } catch (error) {
      console.error('Record appeal error:', error);
    }
  }

  /**
   * Check if user is temporarily blocked
   * @param {Number} userId - User ID
   * @returns {Object} { blocked: boolean, unblockAt: Date|null }
   */
  async checkBlocked(userId) {
    const key = `blocked:${userId}`;
    
    try {
      const blocked = await redisClient.get(key);
      if (blocked) {
        const ttl = await redisClient.ttl(key);
        return {
          blocked: true,
          unblockAt: new Date(Date.now() + ttl * 1000)
        };
      }
      return { blocked: false, unblockAt: null };
    } catch (error) {
      console.error('Check blocked error:', error);
      return { blocked: false, unblockAt: null };
    }
  }

  /**
   * Block user temporarily
   * @param {Number} userId - User ID
   * @param {Number} hours - Hours to block (default 24)
   */
  async blockUser(userId, hours = 24) {
    const key = `blocked:${userId}`;
    const seconds = hours * 60 * 60;

    try {
      await redisClient.setEx(key, seconds, '1');
    } catch (error) {
      console.error('Block user error:', error);
    }
  }

  /**
   * Get user appeal statistics
   * @param {Number} userId - User ID
   * @returns {Object} Statistics
   */
  async getUserStats(userId) {
    try {
      const total = await Appeal.count({
        where: { userId }
      });

      const rejected = await Appeal.count({
        where: {
          userId,
          status: 'rejected'
        }
      });

      const last24h = await Appeal.count({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      return {
        totalAppeals: total,
        rejectedAppeals: rejected,
        appealsLast24h: last24h,
        rejectionRate: total > 0 ? (rejected / total) * 100 : 0
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        totalAppeals: 0,
        rejectedAppeals: 0,
        appealsLast24h: 0,
        rejectionRate: 0
      };
    }
  }
}

module.exports = new SpamProtectionService();

