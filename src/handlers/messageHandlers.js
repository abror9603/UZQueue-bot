const userService = require('../services/userService');
const stateService = require('../services/stateService');
const smartRoutingService = require('../services/smartRoutingService');
const documentService = require('../services/documentService');
const queueService = require('../services/queueService');
const documentRecognitionService = require('../services/documentRecognitionService');
const voiceService = require('../services/voiceService');
const applicationTrackingService = require('../services/applicationTrackingService');
const i18n = require('../config/i18n');
const Keyboard = require('../utils/keyboard');

class MessageHandlers {
  async handleText(bot, msg, language, currentStep, currentSection) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    i18n.changeLanguage(language);

    // Handle menu buttons
    if (text === i18n.t('menu.smart_routing')) {
      await this.handleSmartRouting(bot, msg, language);
    } else if (text === i18n.t('menu.document_assistant')) {
      await this.handleDocumentAssistant(bot, msg, language);
    } else if (text === i18n.t('menu.voice_assistant')) {
      await this.handleVoiceAssistantPrompt(bot, msg, language);
    } else if (text === i18n.t('menu.queue_booking')) {
      await this.handleQueueBooking(bot, msg, language);
    } else if (text === i18n.t('menu.document_recognition')) {
      await this.handleDocumentRecognitionPrompt(bot, msg, language);
    } else if (text === i18n.t('menu.track_application')) {
      await this.handleTrackApplicationPrompt(bot, msg, language);
    } else if (text === i18n.t('menu.settings')) {
      await this.handleSettings(bot, msg, language);
    } else if (text === i18n.t('common.back')) {
      await this.handleBack(bot, msg, language);
    } else if (text === i18n.t('common.cancel')) {
      await this.handleCancel(bot, msg, language);
    } else {
      // Handle based on current section/step
      if (currentSection === 'smart_routing') {
        await this.processSmartRouting(bot, msg, language, text);
      } else if (currentSection === 'document_assistant') {
        await this.processDocumentAssistant(bot, msg, language, text);
      } else if (currentSection === 'queue_booking') {
        await this.processQueueBooking(bot, msg, language, text);
      } else if (currentSection === 'track_application') {
        await this.processTrackApplication(bot, msg, language, text);
      } else {
        // Default response
        await bot.sendMessage(
          chatId,
          i18n.t('common.help') + '\n\n' + 
          (language === 'uz' 
            ? 'Quyidagi funksiyalardan birini tanlang:'
            : language === 'ru'
            ? 'Выберите одну из следующих функций:'
            : 'Please select one of the following functions:'),
          Keyboard.getMainMenu(language)
        );
      }
    }
  }

  async handleVoice(bot, msg, language, currentSection) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    // Set section if not set
    if (!currentSection) {
      await stateService.setSection(userId, 'voice_assistant');
    }

    // Process voice
    await bot.sendMessage(chatId, i18n.t('voice.processing'));
    
    try {
      // Download voice file
      const fileId = msg.voice.file_id;
      const file = await bot.getFile(fileId);
      
      // Get file URL and download it
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      
      // Download voice file as buffer
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const voiceBuffer = Buffer.from(arrayBuffer);

      // Process voice with OpenAI Whisper
      const result = await voiceService.processVoiceMessage(voiceBuffer, language);
      
      if (result.success) {
        await bot.sendMessage(chatId, `${i18n.t('voice.recognized')} ${result.text}`);
        
        // Now process as text
        await this.handleText(bot, { ...msg, text: result.text }, language, null, 'voice_assistant');
      } else {
        await bot.sendMessage(chatId, i18n.t('voice.error'));
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      await bot.sendMessage(chatId, i18n.t('voice.error'));
    }
  }

  async handlePhoto(bot, msg, language, currentSection) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    // Check if user is in document recognition flow
    if (currentSection !== 'document_recognition') {
      await stateService.setSection(userId, 'document_recognition');
    }

    await bot.sendMessage(chatId, i18n.t('document_recognition.analyzing'));

    try {
      // Download photo
      const photo = msg.photo[msg.photo.length - 1]; // Get largest photo
      const fileId = photo.file_id;
      const file = await bot.getFile(fileId);
      
      // Get file URL
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      // Analyze document with OpenAI Vision
      const analysis = await documentRecognitionService.analyzeDocument(fileUrl, 'auto', language);

      let response = `${i18n.t('document_recognition.general_fields')}:\n`;
      
      Object.entries(analysis.generalFields).forEach(([key, value]) => {
        response += `• ${key}: ${value}\n`;
      });

      if (analysis.errors && analysis.errors.length > 0) {
        response += `\n${i18n.t('document_recognition.errors_found')}:\n`;
        analysis.errors.forEach(error => {
          response += `⚠️ ${error}\n`;
        });
      }

      if (analysis.formatAdvice && analysis.formatAdvice.length > 0) {
        response += `\n${i18n.t('document_recognition.format_advice')}:\n`;
        analysis.formatAdvice.forEach(advice => {
          response += `💡 ${advice}\n`;
        });
      }

      await bot.sendMessage(chatId, response, Keyboard.getBackKeyboard(language));
    } catch (error) {
      console.error('Error processing photo:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  // Smart Routing handlers
  async handleSmartRouting(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.setSection(userId, 'smart_routing');
    await userService.updateUserStep(userId, 'waiting_problem', 'smart_routing');

    await bot.sendMessage(
      chatId,
      i18n.t('smart_routing.ask_problem'),
      Keyboard.getCancelKeyboard(language)
    );
  }

  async processSmartRouting(bot, msg, language, problemText) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await bot.sendMessage(chatId, i18n.t('smart_routing.analyzing'));

    try {
      const recommendation = await smartRoutingService.analyzeProblem(problemText, language);

      let response = `${i18n.t('smart_routing.result')}\n\n`;
      response += `🏛️ ${i18n.t('smart_routing.organization')}: ${recommendation.organization}\n`;
      response += `📁 ${i18n.t('smart_routing.department')}: ${recommendation.department}\n`;
      response += `📋 ${i18n.t('smart_routing.required_documents')}:\n`;
      
      recommendation.requiredDocuments.forEach(doc => {
        response += `  • ${doc}\n`;
      });

      response += `\n📅 ${i18n.t('smart_routing.best_day')}: ${recommendation.bestDay}\n`;
      response += `📍 ${i18n.t('smart_routing.branch')}: ${recommendation.branch}`;

      await bot.sendMessage(chatId, response, Keyboard.getMainMenu(language));
      await stateService.clearState(userId);
      await userService.updateUserStep(userId, null, null);
    } catch (error) {
      console.error('Error in smart routing:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  // Document Assistant handlers
  async handleDocumentAssistant(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.setSection(userId, 'document_assistant');
    await userService.updateUserStep(userId, 'waiting_situation', 'document_assistant');

    await bot.sendMessage(
      chatId,
      i18n.t('document_assistant.ask_situation'),
      Keyboard.getCancelKeyboard(language)
    );
  }

  async processDocumentAssistant(bot, msg, language, situation) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await bot.sendMessage(chatId, i18n.t('document_assistant.preparing'));

    try {
      const document = await documentService.prepareDocument(situation, 'application', language);
      
      let response = `${i18n.t('document_assistant.document_ready')}\n\n`;
      response += `\`\`\`\n${document}\n\`\`\``;

      await bot.sendMessage(chatId, response, {
        parse_mode: 'Markdown',
        ...Keyboard.getMainMenu(language)
      });

      await stateService.clearState(userId);
      await userService.updateUserStep(userId, null, null);
    } catch (error) {
      console.error('Error in document assistant:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  // Voice Assistant handlers
  async handleVoiceAssistantPrompt(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.setSection(userId, 'voice_assistant');

    const prompt = language === 'uz'
      ? 'Ovozli xabar yuboring:'
      : language === 'ru'
      ? 'Отправьте голосовое сообщение:'
      : 'Send a voice message:';

    await bot.sendMessage(chatId, prompt, Keyboard.getBackKeyboard(language));
  }

  // Queue Booking handlers
  async handleQueueBooking(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.setSection(userId, 'queue_booking');
    await userService.updateUserStep(userId, 'waiting_service', 'queue_booking');

    await bot.sendMessage(
      chatId,
      i18n.t('queue.ask_service'),
      Keyboard.getCancelKeyboard(language)
    );
  }

  async processQueueBooking(bot, msg, language, serviceText) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    
    // Check if user is selecting a slot
    const currentStep = await stateService.getStep(userId);
    if (currentStep === 'selecting_slot') {
      await this.handleSlotSelection(bot, msg, language, serviceText);
      return;
    }

    await bot.sendMessage(chatId, i18n.t('queue.searching'));

    try {
      const slots = await queueService.findAvailableSlots('Demo Organization', 'Demo Department', userId);
      
      let response = `${i18n.t('queue.available_slots')}\n\n`;
      slots.forEach((slot, index) => {
        response += `${index + 1}. ${slot.branch}\n`;
        response += `   📅 ${i18n.t('queue.date')}: ${slot.date}\n`;
        response += `   🕐 ${i18n.t('queue.time')}: ${slot.time}\n`;
        response += `   🎫 ${i18n.t('queue.queue_number')}: ${slot.queueNumber}\n`;
        response += `   📍 ${i18n.t('queue.distance')}: ${slot.distance}\n\n`;
      });

      // Save slots for booking
      await stateService.setData(userId, 'available_slots', slots);
      await userService.updateUserStep(userId, 'selecting_slot', 'queue_booking');

      await bot.sendMessage(
        chatId,
        response + (language === 'uz' 
          ? 'Navbat raqamini tanlang (1-5):'
          : language === 'ru'
          ? 'Выберите номер очереди (1-5):'
          : 'Select queue number (1-5):'),
        Keyboard.getCancelKeyboard(language)
      );
    } catch (error) {
      console.error('Error in queue booking:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  async handleSlotSelection(bot, msg, language, slotText) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    try {
      const slotIndex = parseInt(slotText.trim()) - 1;
      const slots = await stateService.getData(userId, 'available_slots');

      if (!slots || !slots[slotIndex]) {
        await bot.sendMessage(
          chatId,
          language === 'uz'
            ? 'Noto\'g\'ri raqam. Iltimos, 1-5 orasida tanlang.'
            : language === 'ru'
            ? 'Неверный номер. Пожалуйста, выберите от 1 до 5.'
            : 'Invalid number. Please select between 1-5.'
        );
        return;
      }

      const selectedSlot = slots[slotIndex];
      
      // Book the queue
      const queue = await queueService.bookQueue(userId, {
        organization: 'Demo Organization',
        department: 'Demo Department',
        branch: selectedSlot.branch,
        date: selectedSlot.date,
        time: selectedSlot.time,
        queueNumber: selectedSlot.queueNumber,
        distance: selectedSlot.distance
      });

      let response = `${i18n.t('queue.booking_success')}\n\n`;
      response += `🎫 ${i18n.t('queue.queue_number')}: ${queue.queueNumber}\n`;
      response += `📅 ${i18n.t('queue.date')}: ${selectedSlot.date}\n`;
      response += `🕐 ${i18n.t('queue.time')}: ${selectedSlot.time}\n`;
      response += `📍 ${i18n.t('queue.branch')}: ${selectedSlot.branch}`;

      await bot.sendMessage(chatId, response, Keyboard.getMainMenu(language));
      await stateService.clearState(userId);
      await userService.updateUserStep(userId, null, null);
    } catch (error) {
      console.error('Error booking slot:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  // Document Recognition handlers
  async handleDocumentRecognitionPrompt(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.setSection(userId, 'document_recognition');
    await userService.updateUserStep(userId, 'waiting_photo', 'document_recognition');

    await bot.sendMessage(
      chatId,
      i18n.t('document_recognition.ask_photo'),
      Keyboard.getBackKeyboard(language)
    );
  }

  // Track Application handlers
  async handleTrackApplicationPrompt(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.setSection(userId, 'track_application');
    await userService.updateUserStep(userId, 'waiting_number', 'track_application');

    await bot.sendMessage(
      chatId,
      i18n.t('tracking.ask_number'),
      Keyboard.getCancelKeyboard(language)
    );
  }

  async processTrackApplication(bot, msg, language, applicationNumber) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    try {
      const tracking = await applicationTrackingService.trackApplication(applicationNumber);

      if (!tracking) {
        await bot.sendMessage(chatId, i18n.t('tracking.not_found'), Keyboard.getMainMenu(language));
        await stateService.clearState(userId);
        return;
      }

      const statusInfo = tracking.statusInfo;
      const statusName = language === 'uz' 
        ? statusInfo.name 
        : language === 'ru' 
        ? statusInfo.nameRu 
        : statusInfo.nameEn;

      const nextStep = language === 'uz'
        ? statusInfo.nextStep
        : language === 'ru'
        ? statusInfo.nextStepRu
        : statusInfo.nextStepEn;

      let response = `📊 ${i18n.t('tracking.status')}: ${statusName}\n`;
      response += `📝 ${i18n.t('tracking.next_step')}: ${nextStep}\n`;
      
      if (tracking.estimatedCompletionTime) {
        const date = new Date(tracking.estimatedCompletionTime).toLocaleDateString(
          language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US'
        );
        response += `⏰ ${i18n.t('tracking.estimated_time')}: ${date}`;
      }

      await bot.sendMessage(chatId, response, Keyboard.getMainMenu(language));
      await stateService.clearState(userId);
      await userService.updateUserStep(userId, null, null);
    } catch (error) {
      console.error('Error tracking application:', error);
      await bot.sendMessage(chatId, i18n.t('common.error'));
    }
  }

  // Settings handler
  async handleSettings(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    const keyboard = Keyboard.getLanguageKeyboard(language);
    
    const settingsText = i18n.t('settings.current_language') + ': ' + 
      (language === 'uz' ? 'O\'zbek' : language === 'ru' ? 'Русский' : 'English');

    await bot.sendMessage(chatId, settingsText, keyboard);
  }

  // Back handler
  async handleBack(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.clearState(userId);
    await userService.updateUserStep(userId, null, null);

    await bot.sendMessage(chatId, i18n.t('menu.main'), Keyboard.getMainMenu(language));
  }

  // Cancel handler
  async handleCancel(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);
    await stateService.clearState(userId);
    await userService.updateUserStep(userId, null, null);

    await bot.sendMessage(chatId, i18n.t('menu.main'), Keyboard.getMainMenu(language));
  }
}

module.exports = new MessageHandlers();

