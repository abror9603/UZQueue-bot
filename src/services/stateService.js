const redisClient = require("../config/redis");

class StateService {
  constructor() {
    this.STATE_PREFIX = "user:state:";
    this.STEP_PREFIX = "user:step:";
    this.SECTION_PREFIX = "user:section:";
    this.DATA_PREFIX = "user:data:";
  }

  // Set user state
  async setState(userId, state) {
    try {
      const userIdStr = String(userId);
      await redisClient.setEx(
        `${this.STATE_PREFIX}${userIdStr}`,
        3600, // 1 hour expiry
        JSON.stringify(state)
      );
    } catch (error) {
      console.error("Error setting user state:", error);
    }
  }

  // Get user state
  async getState(userId) {
    try {
      const userIdStr = String(userId);
      const state = await redisClient.get(`${this.STATE_PREFIX}${userIdStr}`);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error("Error getting user state:", error);
      return null;
    }
  }

  // Clear user state
  async clearState(userId) {
    try {
      const userIdStr = String(userId);
      await redisClient.del(`${this.STATE_PREFIX}${userIdStr}`);
      await redisClient.del(`${this.STEP_PREFIX}${userIdStr}`);
      await redisClient.del(`${this.SECTION_PREFIX}${userIdStr}`);
      await redisClient.del(`${this.DATA_PREFIX}${userIdStr}`);
    } catch (error) {
      console.error("Error clearing user state:", error);
    }
  }

  // Set current step
  async setStep(userId, step) {
    try {
      // Ensure userId is a string
      const userIdStr = String(userId);
      
      // Convert to string and handle null/undefined
      const stepValue = step ? String(step) : '';
      if (stepValue) {
        await redisClient.setEx(`${this.STEP_PREFIX}${userIdStr}`, 3600, stepValue);
      } else {
        // If step is null/undefined, delete the key instead
        await redisClient.del(`${this.STEP_PREFIX}${userIdStr}`);
      }
    } catch (error) {
      console.error("Error setting user step:", error);
    }
  }

  // Get current step
  async getStep(userId) {
    try {
      const userIdStr = String(userId);
      return await redisClient.get(`${this.STEP_PREFIX}${userIdStr}`);
    } catch (error) {
      console.error("Error getting user step:", error);
      return null;
    }
  }

  // Set current section
  async setSection(userId, section) {
    try {
      // Ensure userId is a string
      const userIdStr = String(userId);
      
      // Convert to string and handle null/undefined
      const sectionValue = section ? String(section) : '';
      if (sectionValue) {
        await redisClient.setEx(`${this.SECTION_PREFIX}${userIdStr}`, 3600, sectionValue);
      } else {
        // If section is null/undefined, delete the key instead
        await redisClient.del(`${this.SECTION_PREFIX}${userIdStr}`);
      }
    } catch (error) {
      console.error("Error setting user section:", error);
    }
  }

  // Get current section
  async getSection(userId) {
    try {
      const userIdStr = String(userId);
      return await redisClient.get(`${this.SECTION_PREFIX}${userIdStr}`);
    } catch (error) {
      console.error("Error getting user section:", error);
      return null;
    }
  }

  // Set user data (for multi-step flows)
  async setData(userId, key, value) {
    try {
      const userIdStr = String(userId);
      const dataKey = `${this.DATA_PREFIX}${userIdStr}:${key}`;
      await redisClient.setEx(dataKey, 3600, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting user data:", error);
    }
  }

  // Get user data
  async getData(userId, key) {
    try {
      const userIdStr = String(userId);
      const dataKey = `${this.DATA_PREFIX}${userIdStr}:${key}`;
      const data = await redisClient.get(dataKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  // Clear all user data
  async clearData(userId) {
    try {
      const userIdStr = String(userId);
      const pattern = `${this.DATA_PREFIX}${userIdStr}:*`;
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }
}

module.exports = new StateService();
