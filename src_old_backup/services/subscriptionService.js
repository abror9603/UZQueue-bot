// Subscription Service
// Manages user subscriptions and premium features

const { User } = require("../models");
const pricingService = require("./pricingService");

class SubscriptionService {
  /**
   * Subscription types
   */
  getSubscriptionTypes() {
    return {
      free: "free",
      premium: "premium",
      business: "business",
      enterprise: "enterprise",
    };
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId) {
    try {
      const user = await User.findOne({ where: { telegramId: userId } });
      return {
        type: user?.subscriptionType || "free",
        expiresAt: user?.subscriptionExpiresAt || null,
        isActive: this.isSubscriptionActive(user?.subscriptionExpiresAt),
      };
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return { type: "free", expiresAt: null, isActive: false };
    }
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
  }

  /**
   * Check if user has access to feature
   */
  async hasAccess(userId, featureName, stage = 1) {
    const subscription = await this.getUserSubscription(userId);
    const pricing = pricingService.getStage1Pricing();

    // Premium users have unlimited access
    if (subscription.type === "premium" || subscription.type === "business") {
      return { hasAccess: true, reason: "premium" };
    }

    // Check if feature is free
    if (pricing.free[featureName]) {
      return { hasAccess: true, reason: "free" };
    }

    // Paid feature - requires payment
    return {
      hasAccess: false,
      reason: "payment_required",
      price: pricingService.getFeaturePrice(featureName, stage),
    };
  }

  /**
   * Get subscription benefits
   */
  getSubscriptionBenefits(subscriptionType, language = "uz") {
    const benefits = {
      uz: {
        free: [
          "AI maslahat (10 ta/kun)",
          "Hujjat matni (5 ta/kun)",
          "Ovozdan matnga (10 ta/kun)",
          "FAQ (cheksiz)",
          "Oddiy navbat raqami",
        ],
        premium: [
          "Cheksiz AI maslahat",
          "Cheksiz hujjatlar",
          "PDF generatsiya",
          "Hujjat tekshirish",
          "Ovozli yordamchi",
          "Premium qo'llab-quvvatlash",
        ],
        business: [
          "Barcha Premium funksiyalar",
          "Mini CRM",
          "Shartnoma generatsiyasi",
          "Prioritet qo'llab-quvvatlash",
          "API integratsiya",
        ],
      },
      ru: {
        free: [
          "AI консультации (10/день)",
          "Текст документов (5/день)",
          "Голос в текст (10/день)",
          "FAQ (безлимит)",
          "Простой номер очереди",
        ],
        premium: [
          "Безлимитные AI консультации",
          "Безлимитные документы",
          "Генерация PDF",
          "Проверка документов",
          "Голосовой помощник",
          "Премиум поддержка",
        ],
        business: [
          "Все премиум функции",
          "Мини CRM",
          "Генерация договоров",
          "Приоритетная поддержка",
          "API интеграция",
        ],
      },
      en: {
        free: [
          "AI Advice (10/day)",
          "Document Text (5/day)",
          "Voice to Text (10/day)",
          "FAQ (unlimited)",
          "Simple Queue Number",
        ],
        premium: [
          "Unlimited AI Advice",
          "Unlimited Documents",
          "PDF Generation",
          "Document Check",
          "Voice Assistant",
          "Premium Support",
        ],
        business: [
          "All Premium Features",
          "Mini CRM",
          "Contract Generation",
          "Priority Support",
          "API Integration",
        ],
      },
    };

    return benefits[language]?.[subscriptionType] || benefits.uz[subscriptionType] || [];
  }

  /**
   * Format subscription info
   */
  formatSubscriptionInfo(subscription, language = "uz") {
    const types = {
      uz: {
        free: "Bepul",
        premium: "Premium",
        business: "Biznes",
        enterprise: "Enterprise",
      },
      ru: {
        free: "Бесплатно",
        premium: "Премиум",
        business: "Бизнес",
        enterprise: "Корпоративный",
      },
      en: {
        free: "Free",
        premium: "Premium",
        business: "Business",
        enterprise: "Enterprise",
      },
    };

    const typeName = types[language]?.[subscription.type] || subscription.type;
    const benefits = this.getSubscriptionBenefits(subscription.type, language);

    let message =
      language === "uz"
        ? `📋 Obuna: ${typeName}\n\n`
        : language === "ru"
        ? `📋 Подписка: ${typeName}\n\n`
        : `📋 Subscription: ${typeName}\n\n`;

    if (subscription.expiresAt && subscription.isActive) {
      const expiresDate = new Date(subscription.expiresAt).toLocaleDateString(
        language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US"
      );
      message +=
        language === "uz"
          ? `⏰ Tugaydi: ${expiresDate}\n\n`
          : language === "ru"
          ? `⏰ Истекает: ${expiresDate}\n\n`
          : `⏰ Expires: ${expiresDate}\n\n`;
    }

    message +=
      language === "uz"
        ? "✨ Imkoniyatlar:\n"
        : language === "ru"
        ? "✨ Возможности:\n"
        : "✨ Features:\n";

    benefits.forEach((benefit) => {
      message += `• ${benefit}\n`;
    });

    return message;
  }
}

module.exports = new SubscriptionService();

