const { User } = require('../models');
const stateService = require('./stateService');

class UserService {
  async getOrCreateUser(telegramUser) {
    try {
      let user = await User.findByPk(telegramUser.id);
      
      if (!user) {
        user = await User.create({
          id: telegramUser.id,
          telegramId: telegramUser.id,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          language: 'uz'
        });
      } else {
        // Update user info if changed
        await user.update({
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  async updateLanguage(userId, language) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({ language });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating language:', error);
      return false;
    }
  }

  async updateUserStep(userId, step, section = null) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({
          currentStep: step,
          currentSection: section
        });
      }
      // Also update in Redis for fast access
      await stateService.setStep(userId, step);
      if (section) {
        await stateService.setSection(userId, section);
      }
    } catch (error) {
      console.error('Error updating user step:', error);
    }
  }

  async getUserLanguage(userId) {
    try {
      const user = await User.findByPk(userId);
      return user ? user.language : 'uz';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'uz';
    }
  }
}

module.exports = new UserService();

