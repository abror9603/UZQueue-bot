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

  static getRegionsInline(regions, language = 'uz') {
    const buttons = regions.map(region => [{
      text: region.name,
      callback_data: `region_${region.id}`
    }]);
    
    // Add cancel button
    buttons.push([{
      text: language === 'ru' ? '❌ Отмена' : language === 'en' ? '❌ Cancel' : '❌ Bekor qilish',
      callback_data: 'cancel_appeal'
    }]);
    
    return {
      reply_markup: {
        inline_keyboard: buttons
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

  static getDistrictsInline(districts, language = 'uz', regionId) {
    const buttons = districts.map(district => [{
      text: district.name,
      callback_data: `district_${district.id}_${regionId}`
    }]);
    
    // Add back and cancel buttons
    buttons.push([
      {
        text: language === 'ru' ? '◀️ Назад' : language === 'en' ? '◀️ Back' : '◀️ Orqaga',
        callback_data: 'back_to_regions'
      },
      {
        text: language === 'ru' ? '❌ Отмена' : language === 'en' ? '❌ Cancel' : '❌ Bekor qilish',
        callback_data: 'cancel_appeal'
      }
    ]);
    
    return {
      reply_markup: {
        inline_keyboard: buttons
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

  static getNeighborhoodsInline(neighborhoods, language = 'uz', regionId, districtId) {
    const buttons = neighborhoods.map(neighborhood => [{
      text: neighborhood.name,
      callback_data: `neighborhood_${neighborhood.id}_${regionId}_${districtId}`
    }]);
    
    // Add skip option if there are neighborhoods
    if (neighborhoods.length > 0) {
      buttons.push([{
        text: language === 'ru' ? '⏭ Пропустить' : language === 'en' ? '⏭ Skip' : '⏭ O\'tkazib yuborish',
        callback_data: `skip_neighborhood_${regionId}_${districtId}`
      }]);
    }
    
    // Add back and cancel buttons
    buttons.push([
      {
        text: language === 'ru' ? '◀️ Назад' : language === 'en' ? '◀️ Back' : '◀️ Orqaga',
        callback_data: `back_to_districts_${regionId}`
      },
      {
        text: language === 'ru' ? '❌ Отмена' : language === 'en' ? '❌ Cancel' : '❌ Bekor qilish',
        callback_data: 'cancel_appeal'
      }
    ]);
    
    return {
      reply_markup: {
        inline_keyboard: buttons
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

