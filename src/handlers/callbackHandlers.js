const userService = require('../services/userService');
const locationService = require('../services/locationService');
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

