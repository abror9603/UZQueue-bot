const { TelegramGroup } = require("../models");
const locationService = require("../services/locationService");
const organizationService = require("../services/organizationService");
const stateService = require("../services/stateService");
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
      where: { chatId: chatId.toString() },
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

    // Redirect to private chat
    await bot.sendMessage(
      chatId,
      "📝 Guruhni ro'yxatdan o'tkazish uchun bot bilan shaxsiy chatda davom eting:\n\n" +
        "👉 @" +
        (
          await bot.getMe()
        ).username
    );

    // Start registration in private chat
    const privateChatId = userId;
    await this.startRegistration(bot, privateChatId, chatId, userId);
  }

  /**
   * Start registration flow in private chat
   */
  async startRegistration(bot, chatId, groupChatId, userId) {
    i18next.changeLanguage("uz");
    const t = i18next.t;

    // Store registration data
    await stateService.setStep(userId, "group_reg_select_type");
    await stateService.setData(userId, {
      groupChatId: groupChatId.toString(),
      groupTitle: (await bot.getChat(groupChatId)).title,
    });

    await bot.sendMessage(
      chatId,
      "📝 Guruhni ro'yxatdan o'tkazish\n\n" + "1️⃣ Guruh turini tanlang:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🏛 Viloyat hokimiyati",
                callback_data: "group_type_viloyat",
              },
            ],
            [{ text: "🏛 Tuman hokimiyati", callback_data: "group_type_tuman" }],
            [
              {
                text: "🏛 Shahar hokimiyati",
                callback_data: "group_type_shahar",
              },
            ],
            [{ text: "🏘 Mahalla", callback_data: "group_type_mahalla" }],
            [
              {
                text: "🏢 Boshqa davlat tashkiloti",
                callback_data: "group_type_boshqa",
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
    const data = (await stateService.getData(userId)) || {};

    if (!step || !step.startsWith("group_reg_")) {
      return false; // Not in registration flow
    }

    i18next.changeLanguage("uz");
    const t = i18next.t;

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
      case "boshqa":
        // Other: Ask for organization name
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
    await stateService.setData(userId, data);
    await stateService.setStep(userId, "group_reg_enter_phone");

    await bot.sendMessage(
      chatId,
      "📞 Mas'ul shaxs telefon raqamini kiriting:\n\n" + "Misol: +998901234567",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "◀️ Orqaga", callback_data: "group_back_to_responsible" },
              { text: "❌ Bekor qilish", callback_data: "cancel_group_reg" },
            ],
          ],
        },
      }
    );
  }

  async handlePhoneInput(bot, msg, text, data, userId) {
    const chatId = msg.chat.id;

    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(text)) {
      await bot.sendMessage(
        chatId,
        "❌ Telefon raqam noto'g'ri. Format: +998901234567"
      );
      return;
    }

    data.responsiblePhone = text.trim();
    await stateService.setData(userId, data);
    await stateService.setStep(userId, "group_reg_confirm");

    // Show confirmation
    await this.showConfirmation(bot, chatId, data, userId);
  }

  async showConfirmation(bot, chatId, data, userId) {
    try {
      // Build location string
      const regions = await locationService.getAllRegions("uz");
      const selectedRegion = regions.find((r) => r.id === data.regionId);
      let locationStr = selectedRegion ? selectedRegion.name : "";

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
        const neighborhoods = await locationService.getNeighborhoodsByDistrict(
          data.districtId,
          "uz"
        );
        const selectedNeighborhood = neighborhoods.find(
          (n) => n.id === data.neighborhoodId
        );
        if (selectedNeighborhood)
          locationStr += ` → ${selectedNeighborhood.name}`;
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

      // Get group type name
      const typeNames = {
        viloyat: "Viloyat hokimiyati",
        tuman: "Tuman hokimiyati",
        shahar: "Shahar hokimiyati",
        mahalla: "Mahalla",
        boshqa: "Boshqa davlat tashkiloti",
      };
      const typeName = typeNames[data.groupType] || data.groupType;

      const confirmationText =
        "📋 Ro'yxatdan o'tkazish ma'lumotlari:\n\n" +
        `🏛 Guruh turi: ${typeName}\n` +
        `📍 Hudud: ${locationStr}\n` +
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
              },
              { text: "❌ Bekor qilish", callback_data: "cancel_group_reg" },
            ],
            [{ text: "◀️ Orqaga", callback_data: "group_back_to_phone" }],
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

      // Handle organization: if organizationName is provided (for "boshqa" type), create organization entry
      let organizationId = data.organizationId;
      if (data.organizationName && !organizationId) {
        // Create a new organization entry for "other" type
        const newOrg = await Organization.create({
          nameUz: data.organizationName,
          nameRu: data.organizationName,
          nameEn: data.organizationName,
          code: `CUSTOM_${Date.now()}`,
          type: "other",
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

      // Build location string for confirmation
      const regions = await locationService.getAllRegions("uz");
      const selectedRegion = regions.find((r) => r.id === data.regionId);
      let locationStr = selectedRegion ? selectedRegion.name : "";

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
        const neighborhoods = await locationService.getNeighborhoodsByDistrict(
          data.districtId,
          "uz"
        );
        const selectedNeighborhood = neighborhoods.find(
          (n) => n.id === data.neighborhoodId
        );
        if (selectedNeighborhood)
          locationStr += ` → ${selectedNeighborhood.name}`;
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

      // Create telegram group record
      const telegramGroup = await TelegramGroup.create({
        chatId: groupChatId,
        chatTitle: data.groupTitle || chat.title,
        regionId: data.regionId,
        districtId: data.districtId || null,
        neighborhoodId: data.neighborhoodId || null,
        organizationId: organizationId,
        adminIds: adminIds,
        responsiblePerson: data.responsiblePerson,
        responsiblePhone: data.responsiblePhone,
        subscriptionStatus: "inactive",
        isActive: true,
      });

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
