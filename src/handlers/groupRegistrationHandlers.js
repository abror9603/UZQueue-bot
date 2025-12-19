const { TelegramGroup } = require("../models");
const locationService = require("../services/locationService");
const organizationService = require("../services/organizationService");
const stateService = require("../services/stateService");
const spamProtectionService = require("../services/spamProtectionService");
const ActionValidator = require("../middleware/actionValidator");
const Keyboard = require("../utils/keyboard");
const i18next = require("../config/i18n");

/**
 * Group Registration Handlers
 * Handles /register_group command and group registration flow
 */
class GroupRegistrationHandlers {
  /**
   * Handle /register_group command in group chat
   */
  async handleRegisterGroup(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check if message is from a group
    if (msg.chat.type === "private") {
      await bot.sendMessage(chatId, "❌ Bu buyruq faqat guruhda ishlaydi.");
      return;
    }

    // Store group chat_id immediately - this is critical!
    const groupChatId = chatId.toString();
    console.log(`[REGISTER_GROUP] Group chat_id saved: ${groupChatId} for user: ${userId}`);

    // Check if user is admin
    try {
      const chatMember = await bot.getChatMember(chatId, userId);
      if (
        chatMember.status !== "administrator" &&
        chatMember.status !== "creator"
      ) {
        await bot.sendMessage(
          chatId,
          "❌ Faqat guruh adminlari guruhni ro'yxatdan o'tkazishi mumkin."
        );
        return;
      }
    } catch (error) {
      console.error("Error checking admin:", error);
      await bot.sendMessage(chatId, "❌ Xatolik yuz berdi.");
      return;
    }

    // Check if group already registered
    const existingGroup = await TelegramGroup.findOne({
      where: { chatId: groupChatId },
    });

    if (existingGroup) {
      await bot.sendMessage(
        chatId,
        "ℹ️ Bu guruh allaqachon ro'yxatdan o'tgan.\n\n" +
          `📌 Status: ${existingGroup.subscriptionStatus}\n` +
          (existingGroup.subscriptionExpiresAt
            ? `📅 Muddati: ${new Date(
                existingGroup.subscriptionExpiresAt
              ).toLocaleDateString()}\n`
            : "") +
          "\nMa'lumotlarni yangilash uchun shaxsiy chatga o'ting va /update_group yuboring."
      );
      return;
    }

    // Get group title for reference
    let groupTitle = msg.chat.title || "Unknown Group";
    try {
      const chat = await bot.getChat(groupChatId);
      groupTitle = chat.title || groupTitle;
    } catch (error) {
      console.error("Error getting chat info:", error);
    }

    // Store group chat_id and title in state BEFORE redirecting to private chat
    // This ensures we don't lose the group chat_id even if registration is interrupted
    await stateService.setData(userId, {
      groupChatId: groupChatId,
      groupTitle: groupTitle,
    });
    console.log(`[REGISTER_GROUP] Group data stored in state: chatId=${groupChatId}, title=${groupTitle}`);

    // Redirect to private chat
    await bot.sendMessage(
      chatId,
      "📝 Guruhni ro'yxatdan o'tkazish uchun bot bilan shaxsiy chatda davom eting:\n\n" +
        "👉 @" +
        (
          await bot.getMe()
        ).username
    );

    // Start registration in private chat - pass groupChatId explicitly
    const privateChatId = userId;
    await this.startRegistration(bot, privateChatId, groupChatId, userId);
  }

  /**
   * Start registration flow in private chat
   */
  async startRegistration(bot, chatId, groupChatId, userId) {
    i18next.changeLanguage("uz");
    const t = i18next.t;

    // Get existing state data (may already contain groupChatId from handleRegisterGroup)
    const existingData = await stateService.getData(userId) || {};
    
    // Ensure groupChatId is stored (use existing or new one)
    const finalGroupChatId = existingData.groupChatId || groupChatId.toString();
    
    // Get group title
    let groupTitle = existingData.groupTitle;
    if (!groupTitle) {
      try {
        const chat = await bot.getChat(finalGroupChatId);
        groupTitle = chat.title || "Unknown Group";
      } catch (error) {
        console.error("Error getting chat title:", error);
        groupTitle = "Unknown Group";
      }
    }

    // Store registration data - ensure groupChatId is always present
    await stateService.setStep(userId, "group_reg_select_category");
    await stateService.setData(userId, {
      ...existingData,
      groupChatId: finalGroupChatId,
      groupTitle: groupTitle,
    });
    
    console.log(`[START_REGISTRATION] Registration started for group: ${finalGroupChatId}, user: ${userId}`);

    await bot.sendMessage(
      chatId,
      "📝 Guruhni ro'yxatdan o'tkazish\n\n" +
        "1️⃣ Tashkilot kategoriyasini tanlang:",
      {
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

  /**
   * Process registration step
   */
  async processRegistrationStep(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    const step = await stateService.getStep(userId);
    
    // Check if we're in registration flow
    if (!step || !step.startsWith("group_reg_")) {
      return false; // Not in registration flow
    }

    // If we're here, we're in registration flow
    // State exists (otherwise step would be null)
    const data = (await stateService.getData(userId)) || {};

    i18next.changeLanguage("uz");
    const t = i18next.t;

    // Handle cancel
    if (text && (text === t('cancel') || text === '❌ Bekor qilish')) {
      await stateService.clear(userId);
      await bot.sendMessage(chatId, t('cancel') || '❌ Bekor qilindi', Keyboard.getMainMenu('uz'));
      return true;
    }

    // Handle back
    if (text && (text === t('back') || text === '◀️ Orqaga')) {
      // Back navigation can be handled per step if needed
      // For now, just return false to let it fall through
    }

    switch (step) {
      case "group_reg_select_region":
        // Region selection is handled via callback
        return false;
      case "group_reg_select_district":
        // District selection is handled via callback
        return false;
      case "group_reg_select_neighborhood":
        // Neighborhood selection is handled via callback
        return false;
      case "group_reg_enter_org_name":
        await this.handleOrganizationNameInput(bot, msg, text, data, userId);
        break;
      case "group_reg_enter_responsible":
        await this.handleResponsibleInput(bot, msg, text, data, userId);
        break;
      case "group_reg_enter_phone":
        // Handle contact sharing (phone number) - skip validation for this
        if (msg.contact) {
          await this.handlePhoneInput(bot, msg, text, data, userId);
          return true;
        }
        await this.handlePhoneInput(bot, msg, text, data, userId);
        break;
      default:
        return false;
    }

    return true;
  }

  /**
   * Get next step based on organization type
   */
  getNextStepAfterRegion(groupType, regionId) {
    // Handle all qomita types (they all follow the same logic)
    if (groupType && groupType.startsWith("qomita_")) {
      // State Committees: District optional
      return "group_reg_select_district_optional";
    }

    // Handle all vazirlik types (they all follow the same logic)
    if (groupType && groupType.startsWith("vazirlik_")) {
      // Ministries: District optional
      return "group_reg_select_district_optional";
    }

    switch (groupType) {
      case "viloyat":
        // Region Government: Only region needed, skip to organization
        return "group_reg_select_organization";
      case "tuman":
      case "shahar":
        // District/City Government: Need district
        return "group_reg_select_district";
      case "mahalla":
        // Neighborhood: Need district, then neighborhood
        return "group_reg_select_district";
      case "qomita":
      case "vazirlik":
        // State Committees and Ministries: District optional
        return "group_reg_select_district_optional";
      case "xususiy":
        // Private organization: District optional, then organization name
        return "group_reg_select_district_optional";
      case "boshqa":
        // Other: District optional, then organization name
        return "group_reg_select_district_optional";
      default:
        return "group_reg_select_district";
    }
  }

  /**
   * Get next step after district based on organization type
   */
  getNextStepAfterDistrict(groupType) {
    // Handle all qomita types (they all follow the same logic)
    if (groupType && groupType.startsWith("qomita_")) {
      // State Committees: Skip to organization
      return "group_reg_select_organization";
    }

    // Handle all vazirlik types (they all follow the same logic)
    if (groupType && groupType.startsWith("vazirlik_")) {
      // Ministries: Skip to organization
      return "group_reg_select_organization";
    }

    switch (groupType) {
      case "tuman":
        // District Government: Skip to organization
        return "group_reg_select_organization";
      case "shahar":
        // City Government: Neighborhood optional
        return "group_reg_select_neighborhood_optional";
      case "mahalla":
        // Neighborhood: Must select neighborhood
        return "group_reg_select_neighborhood";
      case "qomita":
      case "vazirlik":
        // State Committees and Ministries: Skip to organization
        return "group_reg_select_organization";
      case "xususiy":
      case "boshqa":
        // Private/Other: Ask for organization name
        return "group_reg_enter_org_name";
      default:
        return "group_reg_select_organization";
    }
  }

  /**
   * Get next step after neighborhood based on organization type
   */
  getNextStepAfterNeighborhood(groupType) {
    switch (groupType) {
      case "mahalla":
        // Neighborhood: Skip to organization
        return "group_reg_select_organization";
      case "shahar":
        // City Government: Skip to organization
        return "group_reg_select_organization";
      default:
        return "group_reg_select_organization";
    }
  }

  async handleOrganizationNameInput(bot, msg, text, data, userId) {
    const chatId = msg.chat.id;

    if (!text || text.trim().length < 3) {
      await bot.sendMessage(
        chatId,
        "❌ Tashkilot nomi kamida 3 ta belgi bo'lishi kerak"
      );
      return;
    }

    data.organizationName = text.trim();
    await stateService.setData(userId, data);
    await stateService.setStep(userId, "group_reg_enter_responsible");

    await bot.sendMessage(
      chatId,
      "👤 Mas'ul shaxs F.I.Sh ni kiriting:\n\n" +
        "Misol: Aliyev Anvar Anvarovich",
      Keyboard.getBackCancel("uz")
    );
  }

  async handleResponsibleInput(bot, msg, text, data, userId) {
    const chatId = msg.chat.id;

    if (!text || text.length < 5) {
      await bot.sendMessage(
        chatId,
        "❌ Ism va familiya kamida 5 ta belgi bo'lishi kerak"
      );
      return;
    }

    data.responsiblePerson = text.trim();
    data.phoneAttempts = 0; // Initialize phone validation attempts counter
    await stateService.setData(userId, data);
    await stateService.setStep(userId, "group_reg_enter_phone");

    await bot.sendMessage(
      chatId,
      "📞 Mas'ul shaxs telefon raqamini kiriting:\n\n" + "Misol: +998901234567",
      Keyboard.getPhoneKeyboard("uz")
    );
  }

  async handlePhoneInput(bot, msg, text, data, userId) {
    const chatId = msg.chat.id;

    let phoneNumber = null;

    // Handle contact sharing (when user uses "Share Phone Number" button)
    if (msg.contact && msg.contact.phone_number) {
      const contactPhone = msg.contact.phone_number;
      // If contact doesn't have +, add it
      const formattedContact = contactPhone.startsWith('+') ? contactPhone : '+' + contactPhone;
      
      // Validate contact phone number (should be Uzbekistan number)
      const contactValidation = ActionValidator.validatePhone(formattedContact, 'uz');
      if (!contactValidation.valid) {
        await bot.sendMessage(chatId, contactValidation.error, Keyboard.getPhoneKeyboard('uz'));
        return;
      }
      phoneNumber = contactValidation.formatted;
    } else if (text) {
      // Handle manual phone input
      const phoneValidation = ActionValidator.validatePhone(text, 'uz');
      if (!phoneValidation.valid) {
        // Increment attempts counter
        data.phoneAttempts = (data.phoneAttempts || 0) + 1;
        await stateService.setData(userId, data);

        // If 3 or more attempts, ban user
        if (data.phoneAttempts >= 3) {
          await spamProtectionService.blockUser(userId, 24);
          await bot.sendMessage(
            chatId,
            '❌ Noto\'g\'ri telefon raqam 3 marta kiritildi. Siz 24 soatga bloklangansiz.'
          );
          await stateService.clear(userId);
          return;
        }

        // Warning message based on attempts
        const warningMessage = data.phoneAttempts >= 2
          ? phoneValidation.error + '\n\n⚠️ Eslatma: Yana bir marta noto\'g\'ri raqam kiritilsa, siz 24 soatga bloklanasiz!'
          : phoneValidation.error;
        
        await bot.sendMessage(chatId, warningMessage, Keyboard.getPhoneKeyboard('uz'));
        return;
      }
      phoneNumber = phoneValidation.formatted;
    } else {
      await bot.sendMessage(
        chatId,
        '❌ Telefon raqam noto\'g\'ri. Format: +998901234567',
        Keyboard.getPhoneKeyboard('uz')
      );
      return;
    }

    // If we have a valid phone number, proceed
    data.responsiblePhone = phoneNumber;
    data.phoneAttempts = 0; // Reset attempts on success
    await stateService.setData(userId, data);
    await stateService.setStep(userId, "group_reg_confirm");

    // Remove phone keyboard and show confirmation
    await this.showConfirmation(bot, chatId, data, userId);
  }

  async showConfirmation(bot, chatId, data, userId) {
    try {
      // Build location string (skip for private organizations)
      let locationStr = "";
      if (data.groupType !== "xususiy") {
        const regions = await locationService.getAllRegions("uz");
        const selectedRegion = regions.find((r) => r.id === data.regionId);
        locationStr = selectedRegion ? selectedRegion.name : "";

        if (data.districtId) {
          const districts = await locationService.getDistrictsByRegion(
            data.regionId,
            "uz"
          );
          const selectedDistrict = districts.find(
            (d) => d.id === data.districtId
          );
          if (selectedDistrict) locationStr += ` → ${selectedDistrict.name}`;
        }

        if (data.neighborhoodId) {
          const neighborhoods =
            await locationService.getNeighborhoodsByDistrict(
              data.districtId,
              "uz"
            );
          const selectedNeighborhood = neighborhoods.find(
            (n) => n.id === data.neighborhoodId
          );
          if (selectedNeighborhood)
            locationStr += ` → ${selectedNeighborhood.name}`;
        }
      }

      // Get organization name
      let orgName = data.organizationName;
      if (!orgName && data.organizationId) {
        const org = await organizationService.getOrganizationById(
          data.organizationId
        );
        if (org) {
          orgName = org.nameUz;
        }
      }

      // Get category and type names
      const categoryNames = {
        mahalliy: "Mahalliy davlat hokimiyati organlari",
        qomitalar: "Davlat Qo'mitalari",
        vazirliklar: "Vazirliklar",
        xususiy: "Xususiy tashkilotlar",
      };
      const typeNames = {
        viloyat: "Viloyat hokimiyati",
        tuman: "Tuman hokimiyati",
        shahar: "Shahar hokimiyati",
        mahalla: "Mahalla",
        qomita: "Davlat Qo'mitasi",
        qomita_statistika: "Davlat statistika qo'mitasi",
        qomita_soliq: "Davlat soliq qo'mitasi",
        qomita_bojxona: "Davlat bojxona qo'mitasi",
        qomita_ekologiya:
          "Ekologiya va atrof-muhitni muhofaza qilish davlat qo'mitasi",
        qomita_geologiya: "Davlat geologiya va mineral resurslar qo'mitasi",
        qomita_yer:
          "Yer resurslari, geodeziya, kartografiya va davlat kadastri bo'yicha Davlat qo'mitasi",
        qomita_turizm: "Turizmni rivojlantirish davlat qo'mitasi",
        qomita_investitsiya: "Investitsiyalar bo'yicha davlat qo'mitasi",
        qomita_urmon: "O'rmon xo'jaligi davlat qo'mitasi",
        qomita_veterinariya: "Davlat veterinariya qo'mitasi",
        qomita_sanoat: "Sanoat xavfsizligi davlat qo'mitasi",
        vazirlik: "Vazirlik",
        vazirlik_iqtisodiyot: "Iqtisodiyot va sanoat vazirligi",
        vazirlik_moliya: "Moliya vazirligi",
        vazirlik_bandlik: "Bandlik va mehnat munosabatlari vazirligi",
        vazirlik_oliy: "Oliy va o'rta maxsus ta'lim vazirligi",
        vazirlik_xalq: "Xalq ta'limi vazirligi",
        vazirlik_soglik: "Sog'liqni saqlash vazirligi",
        vazirlik_ichki: "Ichki ishlar vazirligi",
        vazirlik_mudofaa: "Mudofaa vazirligi",
        vazirlik_favqulodda: "Favqulodda vaziyatlar vazirligi",
        vazirlik_tashqi: "Tashqi ishlar vazirligi",
        vazirlik_investitsiya: "Investitsiyalar va tashqi savdo vazirligi",
        vazirlik_adliya: "Adliya vazirligi",
        vazirlik_madaniyat: "Madaniyat vazirligi",
        vazirlik_axborot:
          "Axborot texnologiyalari va kommunikatsiyalarini rivojlantirish vazirligi",
        vazirlik_uyjoy: "Uy-joy kommunal xizmat ko'rsatish vazirligi",
        vazirlik_maktabgacha: "Maktabgacha ta'lim vazirligi",
        vazirlik_innovatsiya: "Innovatsion rivojlanish vazirligi",
        vazirlik_sport: "Sportni rivojlantirish vazirligi",
        vazirlik_turizm: "Turizm va madaniy meros vazirligi",
        vazirlik_qurilish: "Qurilish vazirligi",
        vazirlik_qishloq: "Qishloq xo'jaligi vazirligi",
        vazirlik_suv: "Suv xo'jaligi vazirligi",
        vazirlik_energetika: "Energetika vazirligi",
        vazirlik_mahalla: "Mahalla va oilani qo'llab-quvvatlash vazirligi",
        xususiy: "Xususiy tashkilot",
        boshqa: "Boshqa davlat tashkiloti",
      };
      const categoryName = categoryNames[data.category] || "";
      const typeName = typeNames[data.groupType] || data.groupType;

      let confirmationText =
        "📋 Ro'yxatdan o'tkazish ma'lumotlari:\n\n" +
        (categoryName ? `📂 Kategoriya: ${categoryName}\n` : "") +
        `🏛 Tashkilot turi: ${typeName}\n`;

      // Only show location for non-private organizations
      if (data.groupType !== "xususiy" && locationStr) {
        confirmationText += `📍 Hudud: ${locationStr}\n`;
      }

      confirmationText +=
        `🏢 Tashkilot: ${orgName}\n` +
        `👤 Mas'ul shaxs: ${data.responsiblePerson}\n` +
        `📞 Telefon: ${data.responsiblePhone}\n\n` +
        "✅ Barcha ma'lumotlar to'g'rimi?\n\n" +
        "Tasdiqlasangiz, guruh ro'yxatdan o'tkaziladi.";

      await bot.sendMessage(chatId, confirmationText, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Tasdiqlash",
                callback_data: "group_confirm_registration",
              }
            ],
            [
              { text: "◀️ Orqaga", callback_data: "group_back_to_phone" },
              { text: "❌ Bekor qilish", callback_data: "cancel_group_reg" }
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Error showing confirmation:", error);
      await bot.sendMessage(
        chatId,
        "❌ Xatolik yuz berdi. Qayta urinib ko'ring."
      );
    }
  }

  async completeRegistration(bot, chatId, data, userId) {
    try {
      const { Organization } = require("../models");

      // Get group admins
      const groupChatId = data.groupChatId;
      const chat = await bot.getChat(groupChatId);
      const administrators = await bot.getChatAdministrators(groupChatId);
      const adminIds = administrators.map((admin) => admin.user.id);

      // Handle organization: if organizationName is provided (for "boshqa", "xususiy", "qomita", "vazirlik" types), create organization entry
      let organizationId = data.organizationId;
      if (data.organizationName && !organizationId) {
        // Determine organization type based on group type
        let orgType = "other";
        if (data.groupType === "xususiy") {
          orgType = "private";
        } else if (data.groupType && data.groupType.startsWith("qomita_")) {
          // All qomita types are committees
          orgType = "committee";
        } else if (data.groupType === "qomita") {
          orgType = "committee";
        } else if (data.groupType && data.groupType.startsWith("vazirlik_")) {
          // All vazirlik types are ministries
          orgType = "ministry";
        } else if (data.groupType === "vazirlik") {
          orgType = "ministry";
        }

        // Create a new organization entry
        const newOrg = await Organization.create({
          nameUz: data.organizationName,
          nameRu: data.organizationName,
          nameEn: data.organizationName,
          code: `CUSTOM_${Date.now()}`,
          type: orgType,
          isActive: true,
        });
        organizationId = newOrg.id;
      }

      // Validate required fields based on organization type
      const groupType = data.groupType;
      if (groupType === "tuman" && !data.districtId) {
        throw new Error("Tuman hokimiyati uchun tuman tanlash majburiy");
      }
      if (
        groupType === "mahalla" &&
        (!data.districtId || !data.neighborhoodId)
      ) {
        throw new Error("Mahalla uchun tuman va mahalla tanlash majburiy");
      }

      // Build location string for confirmation (skip for private organizations)
      let locationStr = "";
      if (groupType !== "xususiy") {
        const regions = await locationService.getAllRegions("uz");
        const selectedRegion = regions.find((r) => r.id === data.regionId);
        locationStr = selectedRegion ? selectedRegion.name : "";

        if (data.districtId) {
          const districts = await locationService.getDistrictsByRegion(
            data.regionId,
            "uz"
          );
          const selectedDistrict = districts.find(
            (d) => d.id === data.districtId
          );
          if (selectedDistrict) locationStr += ` → ${selectedDistrict.name}`;
        }

        if (data.neighborhoodId) {
          const neighborhoods =
            await locationService.getNeighborhoodsByDistrict(
              data.districtId,
              "uz"
            );
          const selectedNeighborhood = neighborhoods.find(
            (n) => n.id === data.neighborhoodId
          );
          if (selectedNeighborhood)
            locationStr += ` → ${selectedNeighborhood.name}`;
        }
      }

      // Get organization name
      let orgName = data.organizationName;
      if (!orgName && organizationId) {
        const org = await organizationService.getOrganizationById(
          organizationId
        );
        if (org) {
          orgName = org.nameUz;
        }
      }

      // Validate that groupChatId exists
      if (!groupChatId) {
        throw new Error("Guruh chat_id topilmadi. Iltimos, guruhda /register_group buyrug'ini qayta yuboring.");
      }

      // Check if group already exists (double-check)
      const existingGroup = await TelegramGroup.findOne({
        where: { chatId: groupChatId.toString() },
      });

      if (existingGroup) {
        await bot.sendMessage(
          chatId,
          "ℹ️ Bu guruh allaqachon ro'yxatdan o'tgan.\n\n" +
            `📌 Status: ${existingGroup.subscriptionStatus}`
        );
        await stateService.clear(userId);
        return;
      }

      // Create telegram group record
      const telegramGroup = await TelegramGroup.create({
        chatId: groupChatId.toString(), // Ensure it's a string
        chatTitle: data.groupTitle || chat.title,
        regionId: groupType === "xususiy" ? null : data.regionId,
        districtId: groupType === "xususiy" ? null : data.districtId || null,
        neighborhoodId:
          groupType === "xususiy" ? null : data.neighborhoodId || null,
        organizationId: organizationId,
        adminIds: adminIds,
        responsiblePerson: data.responsiblePerson,
        responsiblePhone: data.responsiblePhone,
        subscriptionStatus: "inactive",
        isActive: true,
      });

      console.log(`[COMPLETE_REGISTRATION] Telegram group created: ID=${telegramGroup.id}, chatId=${groupChatId}, orgId=${organizationId}`);

      await bot.sendMessage(
        chatId,
        "✅ Guruh muvaffaqiyatli ro'yxatdan o'tkazildi!\n\n" +
          `📌 Guruh ID: ${telegramGroup.id}\n` +
          `📍 Hudud: ${locationStr}\n` +
          `🏛 Tashkilot: ${orgName}\n` +
          `👤 Mas'ul shaxs: ${data.responsiblePerson}\n` +
          `📞 Telefon: ${data.responsiblePhone}\n\n` +
          "⚠️ Eslatma: Guruh obunasi hozircha INACTIVE.\n" +
          "Murojaatlar qabul qilish uchun obunani faollashtirish kerak.\n\n" +
          "To'lov qilish uchun administrator bilan bog'laning."
      );

      // Notify group
      await bot.sendMessage(
        groupChatId,
        "✅ Guruh ro'yxatdan o'tkazildi!\n\n" +
          `📍 Hudud: ${locationStr}\n` +
          `🏛 Tashkilot: ${orgName}\n\n` +
          "Hozircha obuna INACTIVE. Murojaatlar qabul qilish uchun obunani faollashtirish kerak."
      );

      await stateService.clear(userId);
    } catch (error) {
      console.error("Registration error:", error);
      await bot.sendMessage(
        chatId,
        `❌ Xatolik yuz berdi: ${error.message}\n\nQayta urinib ko'ring.`
      );
    }
  }
}

module.exports = new GroupRegistrationHandlers();
