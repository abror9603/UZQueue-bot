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
import { rateLimitMiddleware } from './middleware/rateLimit';
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

// Rate limiting (before user loading to prevent DB spam)
bot.use(rateLimitMiddleware());

// Load user from database (after rate limiting)
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
    await ctx.answerCbQuery().catch(() => {});
    return;
  }

  const data = ctx.callbackQuery.data;
  
  if (data?.startsWith('onboarding_')) {
    await handleOnboardingCallback(ctx);
    return;
  }
  
  // Answer callback query
  await ctx.answerCbQuery().catch(() => {});
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

