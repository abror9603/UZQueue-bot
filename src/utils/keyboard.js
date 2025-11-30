const i18n = require('../config/i18n');

class Keyboard {
  static getMainMenu(language = 'uz') {
    i18n.changeLanguage(language);
    return {
      reply_markup: {
        keyboard: [
          [{ text: i18n.t('menu.smart_routing') }],
          [{ text: i18n.t('menu.document_assistant') }, { text: i18n.t('menu.voice_assistant') }],
          [{ text: i18n.t('menu.queue_booking') }, { text: i18n.t('menu.document_recognition') }],
          [{ text: i18n.t('menu.track_application') }, { text: i18n.t('menu.settings') }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getLanguageKeyboard(language = 'uz') {
    i18n.changeLanguage(language);
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇺🇿 O\'zbek', callback_data: 'lang_uz' },
            { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
            { text: '🇬🇧 English', callback_data: 'lang_en' }
          ]
        ]
      }
    };
  }

  static getBackKeyboard(language = 'uz') {
    i18n.changeLanguage(language);
    return {
      reply_markup: {
        keyboard: [
          [{ text: i18n.t('common.back') }, { text: i18n.t('common.cancel') }]
        ],
        resize_keyboard: true
      }
    };
  }

  static getCancelKeyboard(language = 'uz') {
    i18n.changeLanguage(language);
    return {
      reply_markup: {
        keyboard: [
          [{ text: i18n.t('common.cancel') }]
        ],
        resize_keyboard: true
      }
    };
  }

  static removeKeyboard() {
    return {
      reply_markup: {
        remove_keyboard: true
      }
    };
  }
}

module.exports = Keyboard;

