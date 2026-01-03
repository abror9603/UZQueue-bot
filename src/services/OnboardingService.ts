/**
 * Onboarding Service
 * Handles user registration and onboarding flow
 */

import { Context } from 'telegraf';
import { ExtendedContext } from '../types/context';
import { User, UserDocument } from '../models';
import { Language } from '../types';
import { log } from '../utils/logger';
import { SystemLog } from '../models';

export type OnboardingStep = 
  | 'start'
  | 'language_selection'
  | 'phone_number'
  | 'region_selection'
  | 'complete';

interface OnboardingData {
  step: OnboardingStep;
  language?: Language;
  phoneNumber?: string;
  region?: string;
}

/**
 * Start onboarding process
 */
export async function startOnboarding(ctx: ExtendedContext): Promise<void> {
  const telegramId = ctx.from!.id;
  const firstName = ctx.from!.first_name;
  const lastName = ctx.from!.last_name;
  const username = ctx.from!.username;

  try {
    // Check if user already exists
    const existingUser = await User.findByTelegramId(telegramId);

    if (existingUser) {
      // User already registered
      const language = existingUser.language;
      const messages = {
        uz: `👋 Xush kelibsiz, ${existingUser.firstName || 'Foydalanuvchi'}!\n\nSiz allaqachon ro'yxatdan o'tgansiz.`,
        ru: `👋 Добро пожаловать, ${existingUser.firstName || 'Пользователь'}!\n\nВы уже зарегистрированы.`,
        en: `👋 Welcome, ${existingUser.firstName || 'User'}!\n\nYou are already registered.`
      };

      await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
      return;
    }

    // Start new onboarding
    ctx.session = {
      step: 'language_selection',
      data: {
        firstName,
        lastName,
        username
      }
    };

    // Show language selection
    await showLanguageSelection(ctx);
  } catch (error) {
    log.error('Error starting onboarding', error);
    throw error;
  }
}

/**
 * Show language selection keyboard
 */
async function showLanguageSelection(ctx: ExtendedContext): Promise<void> {
  const message = `🌍 *Tilni tanlang / Выберите язык / Choose language*\n\n` +
    `Iltimos, qulay tilni tanlang.\n` +
    `Пожалуйста, выберите удобный язык.\n` +
    `Please choose your preferred language.`;

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🇺🇿 O\'zbek', callback_data: 'onboarding_lang_uz' },
          { text: '🇷🇺 Русский', callback_data: 'onboarding_lang_ru' },
          { text: '🇬🇧 English', callback_data: 'onboarding_lang_en' }
        ]
      ]
    }
  });
}

/**
 * Handle language selection
 */
export async function handleLanguageSelection(
  ctx: ExtendedContext,
  language: Language
): Promise<void> {
  try {
    ctx.session = {
      step: 'phone_number',
      data: {
        ...ctx.session?.data,
        language
      }
    };

    ctx.language = language;

    const messages = {
      uz: `✅ O'zbek tili tanlandi.\n\n📱 Telefon raqamingizni yuboring (ixtiyoriy):\n\n` +
          `Telefon raqamni yuborish uchun quyidagi tugmani bosing yoki "O'tkazib yuborish" tugmasini bosing.`,
      ru: `✅ Выбран узбекский язык.\n\n📱 Отправьте номер телефона (необязательно):\n\n` +
          `Нажмите кнопку ниже, чтобы отправить номер телефона, или нажмите "Пропустить".`,
      en: `✅ Uzbek language selected.\n\n📱 Send your phone number (optional):\n\n` +
          `Click the button below to send your phone number or click "Skip".`
    };

    await ctx.editMessageText(messages[language] || messages.uz, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: language === 'uz' ? '📱 Telefon raqamni yuborish' :
                   language === 'ru' ? '📱 Отправить номер телефона' :
                   '📱 Send phone number',
              callback_data: 'onboarding_request_phone'
            }
          ],
          [
            {
              text: language === 'uz' ? '⏭ O\'tkazib yuborish' :
                   language === 'ru' ? '⏭ Пропустить' :
                   '⏭ Skip',
              callback_data: 'onboarding_skip_phone'
            }
          ]
        ]
      }
    });
  } catch (error) {
    log.error('Error handling language selection', error);
    throw error;
  }
}

/**
 * Handle phone number
 */
export async function handlePhoneNumber(
  ctx: ExtendedContext,
  phoneNumber?: string
): Promise<void> {
  try {
    const language = ctx.session?.data?.language || 'uz';

    ctx.session = {
      step: 'region_selection',
      data: {
        ...ctx.session?.data,
        phoneNumber: phoneNumber || undefined
      }
    };

    // Show region selection
    await showRegionSelection(ctx, language);
  } catch (error) {
    log.error('Error handling phone number', error);
    throw error;
  }
}

/**
 * Show region selection
 */
async function showRegionSelection(ctx: ExtendedContext, language: Language): Promise<void> {
  // Regions for Phase 1 (Sirdaryo viloyat)
  const regions = [
    { code: 'sirdaryo', uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область', en: 'Sirdaryo Region' },
    { code: 'toshkent', uz: 'Toshkent viloyati', ru: 'Ташкентская область', en: 'Tashkent Region' },
    { code: 'andijon', uz: 'Andijon viloyati', ru: 'Андижанская область', en: 'Andijan Region' },
    { code: 'fargona', uz: 'Farg\'ona viloyati', ru: 'Ферганская область', en: 'Fergana Region' },
    { code: 'namangan', uz: 'Namangan viloyati', ru: 'Наманганская область', en: 'Namangan Region' },
    { code: 'samarqand', uz: 'Samarqand viloyati', ru: 'Самаркандская область', en: 'Samarkand Region' },
    { code: 'buxoro', uz: 'Buxoro viloyati', ru: 'Бухарская область', en: 'Bukhara Region' },
    { code: 'qashqadaryo', uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область', en: 'Kashkadarya Region' },
    { code: 'surxondaryo', uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область', en: 'Surkhandarya Region' },
    { code: 'jizzax', uz: 'Jizzax viloyati', ru: 'Джизакская область', en: 'Jizzakh Region' },
    { code: 'navoiy', uz: 'Navoiy viloyati', ru: 'Навоийская область', en: 'Navoiy Region' },
    { code: 'xorazm', uz: 'Xorazm viloyati', ru: 'Хорезмская область', en: 'Khorezm Region' },
    { code: 'qoraqalpogiston', uz: 'Qoraqalpog\'iston Respublikasi', ru: 'Республика Каракалпакстан', en: 'Republic of Karakalpakstan' }
  ];

  const messages = {
    uz: `📍 *Viloyatni tanlang:*\n\nQaysi viloyatda yashaysiz?`,
    ru: `📍 *Выберите область:*\n\nВ какой области вы живете?`,
    en: `📍 *Select region:*\n\nWhich region do you live in?`
  };

  // Create keyboard with regions (2 columns)
  const keyboard = [];
  for (let i = 0; i < regions.length; i += 2) {
    const row = [];
    row.push({
      text: regions[i][language] || regions[i].uz,
      callback_data: `onboarding_region_${regions[i].code}`
    });
    
    if (i + 1 < regions.length) {
      row.push({
        text: regions[i + 1][language] || regions[i + 1].uz,
        callback_data: `onboarding_region_${regions[i + 1].code}`
      });
    }
    
    keyboard.push(row);
  }

  const message = ctx.callbackQuery 
    ? await ctx.editMessageText(messages[language] || messages.uz, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      })
    : await ctx.reply(messages[language] || messages.uz, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
}

/**
 * Handle region selection
 */
export async function handleRegionSelection(
  ctx: ExtendedContext,
  regionCode: string
): Promise<void> {
  try {
    const language = ctx.session?.data?.language || 'uz';
    const regionNames: Record<string, Record<Language, string>> = {
      sirdaryo: { uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область', en: 'Sirdaryo Region' },
      toshkent: { uz: 'Toshkent viloyati', ru: 'Ташкентская область', en: 'Tashkent Region' },
      andijon: { uz: 'Andijon viloyati', ru: 'Андижанская область', en: 'Andijan Region' },
      fargona: { uz: 'Farg\'ona viloyati', ru: 'Ферганская область', en: 'Fergana Region' },
      namangan: { uz: 'Namangan viloyati', ru: 'Наманганская область', en: 'Namangan Region' },
      samarqand: { uz: 'Samarqand viloyati', ru: 'Самаркандская область', en: 'Samarkand Region' },
      buxoro: { uz: 'Buxoro viloyati', ru: 'Бухарская область', en: 'Bukhara Region' },
      qashqadaryo: { uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область', en: 'Kashkadarya Region' },
      surxondaryo: { uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область', en: 'Surkhandarya Region' },
      jizzax: { uz: 'Jizzax viloyati', ru: 'Джизакская область', en: 'Jizzakh Region' },
      navoiy: { uz: 'Navoiy viloyati', ru: 'Навоийская область', en: 'Navoiy Region' },
      xorazm: { uz: 'Xorazm viloyati', ru: 'Хорезмская область', en: 'Khorezm Region' },
      qoraqalpogiston: { uz: 'Qoraqalpog\'iston Respublikasi', ru: 'Республика Каракалпакстан', en: 'Republic of Karakalpakstan' }
    };

    const regionName = regionNames[regionCode]?.[language] || regionNames[regionCode]?.uz || regionCode;

    ctx.session = {
      step: 'complete',
      data: {
        ...ctx.session?.data,
        region: regionName
      }
    };

    // Complete onboarding
    await completeOnboarding(ctx);
  } catch (error) {
    log.error('Error handling region selection', error);
    throw error;
  }
}

/**
 * Complete onboarding and create user
 */
async function completeOnboarding(ctx: ExtendedContext): Promise<void> {
  try {
    const telegramId = ctx.from!.id;
    const data = ctx.session?.data || {};
    const language = data.language || 'uz';

    // Create user in database
    const user = await User.create({
      telegramId,
      firstName: data.firstName || ctx.from!.first_name,
      lastName: data.lastName || ctx.from!.last_name,
      username: data.username || ctx.from!.username,
      phoneNumber: data.phoneNumber,
      region: data.region,
      language: language as Language,
      role: 'citizen',
      isActive: true,
      metadata: {
        totalRequests: 0,
        resolvedRequests: 0
      }
    });

    // Update context
    ctx.user = user.toObject() as any;
    ctx.language = language as Language;

    // Log event
    await SystemLog.logEvent('user_action', 'user_registered', {
      userId: telegramId,
      language,
      region: data.region
    }, {
      userId: telegramId,
      result: 'success'
    });

    // Send welcome message
    const messages = {
      uz: `✅ *Ro'yxatdan o'tdingiz!*\n\n` +
          `👋 Xush kelibsiz, ${user.firstName || 'Foydalanuvchi'}!\n\n` +
          `📋 *UZQueue Bot* - Bu fuqarolar va davlat tashkilotlari o'rtasidagi aloqa platformasi.\n\n` +
          `*Imkoniyatlar:*\n` +
          `• 📝 Murojaat yuborish\n` +
          `• 📊 Murojaat holatini kuzatish\n` +
          `• 🤖 AI yordamchi\n` +
          `• 📈 Statistika\n\n` +
          `*Boshlash uchun:*\n` +
          `Yangi murojaat yuborish uchun xabar yuboring yoki /help buyrug'ini yuboring.`,
      ru: `✅ *Вы зарегистрированы!*\n\n` +
          `👋 Добро пожаловать, ${user.firstName || 'Пользователь'}!\n\n` +
          `📋 *UZQueue Bot* - Это платформа связи между гражданами и государственными организациями.\n\n` +
          `*Возможности:*\n` +
          `• 📝 Отправка запросов\n` +
          `• 📊 Отслеживание статуса\n` +
          `• 🤖 AI помощник\n` +
          `• 📈 Статистика\n\n` +
          `*Чтобы начать:*\n` +
          `Отправьте сообщение для нового запроса или отправьте команду /help.`,
      en: `✅ *You are registered!*\n\n` +
          `👋 Welcome, ${user.firstName || 'User'}!\n\n` +
          `📋 *UZQueue Bot* - This is a communication platform between citizens and government organizations.\n\n` +
          `*Features:*\n` +
          `• 📝 Submit requests\n` +
          `• 📊 Track status\n` +
          `• 🤖 AI assistant\n` +
          `• 📈 Statistics\n\n` +
          `*To get started:*\n` +
          `Send a message for a new request or send /help command.`
    };

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: language === 'uz' ? '📝 Yangi murojaat' :
                   language === 'ru' ? '📝 Новый запрос' :
                   '📝 New request',
              callback_data: 'new_request'
            }
          ],
          [
            {
              text: language === 'uz' ? 'ℹ️ Yordam' :
                   language === 'ru' ? 'ℹ️ Помощь' :
                   'ℹ️ Help',
              callback_data: 'help'
            }
          ]
        ]
      }
    });

    // Clear session
    ctx.session = undefined;

    log.info('User onboarding completed', { userId: telegramId, language, region: data.region });
  } catch (error) {
    log.error('Error completing onboarding', error);
    throw error;
  }
}

