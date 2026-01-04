/**
 * Queue Handlers
 * Handles queue booking flow for government organizations
 * 
 * Organizations:
 * - Hokimlik (hokimlik)
 * - Soliq inspeksiyasi (soliq)
 * - Kommunal xizmatlar (kommunal)
 */

import { ExtendedContext, QueueSessionData } from '../types/context';
import { asyncHandler } from '../middleware/errorHandler';
import { log } from '../utils/logger';
import { SystemLog } from '../models/SystemLog';

// ================================
// TYPES & INTERFACES
// ================================

type OrganizationCode = 'hokimlik' | 'soliq' | 'kommunal';

interface Organization {
  code: OrganizationCode;
  name: {
    uz: string;
    ru: string;
    en: string;
  };
  services: Service[];
}

interface Service {
  code: string;
  name: {
    uz: string;
    ru: string;
    en: string;
  };
}

// ================================
// DATA CONFIGURATION
// ================================

const organizations: Organization[] = [
  {
    code: 'hokimlik',
    name: {
      uz: 'Hokimlik',
      ru: 'Хокимият',
      en: 'Mayor\'s Office'
    },
    services: [
      {
        code: 'guvohnoma',
        name: {
          uz: 'Guvohnoma olish',
          ru: 'Получение справки',
          en: 'Get certificate'
        }
      },
      {
        code: 'mulk',
        name: {
          uz: 'Ko\'chmas mulk ro\'yxati',
          ru: 'Реестр недвижимости',
          en: 'Real estate registry'
        }
      },
      {
        code: 'malumotnoma',
        name: {
          uz: 'Ma\'lumotnoma olish',
          ru: 'Получение справки',
          en: 'Get information'
        }
      }
    ]
  },
  {
    code: 'soliq',
    name: {
      uz: 'Soliq inspeksiyasi',
      ru: 'Налоговая инспекция',
      en: 'Tax Inspection'
    },
    services: [
      {
        code: 'tolash',
        name: {
          uz: 'Soliq to\'lash',
          ru: 'Уплата налогов',
          en: 'Pay taxes'
        }
      },
      {
        code: 'hisobot',
        name: {
          uz: 'Hisobot topshirish',
          ru: 'Сдача отчетности',
          en: 'Submit report'
        }
      },
      {
        code: 'malumotnoma',
        name: {
          uz: 'Ma\'lumotnoma olish',
          ru: 'Получение справки',
          en: 'Get information'
        }
      }
    ]
  },
  {
    code: 'kommunal',
    name: {
      uz: 'Kommunal xizmatlar',
      ru: 'Коммунальные услуги',
      en: 'Utility Services'
    },
    services: [
      {
        code: 'elektr',
        name: {
          uz: 'Elektr energiya',
          ru: 'Электроэнергия',
          en: 'Electricity'
        }
      },
      {
        code: 'suv',
        name: {
          uz: 'Suv ta\'minoti',
          ru: 'Водоснабжение',
          en: 'Water supply'
        }
      },
      {
        code: 'gaz',
        name: {
          uz: 'Gaz xizmati',
          ru: 'Газоснабжение',
          en: 'Gas service'
        }
      }
    ]
  }
];

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Format date to readable string (e.g., "3-yan", "4-yan")
 */
function formatDate(date: Date): string {
  const months = [
    'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
    'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  
  return `${day}-${month}`;
}

/**
 * Get organization name by code
 */
function getOrganizationName(org: string, language: string = 'uz'): string {
  const organization = organizations.find(o => o.code === org);
  if (!organization) return org;
  
  return organization.name[language as keyof typeof organization.name] || organization.name.uz;
}

/**
 * Get service name by organization and service code
 */
function getServiceName(org: string, service: string, language: string = 'uz'): string {
  const organization = organizations.find(o => o.code === org);
  if (!organization) return service;
  
  const serviceObj = organization.services.find(s => s.code === service);
  if (!serviceObj) return service;
  
  return serviceObj.name[language as keyof typeof serviceObj.name] || serviceObj.name.uz;
}

/**
 * Get today's date
 */
function getToday(): Date {
  return new Date();
}

/**
 * Get tomorrow's date
 */
function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

/**
 * Generate random queue number (1-100)
 */
function generateQueueNumber(): number {
  return Math.floor(Math.random() * 100) + 1;
}

// ================================
// MAIN MENU HANDLERS
// ================================

/**
 * Show main menu with organizations
 */
export async function showMainMenu(ctx: ExtendedContext): Promise<void> {
  try {
    const language = ctx.language || 'uz';
    const firstName = ctx.from?.first_name || ctx.user?.firstName || 'Foydalanuvchi';
    
    const messages = {
      uz: `👋 *Xush kelibsiz, ${firstName}!*\n\n` +
          `🏛 *UZQueue Bot*\n\n` +
          `Navbatsiz xizmat ko'rsatish tizimi. Quyidagi tashkilotlardan birini tanlang:`,
      ru: `👋 *Добро пожаловать, ${firstName}!*\n\n` +
          `🏛 *UZQueue Bot*\n\n` +
          `Система обслуживания без очереди. Выберите одну из следующих организаций:`,
      en: `👋 *Welcome, ${firstName}!*\n\n` +
          `🏛 *UZQueue Bot*\n\n` +
          `Queue-free service system. Please select one of the following organizations:`
    };

    // Create reply keyboard for all menu options
    let replyKeyboard: Array<Array<{ text: string }>>;
    if (language === 'ru') {
      replyKeyboard = [
        [
          { text: '🏛 Услуги хокимията' },
          { text: '💰 Налоговая инспекция' }
        ],
        [
          { text: '🏘 Коммунальные услуги' }
        ],
        [
          { text: 'ℹ️ Помощь' },
          { text: '⚙️ Настройки' }
        ]
      ];
    } else if (language === 'en') {
      replyKeyboard = [
        [
          { text: '🏛 Mayor\'s Office' },
          { text: '💰 Tax Inspection' }
        ],
        [
          { text: '🏘 Utility Services' }
        ],
        [
          { text: 'ℹ️ Help' },
          { text: '⚙️ Settings' }
        ]
      ];
    } else {
      replyKeyboard = [
        [
          { text: '🏛 Hokimlik xizmatlari' },
          { text: '💰 Soliq inspeksiyasi' }
        ],
        [
          { text: '🏘 Kommunal xizmatlar' }
        ],
        [
          { text: 'ℹ️ Yordam' },
          { text: '⚙️ Sozlamalar' }
        ]
      ];
    }

    if (ctx.callbackQuery) {
      // If editing a message that had inline keyboard, we need to handle it differently
      // Telegram API requires inline keyboard when editing a message that had inline keyboard
      try {
        // First, try to edit with empty inline keyboard to remove old keyboard
        await ctx.editMessageText(messages[language] || messages.uz, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: []
          }
        });
        
        // Then delete the message and send a new one with reply keyboard
        await ctx.deleteMessage().catch(() => {});
      } catch (error) {
        // If edit fails, try to delete and send new message
        try {
          await ctx.deleteMessage().catch(() => {});
        } catch (deleteError) {
          // If deletion also fails, just send a new message (old one will remain)
          log.debug('Could not delete message', deleteError);
        }
      }
      
      // Send new message with reply keyboard
      await ctx.reply(messages[language] || messages.uz, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: replyKeyboard,
          resize_keyboard: true
        }
      });
      
      // Note: answerCbQuery should be called by the handler, not here
    } else {
      await ctx.reply(messages[language] || messages.uz, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: replyKeyboard,
          resize_keyboard: true
        }
      });
    }
  } catch (error) {
    log.error('Error showing main menu', error);
    throw error;
  }
}

// ================================
// ORGANIZATION HANDLERS
// ================================

/**
 * Handle organization selection (works with both callback query and text message)
 */
export const handleOrganizationSelection = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    let orgCode: OrganizationCode;
    
    // Check if it's a callback query
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (!data?.startsWith('org_')) {
        await ctx.answerCbQuery('❌ Xato');
        return;
      }
      orgCode = data.replace('org_', '') as OrganizationCode;
    } else {
      // It's a text message - orgCode should be passed via context or extracted from text
      // For now, we'll use a helper function to extract org code from text
      const text = ctx.message?.text?.toLowerCase() || '';
      
      // Map text to organization code
      if (text.includes('hokimlik') || text.includes('хокимият') || text.includes('mayor')) {
        orgCode = 'hokimlik';
      } else if (text.includes('soliq') || text.includes('налог') || text.includes('tax')) {
        orgCode = 'soliq';
      } else if (text.includes('kommunal') || text.includes('коммунал') || text.includes('utility')) {
        orgCode = 'kommunal';
      } else {
        // Default or error
        await ctx.reply('❌ Tashkilot topilmadi');
        return;
      }
    }

    const language = ctx.language || 'uz';

    // Update session
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    (ctx.session.data as QueueSessionData).currentService = undefined;
    (ctx.session.data as QueueSessionData).selectedDate = undefined;
    (ctx.session.data as QueueSessionData).selectedTime = undefined;

    // Find organization
    const organization = organizations.find(o => o.code === orgCode);
    if (!organization) {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery('❌ Tashkilot topilmadi');
      } else {
        await ctx.reply('❌ Tashkilot topilmadi');
      }
      return;
    }

    // Show services menu
    await showServicesMenu(ctx, orgCode, language);
    
    // Answer callback query if it exists
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
  } catch (error) {
    log.error('Error handling organization selection', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    } else {
      await ctx.reply('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Show services menu for selected organization
 */
async function showServicesMenu(
  ctx: ExtendedContext,
  orgCode: OrganizationCode,
  language: string
): Promise<void> {
  try {
    const organization = organizations.find(o => o.code === orgCode);
    if (!organization) {
      throw new Error(`Organization not found: ${orgCode}`);
    }

    const orgName = organization.name[language as keyof typeof organization.name] || organization.name.uz;
    
    const messages = {
      uz: `🏛 *${orgName}*\n\nQuyidagi xizmatlardan birini tanlang:`,
      ru: `🏛 *${orgName}*\n\nВыберите одну из следующих услуг:`,
      en: `🏛 *${orgName}*\n\nPlease select one of the following services:`
    };

    // Create keyboard with services
    const keyboard = organization.services.map(service => [
      {
        text: service.name[language as keyof typeof service.name] || service.name.uz,
        callback_data: `service_${orgCode}_${service.code}`
      }
    ]);

    // Add "Murojaat yuborish" button
    keyboard.push([
      {
        text: language === 'uz' ? '📝 Murojaat yuborish' :
              language === 'ru' ? '📝 Отправить обращение' :
              '📝 Send request',
        callback_data: `request_${orgCode}`
      }
    ]);

    // Add back button
    keyboard.push([
      {
        text: language === 'uz' ? '🔙 Orqaga' :
              language === 'ru' ? '🔙 Назад' :
              '🔙 Back',
        callback_data: 'back_to_main'
      }
    ]);

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    log.error('Error showing services menu', error);
    throw error;
  }
}

// ================================
// SERVICE HANDLERS
// ================================

/**
 * Handle service selection
 */
export const handleServiceSelection = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('service_')) {
      return;
    }

    const parts = data.replace('service_', '').split('_');
    const orgCode = parts[0] as OrganizationCode;
    const serviceCode = parts.slice(1).join('_');
    const language = ctx.language || 'uz';

    // Update session
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    (ctx.session.data as QueueSessionData).currentService = serviceCode;

    // Show date selection
    await showDateSelection(ctx, orgCode, serviceCode, language);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error handling service selection', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

// ================================
// DATE SELECTION HANDLERS
// ================================

/**
 * Show date selection menu
 */
async function showDateSelection(
  ctx: ExtendedContext,
  orgCode: OrganizationCode,
  serviceCode: string,
  language: string
): Promise<void> {
  try {
    const orgName = getOrganizationName(orgCode, language);
    const serviceName = getServiceName(orgCode, serviceCode, language);
    const today = getToday();
    const tomorrow = getTomorrow();

    const messages = {
      uz: `📅 *Sana tanlang*\n\n` +
          `Tashkilot: ${orgName}\n` +
          `Xizmat: ${serviceName}\n\n` +
          `Navbat uchun sanani tanlang:`,
      ru: `📅 *Выберите дату*\n\n` +
          `Организация: ${orgName}\n` +
          `Услуга: ${serviceName}\n\n` +
          `Выберите дату для записи:`,
      en: `📅 *Select date*\n\n` +
          `Organization: ${orgName}\n` +
          `Service: ${serviceName}\n\n` +
          `Please select a date for your appointment:`
    };

    const keyboard = [
      [
        {
          text: `📅 Bugun (${formatDate(today)})`,
          callback_data: `date_${orgCode}_${serviceCode}_today`
        }
      ],
      [
        {
          text: `📅 Ertaga (${formatDate(tomorrow)})`,
          callback_data: `date_${orgCode}_${serviceCode}_tomorrow`
        }
      ],
      [
        {
          text: language === 'uz' ? '📆 Boshqa sana' :
                language === 'ru' ? '📆 Другая дата' :
                '📆 Other date',
          callback_data: `date_${orgCode}_${serviceCode}_other`
        }
      ],
      [
        {
          text: language === 'uz' ? '🔙 Orqaga' :
                language === 'ru' ? '🔙 Назад' :
                '🔙 Back',
          callback_data: `back_to_services_${orgCode}`
        }
      ]
    ];

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard.map(row => row.map(btn => btn))
      }
    });
  } catch (error) {
    log.error('Error showing date selection', error);
    throw error;
  }
}

/**
 * Handle date selection
 */
export const handleDateSelection = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('date_')) {
      return;
    }

    const parts = data.replace('date_', '').split('_');
    const orgCode = parts[0] as OrganizationCode;
    const serviceCode = parts.slice(1, -1).join('_');
    const dateType = parts[parts.length - 1];
    const language = ctx.language || 'uz';

    let selectedDate: string;
    let dateDisplay: string;

    if (dateType === 'today') {
      const today = getToday();
      selectedDate = today.toISOString().split('T')[0];
      dateDisplay = formatDate(today);
    } else if (dateType === 'tomorrow') {
      const tomorrow = getTomorrow();
      selectedDate = tomorrow.toISOString().split('T')[0];
      dateDisplay = formatDate(tomorrow);
    } else {
      // For "other date", we'll just use tomorrow as placeholder
      // In production, you'd implement a date picker
      const tomorrow = getTomorrow();
      selectedDate = tomorrow.toISOString().split('T')[0];
      dateDisplay = formatDate(tomorrow);
    }

    // Update session
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    (ctx.session.data as QueueSessionData).currentService = serviceCode;
    (ctx.session.data as QueueSessionData).selectedDate = selectedDate;

    // Show time selection
    await showTimeSelection(ctx, orgCode, serviceCode, dateDisplay, language);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error handling date selection', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

// ================================
// TIME SELECTION HANDLERS
// ================================

/**
 * Show time selection menu
 */
async function showTimeSelection(
  ctx: ExtendedContext,
  orgCode: OrganizationCode,
  serviceCode: string,
  dateDisplay: string,
  language: string
): Promise<void> {
  try {
    const orgName = getOrganizationName(orgCode, language);
    const serviceName = getServiceName(orgCode, serviceCode, language);

    const messages = {
      uz: `⏰ *Vaqt tanlang*\n\n` +
          `Tashkilot: ${orgName}\n` +
          `Xizmat: ${serviceName}\n` +
          `Sana: ${dateDisplay}\n\n` +
          `Navbat uchun vaqtni tanlang:`,
      ru: `⏰ *Выберите время*\n\n` +
          `Организация: ${orgName}\n` +
          `Услуга: ${serviceName}\n` +
          `Дата: ${dateDisplay}\n\n` +
          `Выберите время для записи:`,
      en: `⏰ *Select time*\n\n` +
          `Organization: ${orgName}\n` +
          `Service: ${serviceName}\n` +
          `Date: ${dateDisplay}\n\n` +
          `Please select a time for your appointment:`
    };

    const keyboard = [
      [
        { text: '09:00 - 11:00', callback_data: `time_${orgCode}_${serviceCode}_09-11` }
      ],
      [
        { text: '11:00 - 13:00', callback_data: `time_${orgCode}_${serviceCode}_11-13` }
      ],
      [
        { text: '14:00 - 16:00', callback_data: `time_${orgCode}_${serviceCode}_14-16` }
      ],
      [
        { text: '16:00 - 18:00', callback_data: `time_${orgCode}_${serviceCode}_16-18` }
      ],
      [
        {
          text: language === 'uz' ? '🔙 Orqaga' :
                language === 'ru' ? '🔙 Назад' :
                '🔙 Back',
          callback_data: `back_to_date_${orgCode}_${serviceCode}`
        }
      ]
    ];

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    log.error('Error showing time selection', error);
    throw error;
  }
}

/**
 * Handle time selection
 */
export const handleTimeSelection = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('time_')) {
      return;
    }

    const parts = data.replace('time_', '').split('_');
    const orgCode = parts[0] as OrganizationCode;
    const serviceCode = parts.slice(1, -1).join('_');
    const timeSlot = parts[parts.length - 1];
    const language = ctx.language || 'uz';

    // Map time slot to display format
    const timeDisplay = timeSlot.replace('-', ' - ');

    // Update session
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    (ctx.session.data as QueueSessionData).currentService = serviceCode;
    (ctx.session.data as QueueSessionData).selectedTime = timeSlot;

    // Show confirmation
    await showConfirmation(ctx, orgCode, serviceCode, language);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error handling time selection', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

// ================================
// CONFIRMATION HANDLERS
// ================================

/**
 * Show confirmation screen
 */
async function showConfirmation(
  ctx: ExtendedContext,
  orgCode: OrganizationCode,
  serviceCode: string,
  language: string
): Promise<void> {
  try {
    const sessionData = ctx.session?.data as QueueSessionData | undefined;
    if (!sessionData) {
      throw new Error('Session data not found');
    }

    const orgName = getOrganizationName(orgCode, language);
    const serviceName = getServiceName(orgCode, serviceCode, language);
    const selectedDate = sessionData.selectedDate || '';
    const selectedTime = sessionData.selectedTime || '';

    // Format date display
    let dateDisplay = selectedDate;
    if (selectedDate) {
      try {
        const date = new Date(selectedDate);
        dateDisplay = formatDate(date);
      } catch (e) {
        // Keep original if parsing fails
      }
    }

    // Format time display
    const timeDisplay = selectedTime.replace('-', ' - ');

    const messages = {
      uz: `✅ *Navbat ma'lumotlari*\n\n` +
          `🏛 Tashkilot: ${orgName}\n` +
          `📋 Xizmat: ${serviceName}\n` +
          `📅 Sana: ${dateDisplay}\n` +
          `⏰ Vaqt: ${timeDisplay}\n\n` +
          `Ma'lumotlar to'g'rimi?`,
      ru: `✅ *Информация о записи*\n\n` +
          `🏛 Организация: ${orgName}\n` +
          `📋 Услуга: ${serviceName}\n` +
          `📅 Дата: ${dateDisplay}\n` +
          `⏰ Время: ${timeDisplay}\n\n` +
          `Данные верны?`,
      en: `✅ *Appointment information*\n\n` +
          `🏛 Organization: ${orgName}\n` +
          `📋 Service: ${serviceName}\n` +
          `📅 Date: ${dateDisplay}\n` +
          `⏰ Time: ${timeDisplay}\n\n` +
          `Is the information correct?`
    };

    const keyboard = [
      [
        {
          text: language === 'uz' ? '✅ Tasdiqlash' :
                language === 'ru' ? '✅ Подтвердить' :
                '✅ Confirm',
          callback_data: `confirm_booking_${orgCode}_${serviceCode}`
        }
      ],
      [
        {
          text: language === 'uz' ? '❌ Bekor qilish' :
                language === 'ru' ? '❌ Отменить' :
                '❌ Cancel',
          callback_data: 'back_to_main'
        }
      ]
    ];

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    log.error('Error showing confirmation', error);
    throw error;
  }
}

/**
 * Handle booking confirmation
 */
export const handleBookingConfirmation = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('confirm_booking_')) {
      return;
    }

    const parts = data.replace('confirm_booking_', '').split('_');
    const orgCode = parts[0] as OrganizationCode;
    const serviceCode = parts.slice(1).join('_');
    const language = ctx.language || 'uz';

    const sessionData = ctx.session?.data as QueueSessionData | undefined;
    if (!sessionData) {
      throw new Error('Session data not found');
    }

    const orgName = getOrganizationName(orgCode, language);
    const serviceName = getServiceName(orgCode, serviceCode, language);
    const selectedDate = sessionData.selectedDate || '';
    const selectedTime = sessionData.selectedTime || '';

    // Format date display
    let dateDisplay = selectedDate;
    if (selectedDate) {
      try {
        const date = new Date(selectedDate);
        dateDisplay = formatDate(date);
      } catch (e) {
        // Keep original if parsing fails
      }
    }

    // Format time display
    const timeDisplay = selectedTime.replace('-', ' - ');

    // Generate queue number
    const queueNumber = generateQueueNumber();

    const messages = {
      uz: `🎫 *Navbat muvaffaqiyatli yaratildi!*\n\n` +
          `🎫 Navbat raqami: *${queueNumber}*\n\n` +
          `📋 *Ma'lumotlar:*\n` +
          `🏛 Tashkilot: ${orgName}\n` +
          `📋 Xizmat: ${serviceName}\n` +
          `📅 Sana: ${dateDisplay}\n` +
          `⏰ Vaqt: ${timeDisplay}\n\n` +
          `📱 Sizga SMS va Telegram orqali eslatma yuboriladi.\n\n` +
          `Rahmat!`,
      ru: `🎫 *Запись успешно создана!*\n\n` +
          `🎫 Номер очереди: *${queueNumber}*\n\n` +
          `📋 *Информация:*\n` +
          `🏛 Организация: ${orgName}\n` +
          `📋 Услуга: ${serviceName}\n` +
          `📅 Дата: ${dateDisplay}\n` +
          `⏰ Время: ${timeDisplay}\n\n` +
          `📱 Вам будет отправлено напоминание по SMS и Telegram.\n\n` +
          `Спасибо!`,
      en: `🎫 *Appointment successfully created!*\n\n` +
          `🎫 Queue number: *${queueNumber}*\n\n` +
          `📋 *Information:*\n` +
          `🏛 Organization: ${orgName}\n` +
          `📋 Service: ${serviceName}\n` +
          `📅 Date: ${dateDisplay}\n` +
          `⏰ Time: ${timeDisplay}\n\n` +
          `📱 You will receive a reminder via SMS and Telegram.\n\n` +
          `Thank you!`
    };

    const keyboard = [
      [
        {
          text: language === 'uz' ? '🏠 Bosh menyu' :
                language === 'ru' ? '🏠 Главное меню' :
                '🏠 Main menu',
          callback_data: 'back_to_main'
        }
      ],
      [
        {
          text: language === 'uz' ? '📋 Mening navbatlarim' :
                language === 'ru' ? '📋 Мои записи' :
                '📋 My appointments',
          callback_data: 'my_queues'
        }
      ]
    ];

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard.map(row => row.map(btn => btn))
      }
    });

    // Clear session
    ctx.session = undefined;

    await ctx.answerCbQuery('✅ Navbat yaratildi!');
    
    log.info('Queue booking created', {
      userId: ctx.from?.id,
      orgCode,
      serviceCode,
      date: selectedDate,
      time: selectedTime,
      queueNumber
    });
  } catch (error) {
    log.error('Error confirming booking', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

// ================================
// BACK NAVIGATION HANDLERS
// ================================

/**
 * Handle back to main menu
 */
export const handleBackToMain = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    // Clear session
    ctx.session = undefined;
    
    await showMainMenu(ctx);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error going back to main', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

/**
 * Handle back to services
 */
export const handleBackToServices = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('back_to_services_')) {
      return;
    }

    const orgCode = data.replace('back_to_services_', '') as OrganizationCode;
    const language = ctx.language || 'uz';

    // Update session
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    (ctx.session.data as QueueSessionData).currentService = undefined;
    (ctx.session.data as QueueSessionData).selectedDate = undefined;
    (ctx.session.data as QueueSessionData).selectedTime = undefined;

    await showServicesMenu(ctx, orgCode, language);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error going back to services', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

/**
 * Handle back to date selection
 */
export const handleBackToDate = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('back_to_date_')) {
      return;
    }

    const parts = data.replace('back_to_date_', '').split('_');
    const orgCode = parts[0] as OrganizationCode;
    const serviceCode = parts.slice(1).join('_');
    const language = ctx.language || 'uz';

    // Update session
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    (ctx.session.data as QueueSessionData).currentService = serviceCode;
    (ctx.session.data as QueueSessionData).selectedDate = undefined;
    (ctx.session.data as QueueSessionData).selectedTime = undefined;

    await showDateSelection(ctx, orgCode, serviceCode, language);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error going back to date', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

// ================================
// PLACEHOLDER HANDLERS
// ================================

/**
 * Handle help action - re-export from helpHandlers
 */
export { handleHelp } from './helpHandlers';

/**
 * Handle settings action
 */
export const handleSettings = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';

    const messages = {
      uz: `⚙️ *Sozlamalar*\n\n` +
          `Quyidagi sozlamalardan birini tanlang:`,
      ru: `⚙️ *Настройки*\n\n` +
          `Выберите одну из настроек:`,
      en: `⚙️ *Settings*\n\n` +
          `Please select one of the settings:`
    };

    const keyboard = {
      uz: [
        [
          { text: '🌍 Til sozlamalari', callback_data: 'settings_language' }
        ],
        [
          { text: '🔙 Bosh menyu', callback_data: 'back_to_main' }
        ]
      ],
      ru: [
        [
          { text: '🌍 Языковые настройки', callback_data: 'settings_language' }
        ],
        [
          { text: '🔙 Главное меню', callback_data: 'back_to_main' }
        ]
      ],
      en: [
        [
          { text: '🌍 Language Settings', callback_data: 'settings_language' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'back_to_main' }
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
    log.error('Error handling settings', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle language settings
 */
export const handleLanguageSettings = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';

    const messages = {
      uz: `🌍 *Til sozlamalari*\n\n` +
          `Joriy til: *O'zbek*\n\n` +
          `Qaysi tilni tanlamoqchisiz?`,
      ru: `🌍 *Языковые настройки*\n\n` +
          `Текущий язык: *Русский*\n\n` +
          `Какой язык вы хотите выбрать?`,
      en: `🌍 *Language Settings*\n\n` +
          `Current language: *English*\n\n` +
          `Which language would you like to select?`
    };

    // Get current language for display
    const currentLang = ctx.language || 'uz';
    const currentLangNames = {
      uz: "O'zbek",
      ru: 'Русский',
      en: 'English'
    };

    const messagesWithCurrent = {
      uz: `🌍 *Til sozlamalari*\n\n` +
          `Joriy til: *${currentLangNames[currentLang as keyof typeof currentLangNames]}*\n\n` +
          `Qaysi tilni tanlamoqchisiz?`,
      ru: `🌍 *Языковые настройки*\n\n` +
          `Текущий язык: *${currentLangNames[currentLang as keyof typeof currentLangNames]}*\n\n` +
          `Какой язык вы хотите выбрать?`,
      en: `🌍 *Language Settings*\n\n` +
          `Current language: *${currentLangNames[currentLang as keyof typeof currentLangNames]}*\n\n` +
          `Which language would you like to select?`
    };

    const keyboard = [
      [
        { 
          text: currentLang === 'uz' ? '✅ 🇺🇿 O\'zbek' : '🇺🇿 O\'zbek', 
          callback_data: 'settings_change_lang_uz' 
        }
      ],
      [
        { 
          text: currentLang === 'ru' ? '✅ 🇷🇺 Русский' : '🇷🇺 Русский', 
          callback_data: 'settings_change_lang_ru' 
        }
      ],
      [
        { 
          text: currentLang === 'en' ? '✅ 🇬🇧 English' : '🇬🇧 English', 
          callback_data: 'settings_change_lang_en' 
        }
      ],
      [
        { 
          text: language === 'uz' ? '🔙 Orqaga' : 
                language === 'ru' ? '🔙 Назад' : 
                '🔙 Back', 
          callback_data: 'settings' 
        }
      ]
    ];

    const message = messagesWithCurrent[language] || messagesWithCurrent.uz;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
  } catch (error) {
    log.error('Error handling language settings', error);
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    }
    throw error;
  }
});

/**
 * Handle language change
 */
export const handleLanguageChange = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('settings_change_lang_')) {
      return;
    }

    const newLanguage = data.replace('settings_change_lang_', '') as 'uz' | 'ru' | 'en';
    const oldLanguage = ctx.language || 'uz';
    
    // Update user language in database FIRST
    const { User } = await import('../models');
    const user = await User.findByTelegramId(ctx.from!.id);
    
    if (user) {
      user.language = newLanguage;
      await user.save();
      
      // CRITICAL: Update context user and language IMMEDIATELY
      // This ensures all subsequent messages in this session use the new language
      ctx.user = user.toObject() as any;
      ctx.language = newLanguage;
    } else {
      // If user doesn't exist, just update context
      ctx.language = newLanguage;
    }
    
    // Force refresh user data in context for next requests
    // This ensures middleware will use the new language
    if (user) {
      // Reload user to ensure context is updated
      const refreshedUser = await User.findByTelegramId(ctx.from!.id);
      if (refreshedUser) {
        ctx.user = refreshedUser.toObject() as any;
        ctx.language = refreshedUser.language;
      }
    }

    const messages = {
      uz: {
        success: `✅ *Til o'zgartirildi*\n\n` +
                `Yangi til: *O'zbek*\n\n` +
                `Til muvaffaqiyatli o'zgartirildi!`,
        uz: `✅ *Til o'zgartirildi*\n\n` +
            `Yangi til: *O'zbek*\n\n` +
            `Til muvaffaqiyatli o'zgartirildi!`,
        ru: `✅ *Til o'zgartirildi*\n\n` +
            `Yangi til: *Русский*\n\n` +
            `Til muvaffaqiyatli o'zgartirildi!`,
        en: `✅ *Til o'zgartirildi*\n\n` +
            `Yangi til: *English*\n\n` +
            `Til muvaffaqiyatli o'zgartirildi!`
      },
      ru: {
        success: `✅ *Язык изменен*\n\n` +
                `Новый язык: *Русский*\n\n` +
                `Язык успешно изменен!`,
        uz: `✅ *Язык изменен*\n\n` +
            `Новый язык: *O'zbek*\n\n` +
            `Язык успешно изменен!`,
        ru: `✅ *Язык изменен*\n\n` +
            `Новый язык: *Русский*\n\n` +
            `Язык успешно изменен!`,
        en: `✅ *Язык изменен*\n\n` +
            `Новый язык: *English*\n\n` +
            `Язык успешно изменен!`
      },
      en: {
        success: `✅ *Language Changed*\n\n` +
                `New language: *English*\n\n` +
                `Language successfully changed!`,
        uz: `✅ *Language Changed*\n\n` +
            `New language: *O'zbek*\n\n` +
            `Language successfully changed!`,
        ru: `✅ *Language Changed*\n\n` +
            `New language: *Русский*\n\n` +
            `Language successfully changed!`,
        en: `✅ *Language Changed*\n\n` +
            `New language: *English*\n\n` +
            `Language successfully changed!`
      }
    };

    const langNames = {
      uz: "O'zbek",
      ru: 'Русский',
      en: 'English'
    };

    // Use new language for the message
    const message = messages[newLanguage].success || 
                   `✅ Language changed to ${langNames[newLanguage]}`;

    // Create reply keyboard with new language
    let replyKeyboard: Array<Array<{ text: string }>>;
    if (newLanguage === 'ru') {
      replyKeyboard = [
        [
          { text: '🏛 Услуги хокимията' },
          { text: '💰 Налоговая инспекция' }
        ],
        [
          { text: '🏘 Коммунальные услуги' }
        ],
        [
          { text: 'ℹ️ Помощь' },
          { text: '⚙️ Настройки' }
        ]
      ];
    } else if (newLanguage === 'en') {
      replyKeyboard = [
        [
          { text: '🏛 Mayor\'s Office' },
          { text: '💰 Tax Inspection' }
        ],
        [
          { text: '🏘 Utility Services' }
        ],
        [
          { text: 'ℹ️ Help' },
          { text: '⚙️ Settings' }
        ]
      ];
    } else {
      replyKeyboard = [
        [
          { text: '🏛 Hokimlik xizmatlari' },
          { text: '💰 Soliq inspeksiyasi' }
        ],
        [
          { text: '🏘 Kommunal xizmatlar' }
        ],
        [
          { text: 'ℹ️ Yordam' },
          { text: '⚙️ Sozlamalar' }
        ]
      ];
    }

    // CRITICAL: Update reply keyboard FIRST in real-time
    // Telegram API limitation: reply keyboard can only be set with NEW messages, not edited messages
    // So we need to send a new message with reply keyboard to update it immediately
    
    try {
      // Delete the old message (language settings message) to avoid clutter
      await ctx.deleteMessage().catch(() => {
        // If deletion fails, try to edit with empty inline keyboard first
        return ctx.editMessageText(' ', {
          reply_markup: {
            inline_keyboard: []
          }
        }).catch(() => {});
      });
      
      // Send new message with success notification AND reply keyboard
      // This is the only way to update reply keyboard in Telegram API
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: replyKeyboard,
          resize_keyboard: true
        }
      });
      
      log.info('Reply keyboard updated with success message', {
        userId: ctx.from!.id,
        newLanguage,
        oldLanguage,
        keyboardUpdated: true
      });
      
      // Answer callback query
      await ctx.answerCbQuery(`✅ ${langNames[newLanguage]}`).catch(() => {});
    } catch (error) {
      log.error('Failed to update reply keyboard', error, {
        userId: ctx.from!.id,
        newLanguage,
        chatId: ctx.chat?.id
      });
      
      // Fallback: edit message normally if reply keyboard update fails
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: newLanguage === 'uz' ? '🔙 Bosh menyu' : 
                      newLanguage === 'ru' ? '🔙 Главное меню' : 
                      '🔙 Main Menu', 
                callback_data: 'back_to_main' 
              }
            ]
          ]
        }
      }).catch(() => {});
      
      // Answer callback query even on error
      await ctx.answerCbQuery(`✅ ${langNames[newLanguage]}`).catch(() => {});
    }

    // Log language change
    await SystemLog.logEvent(
      'user_action',
      'language_changed',
      {
        userId: ctx.from!.id,
        oldLanguage: oldLanguage,
        newLanguage: newLanguage
      },
      {
        userId: ctx.from!.id,
        result: 'success'
      }
    );
    
    // IMPORTANT: After language change, all subsequent messages in this session
    // will use the new language because:
    // 1. ctx.language is updated immediately
    // 2. ctx.user is updated with new language
    // 3. Middleware will load user from database on next request
    // 4. All handlers use ctx.language for translations
    
    log.info('Language changed', {
      userId: ctx.from!.id,
      oldLanguage,
      newLanguage,
      contextUpdated: true
    });
  } catch (error) {
    log.error('Error changing language', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

/**
 * Handle my queues action (placeholder)
 */
export const handleMyQueues = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';

    const messages = {
      uz: `📋 *Mening navbatlarim*\n\n` +
          `Bu funksiya tez orada qo'shiladi.`,
      ru: `📋 *Мои записи*\n\n` +
          `Эта функция будет добавлена в ближайшее время.`,
      en: `📋 *My appointments*\n\n` +
          `This feature will be added soon.`
    };

    await ctx.answerCbQuery(messages[language] || messages.uz);
  } catch (error) {
    log.error('Error handling my queues', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

// ================================
// REQUEST HANDLERS
// ================================

/**
 * Handle request button click
 */
export const handleRequestButton = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('request_')) {
      return;
    }

    const orgCode = data.replace('request_', '') as OrganizationCode;
    const language = ctx.language || 'uz';

    // Update session to track which organization the request is for
    if (!ctx.session) {
      ctx.session = { data: {} };
    }
    if (!ctx.session.data) {
      ctx.session.data = {};
    }
    
    (ctx.session.data as QueueSessionData).currentOrganization = orgCode;
    ctx.session.step = 'waiting_for_request';

    const orgName = getOrganizationName(orgCode, language);

    const messages = {
      uz: `📝 *Murojaat yuborish*\n\n` +
          `Tashkilot: *${orgName}*\n\n` +
          `Iltimos, murojaatingizni yuboring. Matn, rasm, hujjat yoki ovozli xabar shaklida bo'lishi mumkin.\n\n` +
          `Murojaatingiz AI yordamida tahlil qilinadi va tegishli tashkilotga yuboriladi.`,
      ru: `📝 *Отправка обращения*\n\n` +
          `Организация: *${orgName}*\n\n` +
          `Пожалуйста, отправьте ваше обращение. Оно может быть в виде текста, фото, документа или голосового сообщения.\n\n` +
          `Ваше обращение будет проанализировано с помощью AI и отправлено в соответствующую организацию.`,
      en: `📝 *Send request*\n\n` +
          `Organization: *${orgName}*\n\n` +
          `Please send your request. It can be in the form of text, photo, document, or voice message.\n\n` +
          `Your request will be analyzed by AI and sent to the appropriate organization.`
    };

    const keyboard = [
      [
        {
          text: language === 'uz' ? '🔙 Orqaga' :
                language === 'ru' ? '🔙 Назад' :
                '🔙 Back',
          callback_data: `back_to_services_${orgCode}`
        }
      ]
    ];

    await ctx.editMessageText(messages[language] || messages.uz, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error handling request button', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

