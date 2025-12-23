require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const sequelize = require("./config/database");
const commandHandlers = require("./handlers/commandHandlers");
const callbackHandlers = require("./handlers/callbackHandlers");
const messageHandlers = require("./handlers/messageHandlers");
const groupRegistrationHandlers = require("./handlers/groupRegistrationHandlers");
const replyHandlers = require("./handlers/replyHandlers");

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// Test database connection
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync models (only in development)
    if (process.env.NODE_ENV === "development") {
      // await sequelize.sync({ alter: true });
      console.log("✅ Database models ready");
    }
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
}

// Initialize
initializeDatabase();

// Command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    await commandHandlers.handleStart(bot, msg);
  } catch (error) {
    console.error("Error in /start:", error);
  }
});

bot.onText(/\/status(?:\s+(.+))?/, async (msg, match) => {
  try {
    const appealId = match[1];
    await commandHandlers.handleStatus(bot, msg, appealId);
  } catch (error) {
    console.error("Error in /status:", error);
  }
});

bot.onText(/\/language/, async (msg) => {
  try {
    await commandHandlers.handleLanguage(bot, msg);
  } catch (error) {
    console.error("Error in /language:", error);
  }
});

bot.onText(/\/help/, async (msg) => {
  try {
    await commandHandlers.handleHelp(bot, msg);
  } catch (error) {
    console.error("Error in /help:", error);
  }
});

// Admin command: /admin_status <appeal_id> <status>
bot.onText(/\/admin_status\s+(\S+)\s+(\w+)/, async (msg, match) => {
  try {
    const appealId = match[1];
    const newStatus = match[2];
    await commandHandlers.handleAdminStatus(bot, msg, appealId, newStatus);
  } catch (error) {
    console.error("Error in /admin_status:", error);
  }
});

// Group registration command
bot.onText(/\/register_group/, async (msg) => {
  try {
    await groupRegistrationHandlers.handleRegisterGroup(bot, msg);
  } catch (error) {
    console.error("Error in /register_group:", error);
  }
});

// Status commands in groups
bot.onText(
  /\/status\s+(bajarildi|rad_etildi|jarayonda)/,
  async (msg, match) => {
    try {
      const newStatus = match[1];
      await commandHandlers.handleGroupStatus(bot, msg, newStatus);
    } catch (error) {
      console.error("Error in /status command:", error);
    }
  }
);

// Callback query handler
bot.on("callback_query", async (callbackQuery) => {
  try {
    await callbackHandlers.handleCallback(bot, callbackQuery);
  } catch (error) {
    console.error("Error in callback:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Xatolik yuz berdi",
      show_alert: true,
    });
  }
});

// Message handler
bot.on("message", async (msg) => {
  try {
    // Skip commands (already handled), but allow /skip in appeal flow
    if (msg.text && msg.text.startsWith("/") && msg.text !== "/skip") {
      return;
    }

    // Check if user is in appeal flow and sharing contact
    // Contact sharing should be processed even if it's a reply
    if (msg.contact) {
      const stateService = require("./services/stateService");
      const step = await stateService.getStep(msg.from.id);
      // If in appeal or registration flow, process contact immediately
      if (step === "enter_phone" || step === "group_reg_enter_phone") {
        // Try group registration flow first
        const inRegistration =
          await groupRegistrationHandlers.processRegistrationStep(bot, msg);
        if (inRegistration) {
          return;
        }
        // Then try appeal flow
        await messageHandlers.handleMessage(bot, msg);
        return;
      }
    }

    // Handle replies to bot messages (group responses)
    // But skip if it's a contact (already handled above)
    if (
      msg.reply_to_message &&
      msg.reply_to_message.from.id === (await bot.getMe()).id &&
      !msg.contact
    ) {
      await replyHandlers.handleReply(bot, msg);
      return;
    }

    // Try group registration flow first
    const inRegistration =
      await groupRegistrationHandlers.processRegistrationStep(bot, msg);
    if (inRegistration) {
      return;
    }

    // Regular message handling
    await messageHandlers.handleMessage(bot, msg);
  } catch (error) {
    console.error("Error in message handler:", error);
  }
});

// Handle pre-checkout query (before payment confirmation)
bot.on("pre_checkout_query", async (preCheckoutQuery) => {
  try {
    const premiumHandlers = require("./handlers/premiumHandlers");
    await premiumHandlers.handlePreCheckoutQuery(bot, preCheckoutQuery);
  } catch (error) {
    console.error("Error in pre_checkout_query:", error);
    await bot.answerPreCheckoutQuery(preCheckoutQuery.id, {
      ok: false,
      error_message: "Payment verification failed",
    });
  }
});

// Handle successful payment
bot.on("successful_payment", async (msg) => {
  try {
    const premiumHandlers = require("./handlers/premiumHandlers");
    await premiumHandlers.handleSuccessfulPayment(bot, msg);
  } catch (error) {
    console.error("Error processing successful payment:", error);
  }
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

console.log("🤖 UZQueue Bot is running...");
