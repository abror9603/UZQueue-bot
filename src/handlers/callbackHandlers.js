const userService = require('../services/userService');
const stateService = require('../services/stateService');
const queueService = require('../services/queueService');
const i18n = require('../config/i18n');
const Keyboard = require('../utils/keyboard');

class CallbackHandlers {
  async handleCallback(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Answer callback query immediately
    await bot.answerCallbackQuery(callbackQuery.id);

    // Get user language
    const language = await userService.getUserLanguage(userId);
    i18n.changeLanguage(language);

    // Handle language selection
    if (data.startsWith('lang_')) {
      await this.handleLanguageChange(bot, msg, userId, data);
    }
    // Handle queue slot selection
    else if (data.startsWith('slot_')) {
      await this.handleSlotSelection(bot, msg, userId, data, language);
    }
  }

  async handleLanguageChange(bot, msg, userId, data) {
    const chatId = msg.chat.id;
    const langCode = data.split('_')[1]; // uz, ru, or en

    if (!['uz', 'ru', 'en'].includes(langCode)) {
      return;
    }

    try {
      await userService.updateLanguage(userId, langCode);
      i18n.changeLanguage(langCode);

      const langName = langCode === 'uz' ? 'O\'zbek' : langCode === 'ru' ? 'Русский' : 'English';
      const message = `${i18n.t('settings.language_changed')}: ${langName}`;

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: Keyboard.getLanguageKeyboard(langCode).reply_markup
      });

      // Send main menu after a short delay
      setTimeout(async () => {
        await bot.sendMessage(chatId, i18n.t('menu.main'), Keyboard.getMainMenu(langCode));
      }, 1000);
    } catch (error) {
      console.error('Error changing language:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  async handleSlotSelection(bot, msg, userId, data, language) {
    const chatId = msg.chat.id;
    i18n.changeLanguage(language);

    try {
      const slotIndex = parseInt(data.split('_')[1]) - 1;
      const slots = await stateService.getData(userId, 'available_slots');

      if (!slots || !slots[slotIndex]) {
        await bot.sendMessage(chatId, i18n.t('common.error'));
        return;
      }

      const selectedSlot = slots[slotIndex];
      
      // Book the queue
      const queue = await queueService.bookQueue(userId, {
        organization: 'Demo Organization',
        department: 'Demo Department',
        branch: selectedSlot.branch,
        date: selectedSlot.date,
        time: selectedSlot.time,
        queueNumber: selectedSlot.queueNumber,
        distance: selectedSlot.distance
      });

      let response = `${i18n.t('queue.booking_success')}\n\n`;
      response += `🎫 ${i18n.t('queue.queue_number')}: ${queue.queueNumber}\n`;
      response += `📅 ${i18n.t('queue.date')}: ${selectedSlot.date}\n`;
      response += `🕐 ${i18n.t('queue.time')}: ${selectedSlot.time}\n`;
      response += `📍 ${i18n.t('queue.branch')}: ${selectedSlot.branch}`;

      await bot.sendMessage(chatId, response, Keyboard.getMainMenu(language));
      await stateService.clearState(userId);
      await userService.updateUserStep(userId, null, null);
    } catch (error) {
      console.error('Error booking slot:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }
}

module.exports = new CallbackHandlers();

