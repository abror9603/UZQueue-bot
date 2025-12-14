const userService = require('../services/userService');
const Keyboard = require('../utils/keyboard');
const i18next = require('../config/i18n');
const appealHandlers = require('./appealHandlers');

class CallbackHandlers {
  async handleCallback(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Handle language selection
    if (data.startsWith('lang_')) {
      const langCode = data.replace('lang_', '');
      await this.handleLanguageChange(bot, msg, userId, langCode);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }
  }

  async handleLanguageChange(bot, msg, userId, langCode) {
    const chatId = msg.chat.id;

    if (!['uz', 'ru', 'en'].includes(langCode)) {
      return;
    }

    await userService.updateLanguage(userId, langCode);
    i18next.changeLanguage(langCode);
    const t = i18next.t;

    await bot.sendMessage(chatId, t('language_selected'), Keyboard.getMainMenu(langCode));
  }
}

module.exports = new CallbackHandlers();

