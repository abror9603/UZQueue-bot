const userService = require('../services/userService');
const appealService = require('../services/appealService');
const stateService = require('../services/stateService');
const aiService = require('../services/aiService');
const locationService = require('../services/locationService');
const Keyboard = require('../utils/keyboard');
const i18next = require('../config/i18n');

class CommandHandlers {
  async handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Get or create user
    await userService.getOrCreateUser(msg.from);
    
    // Show language selection
    i18next.changeLanguage('uz');
    const t = i18next.t;
    
    await bot.sendMessage(
      chatId,
      t('welcome'),
      Keyboard.getLanguageSelection()
    );
  }

  async handleStatus(bot, msg, appealId) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = await userService.getUser(userId);
    if (!user) {
      await this.handleStart(bot, msg);
      return;
    }

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    if (!appealId) {
      await bot.sendMessage(chatId, t('enter_appeal_id'));
      await stateService.setStep(userId, 'waiting_appeal_id');
      return;
    }

    // Remove # if present
    appealId = appealId.replace('#', '');

    try {
      const appeal = await appealService.getAppealByAppealId(appealId);
      
      if (!appeal || appeal.userId !== userId) {
        await bot.sendMessage(chatId, t('appeal_not_found'));
        return;
      }

      const location = await locationService.getLocationString(
        appeal.regionId,
        appeal.districtId,
        appeal.neighborhoodId,
        language
      );

      const org = appeal.organization;
      const orgName = language === 'ru' ? org.nameRu : language === 'en' ? org.nameEn : org.nameUz;

      const statusTexts = {
        pending: t('status_pending'),
        completed: t('status_completed'),
        rejected: t('status_rejected')
      };

      const statusText = statusTexts[appeal.status] || appeal.status;

      const message = t('appeal_status', {
        appealId: appeal.appealId,
        location,
        organization: orgName,
        name: appeal.fullName,
        phone: appeal.phone,
        text: appeal.appealText.substring(0, 200) + (appeal.appealText.length > 200 ? '...' : ''),
        status: statusText,
        createdAt: new Date(appeal.createdAt).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US')
      });

      await bot.sendMessage(chatId, message);
      
      // Get AI-generated status response
      try {
        const aiResponse = await aiService.generateStatusResponse(appeal.status, appeal, language);
        await bot.sendMessage(chatId, t('ai_suggestion', { suggestion: aiResponse }));
      } catch (error) {
        console.error('AI response error:', error);
      }
    } catch (error) {
      console.error('Status error:', error);
      await bot.sendMessage(chatId, t('error'));
    }
  }

  async handleLanguage(bot, msg) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, 'Tilni tanlang:', Keyboard.getLanguageSelection());
  }

  async handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = await userService.getUser(userId);
    const language = user?.language || 'uz';
    i18next.changeLanguage(language);
    const t = i18next.t;

    await bot.sendMessage(chatId, t('help'));
  }

  async handleAdminStatus(bot, msg, appealId, newStatus) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const telegramGroupService = require('../services/telegramGroupService');
    const user = await userService.getUser(userId);
    const language = user?.language || 'uz';
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Check if user is admin in this group
    const isAdmin = await telegramGroupService.isAdmin(chatId, userId);
    if (!isAdmin) {
      await bot.sendMessage(chatId, t('error'));
      return;
    }

    if (!appealId || !newStatus) {
      await bot.sendMessage(chatId, 'Usage: /status <appeal_id> <pending|completed|rejected>');
      return;
    }

    try {
      appealId = appealId.replace('#', '');
      const appeal = await appealService.getAppealByAppealId(appealId);
      
      if (!appeal) {
        await bot.sendMessage(chatId, t('appeal_not_found'));
        return;
      }

      if (!['pending', 'completed', 'rejected'].includes(newStatus)) {
        await bot.sendMessage(chatId, 'Invalid status. Use: pending, completed, or rejected');
        return;
      }

      await appealService.updateStatus(appeal.id, newStatus, userId);

      // Notify citizen
      const citizenLanguage = user.language || 'uz';
      i18next.changeLanguage(citizenLanguage);
      const statusTexts = {
        pending: i18next.t('status_pending'),
        completed: i18next.t('status_completed'),
        rejected: i18next.t('status_rejected')
      };

      const notification = i18next.t('status_updated_notification', {
        appealId: appeal.appealId,
        status: statusTexts[newStatus]
      });

      await bot.sendMessage(appeal.userId, notification);

      await bot.sendMessage(chatId, t('admin_status_updated'));
    } catch (error) {
      console.error('Admin status error:', error);
      await bot.sendMessage(chatId, t('admin_status_error'));
    }
  }
}

module.exports = new CommandHandlers();

