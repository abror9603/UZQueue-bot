const redisClient = require('../config/redis');

class StateService {
  async setStep(userId, step) {
    const key = `user:${userId}:step`;
    if (!step) {
      await redisClient.del(key);
    } else {
      await redisClient.setEx(key, 3600, step.toString()); // 1 hour TTL
    }
  }

  async getStep(userId) {
    const key = `user:${userId}:step`;
    const step = await redisClient.get(key);
    return step || null;
  }

  async setData(userId, data) {
    const key = `user:${userId}:data`;
    await redisClient.setEx(key, 3600, JSON.stringify(data));
  }

  async getData(userId) {
    const key = `user:${userId}:data`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async clear(userId) {
    const keys = [`user:${userId}:step`, `user:${userId}:data`];
    for (const key of keys) {
      await redisClient.del(key);
    }
  }
}

module.exports = new StateService();

