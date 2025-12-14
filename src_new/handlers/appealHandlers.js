const userService = require('../services/userService');
const locationService = require('../services/locationService');
const organizationService = require('../services/organizationService');
const telegramGroupService = require('../services/telegramGroupService');
const appealService = require('../services/appealService');
const aiService = require('../services/aiService');
const stateService = require('../services/stateService');
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
      Keyboard.getRegions(regions, language)
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

    if (!text || text.length < 3) {
      await bot.sendMessage(chatId, '❌ Ism va familiya kamida 3 ta belgi bo\'lishi kerak');
      return;
    }

    data.fullName = text;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'enter_phone');

    i18next.changeLanguage(language);
    const t = i18next.t;
    
    await bot.sendMessage(
      chatId,
      t('enter_phone'),
      Keyboard.getBackCancel(language)
    );
  }

  async handlePhoneInput(bot, msg, text, data, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Basic phone validation
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(text)) {
      await bot.sendMessage(chatId, '❌ Telefon raqam noto\'g\'ri. Format: +998901234567');
      return;
    }

    data.phone = text;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'enter_appeal_type');

    i18next.changeLanguage(language);
    const t = i18next.t;
    
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

    if (!text || text.length < 10) {
      await bot.sendMessage(chatId, '❌ Murojaat matni kamida 10 ta belgi bo\'lishi kerak');
      return;
    }

    data.appealText = text;
    await stateService.setData(userId, data);
    await stateService.setStep(userId, 'upload_file');

    i18next.changeLanguage(language);
    const t = i18next.t;
    
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
      // Find telegram group for routing
      const telegramGroup = await telegramGroupService.findGroupForAppeal(
        data.regionId,
        data.districtId,
        data.neighborhoodId || null,
        data.organizationId
      );

      if (!telegramGroup) {
        await bot.sendMessage(chatId, '❌ Ushbu hudud uchun Telegram guruh topilmadi. Iltimos, administrator bilan bog\'laning.');
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

      // Send to Telegram group
      await this.sendAppealToGroup(bot, appeal, telegramGroup, language);

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

    const message = `📌 Murojaat ID: #${appeal.appealId}\n\n` +
      `📍 Hudud: ${location}\n` +
      `🏛 Tashkilot: ${orgName}\n` +
      `👤 Fuqaro: ${appeal.fullName}\n` +
      `📞 Telefon: ${appeal.phone}\n` +
      `📝 Holat: Jarayonda\n\n` +
      `📄 Murojaat matni:\n${appeal.appealText}`;

    await bot.sendMessage(chatId, message);
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
      await bot.sendMessage(chatId, t('select_region'), Keyboard.getRegions(regions, language));
    } else if (step === 'select_neighborhood') {
      await stateService.setStep(userId, 'select_district');
      const districts = await locationService.getDistrictsByRegion(data.regionId, language);
      i18next.changeLanguage(language);
      const t = i18next.t;
      await bot.sendMessage(chatId, t('select_district'), Keyboard.getDistricts(districts, language));
    }
    // Add more back handlers as needed
  }
}

module.exports = new AppealHandlers();

