// Premium Handlers
// Handles premium features and payments

const subscriptionService = require("../services/subscriptionService");
const pricingService = require("../services/pricingService");
const usageTrackingService = require("../services/usageTrackingService");
const userService = require("../services/userService");
const i18n = require("../config/i18n");
const Keyboard = require("../utils/keyboard");

class PremiumHandlers {
  /**
   * Show premium/subscription menu
   */
  async handlePremium(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    const subscription = await subscriptionService.getUserSubscription(userId);
    const subscriptionInfo = subscriptionService.formatSubscriptionInfo(
      subscription,
      language
    );

    // Create inline keyboard
    const inlineKeyboard = [
      [
        {
          text:
            language === "uz"
              ? "💎 Premium obuna"
              : language === "ru"
              ? "💎 Премиум подписка"
              : "💎 Premium Subscription",
          callback_data: "premium_subscribe",
        },
      ],
      [
        {
          text:
            language === "uz"
              ? "💼 Biznes obuna"
              : language === "ru"
              ? "💼 Бизнес подписка"
              : "💼 Business Subscription",
          callback_data: "business_subscribe",
        },
      ],
      [
        {
          text:
            language === "uz"
              ? "📊 Foydalanish statistikasi"
              : language === "ru"
              ? "📊 Статистика использования"
              : "📊 Usage Statistics",
          callback_data: "usage_stats",
        },
      ],
      [
        {
          text: i18n.t("common.back"),
          callback_data: "back_to_menu",
        },
      ],
    ];

    await bot.sendMessage(chatId, subscriptionInfo, {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  /**
   * Show pricing plans
   */
  async handlePricing(bot, callbackQuery, planType, language) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    i18n.changeLanguage(language);

    const pricing = pricingService.getStage2Pricing();
    const plan = pricing.subscription[planType];

    if (!plan) {
      await bot.sendMessage(chatId, i18n.t("common.error"));
      return;
    }

    const priceText = pricingService.formatPrice(plan.price, "UZS");
    const benefits = subscriptionService.getSubscriptionBenefits(planType, language);

    let message =
      language === "uz"
        ? `💎 ${planType === "premium" ? "Premium" : "Biznes"} Obuna\n\n`
        : language === "ru"
        ? `💎 ${planType === "premium" ? "Премиум" : "Бизнес"} Подписка\n\n`
        : `💎 ${planType === "premium" ? "Premium" : "Business"} Subscription\n\n`;

    message +=
      language === "uz"
        ? `💰 Narx: ${priceText}/oy\n\n`
        : language === "ru"
        ? `💰 Цена: ${priceText}/мес\n\n`
        : `💰 Price: ${priceText}/month\n\n`;

    message +=
      language === "uz"
        ? "✨ Imkoniyatlar:\n"
        : language === "ru"
        ? "✨ Возможности:\n"
        : "✨ Features:\n";

    benefits.forEach((benefit) => {
      message += `• ${benefit}\n`;
    });

    message +=
      language === "uz"
        ? "\n⚠️ Eslatma: To'lov tizimi Stage 2 da faollashtiriladi."
        : language === "ru"
        ? "\n⚠️ Примечание: Система оплаты будет активирована на Stage 2."
        : "\n⚠️ Note: Payment system will be activated in Stage 2.";

    const inlineKeyboard = [
      [
        {
          text:
            language === "uz"
              ? "💳 Obuna bo'lish"
              : language === "ru"
              ? "💳 Подписаться"
              : "💳 Subscribe",
          callback_data: `subscribe_${planType}`,
        },
      ],
      [
        {
          text: i18n.t("common.back"),
          callback_data: "premium_menu",
        },
      ],
    ];

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  /**
   * Show usage statistics
   */
  async handleUsageStats(bot, callbackQuery, language) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    i18n.changeLanguage(language);

    const stats = await usageTrackingService.getUserStats(userId);
    const subscription = await subscriptionService.getUserSubscription(userId);

    let message =
      language === "uz"
        ? "📊 Foydalanish statistikasi (bugun)\n\n"
        : language === "ru"
        ? "📊 Статистика использования (сегодня)\n\n"
        : "📊 Usage Statistics (today)\n\n";

    if (subscription.type === "premium" || subscription.type === "business") {
      message +=
        language === "uz"
          ? "✨ Siz Premium obunaga egasiz - cheksiz foydalanish!\n"
          : language === "ru"
          ? "✨ У вас премиум подписка - безлимитное использование!\n"
          : "✨ You have Premium subscription - unlimited usage!\n";
    } else {
      message +=
        language === "uz"
          ? "📈 Bugun foydalanish:\n"
          : language === "ru"
          ? "📈 Использование сегодня:\n"
          : "📈 Usage today:\n";

      const limits = {
        aiAdvice: 10,
        documentText: 5,
        voiceToText: 10,
      };

      Object.entries(stats).forEach(([feature, count]) => {
        const limit = limits[feature] || 0;
        const featureName =
          language === "uz"
            ? {
                aiAdvice: "AI maslahat",
                documentText: "Hujjat matni",
                voiceToText: "Ovozdan matnga",
              }[feature] || feature
            : language === "ru"
            ? {
                aiAdvice: "AI консультации",
                documentText: "Текст документов",
                voiceToText: "Голос в текст",
              }[feature] || feature
            : {
                aiAdvice: "AI Advice",
                documentText: "Document Text",
                voiceToText: "Voice to Text",
              }[feature] || feature;

        message += `• ${featureName}: ${count}/${limit}\n`;
      });
    }

    const inlineKeyboard = [
      [
        {
          text: i18n.t("common.back"),
          callback_data: "premium_menu",
        },
      ],
    ];

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  /**
   * Check feature access before use
   */
  async checkFeatureAccess(bot, msg, featureName, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const access = await subscriptionService.hasAccess(userId, featureName);

    if (!access.hasAccess) {
      if (access.reason === "payment_required") {
        const pricingInfo = pricingService.getPricingInfo(featureName);
        const message =
          language === "uz"
            ? `💰 Bu funksiya pullik.\n\nNarx: ${pricingInfo.price}\n\nPremium obuna oling yoki to'lov qiling.`
            : language === "ru"
            ? `💰 Эта функция платная.\n\nЦена: ${pricingInfo.price}\n\nОформите премиум подписку или оплатите.`
            : `💰 This feature is paid.\n\nPrice: ${pricingInfo.price}\n\nSubscribe to Premium or make payment.`;

        await bot.sendMessage(chatId, message, Keyboard.getMainMenu(language));
        return false;
      }
    }

    return true;
  }
}

module.exports = new PremiumHandlers();

