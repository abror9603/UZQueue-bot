const userService = require('../services/userService');
const stateService = require('../services/stateService');
const appealHandlers = require('./appealHandlers');
const commandHandlers = require('./commandHandlers');
const Keyboard = require('../utils/keyboard');
const i18next = require('../config/i18n');

class MessageHandlers {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Get or create user
    const user = await userService.getOrCreateUser(msg.from);
    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Handle text messages
    if (msg.text) {
      const text = msg.text.trim();

      // Check for main menu commands (multi-language)
      if (text === '📝 Yangi murojaat' || text === '📝 Новое обращение' || text === '📝 New Appeal') {
        await appealHandlers.handleNewAppeal(bot, msg);
        return;
      }

      if (text === '📊 Murojaat holati' || text === '📊 Статус обращения' || text === '📊 Appeal Status') {
        await commandHandlers.handleStatus(bot, msg);
        return;
      }

      if (text === '🌐 Til' || text === '🌐 Язык' || text === '🌐 Language') {
        await commandHandlers.handleLanguage(bot, msg);
        return;
      }

      if (text === 'ℹ️ Yordam' || text === 'ℹ️ Помощь' || text === 'ℹ️ Help') {
        await commandHandlers.handleHelp(bot, msg);
        return;
      }

      // Check current step
      const step = await stateService.getStep(userId);
      
      if (step && step.startsWith('waiting_')) {
        // Handle status appeal ID input
        if (step === 'waiting_appeal_id') {
          await commandHandlers.handleStatus(bot, msg, text);
          await stateService.setStep(userId, null);
          return;
        }
      }

      // Process appeal flow
      if (step) {
        await appealHandlers.processAppealStep(bot, msg);
        return;
      }

      // Default response
      await bot.sendMessage(chatId, t('help'), Keyboard.getMainMenu(language));
    }

    // Handle photos/documents in appeal flow
    if (msg.photo || msg.document) {
      const step = await stateService.getStep(userId);
      if (step === 'upload_file') {
        await appealHandlers.processAppealStep(bot, msg);
      }
    }
  }
}

module.exports = new MessageHandlers();

