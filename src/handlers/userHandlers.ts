/**
 * User Handlers
 * Handles /start, /help, and other user commands
 */

import { ExtendedContext } from '../types/context';
import { startOnboarding, handleLanguageSelection, handlePhoneNumber, handleRegionSelection } from '../services/OnboardingService';
import { asyncHandler } from '../middleware/errorHandler';
import { log } from '../utils/logger';

/**
 * /start command handler
 */
export const handleStart = asyncHandler(async (ctx: ExtendedContext) => {
  const telegramId = ctx.from!.id;
  
  try {
    // Check if user already exists
    const { User } = await import('../models');
    const existingUser = await User.findByTelegramId(telegramId);

    if (existingUser) {
      // User already registered - show main menu
      ctx.user = existingUser.toObject() as any;
      ctx.language = existingUser.language;
      
      const { showMainMenu } = await import('./queueHandlers');
      await showMainMenu(ctx);
    } else {
      // New user - start onboarding
      await startOnboarding(ctx);
    }
  } catch (error) {
    log.error('Error in handleStart', error);
    // Fallback to onboarding if error
    await startOnboarding(ctx);
  }
});

/**
 * /help command handler
 */
export const handleHelp = asyncHandler(async (ctx: ExtendedContext) => {
  const language = ctx.language || 'uz';

  const messages = {
    uz: `❓ *Yordam*\n\n` +
        `*Buyruqlar:*\n` +
        `/start - Botni qayta boshlash\n` +
        `/help - Yordam\n` +
        `/track <ID> - Murojaat holatini tekshirish\n` +
        `/my_requests - Mening murojaatlarim\n\n` +
        `*Qanday ishlaydi?*\n` +
        `1. Murojaatingizni yuboring (matn, rasm, hujjat)\n` +
        `2. AI murojaatingizni tahlil qiladi\n` +
        `3. Murojaat tegishli tashkilotga yuboriladi\n` +
        `4. Javobni kuting va baholang\n\n` +
        `*Savollar?*\n` +
        `Texnik yordam: @uzqueue_support`,
    ru: `❓ *Помощь*\n\n` +
        `*Команды:*\n` +
        `/start - Перезапустить бота\n` +
        `/help - Помощь\n` +
        `/track <ID> - Проверить статус запроса\n` +
        `/my_requests - Мои запросы\n\n` +
        `*Как это работает?*\n` +
        `1. Отправьте ваш запрос (текст, фото, документ)\n` +
        `2. AI проанализирует ваш запрос\n` +
        `3. Запрос будет отправлен в соответствующую организацию\n` +
        `4. Дождитесь ответа и оцените\n\n` +
        `*Вопросы?*\n` +
        `Техническая поддержка: @uzqueue_support`,
    en: `❓ *Help*\n\n` +
        `*Commands:*\n` +
        `/start - Restart bot\n` +
        `/help - Help\n` +
        `/track <ID> - Check request status\n` +
        `/my_requests - My requests\n\n` +
        `*How it works?*\n` +
        `1. Send your request (text, photo, document)\n` +
        `2. AI will analyze your request\n` +
        `3. Request will be sent to appropriate organization\n` +
        `4. Wait for response and rate\n\n` +
        `*Questions?*\n` +
        `Technical support: @uzqueue_support`
  };

  await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
    parse_mode: 'Markdown'
  });
});

/**
 * Handle callback queries for onboarding
 */
export const handleOnboardingCallback = asyncHandler(async (ctx: ExtendedContext) => {
  // Type guard: Check if callback query has data (not a game query)
  if (!('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery().catch(() => {});
    return;
  }

  const data = ctx.callbackQuery.data;

  if (!data) {
    return;
  }

  // Language selection
  if (data.startsWith('onboarding_lang_')) {
    const lang = data.replace('onboarding_lang_', '') as 'uz' | 'ru' | 'en';
    await handleLanguageSelection(ctx, lang);
    await ctx.answerCbQuery();
    return;
  }

  // Phone number request
  if (data === 'onboarding_request_phone') {
    const language = ctx.session?.data?.language || 'uz';
    const messages = {
      uz: '📱 Telefon raqamingizni yuboring:',
      ru: '📱 Отправьте номер телефона:',
      en: '📱 Send your phone number:'
    };

    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      reply_markup: {
        keyboard: [
          [
            {
              text: language === 'uz' ? '📱 Telefon raqamni yuborish' :
                   language === 'ru' ? '📱 Отправить номер телефона' :
                   '📱 Send phone number',
              request_contact: true
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });

    // Send inline keyboard for skip option
    const skipText = language === 'uz' ? '⏭ O\'tkazib yuborish' :
                     language === 'ru' ? '⏭ Пропустить' :
                     '⏭ Skip';
    await ctx.reply(skipText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: skipText,
              callback_data: 'onboarding_skip_phone'
            }
          ]
        ]
      }
    });

    await ctx.answerCbQuery();
    return;
  }

  // Skip phone
  if (data === 'onboarding_skip_phone') {
    await handlePhoneNumber(ctx);
    await ctx.answerCbQuery();
    return;
  }

  // Region selection
  if (data.startsWith('onboarding_region_')) {
    const regionCode = data.replace('onboarding_region_', '');
    await handleRegionSelection(ctx, regionCode);
    await ctx.answerCbQuery();
    return;
  }
});

/**
 * Handle contact sharing
 */
export const handleContact = asyncHandler(async (ctx: ExtendedContext) => {
  if (ctx.message && 'contact' in ctx.message && ctx.message.contact) {
    const phoneNumber = ctx.message.contact.phone_number;
    await handlePhoneNumber(ctx, phoneNumber);
  }
});

