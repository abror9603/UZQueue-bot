/**
 * Help Handlers
 * Complete help system implementation for UZQueue Bot
 * 
 * Features:
 * - Help menu
 * - User guide
 * - FAQ (Frequently Asked Questions)
 * - Contact information
 * - Example walkthrough
 * - Support message sending
 */

import { ExtendedContext } from '../types/context';
import { asyncHandler } from '../middleware/errorHandler';
import { log } from '../utils/logger';
import { getSupportChatId, getSupportContacts } from '../config/env';
import { SystemLog } from '../models/SystemLog';

/**
 * Track help events for analytics
 */
async function trackHelpEvent(userId: number, event: string): Promise<void> {
  try {
    log.info(`[HELP] User ${userId}: ${event} - ${new Date().toISOString()}`);
    
    // FAZA 2: Database ga saqlash qo'shiladi
    await SystemLog.logEvent(
      'user_action',
      `help_${event}`,
      {
        userId,
        timestamp: new Date()
      },
      {
        userId,
        result: 'success'
      }
    );
  } catch (error) {
    log.error('Error tracking help event', error);
  }
}

/**
 * Main help menu handler
 */
export const handleHelp = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    
    await trackHelpEvent(ctx.from!.id, 'help_opened');

    const messages = {
      uz: `ℹ️ *YORDAM BO'LIMI*\n\n` +
          `UZQueue - bu navbatsiz xizmat olish tizimi\n\n` +
          `Quyidagilardan birini tanlang:`,
      ru: `ℹ️ *РАЗДЕЛ ПОМОЩИ*\n\n` +
          `UZQueue - это система обслуживания без очереди\n\n` +
          `Выберите один из вариантов:`,
      en: `ℹ️ *HELP SECTION*\n\n` +
          `UZQueue - queue-free service system\n\n` +
          `Please select one of the options:`
    };

    const keyboard = {
      uz: [
        [
          { text: '📖 Qo\'llanma', callback_data: 'help_guide' },
          { text: '❓ Savol-javob', callback_data: 'help_faq' }
        ],
        [
          { text: '📞 Aloqa', callback_data: 'help_contact' },
          { text: '🔙 Orqaga', callback_data: 'back_to_main' }
        ]
      ],
      ru: [
        [
          { text: '📖 Руководство', callback_data: 'help_guide' },
          { text: '❓ Вопрос-ответ', callback_data: 'help_faq' }
        ],
        [
          { text: '📞 Контакты', callback_data: 'help_contact' },
          { text: '🔙 Назад', callback_data: 'back_to_main' }
        ]
      ],
      en: [
        [
          { text: '📖 Guide', callback_data: 'help_guide' },
          { text: '❓ FAQ', callback_data: 'help_faq' }
        ],
        [
          { text: '📞 Contact', callback_data: 'help_contact' },
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    // Handle callback query
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    } else {
      // Handle text message
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
    }
  } catch (error) {
    log.error('Error handling help', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle guide (Qo'llanma)
 */
export const handleHelpGuide = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    
    await trackHelpEvent(ctx.from!.id, 'guide_opened');

    const messages = {
      uz: `📖 *FOYDALANISH QO'LLANMASI*\n\n` +
          `Botdan qanday foydalanish:\n\n` +
          `1️⃣ *TASHKILOT TANLANG*\n` +
          `🏛 Hokimlik / 💰 Soliq / 🏘 Kommunal\n\n` +
          `2️⃣ *XIZMAT TANLANG*\n` +
          `Kerakli xizmat turini belgilang\n\n` +
          `3️⃣ *SANA VA VAQT*\n\n` +
          `Bugun yoki ertaga\n` +
          `4 ta vaqt oralig'idan birini tanlang\n` +
          `09:00-11:00 / 11:00-13:00\n` +
          `14:00-16:00 / 16:00-18:00\n\n` +
          `4️⃣ *TASDIQLASH*\n` +
          `Ma'lumotlarni tekshiring va tasdiqlang\n\n` +
          `5️⃣ *TAYYOR!*\n` +
          `📱 Navbat raqamingiz SMS orqali keladi\n` +
          `⏰ Vaqtingizdan 30 daqiqa oldin eslatma\n\n` +
          `💡 *MASLAHAT:*\n` +
          `Navbat vaqtingizdan 10-15 daqiqa oldin keling!`,
      ru: `📖 *РУКОВОДСТВО ПО ИСПОЛЬЗОВАНИЮ*\n\n` +
          `Как использовать бота:\n\n` +
          `1️⃣ *ВЫБЕРИТЕ ОРГАНИЗАЦИЮ*\n` +
          `🏛 Хокимият / 💰 Налоговая / 🏘 Коммунальные\n\n` +
          `2️⃣ *ВЫБЕРИТЕ УСЛУГУ*\n` +
          `Выберите необходимый тип услуги\n\n` +
          `3️⃣ *ДАТА И ВРЕМЯ*\n\n` +
          `Сегодня или завтра\n` +
          `Выберите один из 4 временных интервалов\n` +
          `09:00-11:00 / 11:00-13:00\n` +
          `14:00-16:00 / 16:00-18:00\n\n` +
          `4️⃣ *ПОДТВЕРЖДЕНИЕ*\n` +
          `Проверьте данные и подтвердите\n\n` +
          `5️⃣ *ГОТОВО!*\n` +
          `📱 Ваш номер очереди придет по SMS\n` +
          `⏰ Напоминание за 30 минут до времени\n\n` +
          `💡 *СОВЕТ:*\n` +
          `Приходите за 10-15 минут до времени вашей очереди!`,
      en: `📖 *USER GUIDE*\n\n` +
          `How to use the bot:\n\n` +
          `1️⃣ *SELECT ORGANIZATION*\n` +
          `🏛 Mayor's Office / 💰 Tax / 🏘 Utilities\n\n` +
          `2️⃣ *SELECT SERVICE*\n` +
          `Choose the required service type\n\n` +
          `3️⃣ *DATE AND TIME*\n\n` +
          `Today or tomorrow\n` +
          `Choose one of 4 time slots\n` +
          `09:00-11:00 / 11:00-13:00\n` +
          `14:00-16:00 / 16:00-18:00\n\n` +
          `4️⃣ *CONFIRMATION*\n` +
          `Check the information and confirm\n\n` +
          `5️⃣ *READY!*\n` +
          `📱 Your queue number will arrive via SMS\n` +
          `⏰ Reminder 30 minutes before your time\n\n` +
          `💡 *TIP:*\n` +
          `Come 10-15 minutes before your queue time!`
    };

    const keyboard = {
      uz: [
        [
          { text: '📋 Misolni ko\'rish', callback_data: 'help_example' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '📋 Посмотреть пример', callback_data: 'help_example' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '📋 See example', callback_data: 'help_example' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
    }
  } catch (error) {
    log.error('Error handling help guide', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle FAQ menu
 */
export const handleHelpFaq = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    
    await trackHelpEvent(ctx.from!.id, 'faq_opened');

    const messages = {
      uz: `❓ *TEZ-TEZ SO'RALADIGAN SAVOLLAR*\n\n` +
          `Savolingizni tanlang:`,
      ru: `❓ *ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ*\n\n` +
          `Выберите ваш вопрос:`,
      en: `❓ *FREQUENTLY ASKED QUESTIONS*\n\n` +
          `Select your question:`
    };

    const keyboard = {
      uz: [
        [
          { text: '❔ Navbat qanday olinadi?', callback_data: 'faq_1' }
        ],
        [
          { text: '❔ Vaqtni o\'zgartirish mumkinmi?', callback_data: 'faq_2' }
        ],
        [
          { text: '❔ Navbat raqamim yo\'qolsa?', callback_data: 'faq_3' }
        ],
        [
          { text: '❔ Eslatma qachon keladi?', callback_data: 'faq_4' }
        ],
        [
          { text: '❔ Qaysi tashkilotlar bor?', callback_data: 'faq_5' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '❔ Как получить очередь?', callback_data: 'faq_1' }
        ],
        [
          { text: '❔ Можно ли изменить время?', callback_data: 'faq_2' }
        ],
        [
          { text: '❔ Если потерял номер очереди?', callback_data: 'faq_3' }
        ],
        [
          { text: '❔ Когда придет напоминание?', callback_data: 'faq_4' }
        ],
        [
          { text: '❔ Какие организации есть?', callback_data: 'faq_5' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '❔ How to get a queue?', callback_data: 'faq_1' }
        ],
        [
          { text: '❔ Can I change the time?', callback_data: 'faq_2' }
        ],
        [
          { text: '❔ Lost my queue number?', callback_data: 'faq_3' }
        ],
        [
          { text: '❔ When will the reminder come?', callback_data: 'faq_4' }
        ],
        [
          { text: '❔ Which organizations are available?', callback_data: 'faq_5' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
    }
  } catch (error) {
    log.error('Error handling FAQ menu', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle FAQ 1: Navbat qanday olinadi?
 */
export const handleFaq1 = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'faq_1_viewed');

    const messages = {
      uz: `❔ *NAVBAT QANDAY OLINADI?*\n\n` +
          `Juda oddiy:\n\n` +
          `1. Bosh menyudan tashkilotni tanlang\n` +
          `   (Hokimlik, Soliq yoki Kommunal)\n\n` +
          `2. Kerakli xizmatni belgilang\n` +
          `   (Masalan: Guvohnoma olish)\n\n` +
          `3. Sana tanlang\n` +
          `   (Bugun, Ertaga yoki boshqa kun)\n\n` +
          `4. Vaqt tanlang\n` +
          `   (4 ta vaqt oralig'idan biri)\n\n` +
          `5. Tasdiqlang\n` +
          `   (Ma'lumotlarni tekshirib tasdiqlang)\n\n` +
          `✅ Tayyor! Navbat raqamingiz SMS orqali keladi\n\n` +
          `📌 Bu jarayon 1 daqiqadan kam vaqt oladi!`,
      ru: `❔ *КАК ПОЛУЧИТЬ ОЧЕРЕДЬ?*\n\n` +
          `Очень просто:\n\n` +
          `1. Выберите организацию из главного меню\n` +
          `   (Хокимият, Налоговая или Коммунальные)\n\n` +
          `2. Выберите нужную услугу\n` +
          `   (Например: Получение справки)\n\n` +
          `3. Выберите дату\n` +
          `   (Сегодня, Завтра или другой день)\n\n` +
          `4. Выберите время\n` +
          `   (Один из 4 временных интервалов)\n\n` +
          `5. Подтвердите\n` +
          `   (Проверьте данные и подтвердите)\n\n` +
          `✅ Готово! Ваш номер очереди придет по SMS\n\n` +
          `📌 Этот процесс занимает менее 1 минуты!`,
      en: `❔ *HOW TO GET A QUEUE?*\n\n` +
          `Very simple:\n\n` +
          `1. Select organization from main menu\n` +
          `   (Mayor's Office, Tax or Utilities)\n\n` +
          `2. Select required service\n` +
          `   (For example: Get certificate)\n\n` +
          `3. Select date\n` +
          `   (Today, Tomorrow or another day)\n\n` +
          `4. Select time\n` +
          `   (One of 4 time slots)\n\n` +
          `5. Confirm\n` +
          `   (Check information and confirm)\n\n` +
          `✅ Ready! Your queue number will arrive via SMS\n\n` +
          `📌 This process takes less than 1 minute!`
    };

    const keyboard = {
      uz: [
        [
          { text: '📋 Boshqa savol', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '📋 Другой вопрос', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '📋 Other question', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    }
  } catch (error) {
    log.error('Error handling FAQ 1', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle FAQ 2: Vaqtni o'zgartirish mumkinmi?
 */
export const handleFaq2 = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'faq_2_viewed');

    const messages = {
      uz: `❔ *VAQTNI O'ZGARTIRISH MUMKINMI?*\n\n` +
          `Ha, mumkin!\n\n` +
          `Hozircha eski navbatni bekor qilishingiz va yangisini olishingiz kerak:\n\n` +
          `📋 *Jarayon:*\n\n` +
          `1. Bosh menyuga qayting\n` +
          `2. Yangi navbat oling\n` +
          `3. Eski navbat avtomatik bekor bo'ladi\n\n` +
          `🔜 *Keyingi versiyada:*\n` +
          `"Mening navbatlarim" bo'limida to'g'ridan-to'g'ri o'zgartirish imkoniyati qo'shiladi`,
      ru: `❔ *МОЖНО ЛИ ИЗМЕНИТЬ ВРЕМЯ?*\n\n` +
          `Да, можно!\n\n` +
          `Пока вам нужно отменить старую очередь и получить новую:\n\n` +
          `📋 *Процесс:*\n\n` +
          `1. Вернитесь в главное меню\n` +
          `2. Получите новую очередь\n` +
          `3. Старая очередь автоматически отменится\n\n` +
          `🔜 *В следующей версии:*\n` +
          `В разделе "Мои очереди" будет добавлена возможность напрямую изменить`,
      en: `❔ *CAN I CHANGE THE TIME?*\n\n` +
          `Yes, you can!\n\n` +
          `For now, you need to cancel the old queue and get a new one:\n\n` +
          `📋 *Process:*\n\n` +
          `1. Go back to main menu\n` +
          `2. Get a new queue\n` +
          `3. Old queue will be automatically cancelled\n\n` +
          `🔜 *In next version:*\n` +
          `Direct change option will be added in "My Queues" section`
    };

    const keyboard = {
      uz: [
        [
          { text: '📋 Boshqa savol', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '📋 Другой вопрос', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '📋 Other question', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    }
  } catch (error) {
    log.error('Error handling FAQ 2', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle FAQ 3: Navbat raqamim yo'qolsa?
 */
export const handleFaq3 = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'faq_3_viewed');

    const supportContacts = getSupportContacts();

    const messages = {
      uz: `❔ *NAVBAT RAQAMIM YO'QOLSA?*\n\n` +
          `Xavotir olmang!\n\n` +
          `📱 *SMS xabaringizni tekshiring*\n` +
          `Navbat raqami va ma'lumotlar u yerda\n\n` +
          `🔜 *Tez orada:*\n` +
          `"Mening navbatlarim" bo'limi qo'shiladi - u yerda barcha navbatlaringizni ko'rishingiz mumkin\n\n` +
          `📞 *Yordam kerakmi?*\n` +
          `Support: ${supportContacts.telegram}\n` +
          `Tel: ${supportContacts.phone}`,
      ru: `❔ *ЕСЛИ ПОТЕРЯЛ НОМЕР ОЧЕРЕДИ?*\n\n` +
          `Не волнуйтесь!\n\n` +
          `📱 *Проверьте SMS сообщение*\n` +
          `Номер очереди и информация там\n\n` +
          `🔜 *Скоро:*\n` +
          `Будет добавлен раздел "Мои очереди" - там вы сможете увидеть все свои очереди\n\n` +
          `📞 *Нужна помощь?*\n` +
          `Support: ${supportContacts.telegram}\n` +
          `Тел: ${supportContacts.phone}`,
      en: `❔ *LOST MY QUEUE NUMBER?*\n\n` +
          `Don't worry!\n\n` +
          `📱 *Check your SMS message*\n` +
          `Queue number and information is there\n\n` +
          `🔜 *Coming soon:*\n` +
          `"My Queues" section will be added - you can see all your queues there\n\n` +
          `📞 *Need help?*\n` +
          `Support: ${supportContacts.telegram}\n` +
          `Tel: ${supportContacts.phone}`
    };

    const keyboard = {
      uz: [
        [
          { text: '📋 Boshqa savol', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '📋 Другой вопрос', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '📋 Other question', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    }
  } catch (error) {
    log.error('Error handling FAQ 3', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle FAQ 4: Eslatma qachon keladi?
 */
export const handleFaq4 = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'faq_4_viewed');

    const messages = {
      uz: `❔ *ESLATMA QACHON KELADI?*\n\n` +
          `📱 *SMS eslatma:*\n\n` +
          `Navbat vaqtingizdan 30 daqiqa oldin\n` +
          `Sizning telefon raqamingizga\n\n` +
          `📬 *Telegram eslatma:*\n\n` +
          `Xuddi shu vaqtda\n` +
          `Bu botda ham xabar keladi\n\n` +
          `💡 *MASLAHAT:*\n` +
          `Telefon raqamingizni to'g'ri kiriting - eslatma o'sha raqamga boradi!`,
      ru: `❔ *КОГДА ПРИДЕТ НАПОМИНАНИЕ?*\n\n` +
          `📱 *SMS напоминание:*\n\n` +
          `За 30 минут до времени вашей очереди\n` +
          `На ваш номер телефона\n\n` +
          `📬 *Telegram напоминание:*\n\n` +
          `В то же время\n` +
          `Также придет сообщение в этом боте\n\n` +
          `💡 *СОВЕТ:*\n` +
          `Введите правильный номер телефона - напоминание придет на этот номер!`,
      en: `❔ *WHEN WILL THE REMINDER COME?*\n\n` +
          `📱 *SMS reminder:*\n\n` +
          `30 minutes before your queue time\n` +
          `To your phone number\n\n` +
          `📬 *Telegram reminder:*\n\n` +
          `At the same time\n` +
          `Message will also come in this bot\n\n` +
          `💡 *TIP:*\n` +
          `Enter correct phone number - reminder will go to that number!`
    };

    const keyboard = {
      uz: [
        [
          { text: '📋 Boshqa savol', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '📋 Другой вопрос', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '📋 Other question', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    }
  } catch (error) {
    log.error('Error handling FAQ 4', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle FAQ 5: Qaysi tashkilotlar bor?
 */
export const handleFaq5 = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'faq_5_viewed');

    const messages = {
      uz: `❔ *QAYSI TASHKILOTLAR BOR?*\n\n` +
          `📍 *FAZA 1 - Toshkent viloyati:*\n\n` +
          `🏛 *HOKIMLIK*\n` +
          `• Guvohnoma olish\n` +
          `• Ko'chmas mulk ro'yxati\n` +
          `• Ma'lumotnoma olish\n\n` +
          `💰 *SOLIQ INSPEKSIYASI*\n` +
          `• Soliq to'lash\n` +
          `• Hisobot topshirish\n` +
          `• Ma'lumotnoma olish\n\n` +
          `🏘 *KOMMUNAL XIZMATLAR*\n` +
          `• Elektr energiya\n` +
          `• Suv ta'minoti\n` +
          `• Gaz xizmati\n\n` +
          `🔜 *Tez orada:*\n` +
          `Boshqa viloyatlar va ko'proq tashkilotlar qo'shiladi!`,
      ru: `❔ *КАКИЕ ОРГАНИЗАЦИИ ЕСТЬ?*\n\n` +
          `📍 *ФАЗА 1 - Ташкентская область:*\n\n` +
          `🏛 *ХОКИМИЯТ*\n` +
          `• Получение справки\n` +
          `• Реестр недвижимости\n` +
          `• Получение информации\n\n` +
          `💰 *НАЛОГОВАЯ ИНСПЕКЦИЯ*\n` +
          `• Уплата налогов\n` +
          `• Сдача отчетности\n` +
          `• Получение информации\n\n` +
          `🏘 *КОММУНАЛЬНЫЕ УСЛУГИ*\n` +
          `• Электроэнергия\n` +
          `• Водоснабжение\n` +
          `• Газоснабжение\n\n` +
          `🔜 *Скоро:*\n` +
          `Другие области и больше организаций будут добавлены!`,
      en: `❔ *WHICH ORGANIZATIONS ARE AVAILABLE?*\n\n` +
          `📍 *PHASE 1 - Tashkent region:*\n\n` +
          `🏛 *MAYOR'S OFFICE*\n` +
          `• Get certificate\n` +
          `• Real estate registry\n` +
          `• Get information\n\n` +
          `💰 *TAX INSPECTION*\n` +
          `• Pay taxes\n` +
          `• Submit reports\n` +
          `• Get information\n\n` +
          `🏘 *UTILITY SERVICES*\n` +
          `• Electricity\n` +
          `• Water supply\n` +
          `• Gas service\n\n` +
          `🔜 *Coming soon:*\n` +
          `Other regions and more organizations will be added!`
    };

    const keyboard = {
      uz: [
        [
          { text: '📋 Boshqa savol', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '📋 Другой вопрос', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '📋 Other question', callback_data: 'help_faq' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    }
  } catch (error) {
    log.error('Error handling FAQ 5', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle contact information
 */
export const handleHelpContact = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'contact_opened');

    const supportContacts = getSupportContacts();

    const messages = {
      uz: `📞 *BIZ BILAN BOG'LANING*\n\n` +
          `Savol yoki muammo bormi?\n\n` +
          `📱 *TELEGRAM*\n` +
          `${supportContacts.telegram}\n\n` +
          `☎️ *TELEFON*\n` +
          `${supportContacts.phone}\n\n` +
          `📧 *EMAIL*\n` +
          `${supportContacts.email}\n\n` +
          `⏰ *ISH VAQTI*\n` +
          `Dushanba-Juma: 09:00 - 18:00\n` +
          `Shanba: 09:00 - 14:00\n` +
          `Yakshanba: Dam olish\n\n` +
          `💬 Yoki xabar yozing\n` +
          `Muammoyizni yozing, tez orada javob beramiz`,
      ru: `📞 *СВЯЗАТЬСЯ С НАМИ*\n\n` +
          `Есть вопрос или проблема?\n\n` +
          `📱 *TELEGRAM*\n` +
          `${supportContacts.telegram}\n\n` +
          `☎️ *ТЕЛЕФОН*\n` +
          `${supportContacts.phone}\n\n` +
          `📧 *EMAIL*\n` +
          `${supportContacts.email}\n\n` +
          `⏰ *РАБОЧЕЕ ВРЕМЯ*\n` +
          `Понедельник-Пятница: 09:00 - 18:00\n` +
          `Суббота: 09:00 - 14:00\n` +
          `Воскресенье: Выходной\n\n` +
          `💬 Или напишите сообщение\n` +
          `Опишите проблему, мы быстро ответим`,
      en: `📞 *CONTACT US*\n\n` +
          `Have a question or problem?\n\n` +
          `📱 *TELEGRAM*\n` +
          `${supportContacts.telegram}\n\n` +
          `☎️ *PHONE*\n` +
          `${supportContacts.phone}\n\n` +
          `📧 *EMAIL*\n` +
          `${supportContacts.email}\n\n` +
          `⏰ *WORKING HOURS*\n` +
          `Monday-Friday: 09:00 - 18:00\n` +
          `Saturday: 09:00 - 14:00\n` +
          `Sunday: Day off\n\n` +
          `💬 Or send a message\n` +
          `Describe your problem, we will respond quickly`
    };

    const keyboard = {
      uz: [
        [
          { text: '✍️ Xabar yozish', callback_data: 'contact_message' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '✍️ Написать сообщение', callback_data: 'contact_message' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '✍️ Send message', callback_data: 'contact_message' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
    }
  } catch (error) {
    log.error('Error handling contact', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle contact message request (set state)
 */
export const handleContactMessage = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'contact_message_started');

    const messages = {
      uz: `✍️ *MUROJAAT*\n\n` +
          `Muammoyizni yoki savolingizni yozib yuboring.\n\n` +
          `Bizning mutaxassislar tez orada javob berishadi.\n\n` +
          `*Format:*\n` +
          `Ismingiz - Muammoning qisqacha tavsifi\n\n` +
          `*Misol:*\n` +
          `Ahmad - Navbat raqami SMS orqali kelmadi`,
      ru: `✍️ *ОБРАЩЕНИЕ*\n\n` +
          `Опишите вашу проблему или вопрос.\n\n` +
          `Наши специалисты быстро ответят.\n\n` +
          `*Формат:*\n` +
          `Ваше имя - Краткое описание проблемы\n\n` +
          `*Пример:*\n` +
          `Ахмад - Номер очереди не пришел по SMS`,
      en: `✍️ *MESSAGE*\n\n` +
          `Describe your problem or question.\n\n` +
          `Our specialists will respond quickly.\n\n` +
          `*Format:*\n` +
          `Your name - Brief description of the problem\n\n` +
          `*Example:*\n` +
          `Ahmad - Queue number did not arrive via SMS`
    };

    // Set session state
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    ctx.session.step = 'WAITING_FOR_SUPPORT_MESSAGE';

    const message = messages[language] || messages.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: language === 'uz' ? '❌ Bekor qilish' :
                      language === 'ru' ? '❌ Отменить' :
                      '❌ Cancel',
                callback_data: 'help'
              }
            ]
          ]
        }
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: language === 'uz' ? '❌ Bekor qilish' :
                      language === 'ru' ? '❌ Отменить' :
                      '❌ Cancel',
                callback_data: 'help'
              }
            ]
          ]
        }
      });
    }
  } catch (error) {
    log.error('Error handling contact message request', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle support message (when user sends text in WAITING_FOR_SUPPORT_MESSAGE state)
 */
export async function handleSupportMessage(ctx: ExtendedContext): Promise<void> {
  try {
    const language = ctx.language || 'uz';
    const messageText = ctx.message?.text || '';
    const userId = ctx.from!.id;
    const userName = ctx.from!.first_name || 'Foydalanuvchi';
    const username = ctx.from!.username ? `@${ctx.from!.username}` : 'Yo\'q';

    if (!messageText || messageText.trim().length < 5) {
      const errorMessages = {
        uz: '❌ Xabar juda qisqa. Iltimos, kamida 5 ta belgi yozing.',
        ru: '❌ Сообщение слишком короткое. Пожалуйста, напишите хотя бы 5 символов.',
        en: '❌ Message is too short. Please write at least 5 characters.'
      };
      
      await ctx.reply(errorMessages[language] || errorMessages.uz);
      return;
    }

    // Get support chat ID
    const supportChatId = getSupportChatId();
    
    if (supportChatId) {
      // Send to support chat/group
      const supportMessage = `🆘 *YANGI MUROJAAT*\n\n` +
        `👤 Foydalanuvchi: ${userName} (${username})\n` +
        `🆔 ID: \`${userId}\`\n` +
        `📝 Xabar:\n${messageText}\n\n` +
        `⏰ Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

      await ctx.telegram.sendMessage(supportChatId, supportMessage, {
        parse_mode: 'Markdown'
      }).catch((error) => {
        log.error('Failed to send message to support chat', error);
      });
    } else {
      log.warn('Support chat ID not configured', { userId });
    }

    // Clear session state
    if (ctx.session) {
      ctx.session.step = undefined;
    }

    // Send confirmation to user
    const confirmMessages = {
      uz: `✅ *Murojaatingiz qabul qilindi!*\n\n` +
          `Bizning mutaxassislar tez orada sizga javob berishadi.\n\n` +
          `📱 Javob Telegram orqali keladi`,
      ru: `✅ *Ваше обращение принято!*\n\n` +
          `Наши специалисты скоро ответят вам.\n\n` +
          `📱 Ответ придет через Telegram`,
      en: `✅ *Your message has been received!*\n\n` +
          `Our specialists will respond to you soon.\n\n` +
          `📱 Response will come via Telegram`
    };

    const confirmMessage = confirmMessages[language] || confirmMessages.uz;

    await ctx.reply(confirmMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: language === 'uz' ? '🏠 Bosh menyu' :
                    language === 'ru' ? '🏠 Главное меню' :
                    '🏠 Main Menu',
              callback_data: 'back_to_main'
            }
          ]
        ]
      }
    });

    // Log support message
    await trackHelpEvent(userId, 'support_message_sent');
    await SystemLog.logEvent(
      'user_action',
      'support_message_sent',
      {
        userId,
        messageLength: messageText.length,
        hasSupportChat: !!supportChatId
      },
      {
        userId,
        result: 'success'
      }
    );
  } catch (error) {
    log.error('Error handling support message', error);
    await ctx.reply(
      '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔄 Qayta urinish',
                callback_data: 'contact_message'
              }
            ]
          ]
        }
      }
    ).catch(() => {});
  }
}

/**
 * Handle help example
 */
export const handleHelpExample = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';
    await trackHelpEvent(ctx.from!.id, 'example_viewed');

    const messages = {
      uz: `📋 *MISOL - NAVBAT OLISH*\n\n` +
          `Keling, birgalikda navbat olaylik:\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `*VAZIYAT:*\n` +
          `Sizga hokimlikdan nikoh guvohnomasini olish kerak\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*QADAMLAR:*\n\n` +
          `1️⃣ Bosh menyuda "🏛 Hokimlik xizmatlari" ni bosing\n\n` +
          `2️⃣ "📄 Guvohnoma olish" ni tanlang\n\n` +
          `3️⃣ "Bugun" yoki "Ertaga" ni tanlang\n` +
          `   (Masalan: Ertaga - 5-yanvar)\n\n` +
          `4️⃣ Vaqtni tanlang\n` +
          `   (Masalan: 11:00 - 13:00)\n\n` +
          `5️⃣ Ma'lumotlarni tekshiring:\n` +
          `   ✓ Hokimlik\n` +
          `   ✓ Guvohnoma olish\n` +
          `   ✓ 5-yanvar\n` +
          `   ✓ 11:00 - 13:00\n\n` +
          `6️⃣ "✅ Tasdiqlash" ni bosing\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*NATIJA:*\n\n` +
          `🎉 Navbat olindi!\n` +
          `🎫 Raqam: #42\n` +
          `📱 SMS keladi: +998 90 123-45-67\n` +
          `⏰ Eslatma: 10:30 da (30 daqiqa oldin)\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Endi o'zingiz sinab ko'ring!`,
      ru: `📋 *ПРИМЕР - ПОЛУЧЕНИЕ ОЧЕРЕДИ*\n\n` +
          `Давайте вместе получим очередь:\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `*СИТУАЦИЯ:*\n` +
          `Вам нужно получить справку о браке из хокимията\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*ШАГИ:*\n\n` +
          `1️⃣ В главном меню нажмите "🏛 Услуги хокимията"\n\n` +
          `2️⃣ Выберите "📄 Получение справки"\n\n` +
          `3️⃣ Выберите "Сегодня" или "Завтра"\n` +
          `   (Например: Завтра - 5 января)\n\n` +
          `4️⃣ Выберите время\n` +
          `   (Например: 11:00 - 13:00)\n\n` +
          `5️⃣ Проверьте данные:\n` +
          `   ✓ Хокимият\n` +
          `   ✓ Получение справки\n` +
          `   ✓ 5 января\n` +
          `   ✓ 11:00 - 13:00\n\n` +
          `6️⃣ Нажмите "✅ Подтвердить"\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*РЕЗУЛЬТАТ:*\n\n` +
          `🎉 Очередь получена!\n` +
          `🎫 Номер: #42\n` +
          `📱 SMS придет: +998 90 123-45-67\n` +
          `⏰ Напоминание: в 10:30 (за 30 минут)\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Теперь попробуйте сами!`,
      en: `📋 *EXAMPLE - GET QUEUE*\n\n` +
          `Let's get a queue together:\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `*SITUATION:*\n` +
          `You need to get a marriage certificate from the mayor's office\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*STEPS:*\n\n` +
          `1️⃣ In main menu click "🏛 Mayor's Office"\n\n` +
          `2️⃣ Select "📄 Get certificate"\n\n` +
          `3️⃣ Select "Today" or "Tomorrow"\n` +
          `   (For example: Tomorrow - January 5)\n\n` +
          `4️⃣ Select time\n` +
          `   (For example: 11:00 - 13:00)\n\n` +
          `5️⃣ Check information:\n` +
          `   ✓ Mayor's Office\n` +
          `   ✓ Get certificate\n` +
          `   ✓ January 5\n` +
          `   ✓ 11:00 - 13:00\n\n` +
          `6️⃣ Click "✅ Confirm"\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*RESULT:*\n\n` +
          `🎉 Queue received!\n` +
          `🎫 Number: #42\n` +
          `📱 SMS will come: +998 90 123-45-67\n` +
          `⏰ Reminder: at 10:30 (30 minutes before)\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Now try it yourself!`
    };

    const keyboard = {
      uz: [
        [
          { text: '🚀 Hozir sinab ko\'raman', callback_data: 'back_to_main' }
        ],
        [
          { text: '🔙 Yordam menyusiga', callback_data: 'help' }
        ]
      ],
      ru: [
        [
          { text: '🚀 Попробую сейчас', callback_data: 'back_to_main' }
        ],
        [
          { text: '🔙 К меню помощи', callback_data: 'help' }
        ]
      ],
      en: [
        [
          { text: '🚀 Try now', callback_data: 'back_to_main' }
        ],
        [
          { text: '🔙 Back to help', callback_data: 'help' }
        ]
      ]
    };

    const message = messages[language] || messages.uz;
    const replyKeyboard = keyboard[language] || keyboard.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: replyKeyboard
        }
      });
    }
  } catch (error) {
    log.error('Error handling help example', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

