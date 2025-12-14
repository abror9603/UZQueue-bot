const { User } = require('../models');

class UserService {
  async getOrCreateUser(telegramUser) {
    let user = await User.findOne({ where: { telegramId: telegramUser.id } });
    
    if (!user) {
      user = await User.create({
        id: telegramUser.id,
        telegramId: telegramUser.id,
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        language: 'uz'
      });
    } else {
      // Update user info if changed
      await user.update({
        username: telegramUser.username || user.username,
        firstName: telegramUser.first_name || user.firstName,
        lastName: telegramUser.last_name || user.lastName
      });
    }
    
    return user;
  }

  async getUser(telegramId) {
    return await User.findOne({ where: { telegramId } });
  }

  async updateLanguage(telegramId, language) {
    const user = await User.findOne({ where: { telegramId } });
    if (user) {
      await user.update({ language });
    }
    return user;
  }

  async updatePhone(telegramId, phone) {
    const user = await User.findOne({ where: { telegramId } });
    if (user) {
      await user.update({ phone });
    }
    return user;
  }
}

module.exports = new UserService();

