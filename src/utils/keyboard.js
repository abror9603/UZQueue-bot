const i18next = require("../config/i18n");

class Keyboard {
  static getLanguageSelection() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🇺🇿 O'zbek", callback_data: "lang_uz" }],
          [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
          [{ text: "🇬🇧 English", callback_data: "lang_en" }],
        ],
      },
    };
  }

  static getMainMenu(language = "uz") {
    i18next.changeLanguage(language);

    const menus = {
      uz: [
        [{ text: "📝 Yangi murojaat" }],
        [{ text: "📊 Murojaat holati" }],
        [{ text: "💎 Premium" }, { text: "🌐 Til" }],
        [{ text: "ℹ️ Yordam" }],
      ],
      ru: [
        [{ text: "📝 Новое обращение" }],
        [{ text: "📊 Статус обращения" }],
        [{ text: "💎 Премиум" }, { text: "🌐 Язык" }],
        [{ text: "ℹ️ Помощь" }],
      ],
      en: [
        [{ text: "📝 New Appeal" }],
        [{ text: "📊 Appeal Status" }],
        [{ text: "💎 Premium" }, { text: "🌐 Language" }],
        [{ text: "ℹ️ Help" }],
      ],
    };

    return {
      reply_markup: {
        keyboard: menus[language] || menus.uz,
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getRegions(regions, language = "uz") {
    const buttons = regions.map((region) => [{ text: region.name }]);
    buttons.push([{ text: "❌ Bekor qilish" }]);

    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getRegionsInline(regions, language = "uz") {
    const buttons = regions.map((region) => [
      {
        text: region.name,
        callback_data: `region_${region.id}`,
      },
    ]);

    // Add cancel button
    buttons.push([
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_appeal",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  static getDistricts(districts, language = "uz") {
    const buttons = districts.map((district) => [{ text: district.name }]);
    buttons.push([{ text: "◀️ Orqaga" }, { text: "❌ Bekor qilish" }]);

    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getDistrictsInline(
    districts,
    language = "uz",
    regionId,
    optional = false
  ) {
    const buttons = districts.map((district) => [
      {
        text: district.name,
        callback_data: `district_${district.id}_${regionId}`,
      },
    ]);

    // Add skip button if optional
    if (optional) {
      buttons.push([
        {
          text:
            language === "ru"
              ? "⏭ Пропустить"
              : language === "en"
              ? "⏭ Skip"
              : "⏭ O'tkazib yuborish",
          callback_data: `skip_district_${regionId}`,
        },
      ]);
    }

    // Add back and cancel buttons
    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: "back_to_regions",
      },
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_appeal",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  static getNeighborhoods(neighborhoods, language = "uz") {
    const buttons = neighborhoods.map((neighborhood) => [
      { text: neighborhood.name },
    ]);
    buttons.push([{ text: "◀️ Orqaga" }, { text: "❌ Bekor qilish" }]);

    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getNeighborhoodsInline(
    neighborhoods,
    language = "uz",
    regionId,
    districtId
  ) {
    const buttons = neighborhoods.map((neighborhood) => [
      {
        text: neighborhood.name,
        callback_data: `neighborhood_${neighborhood.id}_${regionId}_${districtId}`,
      },
    ]);

    // Add skip option if there are neighborhoods
    if (neighborhoods.length > 0) {
      buttons.push([
        {
          text:
            language === "ru"
              ? "⏭ Пропустить"
              : language === "en"
              ? "⏭ Skip"
              : "⏭ O'tkazib yuborish",
          callback_data: `skip_neighborhood_${regionId}_${districtId}`,
        },
      ]);
    }

    // Add back and cancel buttons
    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: `back_to_districts_${regionId}`,
      },
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_appeal",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  static getOrganizations(organizations, language = "uz") {
    const buttons = organizations.map((org) => [{ text: org.name }]);
    buttons.push([{ text: "◀️ Orqaga" }, { text: "❌ Bekor qilish" }]);

    return {
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getConfirmCancel(language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    return {
      reply_markup: {
        keyboard: [[{ text: t("confirm") }, { text: t("cancel") }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getBackCancel(language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    return {
      reply_markup: {
        keyboard: [[{ text: t("back") }, { text: t("cancel") }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  static getPhoneKeyboard(language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    return {
      reply_markup: {
        keyboard: [
          [
            {
              text:
                language === "ru"
                  ? "📞 Поделиться номером телефона"
                  : language === "en"
                  ? "📞 Share Phone Number"
                  : "📞 Telefon raqamni ulashish",
              request_contact: true,
            },
          ],
          [{ text: t("back") }, { text: t("cancel") }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
  }

  static getSkipCancel(language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    return {
      reply_markup: {
        keyboard: [[{ text: t("skip") }, { text: t("cancel") }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  // Group Registration Keyboards
  static getRegionsInlineForGroup(regions, language = "uz") {
    const buttons = regions.map((region) => [
      {
        text: region.name,
        callback_data: `group_region_${region.id}`,
      },
    ]);

    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: "group_back_region",
      },
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_group_reg",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  static getDistrictsInlineForGroup(
    districts,
    language = "uz",
    regionId,
    optional = false
  ) {
    const buttons = districts.map((district) => [
      {
        text: district.name,
        callback_data: `group_district_${district.id}_${regionId}`,
      },
    ]);

    if (optional) {
      buttons.push([
        {
          text:
            language === "ru"
              ? "⏭ Пропустить"
              : language === "en"
              ? "⏭ Skip"
              : "⏭ O'tkazib yuborish",
          callback_data: `group_skip_district_${regionId}`,
        },
      ]);
    }

    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: "group_back_region",
      },
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_group_reg",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  static getNeighborhoodsInlineForGroup(
    neighborhoods,
    language = "uz",
    regionId,
    districtId,
    optional = false
  ) {
    const buttons = neighborhoods.map((neighborhood) => [
      {
        text: neighborhood.name,
        callback_data: `group_neighborhood_${neighborhood.id}_${regionId}_${districtId}`,
      },
    ]);

    if (optional) {
      buttons.push([
        {
          text:
            language === "ru"
              ? "⏭ Пропустить"
              : language === "en"
              ? "⏭ Skip"
              : "⏭ O'tkazib yuborish",
          callback_data: `group_skip_neighborhood_${regionId}_${districtId}`,
        },
      ]);
    }

    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: `group_back_district_${regionId}`,
      },
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_group_reg",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  static getOrganizationsInlineForGroup(organizations, language = "uz") {
    const buttons = organizations.map((org) => [
      {
        text: org.name,
        callback_data: `group_org_${org.id}`,
      },
    ]);

    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: "group_back_org",
      },
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_group_reg",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  // Appeal Organization Type Selection
  static getAppealOrgTypeSelection(language = "uz") {
    const types = {
      uz: [
        { text: "🏛 Hokimiyat", callback: "appeal_org_type_hokimiyat" },
        { text: "🏘 Mahalla", callback: "appeal_org_type_mahalla" },
        { text: "🏛 Vazirlik", callback: "appeal_org_type_vazirlik" },
        { text: "📊 Davlat Qo'mitasi", callback: "appeal_org_type_qomita" },
        { text: "🏢 Xususiy tashkilot", callback: "appeal_org_type_xususiy" },
      ],
      ru: [
        { text: "🏛 Хокимият", callback: "appeal_org_type_hokimiyat" },
        { text: "🏘 Махалля", callback: "appeal_org_type_mahalla" },
        { text: "🏛 Министерство", callback: "appeal_org_type_vazirlik" },
        {
          text: "📊 Государственный Комитет",
          callback: "appeal_org_type_qomita",
        },
        { text: "🏢 Частная организация", callback: "appeal_org_type_xususiy" },
      ],
      en: [
        { text: "🏛 Hokimiyat", callback: "appeal_org_type_hokimiyat" },
        { text: "🏘 Mahalla", callback: "appeal_org_type_mahalla" },
        { text: "🏛 Ministry", callback: "appeal_org_type_vazirlik" },
        { text: "📊 State Committee", callback: "appeal_org_type_qomita" },
        {
          text: "🏢 Private Organization",
          callback: "appeal_org_type_xususiy",
        },
      ],
    };

    const buttons = (types[language] || types.uz).map((type) => [
      {
        text: type.text,
        callback_data: type.callback,
      },
    ]);

    buttons.push([
      {
        text:
          language === "ru"
            ? "❌ Отмена"
            : language === "en"
            ? "❌ Cancel"
            : "❌ Bekor qilish",
        callback_data: "cancel_appeal",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  // Premium Keyboards
  static getPremiumMenu(language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text:
                language === "ru"
                  ? "💎 Получить Premium"
                  : language === "en"
                  ? "💎 Get Premium"
                  : "💎 Premium olish",
              callback_data: "premium_buy",
            },
          ],
          [
            {
              text:
                language === "ru"
                  ? "📊 Мой Premium"
                  : language === "en"
                  ? "📊 My Premium"
                  : "📊 Mening Premium",
              callback_data: "premium_status",
            },
          ],
          [
            {
              text:
                language === "ru"
                  ? "◀️ Назад"
                  : language === "en"
                  ? "◀️ Back"
                  : "◀️ Orqaga",
              callback_data: "back_to_main",
            },
          ],
        ],
      },
    };
  }

  static getPaymentMethods(language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text:
                language === "ru"
                  ? "💳 Telegram Wallet (TON)"
                  : language === "en"
                  ? "💳 Telegram Wallet (TON)"
                  : "💳 Telegram Wallet (TON)",
              callback_data: "payment_method_telegram_wallet",
            },
          ],
          [
            {
              text:
                language === "ru"
                  ? "💵 Payme"
                  : language === "en"
                  ? "💵 Payme"
                  : "💵 Payme",
              callback_data: "payment_method_payme",
            },
            {
              text:
                language === "ru"
                  ? "⏳ Tez kunda"
                  : language === "en"
                  ? "⏳ Coming Soon"
                  : "⏳ Tez kunda",
              callback_data: "payment_method_payme_disabled",
            },
          ],
          [
            {
              text:
                language === "ru"
                  ? "◀️ Назад"
                  : language === "en"
                  ? "◀️ Back"
                  : "◀️ Orqaga",
              callback_data: "premium_back",
            },
          ],
        ],
      },
    };
  }

  static getPremiumStatus(isPremium, expiresAt, daysLeft, language = "uz") {
    i18next.changeLanguage(language);
    const t = i18next.t;

    const buttons = [];

    if (isPremium) {
      buttons.push([
        {
          text:
            language === "ru"
              ? "✅ Premium faol"
              : language === "en"
              ? "✅ Premium Active"
              : "✅ Premium faol",
          callback_data: "premium_info",
        },
      ]);
    } else {
      buttons.push([
        {
          text:
            language === "ru"
              ? "💎 Premium olish"
              : language === "en"
              ? "💎 Get Premium"
              : "💎 Premium olish",
          callback_data: "premium_buy",
        },
      ]);
    }

    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: "back_to_main",
      },
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }
}

module.exports = Keyboard;
