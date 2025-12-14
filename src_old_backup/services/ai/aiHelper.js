/**
 * AI Helper Module
 * Provides easy-to-use functions for AI interactions
 */

const openaiService = require('./openaiService');
const googleService = require('./googleService');

/**
 * Ask AI a question and get response in specified language
 * @param {string} question - The question to ask
 * @param {string} language - Language code (uz, ru, en)
 * @param {Object} options - Additional options (context, temperature, etc.)
 * @returns {Promise<string>} - AI response
 */
async function askAI(question, language = 'uz', options = {}) {
  try {
    const response = await openaiService.askAI(
      question,
      language,
      options.context || null
    );
    
    // If translation is needed (fallback), use Google Translate
    if (options.translate && response) {
      try {
        return await googleService.translate(response, language);
      } catch (translateError) {
        console.warn('Translation failed, using original response:', translateError);
        return response;
      }
    }

    return response;
  } catch (error) {
    console.error('Error in askAI helper:', error);
    
    // Fallback response based on language
    const fallbackMessages = {
      uz: 'Kechirasiz, savolga javob berishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
      ru: 'Извините, произошла ошибка при ответе на вопрос. Пожалуйста, попробуйте снова.',
      en: 'Sorry, an error occurred while answering the question. Please try again.'
    };

    return fallbackMessages[language] || fallbackMessages.uz;
  }
}

/**
 * Generate structured response (JSON) from AI
 * @param {string} prompt - The prompt/question
 * @param {string} language - Language code
 * @param {Object} schema - Expected response structure
 * @returns {Promise<Object>} - Structured response
 */
async function askAIStructured(prompt, language = 'uz', schema = null) {
  try {
    const systemPrompt = schema 
      ? `Javobni quyidagi JSON formatida bering:\n${JSON.stringify(schema, null, 2)}\n\nFaqat JSON qaytaring, boshqa matn yo'q.`
      : 'Javobni JSON formatida bering.';

    const response = await openaiService.askAI(
      `${prompt}\n\n${systemPrompt}`,
      language
    );

    // Try to parse JSON from response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, returning text:', parseError);
      return { text: response };
    }
  } catch (error) {
    console.error('Error in askAIStructured:', error);
    throw error;
  }
}

/**
 * Analyze text and extract information
 * @param {string} text - Text to analyze
 * @param {string} analysisType - Type of analysis needed
 * @param {string} language - Response language
 * @returns {Promise<Object>} - Analysis result
 */
async function analyzeText(text, analysisType, language = 'uz') {
  const analysisPrompts = {
    problem: 'Bu muammoni tahlil qiling va quyidagi ma\'lumotlarni bering: idora, bo\'lim, kerakli hujjatlar, eng qulay kun.',
    sentiment: 'Matnning kayfiyatini aniqlang: ijobiy, salbiy yoki neytral.',
    summary: 'Matnning qisqa mazmunini bering.',
    keywords: 'Matndan asosiy kalit so\'zlarni ajratib bering.'
  };

  const prompt = analysisPrompts[analysisType] || analysisPrompts.problem;

  try {
    const response = await openaiService.askAI(
      `${prompt}\n\nMatn: ${text}`,
      language
    );

    return {
      type: analysisType,
      result: response,
      originalText: text
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}

/**
 * Translate text using Google Translate
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language (auto if not provided)
 * @returns {Promise<string>} - Translated text
 */
async function translate(text, targetLang = 'uz', sourceLang = 'auto') {
  try {
    return await googleService.translate(text, targetLang, sourceLang);
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} - Language detection result
 */
async function detectLanguage(text) {
  try {
    return await googleService.detectLanguage(text);
  } catch (error) {
    console.error('Error detecting language:', error);
    throw error;
  }
}

module.exports = {
  askAI,
  askAIStructured,
  analyzeText,
  translate,
  detectLanguage,
  openai: openaiService,
  google: googleService
};

