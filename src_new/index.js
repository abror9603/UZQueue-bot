require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sequelize = require('./config/database');
const commandHandlers = require('./handlers/commandHandlers');
const callbackHandlers = require('./handlers/callbackHandlers');
const messageHandlers = require('./handlers/messageHandlers');

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

// Test database connection
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models (only in development)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
      console.log('✅ Database models ready');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
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
    console.error('Error in /start:', error);
  }
});

bot.onText(/\/status(?:\s+(.+))?/, async (msg, match) => {
  try {
    const appealId = match[1];
    await commandHandlers.handleStatus(bot, msg, appealId);
  } catch (error) {
    console.error('Error in /status:', error);
  }
});

bot.onText(/\/language/, async (msg) => {
  try {
    await commandHandlers.handleLanguage(bot, msg);
  } catch (error) {
    console.error('Error in /language:', error);
  }
});

bot.onText(/\/help/, async (msg) => {
  try {
    await commandHandlers.handleHelp(bot, msg);
  } catch (error) {
    console.error('Error in /help:', error);
  }
});

// Admin command: /admin_status <appeal_id> <status>
bot.onText(/\/admin_status\s+(\S+)\s+(\w+)/, async (msg, match) => {
  try {
    const appealId = match[1];
    const newStatus = match[2];
    await commandHandlers.handleAdminStatus(bot, msg, appealId, newStatus);
  } catch (error) {
    console.error('Error in /admin_status:', error);
  }
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
  try {
    await callbackHandlers.handleCallback(bot, callbackQuery);
  } catch (error) {
    console.error('Error in callback:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Xatolik yuz berdi',
      show_alert: true
    });
  }
});

// Message handler
bot.on('message', async (msg) => {
  try {
    // Skip commands (already handled)
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }
    await messageHandlers.handleMessage(bot, msg);
  } catch (error) {
    console.error('Error in message handler:', error);
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 UZQueue Bot is running...');

