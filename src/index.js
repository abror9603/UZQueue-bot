require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const sequelize = require("./config/database");
const redisClient = require("./config/redis");
const i18n = require("./config/i18n");

// Import handlers
const commandHandlers = require("./handlers/commandHandlers");
const messageHandlers = require("./handlers/messageHandlers");
const callbackHandlers = require("./handlers/callbackHandlers");
const organizationHandlers = require("./handlers/organizationHandlers");

// Import services
const userService = require("./services/userService");
const stateService = require("./services/stateService");

// Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error(
    "ERROR: TELEGRAM_BOT_TOKEN is not set in environment variables!"
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Express app for webhook (optional, for production)
const app = express();
app.use(express.json());

// Initialize database connection
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Sync models (in production, use migrations)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: false });
      console.log("✅ Database models synced.");
    }
  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
  }
}

// Initialize Redis connection
async function initRedis() {
  try {
    await redisClient.ping();
    console.log("✅ Redis connection established.");
  } catch (error) {
    console.error("❌ Unable to connect to Redis:", error);
  }
}

// Initialize services
async function init() {
  await initDatabase();
  await initRedis();

  console.log("🤖 UZQueue Telegram Bot is running...");
}

// Register command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    await commandHandlers.handleStart(bot, msg);
  } catch (error) {
    console.error("Error in /start handler:", error);
  }
});

bot.onText(/\/help/, async (msg) => {
  try {
    await commandHandlers.handleHelp(bot, msg);
  } catch (error) {
    console.error("Error in /help handler:", error);
  }
});

bot.onText(/\/settings/, async (msg) => {
  try {
    await commandHandlers.handleSettings(bot, msg);
  } catch (error) {
    console.error("Error in /settings handler:", error);
  }
});

bot.onText(/\/register_org/, async (msg) => {
  try {
    await organizationHandlers.handleRegisterOrg(bot, msg);
  } catch (error) {
    console.error("Error in /register_org handler:", error);
  }
});

// Register callback query handlers
bot.on("callback_query", async (callbackQuery) => {
  try {
    await callbackHandlers.handleCallback(bot, callbackQuery);
  } catch (error) {
    console.error("Error in callback handler:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      show_alert: true,
    });
  }
});

// Register message handlers
bot.on("message", async (msg) => {
  try {
    // Skip commands
    if (msg.text && msg.text.startsWith("/")) {
      return;
    }

    // Get or create user
    const user = await userService.getOrCreateUser(msg.from);
    const language = await userService.getUserLanguage(user.telegramId);
    i18n.changeLanguage(language);

    // Get current step and section
    const currentStep = await stateService.getStep(user.telegramId);
    const currentSection = await stateService.getSection(user.telegramId);

    // Handle different message types
    if (msg.voice) {
      await messageHandlers.handleVoice(bot, msg, language, currentSection);
    } else if (msg.photo) {
      await messageHandlers.handlePhoto(bot, msg, language, currentSection);
    } else if (msg.text) {
      // Check if it's a join code
      if (msg.text.match(/^JOIN-ORG-\d+-[A-Z0-9]+$/)) {
        await organizationHandlers.handleJoinCode(bot, msg, language, msg.text);
      } else {
        await messageHandlers.handleText(
          bot,
          msg,
          language,
          currentStep,
          currentSection
        );
      }
    }
  } catch (error) {
    console.error("Error in message handler:", error);
    try {
      await bot.sendMessage(msg.chat.id, i18n.t("common.error"));
    } catch (sendError) {
      console.error("Error sending error message:", sendError);
    }
  }
});

// Handle errors
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

// Express routes (for webhook in production)
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "uzqueue-bot" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Express server listening on port ${PORT}`);
});

// Initialize and start bot
init().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await redisClient.quit();
  await sequelize.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await redisClient.quit();
  await sequelize.close();
  process.exit(0);
});

module.exports = { bot, app };
