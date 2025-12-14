const i18next = require('../config/i18n');

class Keyboard {
  static getLanguageSelection() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇺🇿 O\'zbek', callback_data: 'lang_uz' }],
          [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }]
        ]
      }
    };
  }

  static getMainMenu(language = 'uz') {
    i18next.changeLanguage(language);
    
    const menus = {
      uz: [
        [{ text: '📝 Yangi murojaat' }],
        [{ text: '📊 Murojaat holati' }],
        [{ text: '🌐 Til' }, { text: 'ℹ️ Yordam' }]
      ],
      ru: [
        [{ text: '📝 Новое обращение' }],
        [{ text: '📊 Статус обращения' }],
        [{ text: '🌐 Язык' }, { text: 'ℹ️ Помощь' }]
      ],
      en: [
        [{ text: '📝 New Appeal' }],
        [{ text: '📊 Appeal Status' }],
        [{ text: '🌐 Language' }, { text: 'ℹ️ Help' }]
      ]
    };
    
    return {
      reply_markup: {
        keyboard: menus[language] || menus.uz,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getRegions(regions, language = 'uz') {
    const buttons = regions.map(region => [{ text: region.name }]);
    buttons.push([{ text: '❌ Bekor qilish' }]);
    
    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getDistricts(districts, language = 'uz') {
    const buttons = districts.map(district => [{ text: district.name }]);
    buttons.push([{ text: '◀️ Orqaga' }, { text: '❌ Bekor qilish' }]);
    
    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getNeighborhoods(neighborhoods, language = 'uz') {
    const buttons = neighborhoods.map(neighborhood => [{ text: neighborhood.name }]);
    buttons.push([{ text: '◀️ Orqaga' }, { text: '❌ Bekor qilish' }]);
    
    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getOrganizations(organizations, language = 'uz') {
    const buttons = organizations.map(org => [{ text: org.name }]);
    buttons.push([{ text: '◀️ Orqaga' }, { text: '❌ Bekor qilish' }]);
    
    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getConfirmCancel(language = 'uz') {
    i18next.changeLanguage(language);
    const t = i18next.t;
    
    return {
      reply_markup: {
        keyboard: [
          [{ text: t('confirm') }, { text: t('cancel') }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getBackCancel(language = 'uz') {
    i18next.changeLanguage(language);
    const t = i18next.t;
    
    return {
      reply_markup: {
        keyboard: [
          [{ text: t('back') }, { text: t('cancel') }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }

  static getSkipCancel(language = 'uz') {
    i18next.changeLanguage(language);
    const t = i18next.t;
    
    return {
      reply_markup: {
        keyboard: [
          [{ text: t('skip') }, { text: t('cancel') }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }
}

module.exports = Keyboard;

