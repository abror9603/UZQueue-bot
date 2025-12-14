// Usage Tracking Service
// Tracks user usage for free tier limits

const { User } = require("../models");
const redisClient = require("../config/redis");

class UsageTrackingService {
  /**
   * Get user usage for today
   */
  async getUserUsage(userId, feature) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `usage:${userId}:${feature}:${today}`;
      const count = await redisClient.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      console.error("Error getting user usage:", error);
      return 0;
    }
  }

  /**
   * Increment user usage
   */
  async incrementUsage(userId, feature) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `usage:${userId}:${feature}:${today}`;
      const count = await redisClient.incr(key);
      
      // Set expiration to end of day
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const secondsUntilEndOfDay = Math.floor((endOfDay - now) / 1000);
      await redisClient.expire(key, secondsUntilEndOfDay);
      
      return count;
    } catch (error) {
      console.error("Error incrementing usage:", error);
      return 0;
    }
  }

  /**
   * Check if user can use feature (free tier)
   */
  async canUseFeature(userId, feature, limit) {
    try {
      // Check if user has premium subscription
      const user = await User.findOne({ where: { telegramId: userId } });
      if (user && user.subscriptionType === "premium") {
        return { allowed: true, reason: "premium" };
      }

      // Check daily limit
      const usage = await this.getUserUsage(userId, feature);
      if (usage >= limit) {
        return {
          allowed: false,
          reason: "limit_reached",
          usage,
          limit,
        };
      }

      return { allowed: true, reason: "free", usage, limit };
    } catch (error) {
      console.error("Error checking feature usage:", error);
      return { allowed: false, reason: "error" };
    }
  }

  /**
   * Get usage stats for user
   */
  async getUserStats(userId) {
    try {
      const features = [
        "aiAdvice",
        "documentText",
        "voiceToText",
        "documentPdf",
        "documentCheck",
      ];

      const stats = {};
      for (const feature of features) {
        stats[feature] = await this.getUserUsage(userId, feature);
      }

      return stats;
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {};
    }
  }

  /**
   * Reset daily usage (for testing or admin)
   */
  async resetUsage(userId, feature) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `usage:${userId}:${feature}:${today}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error("Error resetting usage:", error);
      return false;
    }
  }
}

module.exports = new UsageTrackingService();

