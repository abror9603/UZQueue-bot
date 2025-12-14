const userService = require('../services/userService');
const locationService = require('../services/locationService');
const organizationService = require('../services/organizationService');
const Keyboard = require('../utils/keyboard');
const i18next = require('../config/i18n');
const stateService = require('../services/stateService');
const appealHandlers = require('./appealHandlers');

class CallbackHandlers {
  async handleCallback(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Handle language selection
    if (data.startsWith('lang_')) {
      const langCode = data.replace('lang_', '');
      await this.handleLanguageChange(bot, msg, userId, langCode);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle region selection
    if (data.startsWith('region_')) {
      await this.handleRegionSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle district selection
    if (data.startsWith('district_')) {
      await this.handleDistrictSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle neighborhood selection
    if (data.startsWith('neighborhood_')) {
      await this.handleNeighborhoodSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle skip neighborhood
    if (data.startsWith('skip_neighborhood_')) {
      await this.handleSkipNeighborhood(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle back to regions
    if (data === 'back_to_regions') {
      await this.handleBackToRegions(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle back to districts
    if (data.startsWith('back_to_districts_')) {
      await this.handleBackToDistricts(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle cancel appeal
    if (data === 'cancel_appeal') {
      await this.handleCancelAppeal(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle AI formatting
    if (data === 'format_appeal_yes' || data === 'format_appeal_no') {
      await this.handleAppealFormatting(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Handle group registration callbacks
    if (data.startsWith('group_type_')) {
      await this.handleGroupTypeSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_region_')) {
      await this.handleGroupRegionSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_district_')) {
      await this.handleGroupDistrictSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_neighborhood_')) {
      await this.handleGroupNeighborhoodSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_skip_neighborhood_')) {
      await this.handleGroupSkipNeighborhood(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_skip_district_')) {
      await this.handleGroupSkipDistrict(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_org_')) {
      await this.handleGroupOrganizationSelection(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'group_back_region') {
      await this.handleGroupBackToRegion(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('group_back_district_')) {
      await this.handleGroupBackToDistrict(bot, callbackQuery, data);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'group_back_org') {
      await this.handleGroupBackToOrganization(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'group_confirm_registration') {
      await this.handleConfirmGroupRegistration(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'group_back_to_phone') {
      await this.handleGroupBackToPhone(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'group_back_to_responsible') {
      await this.handleGroupBackToResponsible(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'cancel_group_reg') {
      await this.handleCancelGroupRegistration(bot, callbackQuery);
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }
  }

  async handleGroupTypeSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require('./groupRegistrationHandlers');
    const stateData = await stateService.getData(userId) || {};
    
    const groupType = data.replace('group_type_', '');
    stateData.groupType = groupType;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'group_reg_select_region');

    // Get regions
    const regions = await locationService.getAllRegions('uz');
    
    await bot.editMessageText(
      '📍 Viloyatni tanlang:',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getRegionsInlineForGroup(regions, 'uz')
      }
    );
  }

  async handleGroupRegionSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require('./groupRegistrationHandlers');
    const stateData = await stateService.getData(userId) || {};
    
    const regionId = parseInt(data.replace('group_region_', ''));
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep = groupRegistrationHandlers.getNextStepAfterRegion(groupType, regionId);
    await stateService.setStep(userId, nextStep);

    // Get region name for display
    const regions = await locationService.getAllRegions('uz');
    const selectedRegion = regions.find(r => r.id === regionId);

    if (nextStep === 'group_reg_select_organization') {
      // Region Government: Skip directly to organization
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    } else if (nextStep === 'group_reg_select_district') {
      // District/City/Neighborhood: Show districts
      const districts = await locationService.getDistrictsByRegion(regionId, 'uz');
      await bot.editMessageText(
        `📍 ${selectedRegion.name}\n\nTuman yoki shaharni tanlang:`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getDistrictsInlineForGroup(districts, 'uz', regionId)
        }
      );
    } else if (nextStep === 'group_reg_select_district_optional') {
      // Other: District optional
      const districts = await locationService.getDistrictsByRegion(regionId, 'uz');
      await bot.editMessageText(
        `📍 ${selectedRegion.name}\n\nTuman yoki shaharni tanlang (ixtiyoriy):`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getDistrictsInlineForGroup(districts, 'uz', regionId, true)
        }
      );
    }
  }

  async handleGroupDistrictSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require('./groupRegistrationHandlers');
    const stateData = await stateService.getData(userId) || {};
    
    // data format: group_district_123_456 (districtId_regionId)
    const parts = data.replace('group_district_', '').split('_');
    const districtId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);

    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep = groupRegistrationHandlers.getNextStepAfterDistrict(groupType);
    await stateService.setStep(userId, nextStep);

    // Get district name for display
    const districts = await locationService.getDistrictsByRegion(regionId, 'uz');
    const selectedDistrict = districts.find(d => d.id === districtId);
    const regions = await locationService.getAllRegions('uz');
    const selectedRegion = regions.find(r => r.id === regionId);

    if (nextStep === 'group_reg_select_organization') {
      // District Government: Skip to organization
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    } else if (nextStep === 'group_reg_select_neighborhood_optional') {
      // City Government: Neighborhood optional
      const neighborhoods = await locationService.getNeighborhoodsByDistrict(districtId, 'uz');
      await bot.editMessageText(
        `📍 ${selectedRegion.name} → ${selectedDistrict.name}\n\nMahallani tanlang (ixtiyoriy):`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getNeighborhoodsInlineForGroup(neighborhoods, 'uz', regionId, districtId, true)
        }
      );
    } else if (nextStep === 'group_reg_select_neighborhood') {
      // Neighborhood: Must select neighborhood
      const neighborhoods = await locationService.getNeighborhoodsByDistrict(districtId, 'uz');
      await bot.editMessageText(
        `📍 ${selectedRegion.name} → ${selectedDistrict.name}\n\nMahallani tanlang:`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          ...Keyboard.getNeighborhoodsInlineForGroup(neighborhoods, 'uz', regionId, districtId, false)
        }
      );
    } else if (nextStep === 'group_reg_enter_org_name') {
      // Other: Ask for organization name
      await bot.editMessageText(
        `📍 ${selectedRegion.name} → ${selectedDistrict.name}\n\n🏛 Tashkilot nomini kiriting:`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '◀️ Orqaga', callback_data: `group_back_district_${regionId}` }],
              [{ text: '❌ Bekor qilish', callback_data: 'cancel_group_reg' }]
            ]
          }
        }
      );
    }
  }

  async handleGroupNeighborhoodSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require('./groupRegistrationHandlers');
    const stateData = await stateService.getData(userId) || {};
    
    // data format: group_neighborhood_123_456_789 (neighborhoodId_regionId_districtId)
    const parts = data.replace('group_neighborhood_', '').split('_');
    const neighborhoodId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);
    const districtId = parseInt(parts[2]);

    stateData.neighborhoodId = neighborhoodId;
    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep = groupRegistrationHandlers.getNextStepAfterNeighborhood(groupType);
    await stateService.setStep(userId, nextStep);

    if (nextStep === 'group_reg_select_organization') {
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    }
  }

  async handleGroupSkipNeighborhood(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require('./groupRegistrationHandlers');
    const stateData = await stateService.getData(userId) || {};
    
    // data format: group_skip_neighborhood_456_789 (regionId_districtId)
    const parts = data.replace('group_skip_neighborhood_', '').split('_');
    const regionId = parseInt(parts[0]);
    const districtId = parseInt(parts[1]);

    stateData.regionId = regionId;
    stateData.districtId = districtId;
    stateData.neighborhoodId = null;
    await stateService.setData(userId, stateData);

    const groupType = stateData.groupType;
    const nextStep = groupRegistrationHandlers.getNextStepAfterNeighborhood(groupType);
    await stateService.setStep(userId, nextStep);

    if (nextStep === 'group_reg_select_organization') {
      await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
    }
  }

  async handleGroupSkipDistrict(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = await stateService.getData(userId) || {};
    const regionId = parseInt(data.replace('group_skip_district_', ''));

    stateData.regionId = regionId;
    stateData.districtId = null;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'group_reg_enter_org_name');

    const regions = await locationService.getAllRegions('uz');
    const selectedRegion = regions.find(r => r.id === regionId);

    await bot.editMessageText(
      `📍 ${selectedRegion.name}\n\n🏛 Tashkilot nomini kiriting:`,
      {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Orqaga', callback_data: `group_back_region` }],
            [{ text: '❌ Bekor qilish', callback_data: 'cancel_group_reg' }]
          ]
        }
      }
    );
  }

  async showOrganizationSelectionForGroup(bot, msg, userId, stateData) {
    const chatId = msg.chat.id;
    const groupType = stateData.groupType;

    // Map group type to organization type
    const orgTypeMap = {
      'viloyat': 'hokimiyat',
      'tuman': 'hokimiyat',
      'shahar': 'hokimiyat',
      'mahalla': 'mahalla',
      'boshqa': 'other'
    };

    const orgType = orgTypeMap[groupType] || 'other';
    
    // Get organizations filtered by type
    const allOrgs = await organizationService.getAllOrganizations('uz');
    const filteredOrgs = allOrgs.filter(org => org.type === orgType || orgType === 'other');

    // Build location string
    let locationStr = '';
    const regions = await locationService.getAllRegions('uz');
    const selectedRegion = regions.find(r => r.id === stateData.regionId);
    if (selectedRegion) locationStr = selectedRegion.name;

    if (stateData.districtId) {
      const districts = await locationService.getDistrictsByRegion(stateData.regionId, 'uz');
      const selectedDistrict = districts.find(d => d.id === stateData.districtId);
      if (selectedDistrict) locationStr += ` → ${selectedDistrict.name}`;
    }

    if (stateData.neighborhoodId) {
      const neighborhoods = await locationService.getNeighborhoodsByDistrict(stateData.districtId, 'uz');
      const selectedNeighborhood = neighborhoods.find(n => n.id === stateData.neighborhoodId);
      if (selectedNeighborhood) locationStr += ` → ${selectedNeighborhood.name}`;
    }

    await bot.editMessageText(
      `📍 ${locationStr}\n\n🏛 Tashkilotni tanlang:`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getOrganizationsInlineForGroup(filteredOrgs, 'uz')
      }
    );
  }

  async handleGroupOrganizationSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = await stateService.getData(userId) || {};
    const organizationId = parseInt(data.replace('group_org_', ''));

    const organizations = await organizationService.getAllOrganizations('uz');
    const selectedOrg = organizations.find(o => o.id === organizationId);

    if (!selectedOrg) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Tashkilot topilmadi' });
      return;
    }

    stateData.organizationId = organizationId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'group_reg_enter_responsible');

    await bot.editMessageText(
      `🏛 ${selectedOrg.name}\n\n👤 Mas'ul shaxs F.I.Sh ni kiriting:\n\nMisol: Aliyev Anvar Anvarovich`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Orqaga', callback_data: 'group_back_org' }],
            [{ text: '❌ Bekor qilish', callback_data: 'cancel_group_reg' }]
          ]
        }
      }
    );
  }

  async handleGroupBackToRegion(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = await stateService.getData(userId) || {};
    delete stateData.regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'group_reg_select_region');

    const regions = await locationService.getAllRegions('uz');
    
    await bot.editMessageText(
      '📍 Viloyatni tanlang:',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getRegionsInlineForGroup(regions, 'uz')
      }
    );
  }

  async handleGroupBackToDistrict(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const regionId = parseInt(data.replace('group_back_district_', ''));
    const stateData = await stateService.getData(userId) || {};
    stateData.regionId = regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'group_reg_select_district');

    const regions = await locationService.getAllRegions('uz');
    const selectedRegion = regions.find(r => r.id === regionId);
    const districts = await locationService.getDistrictsByRegion(regionId, 'uz');
    
    await bot.editMessageText(
      `📍 ${selectedRegion.name}\n\nTuman yoki shaharni tanlang:`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getDistrictsInlineForGroup(districts, 'uz', regionId)
      }
    );
  }

  async handleGroupBackToOrganization(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = await stateService.getData(userId) || {};
    delete stateData.organizationId;
    delete stateData.organizationName;
    await stateService.setData(userId, stateData);
    
    await this.showOrganizationSelectionForGroup(bot, msg, userId, stateData);
  }

  async handleConfirmGroupRegistration(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const groupRegistrationHandlers = require('./groupRegistrationHandlers');
    const stateData = await stateService.getData(userId) || {};

    // Complete registration
    await groupRegistrationHandlers.completeRegistration(bot, chatId, stateData, userId);
    
    // Clear the confirmation message
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }

  async handleGroupBackToPhone(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = await stateService.getData(userId) || {};
    await stateService.setStep(userId, 'group_reg_enter_phone');

    await bot.editMessageText(
      '📞 Mas\'ul shaxs telefon raqamini kiriting:\n\n' +
      'Misol: +998901234567',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '◀️ Orqaga', callback_data: 'group_back_to_responsible' },
              { text: '❌ Bekor qilish', callback_data: 'cancel_group_reg' }
            ]
          ]
        }
      }
    );
  }

  async handleGroupBackToResponsible(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const stateData = await stateService.getData(userId) || {};
    await stateService.setStep(userId, 'group_reg_enter_responsible');

    // Get organization name for display
    let orgName = stateData.organizationName;
    if (!orgName && stateData.organizationId) {
      const org = await organizationService.getOrganizationById(stateData.organizationId);
      if (org) {
        orgName = org.nameUz;
      }
    }

    await bot.editMessageText(
      `🏛 ${orgName || 'Tashkilot'}\n\n👤 Mas'ul shaxs F.I.Sh ni kiriting:\n\nMisol: Aliyev Anvar Anvarovich`,
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '◀️ Orqaga', callback_data: 'group_back_org' },
              { text: '❌ Bekor qilish', callback_data: 'cancel_group_reg' }
            ]
          ]
        }
      }
    );
  }

  async handleCancelGroupRegistration(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    await stateService.clear(userId);
    
    await bot.editMessageText(
      '❌ Ro\'yxatdan o\'tkazish bekor qilindi.',
      {
        chat_id: chatId,
        message_id: msg.message_id
      }
    );
  }

  async handleAppealFormatting(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    const stateData = await stateService.getData(userId) || {};

    if (data === 'format_appeal_yes') {
      // Format appeal using AI
      await bot.sendMessage(chatId, t('formatting_appeal', { defaultValue: '🤖 Murojaatingiz rasmiylashtirilmoqda...' }));
      
      const formattedText = await moderationService.formatToOfficial(
        stateData.originalAppealText || stateData.appealText,
        language
      );

      stateData.appealText = formattedText;
      stateData.needsFormatting = false;
      await stateService.setData(userId, stateData);

      await bot.sendMessage(
        chatId,
        t('formatted_appeal', { 
          defaultValue: '✅ Murojaatingiz rasmiylashtirildi:\n\n' 
        }) + formattedText + '\n\n' + t('confirm_formatted', {
          defaultValue: 'Tasdiqlaysizmi?'
        }),
        Keyboard.getConfirmCancel(language)
      );
    } else {
      // Use original text
      stateData.appealText = stateData.originalAppealText || stateData.appealText;
      stateData.needsFormatting = false;
      await stateService.setData(userId, stateData);
      await stateService.setStep(userId, 'upload_file');

      await bot.sendMessage(
        chatId,
        t('upload_file_optional'),
        Keyboard.getSkipCancel(language)
      );
    }
  }

  async handleLanguageChange(bot, msg, userId, langCode) {
    const chatId = msg.chat.id;

    if (!['uz', 'ru', 'en'].includes(langCode)) {
      return;
    }

    await userService.updateLanguage(userId, langCode);
    i18next.changeLanguage(langCode);
    const t = i18next.t;

    await bot.sendMessage(chatId, t('language_selected'), Keyboard.getMainMenu(langCode));
  }

  async handleRegionSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    
    const regionId = parseInt(data.replace('region_', ''));
    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    const stateData = await stateService.getData(userId) || {};
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'select_district');

    // Get districts for this region
    const districts = await locationService.getDistrictsByRegion(regionId, language);

    if (districts.length === 0) {
      await bot.sendMessage(chatId, t('error') + ': Tumanlar topilmadi.');
      return;
    }

    // Update message with district selection
    await bot.editMessageText(
      t('select_district'),
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getDistrictsInline(districts, language, regionId)
      }
    );
  }

  async handleDistrictSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    
    // data format: district_123_456 (districtId_regionId)
    const parts = data.replace('district_', '').split('_');
    const districtId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    const stateData = await stateService.getData(userId) || {};
    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);
    await stateService.setStep(userId, 'select_neighborhood');

    // Get neighborhoods for this district
    const neighborhoods = await locationService.getNeighborhoodsByDistrict(districtId, language);

    // Update message with neighborhood selection
    await bot.editMessageText(
      t('select_neighborhood'),
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getNeighborhoodsInline(neighborhoods, language, regionId, districtId)
      }
    );
  }

  async handleNeighborhoodSelection(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    
    // data format: neighborhood_123_456_789 (neighborhoodId_regionId_districtId)
    const parts = data.replace('neighborhood_', '').split('_');
    const neighborhoodId = parseInt(parts[0]);
    const regionId = parseInt(parts[1]);
    const districtId = parseInt(parts[2]);

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    const stateData = await stateService.getData(userId) || {};
    stateData.neighborhoodId = neighborhoodId;
    stateData.districtId = districtId;
    stateData.regionId = regionId;
    await stateService.setData(userId, stateData);

    // Continue to organization selection
    await appealHandlers.continueToOrganizationSelection(bot, msg, userId, stateData, language);
  }

  async handleSkipNeighborhood(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    
    // data format: skip_neighborhood_456_789 (regionId_districtId)
    const parts = data.replace('skip_neighborhood_', '').split('_');
    const regionId = parseInt(parts[0]);
    const districtId = parseInt(parts[1]);

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;

    // Update state (without neighborhood)
    const stateData = await stateService.getData(userId) || {};
    stateData.regionId = regionId;
    stateData.districtId = districtId;
    stateData.neighborhoodId = null;
    await stateService.setData(userId, stateData);

    // Continue to organization selection
    await appealHandlers.continueToOrganizationSelection(bot, msg, userId, stateData, language);
  }

  async handleBackToRegions(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Reset state
    await stateService.setStep(userId, 'select_region');
    const stateData = await stateService.getData(userId) || {};
    delete stateData.regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);

    // Get regions
    const regions = await locationService.getAllRegions(language);

    await bot.editMessageText(
      t('select_region'),
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getRegionsInline(regions, language)
      }
    );
  }

  async handleBackToDistricts(bot, callbackQuery, data) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    // data format: back_to_districts_456 (regionId)
    const regionId = parseInt(data.replace('back_to_districts_', ''));

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Update state
    await stateService.setStep(userId, 'select_district');
    const stateData = await stateService.getData(userId) || {};
    stateData.regionId = regionId;
    delete stateData.districtId;
    delete stateData.neighborhoodId;
    await stateService.setData(userId, stateData);

    // Get districts
    const districts = await locationService.getDistrictsByRegion(regionId, language);

    await bot.editMessageText(
      t('select_district'),
      {
        chat_id: chatId,
        message_id: msg.message_id,
        ...Keyboard.getDistrictsInline(districts, language, regionId)
      }
    );
  }

  async handleCancelAppeal(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;

    const user = await userService.getUser(userId);
    if (!user) return;

    const language = user.language;
    i18next.changeLanguage(language);
    const t = i18next.t;

    // Clear state
    await stateService.clear(userId);

    await bot.editMessageText(
      t('cancel'),
      {
        chat_id: chatId,
        message_id: msg.message_id
      }
    );

    await bot.sendMessage(chatId, t('cancel'), Keyboard.getMainMenu(language));
  }
}

module.exports = new CallbackHandlers();

