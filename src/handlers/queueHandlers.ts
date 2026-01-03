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

    // Create keyboard based on language
    let keyboard: Array<Array<{ text: string; callback_data: string }>>;
    
    if (language === 'ru') {
      keyboard = [
        [
          { text: '🏛 Услуги хокимията', callback_data: 'org_hokimlik' },
          { text: '💰 Налоговая инспекция', callback_data: 'org_soliq' }
        ],
        [
          { text: '🏘 Коммунальные услуги', callback_data: 'org_kommunal' }
        ],
        [
          { text: 'ℹ️ Помощь', callback_data: 'help' },
          { text: '⚙️ Настройки', callback_data: 'settings' }
        ]
      ];
    } else if (language === 'en') {
      keyboard = [
        [
          { text: '🏛 Mayor\'s Office', callback_data: 'org_hokimlik' },
          { text: '💰 Tax Inspection', callback_data: 'org_soliq' }
        ],
        [
          { text: '🏘 Utility Services', callback_data: 'org_kommunal' }
        ],
        [
          { text: 'ℹ️ Help', callback_data: 'help' },
          { text: '⚙️ Settings', callback_data: 'settings' }
        ]
      ];
    } else {
      keyboard = [
        [
          { text: '🏛 Hokimlik xizmatlari', callback_data: 'org_hokimlik' },
          { text: '💰 Soliq inspeksiyasi', callback_data: 'org_soliq' }
        ],
        [
          { text: '🏘 Kommunal xizmatlar', callback_data: 'org_kommunal' }
        ],
        [
          { text: 'ℹ️ Yordam', callback_data: 'help' },
          { text: '⚙️ Sozlamalar', callback_data: 'settings' }
        ]
      ];
    }

    if (ctx.callbackQuery) {
      await ctx.editMessageText(messages[language] || messages.uz, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } else {
      await ctx.reply(messages[language] || messages.uz, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
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
 * Handle organization selection
 */
export const handleOrganizationSelection = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    if (!('data' in ctx.callbackQuery!)) {
      await ctx.answerCbQuery('❌ Xato');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data?.startsWith('org_')) {
      return;
    }

    const orgCode = data.replace('org_', '') as OrganizationCode;
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
      await ctx.answerCbQuery('❌ Tashkilot topilmadi');
      return;
    }

    // Show services menu
    await showServicesMenu(ctx, orgCode, language);
    await ctx.answerCbQuery();
  } catch (error) {
    log.error('Error handling organization selection', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
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
 * Handle help action (placeholder)
 */
export const handleHelp = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';

    const messages = {
      uz: `ℹ️ *Yordam*\n\n` +
          `Bu funksiya tez orada qo'shiladi.`,
      ru: `ℹ️ *Помощь*\n\n` +
          `Эта функция будет добавлена в ближайшее время.`,
      en: `ℹ️ *Help*\n\n` +
          `This feature will be added soon.`
    };

    await ctx.answerCbQuery(messages[language] || messages.uz);
  } catch (error) {
    log.error('Error handling help', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi').catch(() => {});
    throw error;
  }
});

/**
 * Handle settings action (placeholder)
 */
export const handleSettings = asyncHandler(async (ctx: ExtendedContext) => {
  try {
    const language = ctx.language || 'uz';

    const messages = {
      uz: `⚙️ *Sozlamalar*\n\n` +
          `Bu funksiya tez orada qo'shiladi.`,
      ru: `⚙️ *Настройки*\n\n` +
          `Эта функция будет добавлена в ближайшее время.`,
      en: `⚙️ *Settings*\n\n` +
          `This feature will be added soon.`
    };

    await ctx.answerCbQuery(messages[language] || messages.uz);
  } catch (error) {
    log.error('Error handling settings', error);
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

