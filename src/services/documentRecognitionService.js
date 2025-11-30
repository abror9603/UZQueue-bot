// Document Image Recognition Service
// Uses OpenAI Vision API for document analysis

const openaiService = require('./ai/openaiService');

class DocumentRecognitionService {
  /**
   * Analyze document image using OpenAI Vision
   * @param {string} imageUrl - URL or base64 encoded image
   * @param {string} documentType - Type of document (passport, id, etc.)
   * @param {string} language - Response language
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeDocument(imageUrl, documentType = 'auto', language = 'uz') {
    try {
      const prompt = this.getAnalysisPrompt(documentType, language);
      const analysis = await openaiService.analyzeImage(imageUrl, prompt, language);

      // Parse the AI response into structured format
      return this.parseAnalysisResponse(analysis.text, language);
    } catch (error) {
      console.error('Error analyzing document with OpenAI Vision:', error);
      // Return fallback response
      return this.getFallbackResponse(language);
    }
  }

  getAnalysisPrompt(documentType, language) {
    const prompts = {
      uz: `Ushbu hujjat rasmini tahlil qiling va quyidagi ma'lumotlarni ajratib bering:
1. Hujjat turi (pasport, ID karta, guvohnoma va hokazo)
2. Umumiy maydonlar (F.I.O., pasport raqami, tug'ilgan sana, berilgan sana)
3. Topilgan xatolar (fotosurat sifati, yorug'lik, fokus va hokazo)
4. Format bo'yicha maslahatlar

Maxfiy ma'lumotlarni (pasport raqami, INN) ko'rsatmang, faqat maydon nomlarini ko'rsating.`,
      ru: `Проанализируйте изображение этого документа и извлеките следующую информацию:
1. Тип документа (паспорт, ID карта, свидетельство и т.д.)
2. Общие поля (Ф.И.О., номер паспорта, дата рождения, дата выдачи)
3. Найденные ошибки (качество фото, освещение, фокус и т.д.)
4. Рекомендации по формату

Не показывайте конфиденциальную информацию (номер паспорта, ИНН), только названия полей.`,
      en: `Analyze this document image and extract the following information:
1. Document type (passport, ID card, certificate, etc.)
2. General fields (Full Name, passport number, birth date, issue date)
3. Errors found (photo quality, lighting, focus, etc.)
4. Format recommendations

Do not show confidential information (passport number, TIN), only field names.`
    };

    return prompts[language] || prompts.uz;
  }

  parseAnalysisResponse(text, language) {
    // Try to extract structured information from AI response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          documentType: parsed.documentType || 'unknown',
          generalFields: parsed.generalFields || {},
          errors: parsed.errors || [],
          formatAdvice: parsed.formatAdvice || [],
          isValid: parsed.isValid !== undefined ? parsed.isValid : false
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, parse text manually
    }

    // Fallback: extract information from text
    const errors = [];
    const formatAdvice = [];
    let documentType = 'unknown';

    // Try to extract document type
    const docTypeMatch = text.match(/hujjat turi[:\s]+([^\n]+)/i) || 
                        text.match(/тип документа[:\s]+([^\n]+)/i) ||
                        text.match(/document type[:\s]+([^\n]+)/i);
    if (docTypeMatch) {
      documentType = docTypeMatch[1].trim().toLowerCase();
    }

    // Extract errors
    const errorMatches = text.match(/(?:xato|ошибка|error)[:\s]+([^\n]+)/gi);
    if (errorMatches) {
      errorMatches.forEach(match => {
        errors.push(match.replace(/(?:xato|ошибка|error)[:\s]+/i, '').trim());
      });
    }

    // Extract format advice
    const adviceMatches = text.match(/(?:maslahat|рекомендация|recommendation)[:\s]+([^\n]+)/gi);
    if (adviceMatches) {
      adviceMatches.forEach(match => {
        formatAdvice.push(match.replace(/(?:maslahat|рекомендация|recommendation)[:\s]+/i, '').trim());
      });
    }

    return {
      documentType,
      generalFields: {
        fullName: '[Taniqlandi / Распознано / Recognized]',
        documentNumber: '[Taniqlandi / Распознано / Recognized]',
        birthDate: '[Taniqlandi / Распознано / Recognized]',
        issueDate: '[Taniqlandi / Распознано / Recognized]'
      },
      errors: errors.length > 0 ? errors : ['Xatoliklar aniqlanmadi / Ошибки не обнаружены / No errors detected'],
      formatAdvice: formatAdvice.length > 0 ? formatAdvice : ['Yaxshi yorug\'likda, to\'liq ko\'rinishida / При хорошем освещении, полностью видим / Good lighting, fully visible'],
      isValid: errors.length === 0,
      rawText: text
    };
  }

  getFallbackResponse(language) {
    const responses = {
      uz: {
        documentType: 'pasport',
        generalFields: {
          fullName: '[Taniqlanmadi]',
          passportNumber: '[Taniqlanmadi]',
          birthDate: '[Taniqlanmadi]',
          issueDate: '[Taniqlanmadi]'
        },
        errors: ['Rasm tahlil qilinmadi'],
        formatAdvice: ['Yorug\'likni yaxshilang', 'Hujjat to\'liq ko\'rinishida bo\'lishi kerak'],
        isValid: false
      },
      ru: {
        documentType: 'паспорт',
        generalFields: {
          fullName: '[Не распознано]',
          passportNumber: '[Не распознано]',
          birthDate: '[Не распознано]',
          issueDate: '[Не распознано]'
        },
        errors: ['Изображение не проанализировано'],
        formatAdvice: ['Улучшите освещение', 'Документ должен быть полностью виден'],
        isValid: false
      },
      en: {
        documentType: 'passport',
        generalFields: {
          fullName: '[Not recognized]',
          passportNumber: '[Not recognized]',
          birthDate: '[Not recognized]',
          issueDate: '[Not recognized]'
        },
        errors: ['Image not analyzed'],
        formatAdvice: ['Improve lighting', 'Document should be fully visible'],
        isValid: false
      }
    };

    return responses[language] || responses.uz;
  }

  async extractFields(imageUrl, documentType, language = 'uz') {
    const analysis = await this.analyzeDocument(imageUrl, documentType, language);
    return analysis.generalFields;
  }
}

module.exports = new DocumentRecognitionService();
