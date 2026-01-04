/**
 * Bot Initialization
 * Sets up Telegraf bot with all middleware and handlers
 */

import { Telegraf, session } from 'telegraf';
import { ExtendedContext } from './types/context';
import { getEnv } from './config/env';
import { database } from './config/database';
import { log } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';
import { loadUserMiddleware } from './middleware/auth';

// Initialize bot
const env = getEnv();
const bot = new Telegraf<ExtendedContext>(env.BOT_TOKEN);

// ================================
// SESSION MIDDLEWARE
// ================================

bot.use(session({
  defaultSession: () => ({
    step: undefined,
    data: {}
  })
}));

// ================================
// CUSTOM MIDDLEWARE
// ================================
// 
// MIDDLEWARE ORDER IS CRITICAL:
// 1. Logging first (to capture all updates, even failures)
// 2. Rate limiting (before expensive operations)
// 3. User loading (after rate limit, before handlers)
//
// All middleware must be defensive and handle undefined/incomplete contexts

// Logging (first - to log everything)
bot.use(loggingMiddleware());

// Load user from database
bot.use(loadUserMiddleware());

// ================================
// ERROR HANDLING
// ================================

bot.catch(errorHandler);

// ================================
// COMMAND HANDLERS
// ================================

import { handleStart, handleHelp, handleOnboardingCallback, handleContact } from './handlers/userHandlers';
import { handleTextRequest, handleMediaRequest, handleVoiceRequest, handleTrack, handleMyRequests } from './handlers/requestHandlers';

// /start command
bot.command('start', handleStart);

// /help command
bot.command('help', handleHelp);

// /track command
bot.command('track', handleTrack);

// /my_requests command
bot.command('my_requests', handleMyRequests);

// Admin commands
import {
  handleAdminRegister,
  handleAdminDashboard,
  handleAdminRequests,
  handleAdminRespond,
  handleAdminResponseText,
  handleAdminVerify
} from './handlers/adminHandlers';

// /admin_register command
bot.command('admin_register', handleAdminRegister);

// /admin_dashboard command
bot.command('admin_dashboard', handleAdminDashboard);

// /admin_requests command
bot.command('admin_requests', handleAdminRequests);

// /admin_respond command
bot.command('admin_respond', handleAdminRespond);

// /admin_verify command (super admin only)
bot.command('admin_verify', handleAdminVerify);

// Callback queries
bot.on('callback_query', async (ctx) => {
  // Type guard: Check if callback query has data (not a game query)
  if (!('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery().catch(() => { });
    return;
  }

  const data = ctx.callbackQuery.data;

  if (data?.startsWith('onboarding_')) {
    await handleOnboardingCallback(ctx);
    return;
  }

  // Help handlers
  if (data === 'help' ||
    data === 'help_guide' ||
    data === 'help_faq' ||
    data === 'help_contact' ||
    data === 'help_example' ||
    data === 'contact_message' ||
    data?.startsWith('faq_')) {
    const {
      handleHelp,
      handleHelpGuide,
      handleHelpFaq,
      handleHelpContact,
      handleHelpExample,
      handleContactMessage,
      handleFaq1,
      handleFaq2,
      handleFaq3,
      handleFaq4,
      handleFaq5
    } = await import('./handlers/helpHandlers');

    if (data === 'help') {
      await handleHelp(ctx);
      return;
    }

    if (data === 'help_guide') {
      await handleHelpGuide(ctx);
      return;
    }

    if (data === 'help_faq') {
      await handleHelpFaq(ctx);
      return;
    }

    if (data === 'help_contact') {
      await handleHelpContact(ctx);
      return;
    }

    if (data === 'help_example') {
      await handleHelpExample(ctx);
      return;
    }

    if (data === 'contact_message') {
      await handleContactMessage(ctx);
      return;
    }

    if (data === 'faq_1') {
      await handleFaq1(ctx);
      return;
    }

    if (data === 'faq_2') {
      await handleFaq2(ctx);
      return;
    }

    if (data === 'faq_3') {
      await handleFaq3(ctx);
      return;
    }

    if (data === 'faq_4') {
      await handleFaq4(ctx);
      return;
    }

    if (data === 'faq_5') {
      await handleFaq5(ctx);
      return;
    }
  }

  // Queue booking handlers
  if (data?.startsWith('org_') ||
    data?.startsWith('service_') ||
    data?.startsWith('date_') ||
    data?.startsWith('time_') ||
    data?.startsWith('confirm_booking_') ||
    data?.startsWith('request_') ||
    data === 'back_to_main' ||
    data?.startsWith('back_to_services_') ||
    data?.startsWith('back_to_date_') ||
    data === 'help' ||
    data === 'settings' ||
    data === 'settings_language' ||
    data?.startsWith('settings_change_lang_') ||
    data === 'my_queues') {
    const {
      handleOrganizationSelection,
      handleServiceSelection,
      handleDateSelection,
      handleTimeSelection,
      handleBookingConfirmation,
      handleRequestButton,
      handleBackToMain,
      handleBackToServices,
      handleBackToDate,
      handleHelp,
      handleSettings,
      handleLanguageSettings,
      handleLanguageChange,
      handleMyQueues
    } = await import('./handlers/queueHandlers');

    if (data?.startsWith('org_')) {
      await handleOrganizationSelection(ctx);
      return;
    }

    if (data?.startsWith('service_')) {
      await handleServiceSelection(ctx);
      return;
    }

    if (data?.startsWith('date_')) {
      await handleDateSelection(ctx);
      return;
    }

    if (data?.startsWith('time_')) {
      await handleTimeSelection(ctx);
      return;
    }

    if (data?.startsWith('confirm_booking_')) {
      await handleBookingConfirmation(ctx);
      return;
    }

    if (data?.startsWith('request_')) {
      await handleRequestButton(ctx);
      return;
    }

    if (data === 'back_to_main') {
      await handleBackToMain(ctx);
      return;
    }

    if (data?.startsWith('back_to_services_')) {
      await handleBackToServices(ctx);
      return;
    }

    if (data?.startsWith('back_to_date_')) {
      await handleBackToDate(ctx);
      return;
    }

    if (data === 'settings') {
      await handleSettings(ctx);
      return;
    }

    if (data === 'settings_language') {
      await handleLanguageSettings(ctx);
      return;
    }

    if (data?.startsWith('settings_change_lang_')) {
      await handleLanguageChange(ctx);
      return;
    }

    if (data === 'my_queues') {
      await handleMyQueues(ctx);
      return;
    }
  }

  // Answer callback query
  await ctx.answerCbQuery().catch(() => { });
});

// Contact sharing
bot.on('contact', handleContact);

// Text messages (requests or admin responses)
bot.on('text', async (ctx) => {
  // Check if admin is responding
  if (ctx.session?.step === 'admin_respond') {
    const { handleAdminResponseText } = await import('./handlers/adminHandlers');
    await handleAdminResponseText(ctx);
    return;
  }

  // Check if user is sending support message
  if (ctx.session?.step === 'WAITING_FOR_SUPPORT_MESSAGE') {
    const { handleSupportMessage } = await import('./handlers/helpHandlers');
    await handleSupportMessage(ctx);
    return;
  }

  // Check for menu buttons (organizations, help, settings)
  const text = ctx.message.text?.trim() || '';
  const language = ctx.language || 'uz';

  // Check if text matches organization buttons
  const orgTexts = {
    uz: {
      hokimlik: ['🏛 hokimlik xizmatlari', 'hokimlik xizmatlari', 'hokimlik'],
      soliq: ['💰 soliq inspeksiyasi', 'soliq inspeksiyasi', 'soliq'],
      kommunal: ['🏘 kommunal xizmatlar', 'kommunal xizmatlar', 'kommunal']
    },
    ru: {
      hokimlik: ['🏛 услуги хокимията', 'услуги хокимията', 'хокимият'],
      soliq: ['💰 налоговая инспекция', 'налоговая инспекция', 'налоговая'],
      kommunal: ['🏘 коммунальные услуги', 'коммунальные услуги', 'коммунальные']
    },
    en: {
      hokimlik: ['🏛 mayor\'s office', 'mayor\'s office', 'mayor'],
      soliq: ['💰 tax inspection', 'tax inspection', 'tax'],
      kommunal: ['🏘 utility services', 'utility services', 'utility']
    }
  };

  const orgMatches = orgTexts[language as keyof typeof orgTexts] || orgTexts.uz;

  // Check for organizations
  if (orgMatches.hokimlik.some(ot => text.toLowerCase() === ot.toLowerCase())) {
    const { handleOrganizationSelection } = await import('./handlers/queueHandlers');
    await handleOrganizationSelection(ctx);
    return;
  }

  if (orgMatches.soliq.some(ot => text.toLowerCase() === ot.toLowerCase())) {
    const { handleOrganizationSelection } = await import('./handlers/queueHandlers');
    await handleOrganizationSelection(ctx);
    return;
  }

  if (orgMatches.kommunal.some(ot => text.toLowerCase() === ot.toLowerCase())) {
    const { handleOrganizationSelection } = await import('./handlers/queueHandlers');
    await handleOrganizationSelection(ctx);
    return;
  }

  // Check if text matches help button
  const helpTexts = {
    uz: ['ℹ️ yordam', 'yordam'],
    ru: ['ℹ️ помощь', 'помощь'],
    en: ['ℹ️ help', 'help']
  };

  // Check if text matches settings button
  const settingsTexts = {
    uz: ['⚙️ sozlamalar', 'sozlamalar'],
    ru: ['⚙️ настройки', 'настройки'],
    en: ['⚙️ settings', 'settings']
  };

  const helpMatches = helpTexts[language as keyof typeof helpTexts] || helpTexts.uz;
  const settingsMatches = settingsTexts[language as keyof typeof settingsTexts] || settingsTexts.uz;

  if (helpMatches.some(ht => text.toLowerCase() === ht.toLowerCase())) {
    const { handleHelp } = await import('./handlers/queueHandlers');
    await handleHelp(ctx);
    return;
  }

  if (settingsMatches.some(st => text.toLowerCase() === st.toLowerCase())) {
    const { handleSettings } = await import('./handlers/queueHandlers');
    await handleSettings(ctx);
    return;
  }

  // Regular text request
  await handleTextRequest(ctx);
});

// Media messages (photos, documents, videos)
bot.on(['photo', 'document', 'video'], handleMediaRequest);

// Voice messages
bot.on('voice', handleVoiceRequest);

// ================================
// GRACEFUL SHUTDOWN
// ================================

const gracefulShutdown = async (signal: string) => {
  log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Stop bot
    bot.stop(signal);
    log.info('Bot stopped');

    // Close database connection
    await database.disconnect();
    log.info('Database disconnected');

    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection', reason as Error, { promise });
  // Don't shutdown on unhandled rejection during startup
  // Only shutdown if bot is already running
  if (bot.botInfo) {
    gracefulShutdown('unhandledRejection');
  }
});

// ================================
// BOT INITIALIZATION
// ================================

export async function initializeBot(): Promise<Telegraf<ExtendedContext>> {
  let botLaunched = false;

  try {
    // Connect to database
    await database.connect();
    log.info('Database connected');

    // Launch bot
    await bot.launch();
    botLaunched = true;
    log.info('✅ Bot launched successfully');

    // Set bot commands (optional)
    // Wrap in try-catch to not fail startup if commands fail
    try {
      await bot.telegram.setMyCommands([
        { command: 'start', description: 'Botni boshlash' },
        { command: 'help', description: 'Yordam' },
        { command: 'track', description: 'Murojaat holatini tekshirish' },
        { command: 'my_requests', description: 'Mening murojaatlarim' }
      ]);
      log.info('Bot commands set');
    } catch (cmdError) {
      log.warn('Failed to set bot commands (non-critical)', cmdError);
      // Don't throw - commands are optional
    }

    return bot;
  } catch (error) {
    log.error('Failed to initialize bot', error);

    // If bot was launched, try to stop it gracefully
    if (botLaunched) {
      try {
        await bot.stop();
      } catch (stopError) {
        log.error('Error stopping bot during failed initialization', stopError);
      }
    }

    throw error;
  }
}

export { bot };
export default bot;

