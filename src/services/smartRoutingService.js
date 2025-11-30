// AI Smart Routing Service
// Uses OpenAI GPT to analyze problems and provide routing recommendations

const { askAIStructured } = require('./ai/aiHelper');

class SmartRoutingService {
  async analyzeProblem(problemText, language = 'uz') {
    try {
      const prompt = this.getRoutingPrompt(problemText, language);
      
      // Use structured AI response for consistent format
      const schema = {
        organization: "Idora nomi",
        department: "Bo'lim nomi",
        requiredDocuments: ["hujjat1", "hujjat2"],
        bestDay: "Eng qulay kun va vaqt",
        branch: "Filial nomi",
        description: "Qisqa tavsif"
      };

      const response = await askAIStructured(prompt, language, schema);

      // If structured response failed, try regular AI query
      if (!response.organization && !response.text) {
        const aiResponse = await this.analyzeWithAI(problemText, language);
        return this.parseAIResponse(aiResponse, language);
      }

      // Normalize response structure
      return {
        organization: response.organization || response.text?.match(/Idora[:\s]+(.+)/)?.[1] || 'Davlat xizmatlari markazi',
        department: response.department || response.text?.match(/Bo'lim[:\s]+(.+)/)?.[1] || 'Maslahat bo\'limi',
        requiredDocuments: Array.isArray(response.requiredDocuments) 
          ? response.requiredDocuments 
          : ['Pasport', 'Muammo haqida batafsil ma\'lumot'],
        bestDay: response.bestDay || 'Ish kunlari',
        branch: response.branch || 'Markaziy filial',
        description: response.description || problemText
      };
    } catch (error) {
      console.error('Error in SmartRoutingService:', error);
      // Fallback to default recommendation
      return this.getDefaultRecommendation(language);
    }
  }

  getRoutingPrompt(problemText, language) {
    const prompts = {
      uz: `Quyidagi muammoni tahlil qiling va eng mos idora, bo'lim, kerakli hujjatlar, eng qulay kun va filialni tavsiya qiling.

Muammo: ${problemText}

Javobni quyidagi formatda bering:
- Idora: [idora nomi]
- Bo'lim: [bo'lim nomi]
- Kerakli hujjatlar: [hujjatlar ro'yxati]
- Eng qulay kun: [kun va vaqt]
- Filial: [filial nomi]
- Tavsif: [qisqa tavsif]

O'zbekiston Respublikasidagi real idoralar va bo'limlar nomlarini ishlating.`,
      ru: `Проанализируйте следующую проблему и порекомендуйте подходящую организацию, отдел, необходимые документы, наиболее удобное время и филиал.

Проблема: ${problemText}

Ответьте в следующем формате:
- Организация: [название организации]
- Отдел: [название отдела]
- Необходимые документы: [список документов]
- Наиболее удобное время: [день и время]
- Филиал: [название филиала]
- Описание: [краткое описание]

Используйте реальные названия организаций и отделов в Республике Узбекистан.`,
      en: `Analyze the following problem and recommend the appropriate organization, department, required documents, best time, and branch.

Problem: ${problemText}

Provide answer in the following format:
- Organization: [organization name]
- Department: [department name]
- Required documents: [list of documents]
- Best time: [day and time]
- Branch: [branch name]
- Description: [brief description]

Use real organization and department names from the Republic of Uzbekistan.`
    };

    return prompts[language] || prompts.uz;
  }

  async analyzeWithAI(problemText, language) {
    const { askAI } = require('./ai/aiHelper');
    const context = {
      uz: 'Siz O\'zbekiston Respublikasidagi davlat idoralari va xizmatlarni tavsiya qiluvchi mutaxassissiz. Muammoga mos idora, bo\'lim, kerakli hujjatlar va eng qulay vaqtni tavsiya qiling.',
      ru: 'Вы специалист, который рекомендует государственные организации и услуги в Республике Узбекистан. Порекомендуйте подходящую организацию, отдел, необходимые документы и наиболее удобное время.',
      en: 'You are a specialist who recommends government organizations and services in the Republic of Uzbekistan. Recommend the appropriate organization, department, required documents, and best time.'
    };

    return await askAI(problemText, language, { context: context[language] || context.uz });
  }

  parseAIResponse(text, language) {
    // Try to extract structured information from text response
    const orgMatch = text.match(/Idora[:\s]+(.+?)(?:\n|$)/i) || text.match(/Организация[:\s]+(.+?)(?:\n|$)/i) || text.match(/Organization[:\s]+(.+?)(?:\n|$)/i);
    const deptMatch = text.match(/Bo'lim[:\s]+(.+?)(?:\n|$)/i) || text.match(/Отдел[:\s]+(.+?)(?:\n|$)/i) || text.match(/Department[:\s]+(.+?)(?:\n|$)/i);

    return {
      organization: orgMatch ? orgMatch[1].trim() : 'Davlat xizmatlari markazi',
      department: deptMatch ? deptMatch[1].trim() : 'Maslahat bo\'limi',
      requiredDocuments: ['Pasport', 'Muammo haqida batafsil ma\'lumot'],
      bestDay: 'Ish kunlari',
      branch: 'Markaziy filial',
      description: text.substring(0, 200)
    };
  }

  getDefaultRecommendation(language) {
    const defaults = {
      uz: {
        organization: 'Davlat xizmatlari markazi',
        department: 'Maslahat bo\'limi',
        requiredDocuments: ['Pasport', 'Muammo haqida batafsil ma\'lumot'],
        bestDay: 'Ish kunlari',
        branch: 'Markaziy filial',
        description: 'Umumiy maslahat'
      },
      ru: {
        organization: 'Центр государственных услуг',
        department: 'Консультационный отдел',
        requiredDocuments: ['Паспорт', 'Подробная информация о проблеме'],
        bestDay: 'Рабочие дни',
        branch: 'Центральный филиал',
        description: 'Общая консультация'
      },
      en: {
        organization: 'State Services Center',
        department: 'Consultation Department',
        requiredDocuments: ['Passport', 'Detailed information about the problem'],
        bestDay: 'Working days',
        branch: 'Central Branch',
        description: 'General consultation'
      }
    };

    return defaults[language] || defaults.uz;
  }
}

module.exports = new SmartRoutingService();

