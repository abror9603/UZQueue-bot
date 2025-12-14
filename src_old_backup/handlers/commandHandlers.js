const userService = require('../services/userService');
const stateService = require('../services/stateService');
const i18n = require('../config/i18n');
const Keyboard = require('../utils/keyboard');

class CommandHandlers {
  async handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const user = msg.from;

    // Get or create user
    await userService.getOrCreateUser(user);
    const language = await userService.getUserLanguage(user.id);
    i18n.changeLanguage(language);

    // Clear any existing state
    await stateService.clearState(user.id);

    const welcomeText = i18n.t('welcome');
    const keyboard = Keyboard.getMainMenu(language);

    await bot.sendMessage(chatId, welcomeText, keyboard);
  }

  async handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    const user = msg.from;
    const language = await userService.getUserLanguage(user.id);
    i18n.changeLanguage(language);

    const helpText = language === 'uz' 
      ? 'Yordam kerakmi? Quyidagi funksiyalardan foydalanishingiz mumkin:\n\n' +
        '🤖 Aqlli yo\'naltirish - muammoingizga mos idora va bo\'limni topish\n' +
        '📄 Hujjat yordamchisi - ariza va hujjatlar tayyorlash\n' +
        '🎤 Ovozli yordamchi - ovoz orqali murojaat qilish\n' +
        '📋 Navbat bron qilish - eng qulay vaqt va filialni tanlash\n' +
        '📸 Hujjat tahlili - rasmdan ma\'lumotlarni olish\n' +
        '📊 Murojaatni kuzatish - murojaatingiz holatini ko\'rish'
      : language === 'ru'
      ? 'Нужна помощь? Вы можете использовать следующие функции:\n\n' +
        '🤖 Умная маршрутизация - найти подходящую организацию и отдел\n' +
        '📄 Помощник по документам - подготовка заявлений и документов\n' +
        '🎤 Голосовой помощник - обращение через голос\n' +
        '📋 Бронирование очереди - выбор удобного времени и филиала\n' +
        '📸 Анализ документа - извлечение информации из фото\n' +
        '📊 Отслеживание заявки - просмотр статуса вашей заявки'
      : 'Need help? You can use the following features:\n\n' +
        '🤖 Smart Routing - find the right organization and department\n' +
        '📄 Document Assistant - prepare applications and documents\n' +
        '🎤 Voice Assistant - submit requests via voice\n' +
        '📋 Queue Booking - choose convenient time and branch\n' +
        '📸 Document Recognition - extract information from photos\n' +
        '📊 Track Application - view your application status';

    await bot.sendMessage(chatId, helpText, Keyboard.getMainMenu(language));
  }

  async handleSettings(bot, msg) {
    const chatId = msg.chat.id;
    const user = msg.from;
    const language = await userService.getUserLanguage(user.id);
    i18n.changeLanguage(language);

    const settingsText = i18n.t('settings.current_language') + ': ' + 
      (language === 'uz' ? 'O\'zbek' : language === 'ru' ? 'Русский' : 'English');
    
    const keyboard = Keyboard.getLanguageKeyboard(language);

    await bot.sendMessage(chatId, settingsText, keyboard);
  }
}

module.exports = new CommandHandlers();

