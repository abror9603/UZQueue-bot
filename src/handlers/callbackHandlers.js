const userService = require("../services/userService");
const locationService = require("../services/locationService");
const organizationService = require("../services/organizationService");
const moderationService = require("../services/moderationService");
const Keyboard = require("../utils/keyboard");
const i18next = require("../config/i18n");
const stateService = require("../services/stateService");
const appealHandlers = require("./appealHandlers");

class CallbackHandlers {
  async handleCallback(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Handle language selection
    if (data.startsWith("lang_")) {
      const langCode = data.replace("lang_", "");
      await this.handleLanguageChange(bot, msg, userId, langCode);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle appeal organization type selection
    if (data.startsWith("appeal_org_type_")) {
      await this.handleAppealOrgTypeSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle region selection
    if (data.startsWith("region_")) {
      await this.handleRegionSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle district selection
    if (data.startsWith("district_")) {
      await this.handleDistrictSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle neighborhood selection
    if (data.startsWith("neighborhood_")) {
      await this.handleNeighborhoodSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle organization selection for appeal
    if (data.startsWith("org_")) {
      await this.handleAppealOrganizationSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle back to appeal org type
    if (data === "back_to_appeal_org_type") {
      await this.handleBackToAppealOrgType(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle back to organization selection
    if (data === "back_to_org_selection") {
      await this.handleBackToOrgSelection(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle skip neighborhood
    if (data.startsWith("skip_neighborhood_")) {
      await this.handleSkipNeighborhood(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle skip district (for optional location)
    if (data.startsWith("skip_district_")) {
      await this.handleSkipDistrict(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle skip region (for optional location)
    if (data === "skip_region") {
      await this.handleSkipRegion(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle back to regions
    if (data === "back_to_regions") {
      await this.handleBackToRegions(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle back to districts
    if (data.startsWith("back_to_districts_")) {
      await this.handleBackToDistricts(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle cancel appeal
    if (data === "cancel_appeal") {
      await this.handleCancelAppeal(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle AI formatting
    if (data === "format_appeal_yes" || data === "format_appeal_no") {
      await this.handleAppealFormatting(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle group registration callbacks
    if (data.startsWith("group_category_")) {
      await this.handleGroupCategorySelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_type_")) {
      await this.handleGroupTypeSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_back_to_category") {
      await this.handleGroupBackToCategory(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_region_")) {
      await this.handleGroupRegionSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_district_")) {
      await this.handleGroupDistrictSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_neighborhood_")) {
      await this.handleGroupNeighborhoodSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_skip_neighborhood_")) {
      await this.handleGroupSkipNeighborhood(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_skip_district_")) {
      await this.handleGroupSkipDistrict(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_org_")) {
      await this.handleGroupOrganizationSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_back_region") {
      await this.handleGroupBackToType(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_back_to_type") {
      await this.handleGroupBackToType(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("group_back_district_")) {
      await this.handleGroupBackToDistrict(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_back_org") {
      await this.handleGroupBackToOrganization(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_confirm_registration") {
      await this.handleConfirmGroupRegistration(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_back_to_phone") {
      await this.handleGroupBackToPhone(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "group_back_to_responsible") {
      await this.handleGroupBackToResponsible(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "cancel_group_reg") {
      await this.handleCancelGroupRegistration(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle premium callbacks
    if (data === "premium_buy") {
      const premiumHandlers = require("./premiumHandlers");
      await premiumHandlers.showPremiumMenu(bot, msg);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "premium_status") {
      const premiumHandlers = require("./premiumHandlers");
      await premiumHandlers.showPremiumStatus(bot, msg);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "premium_back" || data === "back_to_main") {
      const user = await userService.getUser(userId);
      if (!user) return;
      const language = user.language;
      i18next.changeLanguage(language);
      const t = i18next.t;
      await bot.editMessageText(t("help"), {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getMainMenu(language),
      });
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith("payment_method_")) {
      const premiumHandlers = require("./premiumHandlers");
      const method = data.replace("payment_method_", "");
      await premiumHandlers.handlePaymentMethodSelection(
        bot,
        callbackQuery,
        method
      );
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }
  }

  async handleGroupCategorySelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    const category = data.replace("group_category_", "");
    stateData.category = category;

    // If xususiy (private) category is selected, skip type selection and go directly to organization name
    if (category === "xususiy") {
      stateData.groupType = "xususiy";
      await stateService.setData(userId, stateData);
      await stateService.setStep(userId, "group_reg_enter_org_name");

      // Edit message to remove inline keyboard
      await bot
        .editMessageText("✅ Xususiy tashkilot", {
          chat_id: chatId,
          message_id: msg.message_id,
        })
        .catch(() => {
          // If edit fails, ignore (message might already be edited)
        });

      // Send new message with text keyboard
      await bot.sendMessage(
        chatId,
        "🏢 Xususiy tashkilot nomini kiriting:",
        Keyboard.getBackCancel("uz")
      );
      return;
    }

    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_select_type");

    // Define organization types for each category
    const categoryTypes = {
      mahalliy: [
        { text: "🏛 Viloyat hokimiyati", callback: "group_type_viloyat" },
        { text: "🏛 Tuman hokimiyati", callback: "group_type_tuman" },
        { text: "🏛 Shahar hokimiyati", callback: "group_type_shahar" },
        { text: "🏘 Mahalla", callback: "group_type_mahalla" },
      ],
      qomitalar: [
        {
          text: "📊 Davlat statistika qo'mitasi",
          callback: "group_type_qomita_statistika",
        },
        {
          text: "💰 Davlat soliq qo'mitasi",
          callback: "group_type_qomita_soliq",
        },
        {
          text: "📦 Davlat bojxona qo'mitasi",
          callback: "group_type_qomita_bojxona",
        },
        {
          text: "🌿 Ekologiya va atrof-muhitni muhofaza qilish davlat qo'mitasi",
          callback: "group_type_qomita_ekologiya",
        },
        {
          text: "⛏️ Davlat geologiya va mineral resurslar qo'mitasi",
          callback: "group_type_qomita_geologiya",
        },
        {
          text: "🗺️ Yer resurslari, geodeziya, kartografiya va davlat kadastri bo'yicha Davlat qo'mitasi",
          callback: "group_type_qomita_yer",
        },
        {
          text: "✈️ Turizmni rivojlantirish davlat qo'mitasi",
          callback: "group_type_qomita_turizm",
        },
        {
          text: "💼 Investitsiyalar bo'yicha davlat qo'mitasi",
          callback: "group_type_qomita_investitsiya",
        },
        {
          text: "🌳 O'rmon xo'jaligi davlat qo'mitasi",
          callback: "group_type_qomita_urmon",
        },
        {
          text: "🐄 Davlat veterinariya qo'mitasi",
          callback: "group_type_qomita_veterinariya",
        },
        {
          text: "⚙️ Sanoat xavfsizligi davlat qo'mitasi",
          callback: "group_type_qomita_sanoat",
        },
      ],
      vazirliklar: [
        {
          text: "💼 Iqtisodiyot va sanoat vazirligi",
          callback: "group_type_vazirlik_iqtisodiyot",
        },
        { text: "💰 Moliya vazirligi", callback: "group_type_vazirlik_moliya" },
        {
          text: "👔 Bandlik va mehnat munosabatlari vazirligi",
          callback: "group_type_vazirlik_bandlik",
        },
        {
          text: "🎓 Oliy va o'rta maxsus ta'lim vazirligi",
          callback: "group_type_vazirlik_oliy",
        },
        {
          text: "📚 Xalq ta'limi vazirligi",
          callback: "group_type_vazirlik_xalq",
        },
        {
          text: "🏥 Sog'liqni saqlash vazirligi",
          callback: "group_type_vazirlik_soglik",
        },
        {
          text: "👮 Ichki ishlar vazirligi",
          callback: "group_type_vazirlik_ichki",
        },
        {
          text: "🛡️ Mudofaa vazirligi",
          callback: "group_type_vazirlik_mudofaa",
        },
        {
          text: "🚨 Favqulodda vaziyatlar vazirligi",
          callback: "group_type_vazirlik_favqulodda",
        },
        {
          text: "🌍 Tashqi ishlar vazirligi",
          callback: "group_type_vazirlik_tashqi",
        },
        {
          text: "💱 Investitsiyalar va tashqi savdo vazirligi",
          callback: "group_type_vazirlik_investitsiya",
        },
        { text: "⚖️ Adliya vazirligi", callback: "group_type_vazirlik_adliya" },
        {
          text: "🎭 Madaniyat vazirligi",
          callback: "group_type_vazirlik_madaniyat",
        },
        {
          text: "💻 Axborot texnologiyalari va kommunikatsiyalarini rivojlantirish vazirligi",
          callback: "group_type_vazirlik_axborot",
        },
        {
          text: "🏠 Uy-joy kommunal xizmat ko'rsatish vazirligi",
          callback: "group_type_vazirlik_uyjoy",
        },
        {
          text: "👶 Maktabgacha ta'lim vazirligi",
          callback: "group_type_vazirlik_maktabgacha",
        },
        {
          text: "🚀 Innovatsion rivojlanish vazirligi",
          callback: "group_type_vazirlik_innovatsiya",
        },
        {
          text: "⚽ Sportni rivojlantirish vazirligi",
          callback: "group_type_vazirlik_sport",
        },
        {
          text: "✈️ Turizm va madaniy meros vazirligi",
          callback: "group_type_vazirlik_turizm",
        },
        {
          text: "🏗️ Qurilish vazirligi",
          callback: "group_type_vazirlik_qurilish",
        },
        {
          text: "🌾 Qishloq xo'jaligi vazirligi",
          callback: "group_type_vazirlik_qishloq",
        },
        {
          text: "💧 Suv xo'jaligi vazirligi",
          callback: "group_type_vazirlik_suv",
        },
        {
          text: "⚡ Energetika vazirligi",
          callback: "group_type_vazirlik_energetika",
        },
        {
          text: "👨‍👩‍👧‍👦 Mahalla va oilani qo'llab-quvvatlash vazirligi",
          callback: "group_type_vazirlik_mahalla",
        },
      ],
    };

    const categoryNames = {
      mahalliy: "Mahalliy davlat hokimiyati organlari",
      qomitalar: "Davlat Qo'mitalari",
      vazirliklar: "Vazirliklar",
      xususiy: "Xususiy tashkilotlar",
    };

    const types = categoryTypes[category] || [];
    const categoryName = categoryNames[category] || category;

    const inlineKeyboard = types.map((type) => [
      { text: type.text, callback_data: type.callback },
    ]);
    inlineKeyboard.push([
      [
        { text: "◀️ Orqaga", callback_data: "group_back_to_category" },
        { text: "❌ Bekor qilish", callback_data: "cancel_group_reg" },
      ],
    ]);

    await bot.editMessageText(
      `📝 ${categoryName}\n\n2️⃣ Tashkilot turini tanlang:`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }
    );
  }

  async handleGroupBackToCategory(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    delete stateData.category;
    delete stateData.groupType;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_select_category");

    await bot.editMessageText(
      "📝 Guruhni ro'yxatdan o'tkazish\n\n" +
        "1️⃣ Tashkilot kategoriyasini tanlang:",
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🏛 Mahalliy davlat hokimiyati organlari",
                callback_data: "group_category_mahalliy",
              },
            ],
            [
              {
                text: "🏛 Davlat Qo'mitalari",
                callback_data: "group_category_qomitalar",
              },
            ],
            [
              {
                text: "🏛 Vazirliklar",
                callback_data: "group_category_vazirliklar",
              },
            ],
            [
              {
                text: "🏢 Xususiy tashkilotlar",
                callback_data: "group_category_xususiy",
              },
            ],
            [{ text: "❌ Bekor qilish", callback_data: "cancel_group_reg" }],
          ],
        },
      }
    );
  }

  async handleGroupTypeSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require("./groupRegistrationHandlers");
    const stateData = (await stateService.getData(userId)) || {};

    const groupType = data.replace("group_type_", "");
    stateData.groupType = groupType;
    await stateService.setData(userId, stateData);

    // For private organizations, skip location selection and go directly to organization name
    if (groupType === "xususiy") {
      await stateService.setStep(userId, "group_reg_enter_org_name");

      // Edit message to remove inline keyboard
      await bot
        .editMessageText("✅ Xususiy tashkilot", {
          chat_id: chatId,
          message_id: msg.message_id,
        })
        .catch(() => {
          // If edit fails, ignore (message might already be edited)
        });

      // Send new message with text keyboard
      await bot.sendMessage(
        chatId,
        "🏢 Xususiy tashkilot nomini kiriting:",
        Keyboard.getBackCancel("uz")
      );
      return;
    }

    // For other types, proceed with region selection
    await stateService.setStep(userId, "group_reg_select_region");

    // Get regions
    const regions = await locationService.getAllRegions("uz");

    await bot.editMessageText("📍 Viloyatni tanlang:", {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getRegionsInlineForGroup(regions, "uz"),
    });
  }

  async handleGroupRegionSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require("./groupRegistrationHandlers");
    const stateData = (await stateService.getData(userId)) || {};

    const regionId = parseInt(data.replace("group_region_", ""));
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep = groupRegistrationHandlers.getNextStepAfterRegion(
      groupType,
      regionId
    );
    await stateService.setStep(userId, nextStep);

    // Get region name for display
    const regions = await locationService.getAllRegions("uz");
    const selectedRegion = regions.find((r) => r.id === regionId);

    if (nextStep === "group_reg_select_organization") {
      // Region Government: Skip directly to organization
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    } else if (nextStep === "group_reg_select_district") {
      // District/City/Neighborhood: Show districts
      const districts = await locationService.getDistrictsByRegion(
        regionId,
        "uz"
      );
      await bot.editMessageText(
        `📍 ${selectedRegion.name}\n\nTuman yoki shaharni tanlang:`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getDistrictsInlineForGroup(districts, "uz", regionId),
        }
      );
    } else if (nextStep === "group_reg_select_district_optional") {
      // Other: District optional
      const districts = await locationService.getDistrictsByRegion(
        regionId,
        "uz"
      );
      await bot.editMessageText(
        `📍 ${selectedRegion.name}\n\nTuman yoki shaharni tanlang (ixtiyoriy):`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getDistrictsInlineForGroup(
            districts,
            "uz",
            regionId,
            true
          ),
        }
      );
    }
  }

  async handleGroupDistrictSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require("./groupRegistrationHandlers");
    const stateData = (await stateService.getData(userId)) || {};

    // data format: group_district_123_456 (districtId_regionId)
    const parts = data.replace("group_district_", "").split("_");
    const districtId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);

    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep =
      groupRegistrationHandlers.getNextStepAfterDistrict(groupType);
    await stateService.setStep(userId, nextStep);

    // Get district name for display
    const districts = await locationService.getDistrictsByRegion(
      regionId,
      "uz"
    );
    const selectedDistrict = districts.find((d) => d.id === districtId);
    const regions = await locationService.getAllRegions("uz");
    const selectedRegion = regions.find((r) => r.id === regionId);

    if (nextStep === "group_reg_select_organization") {
      // District Government: Skip to organization
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    } else if (nextStep === "group_reg_select_neighborhood_optional") {
      // City Government: Neighborhood optional
      const neighborhoods = await locationService.getNeighborhoodsByDistrict(
        districtId,
        "uz"
      );
      await bot.editMessageText(
        `📍 ${selectedRegion.name} → ${selectedDistrict.name}\n\nMahallani tanlang (ixtiyoriy):`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getNeighborhoodsInlineForGroup(
            neighborhoods,
            "uz",
            regionId,
            districtId,
            true
          ),
        }
      );
    } else if (nextStep === "group_reg_select_neighborhood") {
      // Neighborhood: Must select neighborhood
      const neighborhoods = await locationService.getNeighborhoodsByDistrict(
        districtId,
        "uz"
      );
      await bot.editMessageText(
        `📍 ${selectedRegion.name} → ${selectedDistrict.name}\n\nMahallani tanlang:`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getNeighborhoodsInlineForGroup(
            neighborhoods,
            "uz",
            regionId,
            districtId,
            false
          ),
        }
      );
    } else if (nextStep === "group_reg_enter_org_name") {
      // Other: Ask for organization name
      // Edit message to remove inline keyboard
      await bot
        .editMessageText(
          `📍 ${selectedRegion.name} → ${selectedDistrict.name}`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
          }
        )
        .catch(() => {
          // If edit fails, ignore
        });

      // Send new message with text keyboard
      await bot.sendMessage(
        chatId,
        "🏛 Tashkilot nomini kiriting:",
        Keyboard.getBackCancel("uz")
      );
    }
  }

  async handleGroupNeighborhoodSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require("./groupRegistrationHandlers");
    const stateData = (await stateService.getData(userId)) || {};

    // data format: group_neighborhood_123_456_789 (neighborhoodId_regionId_districtId)
    const parts = data.replace("group_neighborhood_", "").split("_");
    const neighborhoodId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);
    const districtId = parseInt(parts[2]);

    stateData.neighborhoodId = neighborhoodId;
    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep =
      groupRegistrationHandlers.getNextStepAfterNeighborhood(groupType);
    await stateService.setStep(userId, nextStep);

    if (nextStep === "group_reg_select_organization") {
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    }
  }

  async handleGroupSkipNeighborhood(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require("./groupRegistrationHandlers");
    const stateData = (await stateService.getData(userId)) || {};

    // data format: group_skip_neighborhood_456_789 (regionId_districtId)
    const parts = data.replace("group_skip_neighborhood_", "").split("_");
    const regionId = parseInt(parts[0]);
    const districtId = parseInt(parts[1]);

    stateData.regionId = regionId;
    stateData.districtId = districtId;
    stateData.neighborhoodId = null;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep =
      groupRegistrationHandlers.getNextStepAfterNeighborhood(groupType);
    await stateService.setStep(userId, nextStep);

    if (nextStep === "group_reg_select_organization") {
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    }
  }

  async handleGroupSkipDistrict(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    const regionId = parseInt(data.replace("group_skip_district_", ""));

    stateData.regionId = regionId;
    stateData.districtId = null;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_enter_org_name");

    const regions = await locationService.getAllRegions("uz");
    const selectedRegion = regions.find((r) => r.id === regionId);

    // Edit message to remove inline keyboard
    await bot
      .editMessageText(`📍 ${selectedRegion.name}`, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      })
      .catch(() => {
        // If edit fails, ignore
      });

    // Send new message with text keyboard
    await bot.sendMessage(
      msg.chat.id,
      "🏛 Tashkilot nomini kiriting:",
      Keyboard.getBackCancel("uz")
    );
  }

  async showOrganizationSelectionForGroup(bot, msg, userId, stateData) {
    const chatId = msg.chat.id;
    const groupType = stateData.groupType;

    // Map group type to organization type
    const orgTypeMap = {
      viloyat: "hokimiyat",
      tuman: "hokimiyat",
      shahar: "hokimiyat",
      mahalla: "mahalla",
      boshqa: "other",
      qomita: "committee",
      vazirlik: "ministry",
      xususiy: "private",
    };

    // Handle all qomita types (they all map to 'committee')
    let orgType = orgTypeMap[groupType];
    if (!orgType && groupType && groupType.startsWith("qomita_")) {
      orgType = "committee";
    }
    // Handle all vazirlik types (they all map to 'ministry')
    if (!orgType && groupType && groupType.startsWith("vazirlik_")) {
      orgType = "ministry";
    }
    if (!orgType) {
      orgType = "other";
    }

    // Get organizations filtered by type
    const allOrgs = await organizationService.getAllOrganizations("uz");
    const filteredOrgs = allOrgs.filter(
      (org) => org.type === orgType || orgType === "other"
    );

    // Build location string
    let locationStr = "";
    const regions = await locationService.getAllRegions("uz");
    const selectedRegion = regions.find((r) => r.id === stateData.regionId);
    if (selectedRegion) locationStr = selectedRegion.name;

    if (stateData.districtId) {
      const districts = await locationService.getDistrictsByRegion(
        stateData.regionId,
        "uz"
      );
      const selectedDistrict = districts.find(
        (d) => d.id === stateData.districtId
      );
      if (selectedDistrict) locationStr += ` → ${selectedDistrict.name}`;
    }

    if (stateData.neighborhoodId) {
      const neighborhoods = await locationService.getNeighborhoodsByDistrict(
        stateData.districtId,
        "uz"
      );
      const selectedNeighborhood = neighborhoods.find(
        (n) => n.id === stateData.neighborhoodId
      );
      if (selectedNeighborhood)
        locationStr += ` → ${selectedNeighborhood.name}`;
    }

    await bot.editMessageText(`📍 ${locationStr}\n\n🏛 Tashkilotni tanlang:`, {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getOrganizationsInlineForGroup(filteredOrgs, "uz"),
    });
  }

  async handleGroupOrganizationSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    const organizationId = parseInt(data.replace("group_org_", ""));

    const organizations = await organizationService.getAllOrganizations("uz");
    const selectedOrg = organizations.find((o) => o.id === organizationId);

    if (!selectedOrg) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Tashkilot topilmadi",
      });
      return;
    }

    stateData.organizationId = organizationId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_enter_responsible");

    // Edit message to remove inline keyboard
    await bot
      .editMessageText(`✅ ${selectedOrg.name}`, {
        chat_id: chatId,
        message_id: msg.message_id,
      })
      .catch(() => {
        // If edit fails, ignore
      });

    // Send new message with text keyboard
    await bot.sendMessage(
      chatId,
      "👤 Mas'ul shaxs F.I.Sh ni kiriting:\n\nMisol: Aliyev Anvar Anvarovich",
      Keyboard.getBackCancel("uz")
    );
  }

  async handleGroupBackToType(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    const category = stateData.category;
    delete stateData.regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_select_type");

    // Define organization types for each category
    const categoryTypes = {
      mahalliy: [
        { text: "🏛 Viloyat hokimiyati", callback: "group_type_viloyat" },
        { text: "🏛 Tuman hokimiyati", callback: "group_type_tuman" },
        { text: "🏛 Shahar hokimiyati", callback: "group_type_shahar" },
        { text: "🏘 Mahalla", callback: "group_type_mahalla" },
      ],
      qomitalar: [
        {
          text: "📊 Davlat statistika qo'mitasi",
          callback: "group_type_qomita_statistika",
        },
        {
          text: "💰 Davlat soliq qo'mitasi",
          callback: "group_type_qomita_soliq",
        },
        {
          text: "📦 Davlat bojxona qo'mitasi",
          callback: "group_type_qomita_bojxona",
        },
        {
          text: "🌿 Ekologiya va atrof-muhitni muhofaza qilish davlat qo'mitasi",
          callback: "group_type_qomita_ekologiya",
        },
        {
          text: "⛏️ Davlat geologiya va mineral resurslar qo'mitasi",
          callback: "group_type_qomita_geologiya",
        },
        {
          text: "🗺️ Yer resurslari, geodeziya, kartografiya va davlat kadastri bo'yicha Davlat qo'mitasi",
          callback: "group_type_qomita_yer",
        },
        {
          text: "✈️ Turizmni rivojlantirish davlat qo'mitasi",
          callback: "group_type_qomita_turizm",
        },
        {
          text: "💼 Investitsiyalar bo'yicha davlat qo'mitasi",
          callback: "group_type_qomita_investitsiya",
        },
        {
          text: "🌳 O'rmon xo'jaligi davlat qo'mitasi",
          callback: "group_type_qomita_urmon",
        },
        {
          text: "🐄 Davlat veterinariya qo'mitasi",
          callback: "group_type_qomita_veterinariya",
        },
        {
          text: "⚙️ Sanoat xavfsizligi davlat qo'mitasi",
          callback: "group_type_qomita_sanoat",
        },
      ],
      vazirliklar: [
        {
          text: "💼 Iqtisodiyot va sanoat vazirligi",
          callback: "group_type_vazirlik_iqtisodiyot",
        },
        { text: "💰 Moliya vazirligi", callback: "group_type_vazirlik_moliya" },
        {
          text: "👔 Bandlik va mehnat munosabatlari vazirligi",
          callback: "group_type_vazirlik_bandlik",
        },
        {
          text: "🎓 Oliy va o'rta maxsus ta'lim vazirligi",
          callback: "group_type_vazirlik_oliy",
        },
        {
          text: "📚 Xalq ta'limi vazirligi",
          callback: "group_type_vazirlik_xalq",
        },
        {
          text: "🏥 Sog'liqni saqlash vazirligi",
          callback: "group_type_vazirlik_soglik",
        },
        {
          text: "👮 Ichki ishlar vazirligi",
          callback: "group_type_vazirlik_ichki",
        },
        {
          text: "🛡️ Mudofaa vazirligi",
          callback: "group_type_vazirlik_mudofaa",
        },
        {
          text: "🚨 Favqulodda vaziyatlar vazirligi",
          callback: "group_type_vazirlik_favqulodda",
        },
        {
          text: "🌍 Tashqi ishlar vazirligi",
          callback: "group_type_vazirlik_tashqi",
        },
        {
          text: "💱 Investitsiyalar va tashqi savdo vazirligi",
          callback: "group_type_vazirlik_investitsiya",
        },
        { text: "⚖️ Adliya vazirligi", callback: "group_type_vazirlik_adliya" },
        {
          text: "🎭 Madaniyat vazirligi",
          callback: "group_type_vazirlik_madaniyat",
        },
        {
          text: "💻 Axborot texnologiyalari va kommunikatsiyalarini rivojlantirish vazirligi",
          callback: "group_type_vazirlik_axborot",
        },
        {
          text: "🏠 Uy-joy kommunal xizmat ko'rsatish vazirligi",
          callback: "group_type_vazirlik_uyjoy",
        },
        {
          text: "👶 Maktabgacha ta'lim vazirligi",
          callback: "group_type_vazirlik_maktabgacha",
        },
        {
          text: "🚀 Innovatsion rivojlanish vazirligi",
          callback: "group_type_vazirlik_innovatsiya",
        },
        {
          text: "⚽ Sportni rivojlantirish vazirligi",
          callback: "group_type_vazirlik_sport",
        },
        {
          text: "✈️ Turizm va madaniy meros vazirligi",
          callback: "group_type_vazirlik_turizm",
        },
        {
          text: "🏗️ Qurilish vazirligi",
          callback: "group_type_vazirlik_qurilish",
        },
        {
          text: "🌾 Qishloq xo'jaligi vazirligi",
          callback: "group_type_vazirlik_qishloq",
        },
        {
          text: "💧 Suv xo'jaligi vazirligi",
          callback: "group_type_vazirlik_suv",
        },
        {
          text: "⚡ Energetika vazirligi",
          callback: "group_type_vazirlik_energetika",
        },
        {
          text: "👨‍👩‍👧‍👦 Mahalla va oilani qo'llab-quvvatlash vazirligi",
          callback: "group_type_vazirlik_mahalla",
        },
      ],
      xususiy: [
        { text: "🏢 Xususiy tashkilot", callback: "group_type_xususiy" },
      ],
    };

    const categoryNames = {
      mahalliy: "Mahalliy davlat hokimiyati organlari",
      qomitalar: "Davlat Qo'mitalari",
      vazirliklar: "Vazirliklar",
      xususiy: "Xususiy tashkilotlar",
    };

    const types = categoryTypes[category] || [];
    const categoryName = categoryNames[category] || category;

    const inlineKeyboard = types.map((type) => [
      { text: type.text, callback_data: type.callback },
    ]);
    inlineKeyboard.push([
      { text: "◀️ Orqaga", callback_data: "group_back_to_category" },
      { text: "❌ Bekor qilish", callback_data: "cancel_group_reg" },
    ]);

    await bot.editMessageText(
      `📝 ${categoryName}\n\n2️⃣ Tashkilot turini tanlang:`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }
    );
  }

  async handleGroupBackToRegion(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    delete stateData.regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_select_region");

    const regions = await locationService.getAllRegions("uz");

    await bot.editMessageText("📍 Viloyatni tanlang:", {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getRegionsInlineForGroup(regions, "uz"),
    });
  }

  async handleGroupBackToDistrict(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const regionId = parseInt(data.replace("group_back_district_", ""));
    const stateData = (await stateService.getData(userId)) || {};
    stateData.regionId = regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "group_reg_select_district");

    const regions = await locationService.getAllRegions("uz");
    const selectedRegion = regions.find((r) => r.id === regionId);
    const districts = await locationService.getDistrictsByRegion(
      regionId,
      "uz"
    );

    await bot.editMessageText(
      `📍 ${selectedRegion.name}\n\nTuman yoki shaharni tanlang:`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getDistrictsInlineForGroup(districts, "uz", regionId),
      }
    );
  }

  async handleGroupBackToOrganization(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    delete stateData.organizationId;
    delete stateData.organizationName;
    await stateService.setData(userId, stateData);

    await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
  }

  async handleConfirmGroupRegistration(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require("./groupRegistrationHandlers");
    const stateData = (await stateService.getData(userId)) || {};

    // Complete registration
    await groupRegistrationHandlers.completeRegistration(
      bot,
      chatId,
      stateData,
      userId
    );

    // Clear the confirmation message
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }

  async handleGroupBackToPhone(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    await stateService.setStep(userId, "group_reg_enter_phone");

    // Edit message to remove inline keyboard
    await bot
      .editMessageText("✅ Telefon raqami", {
        chat_id: chatId,
        message_id: msg.message_id,
      })
      .catch(() => {
        // If edit fails, ignore
      });

    // Send new message with text keyboard
    await bot.sendMessage(
      chatId,
      "📞 Mas'ul shaxs telefon raqamini kiriting:\n\n" + "Misol: +998901234567",
      Keyboard.getBackCancel("uz")
    );
  }

  async handleGroupBackToResponsible(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = (await stateService.getData(userId)) || {};
    const groupType = stateData.groupType;

    // For private organizations, go back to organization name input
    if (groupType === "xususiy") {
      await stateService.setStep(userId, "group_reg_enter_org_name");

      // Edit message to remove inline keyboard
      await bot
        .editMessageText("🏢 Xususiy tashkilot", {
          chat_id: chatId,
          message_id: msg.message_id,
        })
        .catch(() => {
          // If edit fails, ignore
        });

      // Send new message with text keyboard
      await bot.sendMessage(
        chatId,
        "🏢 Xususiy tashkilot nomini kiriting:",
        Keyboard.getBackCancel("uz")
      );
      return;
    }

    // For other organizations, go back to organization selection
    await stateService.setStep(userId, "group_reg_enter_responsible");

    // Get organization name for display
    let orgName = stateData.organizationName;
    if (!orgName && stateData.organizationId) {
      const org = await organizationService.getOrganizationById(
        stateData.organizationId
      );
      if (org) {
        orgName = org.nameUz;
      }
    }

    // Edit message to remove inline keyboard
    await bot
      .editMessageText(`✅ ${orgName || "Tashkilot"}`, {
        chat_id: chatId,
        message_id: msg.message_id,
      })
      .catch(() => {
        // If edit fails, ignore
      });

    // Send new message with text keyboard
    await bot.sendMessage(
      chatId,
      "👤 Mas'ul shaxs F.I.Sh ni kiriting:\n\nMisol: Aliyev Anvar Anvarovich",
      Keyboard.getBackCancel("uz")
    );
  }

  async handleCancelGroupRegistration(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    const language = user?.language || "uz";
    i18next.changeLanguage(language);
    const t = i18next.t;

    await stateService.clear(userId);

    await bot.editMessageText(t("cancel") || "❌ Bekor qilindi", {
      chat_id: chatId,
      message_id: msg.message_id,
    });

    // Send main menu
    await bot.sendMessage(
      chatId,
      t("help") || "Yordam",
      Keyboard.getMainMenu(language)
    );
  }

  async handleAppealFormatting(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const stateData = (await stateService.getData(userId)) || {};

    if (data === "format_appeal_yes") {
      // Format appeal using AI
      await bot.sendMessage(
        chatId,
        t("formatting_appeal", {
          defaultValue: "🤖 Murojaatingiz rasmiylashtirilmoqda...",
        })
      );

      const formattedText = await moderationService.formatToOfficial(
        stateData.originalAppealText || stateData.appealText,
        language
      );

      stateData.appealText = formattedText;
      stateData.needsFormatting = false;
      await stateService.setData(userId, stateData);

      await bot.sendMessage(
        chatId,
        t("formatted_appeal", {
          defaultValue: "✅ Murojaatingiz rasmiylashtirildi:\n\n",
        }) +
          formattedText +
          "\n\n" +
          t("confirm_formatted", {
            defaultValue: "Tasdiqlaysizmi?",
          }),
        Keyboard.getConfirmCancel(language)
      );
    } else {
      // Use original text
      stateData.appealText =
        stateData.originalAppealText || stateData.appealText;
      stateData.needsFormatting = false;
      await stateService.setData(userId, stateData);
      await stateService.setStep(userId, "upload_file");

      await bot.sendMessage(
        chatId,
        t("upload_file_optional"),
        Keyboard.getSkipCancel(language)
      );
    }
  }

  async handleLanguageChange(bot, msg, userId, langCode) {
    const chatId = msg.chat.id;

    if (!["uz", "ru", "en"].includes(langCode)) {
      return;
    }

    await userService.updateLanguage(userId, langCode);
    i18next.changeLanguage(langCode);
    const t = i18next.t;

    await bot.sendMessage(
      chatId,
      t("language_selected"),
      Keyboard.getMainMenu(langCode)
    );
  }

  async handleAppealOrgTypeSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const orgType = data.replace("appeal_org_type_", "");
    const stateData = (await stateService.getData(userId)) || {};
    stateData.appealOrgType = orgType;
    await stateService.setData(userId, stateData);

    // Determine next step based on organization type
    // hokimiyat, mahalla - need location
    // vazirlik, qomita - optional location (can skip)
    // xususiy - no location needed (skip directly to organization selection)
    // other - optional location

    if (orgType === "xususiy") {
      // Private organization - skip location, go directly to organization selection
      await stateService.setStep(userId, "select_organization");

      // Use sendMessage instead of editMessageText for private organizations
      const chatId = msg.chat.id;
      i18next.changeLanguage(language);
      const t = i18next.t;

      // Get organizations filtered by private type
      const allOrgs = await organizationService.getAllOrganizations(language);
      const filteredOrgs = allOrgs.filter((org) => org.type === "private");

      if (filteredOrgs.length === 0) {
        await bot.sendMessage(
          chatId,
          t("no_organizations_found", {
            defaultValue: "❌ Xususiy tashkilotlar topilmadi.",
          })
        );
        return;
      }

      // Create inline keyboard for organizations
      const buttons = filteredOrgs.map((org) => [
        {
          text: org.name,
          callback_data: `org_${org.id}`,
        },
      ]);

      // Add back and cancel buttons on the same row
      buttons.push([
        {
          text:
            language === "ru"
              ? "◀️ Назад"
              : language === "en"
              ? "◀️ Back"
              : "◀️ Orqaga",
          callback_data: "back_to_appeal_org_type",
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

      await bot.editMessageText(t("select_organization"), {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
      return;
    } else if (orgType === "hokimiyat" || orgType === "mahalla") {
      // Need location - start with region selection
      await stateService.setStep(userId, "select_region");
      const regions = await locationService.getAllRegions(language);

      await bot.editMessageText(t("select_region"), {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getRegionsInline(regions, language),
      });
    } else {
      // Optional location - ask if they want to specify location
      await stateService.setStep(userId, "select_region_optional");
      const regions = await locationService.getAllRegions(language);

      await bot.editMessageText(
        t("select_region_optional", {
          defaultValue:
            "📍 Hududni tanlang (ixtiyoriy):\n\nAgar hududni tanlamasangiz, barcha hududlar uchun murojaat yuboriladi.",
        }),
        {
          chat_id: chatId,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              ...regions.map((region) => [
                {
                  text: region.name,
                  callback_data: `region_${region.id}`,
                },
              ]),
              [
                {
                  text:
                    language === "ru"
                      ? "⏭ Пропустить"
                      : language === "en"
                      ? "⏭ Skip"
                      : "⏭ O'tkazib yuborish",
                  callback_data: "skip_region",
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
              ],
            ],
          },
        }
      );
    }
  }

  async handleBackToAppealOrgType(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Reset state - remove location and organization selection
    const stateData = (await stateService.getData(userId)) || {};
    delete stateData.appealOrgType;
    delete stateData.regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    delete stateData.organizationId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "select_appeal_org_type");

    // Show organization type selection
    await bot.editMessageText(
      t("select_appeal_org_type", {
        defaultValue:
          "📋 Murojaat qaysi tashkilotga yuborilmoqda?\n\nTashkilot turini tanlang:",
      }),
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getAppealOrgTypeSelection(language),
      }
    );
  }

  async handleRegionSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const regionId = parseInt(data.replace("region_", ""));
    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    const stateData = (await stateService.getData(userId)) || {};
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    // Determine next step based on appeal org type
    const appealOrgType = stateData.appealOrgType;
    if (appealOrgType === "hokimiyat") {
      // For hokimiyat, need district
      await stateService.setStep(userId, "select_district");
    } else if (appealOrgType === "mahalla") {
      // For mahalla, need district then neighborhood
      await stateService.setStep(userId, "select_district");
    } else {
      // For vazirlik, qomita, other - district is optional
      await stateService.setStep(userId, "select_district_optional");
    }

    // Get districts for this region
    const districts = await locationService.getDistrictsByRegion(
      regionId,
      language
    );

    if (districts.length === 0) {
      await bot.sendMessage(chatId, t("error") + ": Tumanlar topilmadi.");
      return;
    }

    // Check if district is optional
    const isOptional =
      appealOrgType !== "hokimiyat" && appealOrgType !== "mahalla";

    // Update message with district selection
    const districtText = isOptional
      ? t("select_district_optional", {
          defaultValue: "📍 Tuman yoki shaharni tanlang (ixtiyoriy):",
        })
      : t("select_district");

    await bot.editMessageText(districtText, {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getDistrictsInline(districts, language, regionId, isOptional),
    });
  }

  async handleDistrictSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    // data format: district_123_456 (districtId_regionId)
    const parts = data.replace("district_", "").split("_");
    const districtId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    const stateData = (await stateService.getData(userId)) || {};
    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    // Determine next step based on appeal org type
    const appealOrgType = stateData.appealOrgType;
    if (appealOrgType === "mahalla") {
      // For mahalla, need neighborhood
      await stateService.setStep(userId, "select_neighborhood");
    } else {
      // For others, go to organization selection
      await stateService.setStep(userId, "select_organization");
      await this.showOrganizationSelectionForAppeal(
        bot,
        msg,
        userId,
        stateData,
        language
      );
      return;
    }

    // Get neighborhoods for this district
    const neighborhoods = await locationService.getNeighborhoodsByDistrict(
      districtId,
      language
    );

    // Update message with neighborhood selection
    await bot.editMessageText(t("select_neighborhood"), {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getNeighborhoodsInline(
        neighborhoods,
        language,
        regionId,
        districtId
      ),
    });
  }

  async handleSkipRegion(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Skip location selection and go directly to organization selection
    const stateData = (await stateService.getData(userId)) || {};
    await stateService.setStep(userId, "select_organization");

    // Get organizations based on appeal org type
    await this.showOrganizationSelectionForAppeal(
      bot,
      msg,
      userId,
      stateData,
      language
    );
  }

  async handleSkipDistrict(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Skip district selection and go directly to organization selection
    const regionId = parseInt(data.replace("skip_district_", ""));
    const stateData = (await stateService.getData(userId)) || {};
    stateData.regionId = regionId;
    stateData.districtId = null;
    stateData.neighborhoodId = null;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "select_organization");

    // Get organizations based on appeal org type
    await this.showOrganizationSelectionForAppeal(
      bot,
      msg,
      userId,
      stateData,
      language
    );
  }

  async handleNeighborhoodSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    // data format: neighborhood_123_456_789 (neighborhoodId_regionId_districtId)
    const parts = data.replace("neighborhood_", "").split("_");
    const neighborhoodId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);
    const districtId = parseInt(parts[2]);

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    const stateData = (await stateService.getData(userId)) || {};
    stateData.neighborhoodId = neighborhoodId;
    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    // Continue to organization selection
    await this.showOrganizationSelectionForAppeal(
      bot,
      msg,
      userId,
      stateData,
      language
    );
  }

  async handleSkipNeighborhood(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    // data format: skip_neighborhood_456_789 (regionId_districtId)
    const parts = data.replace("skip_neighborhood_", "").split("_");
    const regionId = parseInt(parts[0]);
    const districtId = parseInt(parts[1]);

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;

    // Update state (without neighborhood)
    const stateData = (await stateService.getData(userId)) || {};
    stateData.regionId = regionId;
    stateData.districtId = districtId;
    stateData.neighborhoodId = null;
    await stateService.setData(userId, stateData);

    // Continue to organization selection
    await this.showOrganizationSelectionForAppeal(
      bot,
      msg,
      userId,
      stateData,
      language
    );
  }

  async showOrganizationSelectionForAppeal(
    bot,
    msg,
    userId,
    stateData,
    language
  ) {
    const chatId = msg.chat.id;
    const appealOrgType = stateData.appealOrgType;

    i18next.changeLanguage(language);
    const t = i18next.t;

    await stateService.setStep(userId, "select_organization");

    // Map appeal org type to organization type
    const orgTypeMap = {
      hokimiyat: "hokimiyat",
      mahalla: "mahalla",
      vazirlik: "ministry",
      qomita: "committee",
      xususiy: "private",
      other: "other",
    };

    const orgType = orgTypeMap[appealOrgType] || "other";

    // Get organizations filtered by type
    const allOrgs = await organizationService.getAllOrganizations(language);
    const filteredOrgs = allOrgs.filter((org) => {
      if (orgType === "other") return true;
      return org.type === orgType;
    });

    if (filteredOrgs.length === 0) {
      await bot.sendMessage(
        chatId,
        t("no_organizations_found", {
          defaultValue: "❌ Ushbu turdagi tashkilotlar topilmadi.",
        })
      );
      return;
    }

    // Create inline keyboard for organizations
    const buttons = filteredOrgs.map((org) => [
      {
        text: org.name,
        callback_data: `org_${org.id}`,
      },
    ]);

    // Add back and cancel buttons on the same row
    buttons.push([
      {
        text:
          language === "ru"
            ? "◀️ Назад"
            : language === "en"
            ? "◀️ Back"
            : "◀️ Orqaga",
        callback_data: "back_to_appeal_org_type",
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

    await bot.editMessageText(t("select_organization"), {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async handleAppealOrganizationSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const organizationId = parseInt(data.replace("org_", ""));
    const stateData = (await stateService.getData(userId)) || {};
    stateData.organizationId = organizationId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "enter_name");

    const org = await organizationService.getOrganizationById(organizationId);
    const orgName =
      language === "ru"
        ? org.nameRu
        : language === "en"
        ? org.nameEn
        : org.nameUz;

    // Edit message to remove inline keyboard
    await bot
      .editMessageText(`✅ ${orgName}`, {
        chat_id: chatId,
        message_id: msg.message_id,
      })
      .catch(() => {
        // If edit fails, ignore (message might already be edited)
      });

    // Send new message with back/cancel buttons (text keyboard)
    await bot.sendMessage(
      chatId,
      t("enter_name"),
      Keyboard.getBackCancel(language)
    );
  }

  async handleBackToOrgSelection(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const stateData = (await stateService.getData(userId)) || {};
    delete stateData.organizationId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, "select_organization");

    await this.showOrganizationSelectionForAppeal(
      bot,
      msg,
      userId,
      stateData,
      language
    );
  }

  async handleBackToRegions(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Reset state
    await stateService.setStep(userId, "select_region");
    const stateData = (await stateService.getData(userId)) || {};
    delete stateData.regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);

    // Get regions
    const regions = await locationService.getAllRegions(language);

    await bot.editMessageText(t("select_region"), {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getRegionsInline(regions, language),
    });
  }

  async handleBackToDistricts(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    // data format: back_to_districts_456 (regionId)
    const regionId = parseInt(data.replace("back_to_districts_", ""));

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    await stateService.setStep(userId, "select_district");
    const stateData = (await stateService.getData(userId)) || {};
    stateData.regionId = regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);

    // Get districts
    const districts = await locationService.getDistrictsByRegion(
      regionId,
      language
    );

    await bot.editMessageText(t("select_district"), {
      chat_id: chatId,
      message_id: msg.message_id,
      ...Keyboard.getDistrictsInline(districts, language, regionId),
    });
  }

  async handleCancelAppeal(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Clear state
    await stateService.clear(userId);

    await bot.editMessageText(t("cancel"), {
      chat_id: chatId,
      message_id: msg.message_id,
    });

    await bot.sendMessage(chatId, t("cancel"), Keyboard.getMainMenu(language));
  }
}

module.exports = new CallbackHandlers();
