// Organization Registration and Management Handlers

const organizationService = require("../services/organizationService");
const employeeService = require("../services/employeeService");
const userService = require("../services/userService");
const stateService = require("../services/stateService");
const i18n = require("../config/i18n");
const Keyboard = require("../utils/keyboard");

class OrganizationHandlers {
  /**
   * Handle /register_org command
   */
  async handleRegisterOrg(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Get or create user
    await userService.getOrCreateUser(msg.from);
    const language = await userService.getUserLanguage(userId);
    i18n.changeLanguage(language);

    // Check if user already has organization
    const existingOrg = await organizationService.getOrganizationByAdmin(
      userId
    );
    if (existingOrg) {
      const message =
        language === "uz"
          ? `Siz allaqachon tashkilot ro'yxatdan o'tkazgansiz.\nTashkilot: ${existingOrg.name}\nORG_ID: ${existingOrg.orgId}`
          : language === "ru"
          ? `Вы уже зарегистрировали организацию.\nОрганизация: ${existingOrg.name}\nORG_ID: ${existingOrg.orgId}`
          : `You have already registered an organization.\nOrganization: ${existingOrg.name}\nORG_ID: ${existingOrg.orgId}`;

      await bot.sendMessage(chatId, message, Keyboard.getMainMenu(language));
      return;
    }

    // Start registration flow
    await stateService.setSection(userId, "org_registration");
    await stateService.setStep(userId, "waiting_name");
    await userService.updateUserStep(
      userId,
      "waiting_name",
      "org_registration"
    );

    const prompt =
      language === "uz"
        ? "Tashkilot nomini kiriting:"
        : language === "ru"
        ? "Введите название организации:"
        : "Enter organization name:";

    await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
  }

  /**
   * Process organization registration step by step
   */
  async processOrgRegistration(bot, msg, language, text) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    const currentStep = await stateService.getStep(userId);

    try {
      if (currentStep === "waiting_name") {
        await stateService.setData(userId, "org_name", text);
        await stateService.setStep(userId, "waiting_type");
        await userService.updateUserStep(
          userId,
          "waiting_type",
          "org_registration"
        );

        const prompt =
          language === "uz"
            ? "Tashkilot turini tanlang:"
            : language === "ru"
            ? "Выберите тип организации:"
            : "Select organization type:";

        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text:
                    language === "uz"
                      ? "🏛️ Davlat"
                      : language === "ru"
                      ? "🏛️ Государственная"
                      : "🏛️ Government",
                  callback_data: "org_type_government",
                },
                {
                  text:
                    language === "uz"
                      ? "🏢 Xususiy"
                      : language === "ru"
                      ? "🏢 Частная"
                      : "🏢 Private",
                  callback_data: "org_type_private",
                },
              ],
            ],
          },
        };

        await bot.sendMessage(chatId, prompt, keyboard);
      } else if (currentStep === "waiting_address") {
        await stateService.setData(userId, "org_address", text);
        await stateService.setStep(userId, "waiting_owner");
        await userService.updateUserStep(
          userId,
          "waiting_owner",
          "org_registration"
        );

        const prompt =
          language === "uz"
            ? "Rahbar F.I.Sh ni kiriting:"
            : language === "ru"
            ? "Введите Ф.И.О. руководителя:"
            : "Enter owner full name:";

        await bot.sendMessage(
          chatId,
          prompt,
          Keyboard.getCancelKeyboard(language)
        );
      } else if (currentStep === "waiting_owner") {
        await stateService.setData(userId, "org_owner", text);
        await stateService.setStep(userId, "waiting_phone");
        await userService.updateUserStep(
          userId,
          "waiting_phone",
          "org_registration"
        );

        const prompt =
          language === "uz"
            ? "Telefon raqamini kiriting:"
            : language === "ru"
            ? "Введите номер телефона:"
            : "Enter phone number:";

        await bot.sendMessage(
          chatId,
          prompt,
          Keyboard.getCancelKeyboard(language)
        );
      } else if (currentStep === "waiting_phone") {
        await stateService.setData(userId, "org_phone", text);

        // Collect all data and register
        const orgData = {
          name: await stateService.getData(userId, "org_name"),
          type: await stateService.getData(userId, "org_type"),
          address: await stateService.getData(userId, "org_address"),
          owner: await stateService.getData(userId, "org_owner"),
          phone: text,
          telegramId: userId,
        };

        const result = await organizationService.registerOrganization(orgData);

        // Set org context
        await stateService.setOrgContext(userId, result.org_id);

        const successMessage =
          language === "uz"
            ? `✅ Tashkilot muvaffaqiyatli ro'yxatdan o'tkazildi!\n\n` +
              `Tashkilot: ${orgData.name}\n` +
              `ORG_ID: ${result.org_id}\n` +
              `Join Code: ${result.join_code}\n\n` +
              `Bu kodni xodimlarga yuboring.`
            : language === "ru"
            ? `✅ Организация успешно зарегистрирована!\n\n` +
              `Организация: ${orgData.name}\n` +
              `ORG_ID: ${result.org_id}\n` +
              `Join Code: ${result.join_code}\n\n` +
              `Отправьте этот код сотрудникам.`
            : `✅ Organization successfully registered!\n\n` +
              `Organization: ${orgData.name}\n` +
              `ORG_ID: ${result.org_id}\n` +
              `Join Code: ${result.join_code}\n\n` +
              `Send this code to employees.`;

        await bot.sendMessage(
          chatId,
          successMessage,
          Keyboard.getMainMenu(language)
        );

        // Clear registration state
        await stateService.clearState(userId);
        await userService.updateUserStep(userId, null, null);
      }
    } catch (error) {
      console.error("Error in org registration:", error);
      await bot.sendMessage(
        chatId,
        i18n.t("common.error"),
        Keyboard.getMainMenu(language)
      );
    }
  }

  /**
   * Handle organization type selection
   */
  async handleOrgTypeSelection(bot, callbackQuery, orgType) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    const language = await userService.getUserLanguage(userId);
    i18n.changeLanguage(language);

    await stateService.setData(userId, "org_type", orgType);
    await stateService.setStep(userId, "waiting_address");
    await userService.updateUserStep(
      userId,
      "waiting_address",
      "org_registration"
    );

    const prompt =
      language === "uz"
        ? "Manzilni kiriting:"
        : language === "ru"
        ? "Введите адрес:"
        : "Enter address:";

    await bot.editMessageText(prompt, {
      chat_id: chatId,
      message_id: msg.message_id,
    });

    await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
  }

  /**
   * Handle employee join code
   */
  async handleJoinCode(bot, msg, language, joinCode) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    try {
      // Verify and register employee
      const result = await employeeService.registerEmployee(joinCode, userId);

      if (result.status === "already_registered") {
        const message =
          language === "uz"
            ? `Siz allaqachon ro'yxatdan o'tgansiz.\nORG_ID: ${result.org_id}\nXodim ID: ${result.employee_id}`
            : language === "ru"
            ? `Вы уже зарегистрированы.\nORG_ID: ${result.org_id}\nID сотрудника: ${result.employee_id}`
            : `You are already registered.\nORG_ID: ${result.org_id}\nEmployee ID: ${result.employee_id}`;

        await bot.sendMessage(chatId, message, Keyboard.getMainMenu(language));
        await stateService.setOrgContext(userId, result.org_id);
        return;
      }

      // Set org context
      await stateService.setOrgContext(userId, result.org_id);

      const successMessage =
        language === "uz"
          ? `✅ Xodim sifatida ro'yxatdan o'tdingiz!\n\n` +
            `ORG_ID: ${result.org_id}\n` +
            `Xodim ID: ${result.employee_id}\n` +
            `Rol: ${result.role === "admin" ? "Admin" : "Xodim"}`
          : language === "ru"
          ? `✅ Вы зарегистрированы как сотрудник!\n\n` +
            `ORG_ID: ${result.org_id}\n` +
            `ID сотрудника: ${result.employee_id}\n` +
            `Роль: ${result.role === "admin" ? "Админ" : "Сотрудник"}`
          : `✅ Registered as employee!\n\n` +
            `ORG_ID: ${result.org_id}\n` +
            `Employee ID: ${result.employee_id}\n` +
            `Role: ${result.role === "admin" ? "Admin" : "Staff"}`;

      await bot.sendMessage(
        chatId,
        successMessage,
        Keyboard.getMainMenu(language)
      );
    } catch (error) {
      console.error("Error joining organization:", error);

      const errorMessage =
        language === "uz"
          ? "Noto'g'ri join code. Iltimos, tekshirib qayta urinib ko'ring."
          : language === "ru"
          ? "Неверный join code. Пожалуйста, проверьте и попробуйте снова."
          : "Invalid join code. Please check and try again.";

      await bot.sendMessage(
        chatId,
        errorMessage,
        Keyboard.getMainMenu(language)
      );
    }
  }

  /**
   * Get user's current organization context
   */
  async getUserOrgContext(userId) {
    try {
      // First check Redis cache
      let orgId = await stateService.getOrgContext(userId);

      if (orgId) {
        return orgId;
      }

      // If not in cache, check database
      orgId = await organizationService.getUserOrgContext(userId);

      if (orgId) {
        // Cache it
        await stateService.setOrgContext(userId, orgId);
        return orgId;
      }

      return null;
    } catch (error) {
      console.error("Error getting user org context:", error);
      return null;
    }
  }

  /**
   * Ensure org_id is set before operations
   */
  async ensureOrgContext(bot, msg, language) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const orgId = await this.getUserOrgContext(userId);

    if (!orgId) {
      const message =
        language === "uz"
          ? "Siz hali tashkilotga biriktirilmagansiz.\n\n" +
            "Tashkilot admini bo'lsangiz: /register_org\n" +
            "Xodim bo'lsangiz: Join code yuboring (JOIN-ORG-X-XXXXX)"
          : language === "ru"
          ? "Вы еще не привязаны к организации.\n\n" +
            "Если вы администратор организации: /register_org\n" +
            "Если вы сотрудник: отправьте Join code (JOIN-ORG-X-XXXXX)"
          : "You are not linked to an organization yet.\n\n" +
            "If you are organization admin: /register_org\n" +
            "If you are employee: send Join code (JOIN-ORG-X-XXXXX)";

      await bot.sendMessage(chatId, message, Keyboard.getMainMenu(language));
      return null;
    }

    return orgId;
  }
}

module.exports = new OrganizationHandlers();
