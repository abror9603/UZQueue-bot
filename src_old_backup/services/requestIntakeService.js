// Request Intake Service
// Collects user information and processes requests for government services

const { askAI } = require("./ai/aiHelper");
const { UserRequest } = require("../models");

class RequestIntakeService {
  /**
   * System prompt for UZQueue AI Assistant
   */
  getSystemPrompt(language = "uz") {
    const prompts = {
      uz: `Siz UZQueue AI Yordamchisisiz. Sizning vazifangiz foydalanuvchi ma'lumotlarini yig'ish, murojaatni tahlil qilish va tegishli davlat idorasini aniqlashdir.

1. FOYDALANUVCHI MA'LUMOTLARINI YIG'ISH:
- To'liq ism (Ism + Familiya)
- Viloyat
- Tuman/Shahar
- Telefon raqami
- Qo'shimcha aloqa ma'lumotlari (agar kerak bo'lsa)

2. MUROJAATNI QABUL QILISH VA TASNIFLASH:
- Asosiy muammoni aniqlash
- Kalit so'zlarni ajratish
- Muammo kategoriyasini aniqlash
- Qaysi idora yoki tashkilot javobgar ekanligini aniqlash

3. KATEGORIYALAR:
- Elektr / Energiya
- Gaz ta'minoti
- Suv ta'minoti
- Transport
- Yo'l ta'mirlash
- Ta'lim
- Tibbiyot
- Uy-joy va kommunal xizmatlar
- Ijtimoiy himoya
- Politsiya / Xavfsizlik
- Soliqlar
- Shahar xizmatlari

4. CHIQISH FORMATI:
USER_INFORMATION:
- Full Name: [Ism]
- Region: [Viloyat]
- City/District: [Tuman/Shahar]
- Phone: [Telefon]

REQUEST:
- User Request Text: [Murojaat matni]
- Summary: [Qisqa xulosa]
- Category: [Kategoriya]
- Responsible Organization: [Javobgar idora]
- Alternative Organizations: [Muqobil idoralar]
- Confidence Score: [0-100]

READY_FOR_SENDING: YES

Eslatma: Murojaatni avtomatik yubormang. Faqat ma'lumotlarni tayyorlang.`,

      ru: `Вы - UZQueue AI Помощник. Ваша задача - собирать информацию о пользователе, анализировать запрос и определять соответствующее государственное учреждение.

1. СБОР ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ:
- Полное имя (Имя + Фамилия)
- Область
- Район/Город
- Номер телефона
- Дополнительные контактные данные (при необходимости)

2. ПРИЕМ И КЛАССИФИКАЦИЯ ЗАПРОСА:
- Определение основной проблемы
- Выделение ключевых слов
- Определение категории проблемы
- Определение ответственного учреждения

3. КАТЕГОРИИ:
- Электричество / Энергия
- Газоснабжение
- Водоснабжение
- Транспорт
- Ремонт дорог
- Образование
- Здравоохранение
- Жилищно-коммунальные услуги
- Социальная защита
- Полиция / Безопасность
- Налоги
- Муниципальные услуги

4. ФОРМАТ ВЫВОДА:
USER_INFORMATION:
- Full Name: [Имя]
- Region: [Область]
- City/District: [Район/Город]
- Phone: [Телефон]

REQUEST:
- User Request Text: [Текст запроса]
- Summary: [Краткое резюме]
- Category: [Категория]
- Responsible Organization: [Ответственное учреждение]
- Alternative Organizations: [Альтернативные учреждения]
- Confidence Score: [0-100]

READY_FOR_SENDING: YES

Примечание: Не отправляйте запрос автоматически. Только подготовьте данные.`,

      en: `You are the UZQueue AI Assistant. Your task is to collect user information, analyze their request, and determine the correct government organization or service authority.

1. USER IDENTIFICATION & INFORMATION COLLECTION:
- Full name (First name + Last name)
- Region (Viloyat)
- District or City (Tuman/Shahar)
- Phone number
- Any additional contact details if needed

2. REQUEST INTAKE & CLASSIFICATION:
- Extract the main problem
- Identify keywords
- Classify the issue category
- Determine which organization or authority is responsible

3. CATEGORIES:
- Electricity / Energy
- Gas supply
- Water supply
- Transport
- Road maintenance
- Education
- Healthcare
- Housing & Communal services
- Social protection
- Police / Safety
- Taxes
- Municipal services

4. OUTPUT FORMAT:
USER_INFORMATION:
- Full Name: [Name]
- Region: [Region]
- City/District: [City/District]
- Phone: [Phone]

REQUEST:
- User Request Text: [Request text]
- Summary: [Summary]
- Category: [Category]
- Responsible Organization: [Organization]
- Alternative Organizations: [Alternatives]
- Confidence Score: [0-100]

READY_FOR_SENDING: YES

Note: Do NOT send the request automatically. Only format and prepare the data for sending.`,
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Analyze user request and extract structured information
   */
  async analyzeRequest(requestText, userInfo, language = "uz") {
    try {
      const systemPrompt = this.getSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(requestText, userInfo, language);

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const aiResponse = await askAI(fullPrompt, language);

      // Parse AI response to extract structured data
      const parsedData = this.parseAIResponse(aiResponse);

      return parsedData;
    } catch (error) {
      console.error("Error analyzing request:", error);
      throw error;
    }
  }

  /**
   * Build user prompt with collected information
   */
  buildUserPrompt(requestText, userInfo, language) {
    const prompts = {
      uz: `Foydalanuvchi ma'lumotlari:
${userInfo.fullName ? `- Ism: ${userInfo.fullName}` : "- Ism: (topilmadi)"}
${userInfo.region ? `- Viloyat: ${userInfo.region}` : "- Viloyat: (topilmadi)"}
${userInfo.district ? `- Tuman/Shahar: ${userInfo.district}` : "- Tuman/Shahar: (topilmadi)"}
${userInfo.phone ? `- Telefon: ${userInfo.phone}` : "- Telefon: (topilmadi)"}

Foydalanuvchi murojaati:
${requestText}

Yuqoridagi ma'lumotlarni tahlil qiling va struktur ma'lumotlarni chiqaring.`,

      ru: `Информация о пользователе:
${userInfo.fullName ? `- Имя: ${userInfo.fullName}` : "- Имя: (не указано)"}
${userInfo.region ? `- Область: ${userInfo.region}` : "- Область: (не указано)"}
${userInfo.district ? `- Район/Город: ${userInfo.district}` : "- Район/Город: (не указано)"}
${userInfo.phone ? `- Телефон: ${userInfo.phone}` : "- Телефон: (не указано)"}

Запрос пользователя:
${requestText}

Проанализируйте вышеуказанную информацию и выведите структурированные данные.`,

      en: `User Information:
${userInfo.fullName ? `- Name: ${userInfo.fullName}` : "- Name: (not provided)"}
${userInfo.region ? `- Region: ${userInfo.region}` : "- Region: (not provided)"}
${userInfo.district ? `- City/District: ${userInfo.district}` : "- City/District: (not provided)"}
${userInfo.phone ? `- Phone: ${userInfo.phone}` : "- Phone: (not provided)"}

User Request:
${requestText}

Analyze the above information and output structured data.`,
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Parse AI response to extract structured data
   */
  parseAIResponse(aiResponse) {
    const data = {
      userInfo: {},
      request: {},
      readyForSending: false,
    };

    try {
      // Extract USER_INFORMATION section
      const userInfoMatch = aiResponse.match(
        /USER_INFORMATION:([\s\S]*?)(?=REQUEST:|READY_FOR_SENDING:|$)/i
      );
      if (userInfoMatch) {
        const userInfoText = userInfoMatch[1];
        data.userInfo.fullName = this.extractField(
          userInfoText,
          /Full Name:\s*(.+)/i
        );
        data.userInfo.region = this.extractField(
          userInfoText,
          /Region:\s*(.+)/i
        );
        data.userInfo.district = this.extractField(
          userInfoText,
          /City\/District:\s*(.+)/i
        );
        data.userInfo.phone = this.extractField(
          userInfoText,
          /Phone:\s*(.+)/i
        );
      }

      // Extract REQUEST section
      const requestMatch = aiResponse.match(
        /REQUEST:([\s\S]*?)(?=READY_FOR_SENDING:|$)/i
      );
      if (requestMatch) {
        const requestText = requestMatch[1];
        data.request.requestText = this.extractField(
          requestText,
          /User Request Text:\s*(.+)/i
        );
        data.request.summary = this.extractField(
          requestText,
          /Summary:\s*(.+)/i
        );
        data.request.category = this.extractField(
          requestText,
          /Category:\s*(.+)/i
        );
        data.request.responsibleOrganization = this.extractField(
          requestText,
          /Responsible Organization:\s*(.+)/i
        );
        data.request.alternativeOrganizations = this.extractField(
          requestText,
          /Alternative Organizations:\s*(.+)/i
        );
        data.request.confidenceScore = parseInt(
          this.extractField(requestText, /Confidence Score:\s*(\d+)/i) || "0"
        );
      }

      // Check if ready for sending
      data.readyForSending =
        aiResponse.includes("READY_FOR_SENDING: YES") ||
        aiResponse.includes("READY_FOR_SENDING:YES");

      return data;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return data;
    }
  }

  /**
   * Extract field value from text using regex
   */
  extractField(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Create a new user request
   */
  async createRequest(userId, requestData, orgId = null) {
    try {
      const requestNumber = this.generateRequestNumber();

      const request = await UserRequest.create({
        userId,
        orgId,
        requestNumber,
        fullName: requestData.userInfo?.fullName,
        region: requestData.userInfo?.region,
        district: requestData.userInfo?.district,
        phone: requestData.userInfo?.phone,
        requestText: requestData.request?.requestText || requestData.rawText,
        summary: requestData.request?.summary,
        category: requestData.request?.category,
        responsibleOrganization: requestData.request?.responsibleOrganization,
        alternativeOrganizations: requestData.request?.alternativeOrganizations
          ? [requestData.request.alternativeOrganizations]
          : null,
        confidenceScore: requestData.request?.confidenceScore || 0,
        status: data.readyForSending ? "ready" : "analyzing",
        metadata: {
          rawAIResponse: requestData.rawAIResponse,
        },
      });

      return request;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  }

  /**
   * Generate unique request number
   */
  generateRequestNumber() {
    const prefix = "UZQ-REQ";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get request by number
   */
  async getRequest(requestNumber, orgId = null) {
    try {
      const where = { requestNumber };
      if (orgId) {
        where.orgId = orgId;
      }

      return await UserRequest.findOne({ where });
    } catch (error) {
      console.error("Error getting request:", error);
      return null;
    }
  }

  /**
   * Get user requests
   */
  async getUserRequests(userId, orgId = null) {
    try {
      const where = { userId };
      if (orgId) {
        where.orgId = orgId;
      }

      return await UserRequest.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      console.error("Error getting user requests:", error);
      return [];
    }
  }

  /**
   * Get organization requests
   */
  async getOrganizationRequests(orgId) {
    try {
      return await UserRequest.findAll({
        where: { orgId },
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      console.error("Error getting organization requests:", error);
      return [];
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(requestNumber, status, orgId = null) {
    try {
      const where = { requestNumber };
      if (orgId) {
        where.orgId = orgId;
      }

      const request = await UserRequest.findOne({ where });
      if (!request) {
        throw new Error("Request not found");
      }

      await request.update({ status });
      return request;
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  }
}

module.exports = new RequestIntakeService();

