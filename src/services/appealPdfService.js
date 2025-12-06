// Appeal PDF Generation Service
// Generates official appeal text and prepares data for PDF creation

const { askAI } = require("./ai/aiHelper");

class AppealPdfService {
  /**
   * Organization URLs mapping
   */
  getOrganizationUrls() {
    return {
      // Hokimiyat
      hokimiyat: "https://reception.pm.gov.uz/",
      "viloyat hokimiyati": "https://reception.pm.gov.uz/",
      "tuman hokimiyati": "https://reception.pm.gov.uz/",
      "shahar hokimiyati": "https://reception.pm.gov.uz/",

      // Banklar
      "ipoteka bank": "https://ipoteka.uz/uz/reception/",
      "aloqa bank": "https://aloqabank.uz/uz/interactive/reception/",
      agrobank: "https://agrobank.uz/uz/virtual-reception",
      "xalq banki": "https://xb.uz/uz/reception/",
      "tenge bank": "https://tengebank.uz/uz/reception",

      // Energiya
      "hududiy elektr tarmoqlari": "https://het.uz/uz/reception/",
      het: "https://het.uz/uz/reception/",
      elektr: "https://het.uz/uz/reception/",

      // Gaz
      hududgaz: "https://hududgaz.uz/virtual-reception/",
      gaz: "https://hududgaz.uz/virtual-reception/",

      // Suv
      "suv kanal": "https://uzsuv.uz/virtual-reception/",
      suv: "https://uzsuv.uz/virtual-reception/",

      // IIV / YPX
      iiv: "https://my.gov.uz/oz/service/51",
      "yo'l patrol": "https://my.gov.uz/oz/service/438",
      ypx: "https://my.gov.uz/oz/service/438",

      // Tibbiyot
      ssv: "https://ssv.uz/uz/virtual-reception",
      "sog'liqni saqlash vazirligi": "https://ssv.uz/uz/virtual-reception",

      // Savdo tarmoqlari
      korzinka: "https://korzinka.uz/uz/contact",
      makro: "https://makromarket.uz/contact",
      beeline: "https://beeline.uz/uz/feedback",
      ucell: "https://ucell.uz/uz/feedback",
      "uzum market": "https://help.uzum.uz/hc/uz/requests/new",
    };
  }

  /**
   * Find organization URL by name
   */
  findOrganizationUrl(organizationName) {
    const urls = this.getOrganizationUrls();
    const normalizedName = organizationName.toLowerCase().trim();

    // Direct match
    if (urls[normalizedName]) {
      return urls[normalizedName];
    }

    // Partial match
    for (const [key, url] of Object.entries(urls)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return url;
      }
    }

    // Default - general reception
    return "https://reception.pm.gov.uz/";
  }

  /**
   * Generate official appeal text using AI
   */
  async generateAppealText(
    organizationName,
    userInfo,
    appealText,
    language = "uz"
  ) {
    try {
      const systemPrompt = this.getSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(
        organizationName,
        userInfo,
        appealText,
        language
      );

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const aiResponse = await askAI(fullPrompt, language);

      // Clean and extract appeal text
      return this.cleanAppealText(aiResponse, organizationName, userInfo.fullName);
    } catch (error) {
      console.error("Error generating appeal text:", error);
      // Fallback to template
      return this.generateFallbackAppeal(
        organizationName,
        userInfo,
        appealText,
        language
      );
    }
  }

  /**
   * System prompt for appeal generation
   */
  getSystemPrompt(language = "uz") {
    const prompts = {
      uz: `Sizning vazifangiz - foydalanuvchining tanlagan tashkiloti bo'yicha rasmiy murojaat matnini generatsiya qilish.

TALABLAR:
1. Adabiy, rasmiy uslubda yozilsin
2. "Hurmatli {tashkilot} rahbariyatiga" deb boshlansin
3. Murojaat matni tashkilotga mos bo'lsin
4. Grammatik xatolarsiz bo'lsin
5. Oxirida "Hurmat bilan, {FIO}" deb tugatilsin
6. Faqat murojaat matnini qaytaring, boshqa izohlar yo'q

FORMAT:
Hurmatli {tashkilot} rahbariyatiga!

[Asosiy murojaat matni - foydalanuvchi muammosini batafsil tushuntirish]

Hurmat bilan,
{FIO}`,

      ru: `Ваша задача - сгенерировать официальный текст обращения для выбранной пользователем организации.

ТРЕБОВАНИЯ:
1. Написано в литературном, официальном стиле
2. Начинается с "Уважаемое руководство {организация}"
3. Текст обращения должен соответствовать организации
4. Без грамматических ошибок
5. Заканчивается "С уважением, {ФИО}"
6. Возвращайте только текст обращения, без дополнительных комментариев

ФОРМАТ:
Уважаемое руководство {организация}!

[Основной текст обращения - подробное описание проблемы пользователя]

С уважением,
{ФИО}`,

      en: `Your task is to generate an official appeal text for the user's selected organization.

REQUIREMENTS:
1. Written in literary, official style
2. Starts with "Dear {organization} management"
3. Appeal text should match the organization
4. No grammatical errors
5. Ends with "Respectfully, {Full Name}"
6. Return only the appeal text, no additional comments

FORMAT:
Dear {organization} management!

[Main appeal text - detailed description of user's problem]

Respectfully,
{Full Name}`,
    };

    return prompts[language] || prompts.uz;
  }

  /**
   * Build user prompt
   */
  buildUserPrompt(organizationName, userInfo, appealText, language) {
    const prompts = {
      uz: `Tashkilot: ${organizationName}
Foydalanuvchi: ${userInfo.fullName}
Manzil: ${userInfo.address || "N/A"}
Telefon: ${userInfo.phone || "N/A"}

Foydalanuvchi muammosi:
${appealText}

Yuqoridagi ma'lumotlarga asoslanib, rasmiy murojaat matnini generatsiya qiling.`,

      ru: `Организация: ${organizationName}
Пользователь: ${userInfo.fullName}
Адрес: ${userInfo.address || "N/A"}
Телефон: ${userInfo.phone || "N/A"}

Проблема пользователя:
${appealText}

На основе вышеуказанной информации сгенерируйте официальный текст обращения.`,

      en: `Organization: ${organizationName}
User: ${userInfo.fullName}
Address: ${userInfo.address || "N/A"}
Phone: ${userInfo.phone || "N/A"}

User's problem:
${appealText}

Based on the above information, generate the official appeal text.`,
    };

    return prompts[language] || prompts.uz;
  }

  /**
   * Clean and format appeal text
   */
  cleanAppealText(aiResponse, organizationName, fullName) {
    // Remove markdown formatting
    let text = aiResponse
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`/g, "")
      .trim();

    // Ensure proper greeting
    if (!text.toLowerCase().includes("hurmatli")) {
      text = `Hurmatli ${organizationName} rahbariyatiga!\n\n${text}`;
    }

    // Ensure proper closing
    if (!text.toLowerCase().includes("hurmat bilan")) {
      text = `${text}\n\nHurmat bilan,\n${fullName}`;
    }

    return text;
  }

  /**
   * Generate fallback appeal text
   */
  generateFallbackAppeal(organizationName, userInfo, appealText, language) {
    const templates = {
      uz: `Hurmatli ${organizationName} rahbariyatiga!

${appealText}

Hurmat bilan,
${userInfo.fullName}`,

      ru: `Уважаемое руководство ${organizationName}!

${appealText}

С уважением,
${userInfo.fullName}`,

      en: `Dear ${organizationName} management!

${appealText}

Respectfully,
${userInfo.fullName}`,
    };

    return templates[language] || templates.uz;
  }

  /**
   * Generate PDF data in JSON format
   */
  async generatePdfData(userInfo, organizationName, appealText, language = "uz") {
    try {
      // Generate official appeal text
      const officialAppealText = await this.generateAppealText(
        organizationName,
        userInfo,
        appealText,
        language
      );

      // Find organization URL
      const organizationUrl = this.findOrganizationUrl(organizationName);

      // Get current date
      const currentDate = new Date().toLocaleDateString(
        language === "uz"
          ? "uz-UZ"
          : language === "ru"
          ? "ru-RU"
          : "en-US"
      );

      // Build PDF data
      const pdfData = {
        pdf_title: `Murojaat – ${organizationName}`,
        organization: organizationName,
        organization_url: organizationUrl,
        full_name: userInfo.fullName,
        address: userInfo.address || "",
        phone: userInfo.phone || "",
        passport_or_pinfl: userInfo.passportOrPinfl || "",
        appeal_text: officialAppealText,
        date: currentDate,
        note_for_user:
          language === "uz"
            ? "Ushbu PDFni tashkilotning rasmiy murojaat portaliga o'zingiz joylashingiz kerak."
            : language === "ru"
            ? "Вам необходимо самостоятельно разместить этот PDF на официальном портале обращений организации."
            : "You need to place this PDF on the organization's official appeal portal yourself.",
      };

      return pdfData;
    } catch (error) {
      console.error("Error generating PDF data:", error);
      throw error;
    }
  }

  /**
   * Format PDF data for display
   */
  formatPdfDataForDisplay(pdfData, language = "uz") {
    if (language === "uz") {
      return `📄 MUROJAAT TAYYORLANDI

📋 Sarlavha: ${pdfData.pdf_title}
🏛️ Tashkilot: ${pdfData.organization}
🔗 Murojaat URL: ${pdfData.organization_url}

👤 FOYDALANUVCHI MA'LUMOTLARI:
- Ism: ${pdfData.full_name}
- Manzil: ${pdfData.address || "N/A"}
- Telefon: ${pdfData.phone || "N/A"}
- Pasport/JShShIR: ${pdfData.passport_or_pinfl || "N/A"}

📝 MUROJAAT MATNI:
${pdfData.appeal_text}

📅 Sana: ${pdfData.date}

ℹ️ ${pdfData.note_for_user}`;
    } else if (language === "ru") {
      return `📄 ОБРАЩЕНИЕ ПОДГОТОВЛЕНО

📋 Заголовок: ${pdfData.pdf_title}
🏛️ Организация: ${pdfData.organization}
🔗 URL обращения: ${pdfData.organization_url}

👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
- Имя: ${pdfData.full_name}
- Адрес: ${pdfData.address || "N/A"}
- Телефон: ${pdfData.phone || "N/A"}
- Паспорт/ПИНФЛ: ${pdfData.passport_or_pinfl || "N/A"}

📝 ТЕКСТ ОБРАЩЕНИЯ:
${pdfData.appeal_text}

📅 Дата: ${pdfData.date}

ℹ️ ${pdfData.note_for_user}`;
    } else {
      return `📄 APPEAL PREPARED

📋 Title: ${pdfData.pdf_title}
🏛️ Organization: ${pdfData.organization}
🔗 Appeal URL: ${pdfData.organization_url}

👤 USER INFORMATION:
- Name: ${pdfData.full_name}
- Address: ${pdfData.address || "N/A"}
- Phone: ${pdfData.phone || "N/A"}
- Passport/PINFL: ${pdfData.passport_or_pinfl || "N/A"}

📝 APPEAL TEXT:
${pdfData.appeal_text}

📅 Date: ${pdfData.date}

ℹ️ ${pdfData.note_for_user}`;
    }
  }
}

module.exports = new AppealPdfService();

