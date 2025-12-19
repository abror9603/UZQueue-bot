const i18next = require('../config/i18n');

/**
 * Action-based validation middleware
 * Checks if user input matches expected action type
 */
class ActionValidator {
  /**
   * Validates message type based on expected action
   * @param {Object} msg - Telegram message object
   * @param {String} expectedAction - Expected action type: 'text', 'file', 'button', 'photo', 'document'
   * @param {String} language - User language
   * @returns {Object} { valid: boolean, error: string|null }
   */
  static validate(msg, expectedAction, language = 'uz') {
    i18next.changeLanguage(language);
    const t = i18next.t;

    // If expecting text input
    if (expectedAction === 'text') {
      if (!msg.text) {
        // Check what was sent instead
        if (msg.photo) {
          return {
            valid: false,
            error: t('validation_error_photo_instead_of_text', {
              defaultValue: '❌ Iltimos, matn yuboring, rasm emas. Matnni kiriting:'
            })
          };
        }
        if (msg.document) {
          return {
            valid: false,
            error: t('validation_error_file_instead_of_text', {
              defaultValue: '❌ Iltimos, matn yuboring, fayl emas. Matnni kiriting:'
            })
          };
        }
        if (msg.sticker) {
          return {
            valid: false,
            error: t('validation_error_sticker_instead_of_text', {
              defaultValue: '❌ Iltimos, matn yuboring, sticker emas. Matnni kiriting:'
            })
          };
        }
        if (msg.audio || msg.voice) {
          return {
            valid: false,
            error: t('validation_error_audio_instead_of_text', {
              defaultValue: '❌ Iltimos, matn yuboring, ovoz emas. Matnni kiriting:'
            })
          };
        }
        if (msg.video) {
          return {
            valid: false,
            error: t('validation_error_video_instead_of_text', {
              defaultValue: '❌ Iltimos, matn yuboring, video emas. Matnni kiriting:'
            })
          };
        }
        return {
          valid: false,
          error: t('validation_error_text_required', {
            defaultValue: '❌ Iltimos, matn yuboring.'
          })
        };
      }

      // Validate text is not empty or too short
      const text = msg.text.trim();
      if (text.length < 2) {
        return {
          valid: false,
          error: t('validation_error_text_too_short', {
            defaultValue: '❌ Matn juda qisqa. Iltimos, to\'liq matn kiriting.'
          })
        };
      }
    }

    // If expecting file/photo input
    if (expectedAction === 'file' || expectedAction === 'photo') {
      if (!msg.photo && !msg.document) {
        if (msg.text) {
          return {
            valid: false,
            error: t('validation_error_file_required', {
              defaultValue: '❌ Iltimos, fayl yoki rasm yuboring, matn emas.'
            })
          };
        }
        return {
          valid: false,
          error: t('validation_error_file_required', {
            defaultValue: '❌ Iltimos, fayl yoki rasm yuboring.'
          })
        };
      }
    }

    // If expecting button selection (callback query)
    if (expectedAction === 'button') {
      // This should be handled in callback handler, but we can check here too
      if (msg.text && !msg.text.startsWith('/')) {
        return {
          valid: false,
          error: t('validation_error_button_required', {
            defaultValue: '❌ Iltimos, tugmalardan birini tanlang.'
          })
        };
      }
    }

    return { valid: true, error: null };
  }

  /**
   * Formats phone number to +998XXXXXXXXX format
   * Handles various input formats:
   * - 998993691401 -> +998993691401
   * - 993691401 -> +998993691401
   * - +998993691401 -> +998993691401
   */
  static formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let cleaned = phone.trim().replace(/[^\d+]/g, '');
    
    // If starts with +998, return as is (if valid length)
    if (cleaned.startsWith('+998')) {
      if (cleaned.length === 13) {
        return cleaned;
      }
    }
    
    // If starts with 998 (without +), add +
    if (cleaned.startsWith('998')) {
      if (cleaned.length === 12) {
        return '+' + cleaned;
      }
    }
    
    // If starts with 9 (9 digits), add +998
    if (cleaned.startsWith('9') && cleaned.length === 9) {
      return '+998' + cleaned;
    }
    
    return null;
  }

  /**
   * Validates phone number format and checks if it's a valid Uzbekistan number
   * Validates against common invalid patterns like all same digits (1111111, 3333333, etc.)
   */
  static validatePhone(phone, language = 'uz') {
    i18next.changeLanguage(language);
    const t = i18next.t;

    // First, format the phone number
    const formatted = this.formatPhoneNumber(phone);
    
    if (!formatted) {
      return {
        valid: false,
        error: t('validation_error_phone_format', {
          defaultValue: '❌ Telefon raqam noto\'g\'ri. Format: +998901234567'
        })
      };
    }

    // Check format: must be +998 followed by 9 digits
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(formatted)) {
      return {
        valid: false,
        error: t('validation_error_phone_format', {
          defaultValue: '❌ Telefon raqam noto\'g\'ri. Format: +998901234567'
        })
      };
    }

    // Extract the 9-digit number part (after +998)
    const numberPart = formatted.substring(4);
    
    // Check for invalid patterns (all same digits, sequential patterns, etc.)
    // Check if all digits are the same (111111111, 222222222, etc.)
    const allSame = /^(\d)\1{8}$/.test(numberPart);
    if (allSame) {
      return {
        valid: false,
        error: t('validation_error_phone_invalid', {
          defaultValue: '❌ Telefon raqam noto\'g\'ri. Iltimos, haqiqiy telefon raqam kiriting.'
        })
      };
    }

    // Check for sequential patterns (123456789, 987654321, etc.)
    let isSequential = true;
    let isReverseSequential = true;
    for (let i = 1; i < numberPart.length; i++) {
      const current = parseInt(numberPart[i]);
      const prev = parseInt(numberPart[i - 1]);
      if (current !== prev + 1) {
        isSequential = false;
      }
      if (current !== prev - 1) {
        isReverseSequential = false;
      }
    }
    if (isSequential || isReverseSequential) {
      return {
        valid: false,
        error: t('validation_error_phone_invalid', {
          defaultValue: '❌ Telefon raqam noto\'g\'ri. Iltimos, haqiqiy telefon raqam kiriting.'
        })
      };
    }

    // Check first digit of the 9-digit number (must be 9 for mobile numbers in Uzbekistan)
    const firstDigit = numberPart[0];
    if (firstDigit !== '9') {
      return {
        valid: false,
        error: t('validation_error_phone_format', {
          defaultValue: '❌ Telefon raqam noto\'g\'ri. Format: +998901234567'
        })
      };
    }

    return { valid: true, error: null, formatted };
  }

  /**
   * Validates name format (full name)
   */
  static validateName(name, language = 'uz') {
    i18next.changeLanguage(language);
    const t = i18next.t;

    if (!name || name.trim().length < 3) {
      return {
        valid: false,
        error: t('validation_error_name_too_short', {
          defaultValue: '❌ Ism va familiya kamida 3 ta belgi bo\'lishi kerak.'
        })
      };
    }

    if (name.trim().length > 100) {
      return {
        valid: false,
        error: t('validation_error_name_too_long', {
          defaultValue: '❌ Ism va familiya juda uzun.'
        })
      };
    }

    return { valid: true, error: null };
  }
}

module.exports = ActionValidator;

