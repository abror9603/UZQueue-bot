const premiumService = require("../services/premiumService");
const paymentService = require("../services/paymentService");
const Keyboard = require("../utils/keyboard");
const i18next = require("../config/i18n");
const userService = require("../services/userService");

class PremiumHandlers {
  /**
   * Show premium menu
   */
  async showPremiumMenu(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = await userService.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, "Iltimos, /start buyrug'ini yuboring");
      return;
    }

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    await bot.sendMessage(
      chatId,
      t("premium_menu", {
        defaultValue:
          "💎 Premium Tarif\n\nPremium tarif bilan quyidagi imtiyozlarga ega bo'lasiz:\n\n✨ Cheksiz murojaatlar\n✨ Birinchi navbatda javob\n✨ AI yordamchisi\n✨ Batafsil statistikalar\n\n💳 To'lov usulini tanlang:",
      }),
      Keyboard.getPaymentMethods(language)
    );
  }

  /**
   * Show premium status
   */
  async showPremiumStatus(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = await userService.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, "Iltimos, /start buyrug'ini yuboring");
      return;
    }

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const premiumInfo = await premiumService.getPremiumInfo(userId);

    let statusText = "";
    let expiresText = "";

    if (premiumInfo.isPremium) {
      statusText = t("premium_active", {
        defaultValue: "✅ Premium faol",
      });

      const expiresDate = new Date(premiumInfo.expiresAt).toLocaleDateString(
        language === "ru"
          ? "ru-RU"
          : language === "en"
          ? "en-US"
          : "uz-UZ"
      );

      expiresText = t("premium_expires", {
        date: expiresDate,
        days: premiumInfo.daysLeft,
        defaultValue: `📅 Premium muddati: ${expiresDate}\n⏰ Qolgan kunlar: ${premiumInfo.daysLeft}`,
      });
    } else {
      statusText = t("premium_inactive", {
        defaultValue: "❌ Premium faol emas",
      });

      if (premiumInfo.expiresAt) {
        expiresText = t("premium_expired", {
          defaultValue: "⏰ Premium muddati tugagan",
        });
      }
    }

    const statusMessage = t("premium_status", {
      status: statusText,
      expires: expiresText,
      defaultValue: `📊 Premium Holati\n\n${statusText}\n\n${expiresText}`,
    });

    await bot.sendMessage(
      chatId,
      statusMessage,
      Keyboard.getPremiumStatus(
        premiumInfo.isPremium,
        premiumInfo.expiresAt,
        premiumInfo.daysLeft,
        language
      )
    );
  }

  /**
   * Handle payment method selection
   */
  async handlePaymentMethodSelection(bot, callbackQuery, paymentMethod) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    if (paymentMethod === "payme" || paymentMethod === "payme_disabled") {
      // Payme is not available yet
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: t("payment_method_payme_disabled", {
          defaultValue:
            "⏳ Payme to'lov usuli hozircha ishlamaydi. Tez orada qo'shiladi.",
        }),
        show_alert: true,
      });
      return;
    }

    if (paymentMethod === "telegram_wallet") {
      // Create payment record
      const premiumDays = 30;
      const amount = 5.0; // 5 TON - adjust as needed

      const payment = await paymentService.createPayment(
        userId,
        "telegram_wallet",
        amount,
        premiumDays
      );

      // Generate invoice payload
      const payload = paymentService.generateInvoicePayload(payment.id);

      // Update payment with payload
      await paymentService.updatePaymentStatus(payment.id, "pending");
      await payment.update({
        telegramInvoicePayload: payload,
      });

      // Send invoice
      const invoiceMessage = t("premium_purchase_telegram_wallet", {
        amount: amount,
        days: premiumDays,
        defaultValue: `💳 Telegram Wallet orqali to'lov\n\n💰 Summa: ${amount} TON\n📅 Premium muddati: ${premiumDays} kun\n\nTo'lovni amalga oshirish uchun quyidagi tugmani bosing:`,
      });

      // Note: For Telegram Wallet (TON), you need to set up payment provider
      // For now, we'll use a simple invoice format
      // In production, you'll need to configure TELEGRAM_PAYMENT_PROVIDER_TOKEN
      // or use TonConnect for direct TON payments
      
      try {
        await bot.sendInvoice(chatId, {
          title: `Premium ${premiumDays} kun`,
          description: invoiceMessage,
          payload: payload,
          provider_token: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN || "", // Set in .env
          currency: "XTR", // TON currency code for Telegram
          prices: [
            {
              label: `Premium ${premiumDays} kun`,
              amount: Math.round(amount * 1000000000), // Convert to nanotons (1 TON = 1,000,000,000 nanotons)
            },
          ],
          start_parameter: `premium_${payment.id}`,
        });
      } catch (error) {
        console.error("Error sending invoice:", error);
        // Fallback: Show payment instructions
        await bot.sendMessage(
          chatId,
          `${invoiceMessage}\n\n⚠️ To'lovni amalga oshirish uchun administrator bilan bog'laning.\n\nPayment ID: ${payment.id}`,
          Keyboard.getPaymentMethods(language)
        );
      }
    }
  }

  /**
   * Handle successful payment (pre_checkout_query)
   */
  async handlePreCheckoutQuery(bot, preCheckoutQuery) {
    const userId = preCheckoutQuery.from.id;
    const payload = preCheckoutQuery.invoice_payload;

    // Find payment by payload
    const payment = await paymentService.getPaymentByInvoicePayload(payload);

    if (!payment) {
      await bot.answerPreCheckoutQuery(preCheckoutQuery.id, {
        ok: false,
        error_message: "Payment not found",
      });
      return;
    }

    // Verify payment belongs to user
    if (payment.userId !== userId) {
      await bot.answerPreCheckoutQuery(preCheckoutQuery.id, {
        ok: false,
        error_message: "Invalid payment",
      });
      return;
    }

    // Verify payment is still pending
    if (payment.status !== "pending") {
      await bot.answerPreCheckoutQuery(preCheckoutQuery.id, {
        ok: false,
        error_message: "Payment already processed",
      });
      return;
    }

    // Save pre_checkout_query_id
    await payment.update({
      telegramPreCheckoutQueryId: preCheckoutQuery.id,
    });

    // Approve payment
    await bot.answerPreCheckoutQuery(preCheckoutQuery.id, {
      ok: true,
    });
  }

  /**
   * Handle successful payment (successful_payment)
   */
  async handleSuccessfulPayment(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    if (!msg.successful_payment) {
      return;
    }

    const payload = msg.successful_payment.invoice_payload;
    const transactionId = msg.successful_payment.telegram_payment_charge_id;

    // Find payment
    const payment = await paymentService.getPaymentByInvoicePayload(payload);

    if (!payment) {
      await bot.sendMessage(
        chatId,
        t("error", { defaultValue: "❌ Xatolik yuz berdi." })
      );
      return;
    }

    // Process successful payment
    try {
      await paymentService.processSuccessfulPayment(
        payment.id,
        transactionId
      );

      const premiumInfo = await premiumService.getPremiumInfo(userId);

      const expiresDate = new Date(premiumInfo.expiresAt).toLocaleDateString(
        language === "ru"
          ? "ru-RU"
          : language === "en"
          ? "en-US"
          : "uz-UZ"
      );

      const successMessage = t("payment_success", {
        days: payment.premiumDays,
        expiresAt: expiresDate,
        defaultValue: `✅ To'lov muvaffaqiyatli amalga oshirildi!\n\n💎 Premium ${payment.premiumDays} kunga faollashtirildi.\n📅 Muddati: ${expiresDate}`,
      });

      await bot.sendMessage(chatId, successMessage, Keyboard.getMainMenu(language));
    } catch (error) {
      console.error("Payment processing error:", error);
      await bot.sendMessage(
        chatId,
        t("payment_failed", {
          reason: error.message,
          defaultValue: `❌ To'lov amalga oshirilmadi.\n\nSabab: ${error.message}`,
        })
      );
    }
  }
}

module.exports = new PremiumHandlers();

