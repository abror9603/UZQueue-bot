// Business Assistant Handlers
// Handles business assistant features

const businessAssistantService = require("../services/businessAssistantService");
const userService = require("../services/userService");
const stateService = require("../services/stateService");
const i18n = require("../config/i18n");
const Keyboard = require("../utils/keyboard");

class BusinessHandlers {
  /**
   * Show business assistant categories
   */
  async handleBusinessAssistant(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    const categories = businessAssistantService.getBusinessCategories(language);

    // Create inline keyboard with categories
    const inlineKeyboard = categories.map((category) => [
      {
        text: `${category.icon} ${category.name}`,
        callback_data: `business_category_${category.id}`,
      },
    ]);

    inlineKeyboard.push([
      { text: i18n.t("common.back"), callback_data: "back_to_menu" },
    ]);

    const message =
      language === "uz"
        ? "💼 Biznes yordamchisi:\n\nKategoriyani tanlang:"
        : language === "ru"
        ? "💼 Бизнес-помощник:\n\nВыберите категорию:"
        : "💼 Business Assistant:\n\nSelect a category:";

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  /**
   * Handle category selection
   */
  async handleCategory(bot, callbackQuery, categoryId, language) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    i18n.changeLanguage(language);

    const categories = businessAssistantService.getBusinessCategories(language);
    const category = categories.find((cat) => cat.id === categoryId);

    if (!category) {
      await bot.sendMessage(chatId, i18n.t("common.error"));
      return;
    }

    // Set state for collecting request
    await stateService.setSection(userId, "business_assistant");
    await stateService.setStep(userId, `waiting_${categoryId}`);
    await stateService.setData(userId, "business_category", categoryId);
    await userService.updateUserStep(
      userId,
      `waiting_${categoryId}`,
      "business_assistant"
    );

    const prompt =
      language === "uz"
        ? `${category.icon} ${category.name}\n\n${category.description}\n\nSo'rovingizni yuboring:`
        : language === "ru"
        ? `${category.icon} ${category.name}\n\n${category.description}\n\nОтправьте ваш запрос:`
        : `${category.icon} ${category.name}\n\n${category.description}\n\nSend your request:`;

    await bot.editMessageText(prompt, {
      chat_id: chatId,
      message_id: msg.message_id,
    });

    await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
  }

  /**
   * Process business request
   */
  async processRequest(bot, msg, language, text) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    const categoryId = await stateService.getData(userId, "business_category");

    if (!categoryId) {
      await bot.sendMessage(chatId, i18n.t("common.error"));
      return;
    }

    await bot.sendMessage(
      chatId,
      language === "uz"
        ? "💼 Tayyorlanmoqda..."
        : language === "ru"
        ? "💼 Подготавливается..."
        : "💼 Preparing..."
    );

    try {
      const content = await businessAssistantService.generateContent(
        categoryId,
        text,
        language
      );

      await bot.sendMessage(chatId, content, Keyboard.getMainMenu(language));

      // Clear state
      await stateService.clearState(userId);
      await userService.updateUserStep(userId, null, null);
    } catch (error) {
      console.error("Error processing business request:", error);
      await bot.sendMessage(chatId, i18n.t("common.error"), Keyboard.getMainMenu(language));
    }
  }
}

module.exports = new BusinessHandlers();

