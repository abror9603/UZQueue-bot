/**
 * OpenAI Service
 * Handles all interactions with OpenAI API (GPT models)
 */

require('dotenv').config();

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!this.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY is not set in environment variables');
    }
  }

  /**
   * Generic method to call OpenAI API
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options (model, temperature, etc.)
   * @returns {Promise<Object>} - API response
   */
  async chat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          ...options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Ask AI a question in specified language
   * @param {string} question - The question to ask
   * @param {string} language - Language code (uz, ru, en)
   * @param {Object} context - Additional context or system prompt
   * @returns {Promise<string>} - AI response in specified language
   */
  async askAI(question, language = 'uz', context = null) {
    const languageNames = {
      uz: 'O\'zbek tili',
      ru: 'Русский язык',
      en: 'English'
    };

    const systemPrompt = context || `Siz — UZQueue AI Platform uchun mo'ljallangan rasmiy AI yordamchi tizimisiz. 
Sizning vazifangiz O'zbekiston va MDH davlatlaridagi davlat idoralari, banklar, klinikalar va xizmat ko'rsatish tashkilotlaridagi fuqarolar murojaatlarini, navbatlarni va hujjat jarayonlarini sun'iy intellekt yordamida avtomatlashtirishdir.

Javoblar har doim ${languageNames[language] || 'O\'zbek tili'}da, qisqa, aniq, oddiy va tushunarli bo'lishi shart.
Davlat tili me'yorida, rasmiy ohangda gapiring.
Maxfiy ma'lumotlarni hech qachon so'ramang.
Har doim aniq yechim chiqaring.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: question
      }
    ];

    try {
      const response = await this.chat(messages, {
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0]?.message?.content || 'Javob olinmadi.';
    } catch (error) {
      console.error('Error in askAI:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   * @param {Buffer|string} audioFile - Audio file buffer or file path
   * @param {string} language - Language code (uz, ru, en)
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeAudio(audioFile, language = 'uz') {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const FormData = require('form-data');
    const languageMap = {
      uz: 'uz',
      ru: 'ru',
      en: 'en'
    };

    try {
      const formData = new FormData();
      
      // If audioFile is a buffer
      if (Buffer.isBuffer(audioFile)) {
        formData.append('file', audioFile, {
          filename: 'audio.ogg',
          contentType: 'audio/ogg'
        });
      } else {
        throw new Error('Audio file must be a Buffer.');
      }

      formData.append('model', 'whisper-1');
      const langCode = languageMap[language] || 'uz';
      if (langCode !== 'uz') {
        formData.append('language', langCode);
      }

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Whisper error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Analyze image/document using OpenAI Vision
   * @param {string} imageUrl - URL or base64 encoded image
   * @param {string} prompt - Analysis prompt
   * @param {string} language - Response language
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeImage(imageUrl, prompt, language = 'uz') {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const languageInstructions = {
      uz: 'Javobni O\'zbek tilida bering.',
      ru: 'Отвечайте на русском языке.',
      en: 'Respond in English.'
    };

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${prompt}\n\n${languageInstructions[language] || languageInstructions.uz}`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl.startsWith('http') ? imageUrl : `data:image/jpeg;base64,${imageUrl}`
            }
          }
        ]
      }
    ];

    try {
      const response = await this.chat(messages, {
        model: 'gpt-4o',
        max_tokens: 2000
      });

      return {
        text: response.choices[0]?.message?.content || '',
        raw: response
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Generate document/content using GPT
   * @param {string} instruction - What to generate
   * @param {Object} data - Context data
   * @param {string} language - Output language
   * @returns {Promise<string>} - Generated content
   */
  async generateContent(instruction, data = {}, language = 'uz') {
    const languageNames = {
      uz: 'O\'zbek tili',
      ru: 'Русский язык',
      en: 'English'
    };

    const systemPrompt = `Siz professional hujjatlar tayyorlovchi yordamchisiz.
${languageNames[language] || 'O\'zbek tili'}da, rasmiy davlat tili me'yorida, to'liq va batafsil javob bering.
Hujjatlar O'zbekiston Respublikasi qonun-qoidalariga mos bo'lishi kerak.`;

    const userPrompt = `${instruction}\n\nContext: ${JSON.stringify(data, null, 2)}\n\n${languageNames[language] || 'O\'zbek tili'}da yozing.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.chat(messages, {
        temperature: 0.5,
        max_tokens: 3000
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();

