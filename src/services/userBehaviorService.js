const { Appeal } = require('../models');
const spamProtectionService = require('./spamProtectionService');

/**
 * User Behavior Tracking Service
 * Tracks user behavior and calculates internal rating
 */
class UserBehaviorService {
  /**
   * Get user behavior rating
   * @param {Number} userId - User ID
   * @returns {Object} { rating: number, level: string, stats: object }
   */
  async getUserRating(userId) {
    try {
      const stats = await spamProtectionService.getUserStats(userId);
      
      // Calculate rating (0-100)
      let rating = 100;

      // Deduct points for rejected appeals
      rating -= stats.rejectionRate * 0.5; // Max -50 points

      // Deduct points for too many appeals in 24h
      if (stats.appealsLast24h > 5) {
        rating -= (stats.appealsLast24h - 5) * 5; // -5 points per extra appeal
      }

      // Deduct points for high rejection rate
      if (stats.rejectionRate > 50) {
        rating -= 20; // Additional penalty
      }

      // Ensure rating is between 0 and 100
      rating = Math.max(0, Math.min(100, rating));

      // Determine level
      let level = 'excellent';
      if (rating < 30) level = 'poor';
      else if (rating < 50) level = 'fair';
      else if (rating < 70) level = 'good';
      else if (rating < 90) level = 'very_good';

      return {
        rating: Math.round(rating),
        level,
        stats: {
          totalAppeals: stats.totalAppeals,
          rejectedAppeals: stats.rejectedAppeals,
          appealsLast24h: stats.appealsLast24h,
          rejectionRate: Math.round(stats.rejectionRate * 10) / 10
        }
      };
    } catch (error) {
      console.error('Get user rating error:', error);
      return {
        rating: 100,
        level: 'excellent',
        stats: {
          totalAppeals: 0,
          rejectedAppeals: 0,
          appealsLast24h: 0,
          rejectionRate: 0
        }
      };
    }
  }

  /**
   * Log user behavior event
   * @param {Number} userId - User ID
   * @param {String} eventType - Event type (appeal_submitted, appeal_rejected, etc.)
   * @param {Object} metadata - Additional metadata
   */
  async logBehavior(userId, eventType, metadata = {}) {
    try {
      // Store in Redis for quick access
      const key = `behavior:${userId}:${eventType}`;
      const timestamp = Date.now();
      
      await require('../config/redis').setEx(
        key,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify({
          timestamp,
          eventType,
          metadata
        })
      );

      // Could also store in database if needed
    } catch (error) {
      console.error('Log behavior error:', error);
    }
  }

  /**
   * Check if user should be subject to stricter moderation
   * @param {Number} userId - User ID
   * @returns {Boolean}
   */
  async requiresStrictModeration(userId) {
    try {
      const rating = await this.getUserRating(userId);
      return rating < 50; // Users with rating below 50 require strict moderation
    } catch (error) {
      console.error('Check strict moderation error:', error);
      return false;
    }
  }
}

module.exports = new UserBehaviorService();

