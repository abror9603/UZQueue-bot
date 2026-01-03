/**
 * Application constants
 * All magic numbers, strings, and configuration values
 */

// ================================
// REQUEST CATEGORIES
// ================================

export const CATEGORIES = {
  TAX: 'Soliq masalalari',
  UTILITIES: 'Kommunal xizmatlar',
  CONSTRUCTION: 'Qurilish va ruxsatlar',
  EDUCATION: "Ta'lim",
  HEALTHCARE: 'Sog\'liqni saqlash',
  BUSINESS: 'Tadbirkorlik',
  SOCIAL: 'Ijtimoiy yordam',
  INFRASTRUCTURE: 'Infratuzilma',
  OTHER: 'Boshqa'
} as const;

// ================================
// AI CONFIGURATION
// ================================

export const AI_CONFIG = {
  MIN_CONFIDENCE_FOR_AUTO_ASSIGN: 85,
  MIN_CONFIDENCE_FOR_ADMIN_REVIEW: 70,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000
} as const;

// ================================
// REQUEST DEADLINES
// ================================

export const DEADLINE_CONFIG = {
  DEFAULT_DAYS: 7,
  REMINDER_DAYS: [3, 1], // Days before deadline to send reminder
  ESCALATION_DAYS: 0 // Days after deadline to escalate
} as const;

// ================================
// RATE LIMITING
// ================================

export const RATE_LIMIT = {
  REQUESTS_PER_HOUR: 10,
  REQUESTS_PER_DAY: 50,
  ADMIN_ACTIONS_PER_HOUR: 100
} as const;

// ================================
// TRACKING ID FORMAT
// ================================

export const TRACKING_ID_PREFIX = 'UZQ';
export const TRACKING_ID_LENGTH = 6;

// ================================
// PAGINATION
// ================================

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
} as const;

// ================================
// VALIDATION LIMITS
// ================================

export const VALIDATION = {
  MIN_REQUEST_TEXT_LENGTH: 10,
  MAX_REQUEST_TEXT_LENGTH: 5000,
  MAX_MEDIA_FILES: 5,
  MAX_VOICE_DURATION: 300 // seconds
} as const;

// ================================
// ERROR MESSAGES (Uzbek)
// ================================

export const ERROR_MESSAGES = {
  uz: {
    database: 'Ma\'lumotlar bazasiga ulanishda xatolik. Qayta urinib ko\'ring.',
    ai: 'AI xizmatida vaqtinchalik muammo. Admin ko\'rib chiqadi.',
    network: 'Tarmoq xatosi. Internetingizni tekshiring.',
    unknown: 'Kutilmagan xatolik. Texnik yordam bilan bog\'laning.',
    validation: 'Noto\'g\'ri ma\'lumot kiritildi.',
    rateLimit: 'Juda ko\'p so\'rov yuborildi. Iltimos, biroz kuting.',
    notFound: 'Ma\'lumot topilmadi.',
    unauthorized: 'Sizda ruxsat yo\'q.',
    timeout: 'So\'rov vaqti tugadi. Qayta urinib ko\'ring.'
  },
  ru: {
    database: 'Ошибка подключения к базе данных. Попробуйте снова.',
    ai: 'Временная проблема с AI сервисом. Администратор проверит.',
    network: 'Ошибка сети. Проверьте интернет.',
    unknown: 'Неожиданная ошибка. Свяжитесь с технической поддержкой.',
    validation: 'Введены неверные данные.',
    rateLimit: 'Слишком много запросов. Пожалуйста, подождите.',
    notFound: 'Данные не найдены.',
    unauthorized: 'У вас нет разрешения.',
    timeout: 'Время запроса истекло. Попробуйте снова.'
  },
  en: {
    database: 'Database connection error. Please try again.',
    ai: 'Temporary issue with AI service. Admin will review.',
    network: 'Network error. Check your internet.',
    unknown: 'Unexpected error. Contact technical support.',
    validation: 'Invalid data entered.',
    rateLimit: 'Too many requests. Please wait.',
    notFound: 'Data not found.',
    unauthorized: 'You do not have permission.',
    timeout: 'Request timeout. Please try again.'
  }
} as const;

// ================================
// SUCCESS MESSAGES (Uzbek)
// ================================

export const SUCCESS_MESSAGES = {
  uz: {
    requestCreated: 'Murojaatingiz qabul qilindi! Tracking ID: {trackingId}',
    requestResolved: 'Murojaatingiz hal qilindi.',
    responseSent: 'Javobingiz yuborildi.',
    ratingSubmitted: 'Rahmat! Baholash qabul qilindi.'
  },
  ru: {
    requestCreated: 'Ваш запрос принят! Tracking ID: {trackingId}',
    requestResolved: 'Ваш запрос решен.',
    responseSent: 'Ваш ответ отправлен.',
    ratingSubmitted: 'Спасибо! Оценка принята.'
  },
  en: {
    requestCreated: 'Your request has been accepted! Tracking ID: {trackingId}',
    requestResolved: 'Your request has been resolved.',
    responseSent: 'Your response has been sent.',
    ratingSubmitted: 'Thank you! Rating submitted.'
  }
} as const;

