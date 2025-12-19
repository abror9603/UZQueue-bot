const redisClient = require('../config/redis');

class StateService {
  // TTL: 30 minutes (1800 seconds) - if user doesn't continue within 30 minutes, state will expire
  static STATE_TTL_SECONDS = 30 * 60; // 30 minutes

  async setStep(userId, step) {
    const key = `user:${userId}:step`;
    if (!step) {
      await redisClient.del(key);
    } else {
      await redisClient.setEx(key, StateService.STATE_TTL_SECONDS, step.toString());
    }
  }

  async getStep(userId) {
    const key = `user:${userId}:step`;
    const step = await redisClient.get(key);
    return step || null;
  }

  async setData(userId, data) {
    const key = `user:${userId}:data`;
    await redisClient.setEx(key, StateService.STATE_TTL_SECONDS, JSON.stringify(data));
  }

  async getData(userId) {
    const key = `user:${userId}:data`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Check if user has active state (step or data exists)
   * @param {Number} userId - User ID
   * @returns {Boolean} true if state exists, false otherwise
   */
  async hasActiveState(userId) {
    const step = await this.getStep(userId);
    const data = await this.getData(userId);
    return !!(step || data);
  }

  async clear(userId) {
    const keys = [`user:${userId}:step`, `user:${userId}:data`];
    for (const key of keys) {
      await redisClient.del(key);
    }
  }
}

module.exports = new StateService();

