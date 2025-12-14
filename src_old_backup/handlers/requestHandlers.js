// Request Intake Handlers
// Handles user request collection and processing

const requestIntakeService = require("../services/requestIntakeService");
const appealPdfService = require("../services/appealPdfService");
const userService = require("../services/userService");
const stateService = require("../services/stateService");
const organizationHandlers = require("./organizationHandlers");
const i18n = require("../config/i18n");
const Keyboard = require("../utils/keyboard");

class RequestHandlers {
  /**
   * Start PDF appeal generation process
   */
  async handleNewRequest(bot, msg, language) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    i18n.changeLanguage(language);

    // Set state for collecting information for PDF appeal
    await stateService.setSection(userId, "appeal_pdf");
    await stateService.setStep(userId, "waiting_full_name");
    await userService.updateUserStep(userId, "waiting_full_name", "appeal_pdf");

    const prompt =
      language === "uz"
        ? "📄 PDF murojaat yaratish uchun ma'lumotlaringizni yig'amiz.\n\nTo'liq ismingizni kiriting (Ism + Familiya):"
        : language === "ru"
        ? "📄 Для создания PDF обращения собираем вашу информацию.\n\nВведите ваше полное имя (Имя + Фамилия):"
        : "📄 To create a PDF appeal, we need to collect your information.\n\nEnter your full name (First name + Last name):";

    await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
  }

  /**
   * Process PDF appeal generation step by step
   */
  async processRequestIntake(bot, msg, language, text) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const currentSection = await stateService.getSection(userId);

    i18n.changeLanguage(language);
    const currentStep = await stateService.getStep(userId);

    try {
      // Handle PDF appeal flow
      if (currentSection === "appeal_pdf") {
        if (currentStep === "waiting_full_name") {
          await stateService.setData(userId, "appeal_full_name", text);
          await stateService.setStep(userId, "waiting_address");
          await userService.updateUserStep(userId, "waiting_address", "appeal_pdf");

          const prompt =
            language === "uz"
              ? "Yashash manzilingizni kiriting:"
              : language === "ru"
              ? "Введите ваш адрес проживания:"
              : "Enter your residential address:";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_address") {
          await stateService.setData(userId, "appeal_address", text);
          await stateService.setStep(userId, "waiting_phone");
          await userService.updateUserStep(userId, "waiting_phone", "appeal_pdf");

          const prompt =
            language === "uz"
              ? "Telefon raqamingizni kiriting:"
              : language === "ru"
              ? "Введите номер телефона:"
              : "Enter your phone number:";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_phone") {
          await stateService.setData(userId, "appeal_phone", text);
          await stateService.setStep(userId, "waiting_passport");
          await userService.updateUserStep(userId, "waiting_passport", "appeal_pdf");

          const prompt =
            language === "uz"
              ? "Pasport yoki JShShIR raqamingizni kiriting (ixtiyoriy, o'tkazib yuborish uchun 'skip' yozing):"
              : language === "ru"
              ? "Введите номер паспорта или ПИНФЛ (необязательно, введите 'skip' для пропуска):"
              : "Enter your passport or PINFL number (optional, type 'skip' to skip):";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_passport") {
          const passportOrPinfl = text.toLowerCase() === "skip" ? "" : text;
          await stateService.setData(userId, "appeal_passport", passportOrPinfl);
          await stateService.setStep(userId, "waiting_appeal_text");
          await userService.updateUserStep(
            userId,
            "waiting_appeal_text",
            "appeal_pdf"
          );

          const prompt =
            language === "uz"
              ? "Murojaat matnini kiriting (muammo, taklif yoki shikoyat):"
              : language === "ru"
              ? "Введите текст обращения (проблема, предложение или жалоба):"
              : "Enter the appeal text (problem, suggestion or complaint):";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_appeal_text") {
          await stateService.setData(userId, "appeal_text", text);
          await stateService.setStep(userId, "waiting_organization");
          await userService.updateUserStep(
            userId,
            "waiting_organization",
            "appeal_pdf"
          );

          const prompt =
            language === "uz"
              ? "Tashkilot nomini kiriting (masalan: Hokimiyat, Ipoteka Bank, Hududgaz va hokazo):"
              : language === "ru"
              ? "Введите название организации (например: Хокимият, Ипотека Банк, Худудгаз и т.д.):"
              : "Enter organization name (e.g., Hokimiyat, Ipoteka Bank, Hududgaz, etc.):";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_organization") {
          // Collect all information
          const userInfo = {
            fullName: await stateService.getData(userId, "appeal_full_name"),
            address: await stateService.getData(userId, "appeal_address"),
            phone: await stateService.getData(userId, "appeal_phone"),
            passportOrPinfl: await stateService.getData(userId, "appeal_passport") || "",
          };

          const appealText = await stateService.getData(userId, "appeal_text");
          const organizationName = text;

          // Show generating message
          await bot.sendMessage(
            chatId,
            language === "uz"
              ? "📄 PDF murojaat tayyorlanmoqda..."
              : language === "ru"
              ? "📄 PDF обращение готовится..."
              : "📄 PDF appeal is being prepared..."
          );

          // Generate PDF data
          const pdfData = await appealPdfService.generatePdfData(
            userInfo,
            organizationName,
            appealText,
            language
          );

          // Format and send result
          const resultMessage = appealPdfService.formatPdfDataForDisplay(
            pdfData,
            language
          );

          // Send JSON data as well (for future PDF generation)
          const jsonData = JSON.stringify(pdfData, null, 2);
          await bot.sendMessage(
            chatId,
            resultMessage,
            Keyboard.getMainMenu(language)
          );

          // Send JSON in code format
          await bot.sendMessage(
            chatId,
            `\`\`\`json\n${jsonData}\n\`\`\``,
            { parse_mode: "Markdown" }
          );

          // Clear state
          await stateService.clearState(userId);
          await userService.updateUserStep(userId, null, null);
        }
      } else {
        // Old request intake flow (for backward compatibility)
        if (currentStep === "waiting_full_name") {
          await stateService.setData(userId, "request_full_name", text);
          await stateService.setStep(userId, "waiting_region");
          await userService.updateUserStep(userId, "waiting_region", "request_intake");

          const prompt =
            language === "uz"
              ? "Viloyatingizni kiriting:"
              : language === "ru"
              ? "Введите вашу область:"
              : "Enter your region:";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_region") {
          await stateService.setData(userId, "request_region", text);
          await stateService.setStep(userId, "waiting_district");
          await userService.updateUserStep(userId, "waiting_district", "request_intake");

          const prompt =
            language === "uz"
              ? "Tuman yoki shaharni kiriting:"
              : language === "ru"
              ? "Введите район или город:"
              : "Enter district or city:";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_district") {
          await stateService.setData(userId, "request_district", text);
          await stateService.setStep(userId, "waiting_phone");
          await userService.updateUserStep(userId, "waiting_phone", "request_intake");

          const prompt =
            language === "uz"
              ? "Telefon raqamingizni kiriting:"
              : language === "ru"
              ? "Введите номер телефона:"
              : "Enter your phone number:";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_phone") {
          await stateService.setData(userId, "request_phone", text);
          await stateService.setStep(userId, "waiting_request_text");
          await userService.updateUserStep(
            userId,
            "waiting_request_text",
            "request_intake"
          );

          const prompt =
            language === "uz"
              ? "Muammoingiz yoki murojaatingizni batafsil tushuntiring:"
              : language === "ru"
              ? "Опишите вашу проблему или запрос подробно:"
              : "Please describe your issue or request in detail:";

          await bot.sendMessage(chatId, prompt, Keyboard.getCancelKeyboard(language));
        } else if (currentStep === "waiting_request_text") {
          // Collect all information
          const userInfo = {
            fullName: await stateService.getData(userId, "request_full_name"),
            region: await stateService.getData(userId, "request_region"),
            district: await stateService.getData(userId, "request_district"),
            phone: await stateService.getData(userId, "request_phone"),
          };

          const requestText = text;

          // Show analyzing message
          await bot.sendMessage(
            chatId,
            language === "uz"
              ? "Murojaatingiz tahlil qilinmoqda..."
              : language === "ru"
              ? "Ваш запрос анализируется..."
              : "Analyzing your request..."
          );

          // Analyze request with AI
          const analysisResult = await requestIntakeService.analyzeRequest(
            requestText,
            userInfo,
            language
          );

          // Get org context
          const orgId = await organizationHandlers.getUserOrgContext(userId);

          // Create request in database
          const requestData = {
            userInfo: analysisResult.userInfo || userInfo,
            request: analysisResult.request,
            readyForSending: analysisResult.readyForSending,
            rawText: requestText,
            rawAIResponse: JSON.stringify(analysisResult),
          };

          const request = await requestIntakeService.createRequest(
            userId,
            requestData,
            orgId
          );

          // Format and send result
          const resultMessage = this.formatRequestResult(
            request,
            analysisResult,
            language
          );

          await bot.sendMessage(chatId, resultMessage, Keyboard.getMainMenu(language));

          // Clear state
          await stateService.clearState(userId);
          await userService.updateUserStep(userId, null, null);
        }
      }
    } catch (error) {
      console.error("Error in request intake:", error);
      await bot.sendMessage(chatId, i18n.t("common.error"), Keyboard.getMainMenu(language));
    }
  }

  /**
   * Format request result for display
   */
  formatRequestResult(request, analysisResult, language) {
    if (language === "uz") {
      let message = `✅ Murojaat tayyorlandi!\n\n`;
      message += `📋 Murojaat raqami: ${request.requestNumber}\n\n`;
      message += `👤 FOYDALANUVCHI MA'LUMOTLARI:\n`;
      message += `- Ism: ${request.fullName || "N/A"}\n`;
      message += `- Viloyat: ${request.region || "N/A"}\n`;
      message += `- Tuman/Shahar: ${request.district || "N/A"}\n`;
      message += `- Telefon: ${request.phone || "N/A"}\n\n`;
      message += `📝 MUROJAAT:\n`;
      message += `- Matn: ${request.requestText.substring(0, 200)}${request.requestText.length > 200 ? "..." : ""}\n`;
      message += `- Xulosa: ${request.summary || "N/A"}\n`;
      message += `- Kategoriya: ${request.category || "N/A"}\n`;
      message += `- Javobgar idora: ${request.responsibleOrganization || "N/A"}\n`;
      message += `- Ishonchlilik: ${request.confidenceScore || 0}%\n\n`;
      message += `📊 Holat: ${this.getStatusText(request.status, language)}\n\n`;
      message += `ℹ️ Murojaat tayyor. API ruxsatlari faollashtirilgandan keyin yuboriladi.`;
      return message;
    } else if (language === "ru") {
      let message = `✅ Запрос подготовлен!\n\n`;
      message += `📋 Номер запроса: ${request.requestNumber}\n\n`;
      message += `👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:\n`;
      message += `- Имя: ${request.fullName || "N/A"}\n`;
      message += `- Область: ${request.region || "N/A"}\n`;
      message += `- Район/Город: ${request.district || "N/A"}\n`;
      message += `- Телефон: ${request.phone || "N/A"}\n\n`;
      message += `📝 ЗАПРОС:\n`;
      message += `- Текст: ${request.requestText.substring(0, 200)}${request.requestText.length > 200 ? "..." : ""}\n`;
      message += `- Резюме: ${request.summary || "N/A"}\n`;
      message += `- Категория: ${request.category || "N/A"}\n`;
      message += `- Ответственное учреждение: ${request.responsibleOrganization || "N/A"}\n`;
      message += `- Уверенность: ${request.confidenceScore || 0}%\n\n`;
      message += `📊 Статус: ${this.getStatusText(request.status, language)}\n\n`;
      message += `ℹ️ Запрос готов. Будет отправлен после активации разрешений API.`;
      return message;
    } else {
      let message = `✅ Request prepared!\n\n`;
      message += `📋 Request Number: ${request.requestNumber}\n\n`;
      message += `👤 USER INFORMATION:\n`;
      message += `- Name: ${request.fullName || "N/A"}\n`;
      message += `- Region: ${request.region || "N/A"}\n`;
      message += `- City/District: ${request.district || "N/A"}\n`;
      message += `- Phone: ${request.phone || "N/A"}\n\n`;
      message += `📝 REQUEST:\n`;
      message += `- Text: ${request.requestText.substring(0, 200)}${request.requestText.length > 200 ? "..." : ""}\n`;
      message += `- Summary: ${request.summary || "N/A"}\n`;
      message += `- Category: ${request.category || "N/A"}\n`;
      message += `- Responsible Organization: ${request.responsibleOrganization || "N/A"}\n`;
      message += `- Confidence: ${request.confidenceScore || 0}%\n\n`;
      message += `📊 Status: ${this.getStatusText(request.status, language)}\n\n`;
      message += `ℹ️ Request is ready. Will be sent once API permissions are activated.`;
      return message;
    }
  }

  /**
   * Get status text in user's language
   */
  getStatusText(status, language) {
    const statusMap = {
      uz: {
        collecting_info: "Ma'lumot yig'ilmoqda",
        analyzing: "Tahlil qilinmoqda",
        ready: "Tayyor",
        sent: "Yuborildi",
        processing: "Qayta ishlanmoqda",
        completed: "Yakunlandi",
        rejected: "Rad etildi",
      },
      ru: {
        collecting_info: "Сбор информации",
        analyzing: "Анализируется",
        ready: "Готов",
        sent: "Отправлен",
        processing: "В обработке",
        completed: "Завершен",
        rejected: "Отклонен",
      },
      en: {
        collecting_info: "Collecting Information",
        analyzing: "Analyzing",
        ready: "Ready",
        sent: "Sent",
        processing: "Processing",
        completed: "Completed",
        rejected: "Rejected",
      },
    };

    return statusMap[language]?.[status] || status;
  }
}

module.exports = new RequestHandlers();

