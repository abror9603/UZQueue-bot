const userService = require('../services/userService');
const locationService = require('../services/locationService');
const organizationService = require('../services/organizationService');
const telegramGroupService = require('../services/telegramGroupService');
const appealService = require('../services/appealService');
const aiService = require('../services/aiService');
const moderationService = require('../services/moderationService');
const spamProtectionService = require('../services/spamProtectionService');
const userBehaviorService = require('../services/userBehaviorService');
const stateService = require('../services/stateService');
const ActionValidator = require('../middleware/actionValidator');
const Keyboard = require('../utils/keyboard');
const i18next = require('../config/i18n');
const TelegramBot = require('node-telegram-bot-api');

class AppealHandlers {
  async handleNewAppeal(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = await userService.getUser(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Iltimos, /start buyrug\'ini yuboring');
      return;
    }

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Reset state
    await stateService.clear(userId);
    await stateService.setStep(userId, 'select_region');
    await stateService.setData(userId, {});

    // Get regions
    const regions = await locationService.getAllRegions(language);
    
    await bot.sendMessage(
      chatId,
      t('select_region'),
      Keyboard.getRegionsInline(regions, language)
    );
  }

  async processAppealStep(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const step = await stateService.getStep(userId);
    const data = await stateService.getData(userId) || {};

    // Check if user is blocked
    const blocked = await spamProtectionService.checkBlocked(userId);
    if (blocked.blocked) {
      const unblockDate = new Date(blocked.unblockAt).toLocaleString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ');
      await bot.sendMessage(chatId, 
        t('user_blocked', { 
          defaultValue: `❌ Siz vaqtinchalik bloklangansiz. Blokdan chiqish: ${unblockDate}` 
        })
      );
      return;
    }

    // Handle cancel
    if (text === t('cancel') || text === '❌ Bekor qilish') {
      await stateService.clear(userId);
      await bot.sendMessage(chatId, t('cancel'), Keyboard.getMainMenu(language));
      return;
    }

    // Handle back
    if (text === t('back') || text === '◀️ Orqaga') {
      await this.handleBack(bot, msg, step, data, language);
      return;
    }

    // Action validation based on step
    const expectedAction = this._getExpectedAction(step);
    if (expectedAction) {
      const validation = ActionValidator.validate(msg, expectedAction, language);
      if (!validation.valid) {
        await bot.sendMessage(chatId, validation.error);
        return;
      }
    }

    switch (step) {
      case 'select_region':
        await this.handleRegionSelection(bot, msg, text, data, language);
        break;
      case 'select_district':
        await this.handleDistrictSelection(bot, msg, text, data, language);
        break;
      case 'select_neighborhood':
        await this.handleNeighborhoodSelection(bot, msg, text, data, language);
        break;
      case 'select_organization':
        await this.handleOrganizationSelection(bot, msg, text, data, language);
        break;
      case 'enter_name':
        await this.handleNameInput(bot, msg, text, data, language);
        break;
      case 'enter_phone':
        await this.handlePhoneInput(bot, msg, text, data, language);
        break;
      case 'enter_appeal_type':
        await this.handleAppealTypeInput(bot, msg, text, data, language);
        break;
      case 'enter_appeal_text':
        await this.handleAppealTextInput(bot, msg, text, data, language);
        break;
      case 'upload_file':
        await this.handleFileUpload(bot, msg, data, language);
        break;
      case 'confirm_appeal':
        await this.handleAppealConfirmation(bot, msg, text, data, language);
        break;
      default:
        break;
    }
  }

  _getExpectedAction(step) {
    const actionMap = {
      'enter_name': 'text',
      'enter_phone': 'text',
      'enter_appeal_type': 'text',
      'enter_appeal_text': 'text',
      'upload_file': 'file'
    };
    return actionMap[step] || null;
  }

  async handleRegionSelection(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const regions = await locationService.getAllRegions(language);
    const selectedRegion = regions.find(r => r.name === text);

    if (!selectedRegion) {
      await bot.sendMessage(chatId, '❌ Noto\'g\'ri tanlov. Qayta tanlang:');
      return;
    }

    data.regionId = selectedRegion.id;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'select_district');

    const districts = await locationService.getDistrictsByRegion(selectedRegion.id, language);
    
    i18next.changeLanguage(language);
    const t = i18next.t;
    
    await bot.sendMessage(
      chatId,
      t('select_district'),
      Keyboard.getDistricts(districts, language)
    );
  }

  async handleDistrictSelection(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const districts = await locationService.getDistrictsByRegion(data.regionId, language);
    const selectedDistrict = districts.find(d => d.name === text);

    if (!selectedDistrict) {
      await bot.sendMessage(chatId, '❌ Noto\'g\'ri tanlov. Qayta tanlang:');
      return;
    }

    data.districtId = selectedDistrict.id;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'select_neighborhood');

    const neighborhoods = await locationService.getNeighborhoodsByDistrict(selectedDistrict.id, language);
    
    i18next.changeLanguage(language);
    const t = i18next.t;
    
    await bot.sendMessage(
      chatId,
      t('select_neighborhood'),
      Keyboard.getNeighborhoods(neighborhoods, language)
    );
  }

  async handleNeighborhoodSelection(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18next.changeLanguage(language);
    const t = i18next.t;

    const neighborhoods = await locationService.getNeighborhoodsByDistrict(data.districtId, language);
    const selectedNeighborhood = neighborhoods.find(n => n.name === text);

    if (selectedNeighborhood) {
      data.neighborhoodId = selectedNeighborhood.id;
      await stateService.setData(userId, data);
    }
    // If not found, continue without neighborhood

    await stateService.setStep(userId, 'select_organization');

    const organizations = await organizationService.getAllOrganizations(language);
    
    await bot.sendMessage(
      chatId,
      t('select_organization'),
      Keyboard.getOrganizations(organizations, language)
    );
  }

  async handleOrganizationSelection(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const organizations = await organizationService.getAllOrganizations(language);
    const selectedOrg = organizations.find(o => o.name === text);

    if (!selectedOrg) {
      await bot.sendMessage(chatId, '❌ Noto\'g\'ri tanlov. Qayta tanlang:');
      return;
    }

    data.organizationId = selectedOrg.id;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'enter_name');

    i18next.changeLanguage(language);
    const t = i18next.t;
    
    await bot.sendMessage(
      chatId,
      t('enter_name'),
      Keyboard.getBackCancel(language)
    );
  }

  async handleNameInput(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18next.changeLanguage(language);
    const t = i18next.t;

    // Validate name
    const nameValidation = ActionValidator.validateName(text, language);
    if (!nameValidation.valid) {
      await bot.sendMessage(chatId, nameValidation.error);
      return;
    }

    data.fullName = text.trim();
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'enter_phone');
    
    await bot.sendMessage(
      chatId,
      t('enter_phone'),
      Keyboard.getBackCancel(language)
    );
  }

  async handlePhoneInput(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18next.changeLanguage(language);
    const t = i18next.t;

    // Validate phone
    const phoneValidation = ActionValidator.validatePhone(text, language);
    if (!phoneValidation.valid) {
      await bot.sendMessage(chatId, phoneValidation.error);
      return;
    }

    data.phone = text.trim();
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'enter_appeal_type');
    
    await bot.sendMessage(
      chatId,
      t('enter_appeal_type'),
      Keyboard.getBackCancel(language)
    );
  }

  async handleAppealTypeInput(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    data.appealType = text;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'enter_appeal_text');

    i18next.changeLanguage(language);
    const t = i18next.t;
    
    await bot.sendMessage(
      chatId,
      t('enter_appeal_text'),
      Keyboard.getBackCancel(language)
    );
  }

  async handleAppealTextInput(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18next.changeLanguage(language);
    const t = i18next.t;

    if (!text || text.length < 10) {
      await bot.sendMessage(chatId, t('validation_error_appeal_too_short', {
        defaultValue: '❌ Murojaat matni kamida 10 ta belgi bo\'lishi kerak'
      }));
      return;
    }

    // Check if user wants AI to format the appeal
    const wantsFormatting = text.toLowerCase().includes('yordam') || 
                           text.toLowerCase().includes('yozib ber') ||
                           text.toLowerCase().includes('rasmiy');

    if (wantsFormatting) {
      // Ask user if they want AI to format
      data.originalAppealText = text;
      data.needsFormatting = true;
      await stateService.setData(userId, data);
      
      await bot.sendMessage(
        chatId,
        t('ai_format_question', {
          defaultValue: '🤖 Murojaatingizni AI yordamida rasmiy formatda yozib beraymi?'
        }),
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: t('yes', { defaultValue: '✅ Ha' }), callback_data: 'format_appeal_yes' },
                { text: t('no', { defaultValue: '❌ Yo\'q' }), callback_data: 'format_appeal_no' }
              ]
            ]
          }
        }
      );
      return;
    }

    data.appealText = text;
    data.needsFormatting = false;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'upload_file');
    
    await bot.sendMessage(
      chatId,
      t('upload_file_optional'),
      Keyboard.getSkipCancel(language)
    );
  }

  async handleFileUpload(bot, msg, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // If skip, go to confirmation
    if (msg.text === '/skip' || msg.text?.includes('skip')) {
      await this.showConfirmation(bot, msg, data, language);
      return;
    }

    // Handle file (photo or document)
    if (msg.photo || msg.document) {
      const fileId = msg.photo 
        ? msg.photo[msg.photo.length - 1].file_id
        : msg.document.file_id;
      
      if (!data.files) data.files = [];
      data.files.push({
        fileId,
        fileType: msg.photo ? 'photo' : 'document',
        fileName: msg.document?.file_name || 'photo.jpg'
      });
      
      await stateService.setData(userId, data);
    }

    await this.showConfirmation(bot, msg, data, language);
  }

  async showConfirmation(bot, msg, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await stateService.setStep(userId, 'confirm_appeal');

    i18next.changeLanguage(language);
    const t = i18next.t;

    const location = await locationService.getLocationString(
      data.regionId,
      data.districtId,
      data.neighborhoodId,
      language
    );

    const org = await organizationService.getOrganizationById(data.organizationId);
    const orgName = language === 'ru' ? org.nameRu : language === 'en' ? org.nameEn : org.nameUz;

    const confirmText = t('confirm_appeal', {
      location,
      organization: orgName,
      name: data.fullName,
      phone: data.phone,
      type: data.appealType,
      text: data.appealText.substring(0, 200) + (data.appealText.length > 200 ? '...' : '')
    });

    await bot.sendMessage(
      chatId,
      confirmText,
      Keyboard.getConfirmCancel(language)
    );
  }

  async handleAppealConfirmation(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18next.changeLanguage(language);
    const t = i18next.t;

    if (text !== t('confirm') && text !== '✅ Tasdiqlash') {
      await bot.sendMessage(chatId, t('cancel'));
      await stateService.clear(userId);
      return;
    }

    try {
      // Check rate limit
      const rateLimit = await spamProtectionService.checkRateLimit(userId, 2, 60);
      if (!rateLimit.allowed) {
        const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ');
        await bot.sendMessage(chatId, 
          t('rate_limit_exceeded', {
            defaultValue: `❌ Juda tez-tez murojaat yuboryapsiz. Keyingi murojaat: ${resetTime}`
          })
        );
        return;
      }

      // Check for spam
      const spamCheck = await moderationService.checkSpam(data.appealText, userId);
      if (spamCheck.isSpam) {
        await bot.sendMessage(chatId, 
          t('spam_detected', {
            defaultValue: `❌ ${spamCheck.reason}. Iltimos, yangi murojaat yozing.`
          })
        );
        return;
      }

      // AI Moderation
      await bot.sendMessage(chatId, t('checking_appeal', { defaultValue: '🔍 Murojaatingiz tekshirilmoqda...' }));
      
      const moderation = await moderationService.moderateAppeal(data.appealText, userId);
      
      if (!moderation.approved) {
        // Appeal rejected by AI
        await userBehaviorService.logBehavior(userId, 'appeal_rejected', { reason: moderation.reason });
        
        await bot.sendMessage(chatId, 
          t('appeal_rejected', {
            defaultValue: `❌ Murojaatingiz qoidalarga mos emas.\n\nSabab: ${moderation.reason}\n\n${moderation.suggestion || 'Iltimos, rasmiy va mazmunli murojaat yozing.'}`
          })
        );

        // If user has low rating, consider blocking
        const rating = await userBehaviorService.getUserRating(userId);
        if (rating.rating < 30) {
          await spamProtectionService.blockUser(userId, 24);
          await bot.sendMessage(chatId, 
            t('user_blocked_temporary', {
              defaultValue: '⚠️ Ko\'p murojaatlar rad etilgani uchun siz 24 soatga bloklangansiz.'
            })
          );
        }

        await stateService.clear(userId);
        return;
      }

      // Find telegram group for routing
      const telegramGroup = await telegramGroupService.findGroupForAppeal(
        data.regionId,
        data.districtId,
        data.neighborhoodId || null,
        data.organizationId
      );

      if (!telegramGroup) {
        await bot.sendMessage(chatId, t('group_not_found', {
          defaultValue: '❌ Ushbu hudud uchun Telegram guruh topilmadi. Iltimos, administrator bilan bog\'laning.'
        }));
        return;
      }

      // Check if group subscription is active
      if (telegramGroup.subscriptionStatus !== 'active') {
        await bot.sendMessage(chatId, t('group_inactive', {
          defaultValue: '❌ Ushbu tashkilot obunasi faol emas. Murojaat qabul qilinmaydi.'
        }));
        return;
      }

      // Create appeal
      const appeal = await appealService.createAppeal({
        userId,
        regionId: data.regionId,
        districtId: data.districtId,
        neighborhoodId: data.neighborhoodId || null,
        organizationId: data.organizationId,
        telegramGroupId: telegramGroup.id,
        fullName: data.fullName,
        phone: data.phone,
        appealType: data.appealType,
        appealText: data.appealText
      });

      // Save files if any
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          await appealService.addFile(appeal.id, file);
        }
      }

      // Record appeal submission
      await spamProtectionService.recordAppeal(userId);
      await userBehaviorService.logBehavior(userId, 'appeal_submitted', { appealId: appeal.id });

      // Send to Telegram group
      const groupMessage = await this.sendAppealToGroup(bot, appeal, telegramGroup, language);

      // Save group message ID
      await appealService.updateAppeal(appeal.id, { groupMessageId: groupMessage.message_id });

      // Confirm to user
      const location = await locationService.getLocationString(
        data.regionId,
        data.districtId,
        data.neighborhoodId,
        language
      );

      const org = await organizationService.getOrganizationById(data.organizationId);
      const orgName = language === 'ru' ? org.nameRu : language === 'en' ? org.nameEn : org.nameUz;

      const successMessage = t('appeal_submitted', {
        appealId: appeal.appealId,
        location,
        organization: orgName
      });

      await bot.sendMessage(chatId, successMessage);
      await stateService.clear(userId);

    } catch (error) {
      console.error('Appeal creation error:', error);
      await bot.sendMessage(chatId, t('error'));
    }
  }

  async sendAppealToGroup(bot, appeal, telegramGroup, language) {
    const chatId = telegramGroup.chatId;

    const locationService = require('../services/locationService');
    const organizationService = require('../services/organizationService');

    const location = await locationService.getLocationString(
      appeal.regionId,
      appeal.districtId,
      appeal.neighborhoodId,
      language
    );

    const org = await organizationService.getOrganizationById(appeal.organizationId);
    const orgName = language === 'ru' ? org.nameRu : language === 'en' ? org.nameEn : org.nameUz;

    const statusText = {
      uz: { pending: 'Jarayonda', completed: 'Bajarildi', rejected: 'Rad etildi' },
      ru: { pending: 'В процессе', completed: 'Выполнено', rejected: 'Отклонено' },
      en: { pending: 'Pending', completed: 'Completed', rejected: 'Rejected' }
    };

    const status = statusText[language]?.[appeal.status] || appeal.status;

    const message = `📌 Murojaat ID: #${appeal.appealId}\n\n` +
      `📍 Hudud: ${location}\n` +
      `🏛 Tashkilot: ${orgName}\n` +
      `👤 Fuqaro: ${appeal.fullName}\n` +
      `📞 Telefon: ${appeal.phone}\n` +
      `📝 Holat: ${status}\n\n` +
      `📄 Murojaat matni:\n${appeal.appealText}`;

    return await bot.sendMessage(chatId, message);
  }

  async continueToOrganizationSelection(bot, msg, userId, data, language) {
    const chatId = msg.chat.id;
    
    i18next.changeLanguage(language);
    const t = i18next.t;

    await stateService.setStep(userId, 'select_organization');

    const organizations = await organizationService.getAllOrganizations(language);
    
    await bot.sendMessage(
      chatId,
      t('select_organization'),
      Keyboard.getOrganizations(organizations, language)
    );
  }

  async handleBack(bot, msg, step, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Simple back navigation
    if (step === 'select_district') {
      await stateService.setStep(userId, 'select_region');
      const regions = await locationService.getAllRegions(language);
      i18next.changeLanguage(language);
      const t = i18next.t;
      await bot.sendMessage(chatId, t('select_region'), Keyboard.getRegionsInline(regions, language));
    } else if (step === 'select_neighborhood') {
      await stateService.setStep(userId, 'select_district');
      const districts = await locationService.getDistrictsByRegion(data.regionId, language);
      i18next.changeLanguage(language);
      const t = i18next.t;
      await bot.sendMessage(chatId, t('select_district'), Keyboard.getDistrictsInline(districts, language, data.regionId));
    }
    // Add more back handlers as needed
  }
}

module.exports = new AppealHandlers();

