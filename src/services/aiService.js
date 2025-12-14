const OpenAI = require('openai');
const { AiLog } = require('../models');
require('dotenv').config();

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async askAI(prompt, language = 'uz') {
    try {
      const systemPrompt = this._getSystemPrompt(language);
      
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });

      const answer = response.choices[0].message.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      // Log AI usage
      await AiLog.create({
        prompt,
        response: answer,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        tokensUsed
      });

      return answer;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  async suggestOrganization(appealText, location, language = 'uz') {
    const prompt = this._getOrganizationSuggestionPrompt(appealText, location, language);
    return await this.askAI(prompt, language);
  }

  async analyzeAppeal(appealText, language = 'uz') {
    const prompt = this._getAppealAnalysisPrompt(appealText, language);
    return await this.askAI(prompt, language);
  }

  async generateStatusResponse(status, appeal, language = 'uz') {
    const prompt = this._getStatusResponsePrompt(status, appeal, language);
    return await this.askAI(prompt, language);
  }

  _getSystemPrompt(language) {
    const prompts = {
      uz: 'Siz UZQueue fuqaro murojaatlari botining AI yordamchisisiz. Siz rasmiy, tushunarli va yordamchi javoblar berasiz.',
      ru: 'Вы AI-помощник бота для обращений граждан UZQueue. Вы даете официальные, понятные и полезные ответы.',
      en: 'You are an AI assistant for the UZQueue citizen appeals bot. You provide official, clear, and helpful responses.'
    };
    return prompts[language] || prompts.uz;
  }

  _getOrganizationSuggestionPrompt(appealText, location, language) {
    const prompts = {
      uz: `Quyidagi murojaatni tahlil qiling va qaysi tashkilotga yuborilishi kerakligini tavsiya qiling:\n\nHudud: ${location}\nMurojaat: ${appealText}\n\nQaysi tashkilot eng mos keladi? Qisqa tushuntirish bering.`,
      ru: `Проанализируйте следующее обращение и порекомендуйте, в какую организацию его следует направить:\n\nРегион: ${location}\nОбращение: ${appealText}\n\nКакая организация наиболее подходит? Дайте краткое объяснение.`,
      en: `Analyze the following appeal and recommend which organization it should be directed to:\n\nLocation: ${location}\nAppeal: ${appealText}\n\nWhich organization is most suitable? Provide a brief explanation.`
    };
    return prompts[language] || prompts.uz;
  }

  _getAppealAnalysisPrompt(appealText, language) {
    const prompts = {
      uz: `Quyidagi murojaatni tahlil qiling:\n\n${appealText}\n\nTahlil qiling: murojaatning mohiyati, qaysi hujjatlar kerak bo'lishi mumkin, qanday yechimlar taklif qilish mumkin.`,
      ru: `Проанализируйте следующее обращение:\n\n${appealText}\n\nПроанализируйте: суть обращения, какие документы могут понадобиться, какие решения можно предложить.`,
      en: `Analyze the following appeal:\n\n${appealText}\n\nAnalyze: the essence of the appeal, what documents might be needed, what solutions can be proposed.`
    };
    return prompts[language] || prompts.uz;
  }

  _getStatusResponsePrompt(status, appeal, language) {
    const statusTexts = {
      uz: {
        pending: 'jarayonda',
        completed: 'bajarildi',
        rejected: 'rad etildi'
      },
      ru: {
        pending: 'в процессе',
        completed: 'выполнено',
        rejected: 'отклонено'
      },
      en: {
        pending: 'pending',
        completed: 'completed',
        rejected: 'rejected'
      }
    };

    const statusText = statusTexts[language]?.[status] || status;

    const prompts = {
      uz: `Murojaat holati "${statusText}" ga o'zgardi.\n\nMurojaat: ${appeal.appealText}\n\nFuqaroga tushunarli, rasmiy va yordamchi javob yozing.`,
      ru: `Статус обращения изменился на "${statusText}".\n\nОбращение: ${appeal.appealText}\n\nНапишите гражданину понятный, официальный и полезный ответ.`,
      en: `Appeal status changed to "${statusText}".\n\nAppeal: ${appeal.appealText}\n\nWrite a clear, official, and helpful response to the citizen.`
    };
    return prompts[language] || prompts.uz;
  }
}

module.exports = new AIService();

