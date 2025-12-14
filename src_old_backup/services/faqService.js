// FAQ Service
// Handles frequently asked questions for citizens

const { askAI } = require("./ai/aiHelper");

class FaqService {
  /**
   * FAQ categories and common questions
   */
  getFaqCategories(language = "uz") {
    const categories = {
      uz: [
        {
          id: "passport",
          name: "Pasport va hujjatlar",
          icon: "📄",
          questions: [
            "Pasport qanday olinadi?",
            "Pasportni qayta qanday olish mumkin?",
            "Pasport yo'qolgan bo'lsa nima qilish kerak?",
            "JShShIR qanday olinadi?",
          ],
        },
        {
          id: "education",
          name: "Ta'lim",
          icon: "🎓",
          questions: [
            "Maktabga qanday ro'yxatdan o'tish kerak?",
            "Oliy ta'lim granti qanday olinadi?",
            "Diplom nostrifikatsiyasi qanday amalga oshiriladi?",
          ],
        },
        {
          id: "healthcare",
          name: "Tibbiyot",
          icon: "🏥",
          questions: [
            "Poliklinikaga qanday ro'yxatdan o'tish kerak?",
            "Shifokor qabuliga qanday yozilish kerak?",
            "Bemorlik varaqasi qanday olinadi?",
          ],
        },
        {
          id: "housing",
          name: "Uy-joy",
          icon: "🏠",
          questions: [
            "Uy-joy olish uchun qanday hujjatlar kerak?",
            "Ipoteka krediti qanday olinadi?",
            "Uy-joy ro'yxatiga qanday kiritilish kerak?",
          ],
        },
        {
          id: "business",
          name: "Biznes",
          icon: "💼",
          questions: [
            "Yakka tartibdagi tadbirkor qanday ro'yxatdan o'tadi?",
            "Soliq qanday to'lanadi?",
            "Litsenziya qanday olinadi?",
          ],
        },
        {
          id: "transport",
          name: "Transport",
          icon: "🚗",
          questions: [
            "Haydovchilik guvohnomasi qanday olinadi?",
            "Avtomobil ro'yxatdan o'tkazish qanday?",
            "Transport solig'i qanday to'lanadi?",
          ],
        },
      ],
      ru: [
        {
          id: "passport",
          name: "Паспорт и документы",
          icon: "📄",
          questions: [
            "Как получить паспорт?",
            "Как восстановить паспорт?",
            "Что делать, если паспорт потерян?",
            "Как получить ПИНФЛ?",
          ],
        },
        {
          id: "education",
          name: "Образование",
          icon: "🎓",
          questions: [
            "Как записаться в школу?",
            "Как получить грант на высшее образование?",
            "Как провести нострификацию диплома?",
          ],
        },
        {
          id: "healthcare",
          name: "Медицина",
          icon: "🏥",
          questions: [
            "Как записаться в поликлинику?",
            "Как записаться к врачу?",
            "Как получить больничный лист?",
          ],
        },
        {
          id: "housing",
          name: "Жилье",
          icon: "🏠",
          questions: [
            "Какие документы нужны для получения жилья?",
            "Как получить ипотечный кредит?",
            "Как попасть в очередь на жилье?",
          ],
        },
        {
          id: "business",
          name: "Бизнес",
          icon: "💼",
          questions: [
            "Как зарегистрироваться как индивидуальный предприниматель?",
            "Как платить налоги?",
            "Как получить лицензию?",
          ],
        },
        {
          id: "transport",
          name: "Транспорт",
          icon: "🚗",
          questions: [
            "Как получить водительские права?",
            "Как зарегистрировать автомобиль?",
            "Как платить транспортный налог?",
          ],
        },
      ],
      en: [
        {
          id: "passport",
          name: "Passport & Documents",
          icon: "📄",
          questions: [
            "How to get a passport?",
            "How to renew a passport?",
            "What to do if passport is lost?",
            "How to get PINFL?",
          ],
        },
        {
          id: "education",
          name: "Education",
          icon: "🎓",
          questions: [
            "How to enroll in school?",
            "How to get higher education grant?",
            "How to do diploma nostrification?",
          ],
        },
        {
          id: "healthcare",
          name: "Healthcare",
          icon: "🏥",
          questions: [
            "How to register at polyclinic?",
            "How to make appointment with doctor?",
            "How to get sick leave?",
          ],
        },
        {
          id: "housing",
          name: "Housing",
          icon: "🏠",
          questions: [
            "What documents are needed to get housing?",
            "How to get mortgage loan?",
            "How to get on housing waiting list?",
          ],
        },
        {
          id: "business",
          name: "Business",
          icon: "💼",
          questions: [
            "How to register as individual entrepreneur?",
            "How to pay taxes?",
            "How to get license?",
          ],
        },
        {
          id: "transport",
          name: "Transport",
          icon: "🚗",
          questions: [
            "How to get driver's license?",
            "How to register a car?",
            "How to pay transport tax?",
          ],
        },
      ],
    };

    return categories[language] || categories.uz;
  }

  /**
   * Get answer for FAQ question using AI
   */
  async getAnswer(question, category, language = "uz") {
    try {
      const systemPrompt = this.getSystemPrompt(language, category);
      const response = await askAI(question, language, {
        context: systemPrompt,
      });

      return response;
    } catch (error) {
      console.error("Error getting FAQ answer:", error);
      return this.getFallbackAnswer(category, language);
    }
  }

  /**
   * System prompt for FAQ
   */
  getSystemPrompt(language, category) {
    const prompts = {
      uz: `Siz O'zbekiston Respublikasidagi davlat xizmatlari bo'yicha mutaxassissiz. Foydalanuvchiga aniq, tushunarli va rasmiy ma'lumot bering. Javobingiz qisqa, ammo to'liq bo'lsin.`,
      ru: `Вы специалист по государственным услугам Республики Узбекистан. Предоставьте пользователю точную, понятную и официальную информацию. Ваш ответ должен быть кратким, но полным.`,
      en: `You are a specialist in government services of the Republic of Uzbekistan. Provide the user with accurate, clear and official information. Your answer should be brief but complete.`,
    };

    return prompts[language] || prompts.uz;
  }

  /**
   * Fallback answer if AI fails
   */
  getFallbackAnswer(category, language) {
    const answers = {
      uz: "Kechirasiz, savolingizga javob berishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki boshqa savol bering.",
      ru: "Извините, произошла ошибка при ответе на ваш вопрос. Пожалуйста, попробуйте снова или задайте другой вопрос.",
      en: "Sorry, an error occurred while answering your question. Please try again or ask another question.",
    };

    return answers[language] || answers.uz;
  }
}

module.exports = new FaqService();

