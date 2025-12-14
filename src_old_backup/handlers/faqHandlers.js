// FAQ Handlers
// Handles frequently asked questions

const faqService = require("../services/faqService");
const userService = require("../services/userService");
const stateService = require("../services/stateService");
const i18n = require("../config/i18n");
const Keyboard = require("../utils/keyboard");

class FaqHandlers {
  /**
   * Show FAQ categories
   */
  async handleFaq(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    const categories = faqService.getFaqCategories(language);

    // Create inline keyboard with categories
    const inlineKeyboard = categories.map((category) => [
      {
        text: `${category.icon} ${category.name}`,
        callback_data: `faq_category_${category.id}`,
      },
    ]);

    inlineKeyboard.push([
      { text: i18n.t("common.back"), callback_data: "back_to_menu" },
    ]);

    const message =
      language === "uz"
        ? "❓ Tez-tez beriladigan savollar:\n\nKategoriyani tanlang:"
        : language === "ru"
        ? "❓ Часто задаваемые вопросы:\n\nВыберите категорию:"
        : "❓ Frequently Asked Questions:\n\nSelect a category:";

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  /**
   * Show questions in category
   */
  async handleCategory(bot, callbackQuery, categoryId, language) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    i18n.changeLanguage(language);

    const categories = faqService.getFaqCategories(language);
    const category = categories.find((cat) => cat.id === categoryId);

    if (!category) {
      await bot.sendMessage(chatId, i18n.t("common.error"));
      return;
    }

    // Create inline keyboard with questions
    const inlineKeyboard = category.questions.map((question, index) => [
      {
        text: `${index + 1}. ${question}`,
        callback_data: `faq_question_${categoryId}_${index}`,
      },
    ]);

    inlineKeyboard.push([
      { text: i18n.t("common.back"), callback_data: "faq_back" },
    ]);

    const message = `${category.icon} ${category.name}\n\nSavolni tanlang:`;

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  /**
   * Get answer for question
   */
  async handleQuestion(bot, callbackQuery, categoryId, questionIndex, language) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    await bot.answerCallbackQuery(callbackQuery.id, {
      text:
        language === "uz"
          ? "Javob tayyorlanmoqda..."
          : language === "ru"
          ? "Подготовка ответа..."
          : "Preparing answer...",
    });

    i18n.changeLanguage(language);

    const categories = faqService.getFaqCategories(language);
    const category = categories.find((cat) => cat.id === categoryId);

    if (!category || !category.questions[questionIndex]) {
      await bot.sendMessage(chatId, i18n.t("common.error"));
      return;
    }

    const question = category.questions[questionIndex];

    // Get answer using AI
    const answer = await faqService.getAnswer(question, categoryId, language);

    const inlineKeyboard = [
      [
        { text: i18n.t("common.back"), callback_data: `faq_category_${categoryId}` },
      ],
    ];

    await bot.editMessageText(
      `❓ ${question}\n\n💡 ${answer}`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }
    );
  }
}

module.exports = new FaqHandlers();

