// Business Assistant Service
// AI assistant for businesses

const { askAI } = require("./ai/aiHelper");

class BusinessAssistantService {
  /**
   * Business assistant categories
   */
  getBusinessCategories(language = "uz") {
    const categories = {
      uz: [
        {
          id: "contract",
          name: "Shartnoma namunasi",
          icon: "📝",
          description: "Har qanday shartnoma namunasi yaratish",
        },
        {
          id: "social_media",
          name: "Ijtimoiy tarmoqlar",
          icon: "📱",
          description: "Instagram bio, post matnlari, reklama",
        },
        {
          id: "business_plan",
          name: "Biznes reja",
          icon: "📊",
          description: "Biznes reja yaratish",
        },
        {
          id: "marketing",
          name: "Marketing",
          icon: "📢",
          description: "Marketing strategiyasi, reklama matnlari",
        },
        {
          id: "legal",
          name: "Huquqiy maslahat",
          icon: "⚖️",
          description: "Huquqiy maslahatlar va hujjatlar",
        },
        {
          id: "finance",
          name: "Moliya",
          icon: "💰",
          description: "Moliya maslahatlari, hisob-kitoblar",
        },
      ],
      ru: [
        {
          id: "contract",
          name: "Образец договора",
          icon: "📝",
          description: "Создание образца любого договора",
        },
        {
          id: "social_media",
          name: "Социальные сети",
          icon: "📱",
          description: "Instagram bio, тексты постов, реклама",
        },
        {
          id: "business_plan",
          name: "Бизнес-план",
          icon: "📊",
          description: "Создание бизнес-плана",
        },
        {
          id: "marketing",
          name: "Маркетинг",
          icon: "📢",
          description: "Маркетинговая стратегия, рекламные тексты",
        },
        {
          id: "legal",
          name: "Юридическая консультация",
          icon: "⚖️",
          description: "Юридические консультации и документы",
        },
        {
          id: "finance",
          name: "Финансы",
          icon: "💰",
          description: "Финансовые консультации, расчеты",
        },
      ],
      en: [
        {
          id: "contract",
          name: "Contract Template",
          icon: "📝",
          description: "Create any contract template",
        },
        {
          id: "social_media",
          name: "Social Media",
          icon: "📱",
          description: "Instagram bio, post texts, advertising",
        },
        {
          id: "business_plan",
          name: "Business Plan",
          icon: "📊",
          description: "Create business plan",
        },
        {
          id: "marketing",
          name: "Marketing",
          icon: "📢",
          description: "Marketing strategy, ad texts",
        },
        {
          id: "legal",
          name: "Legal Advice",
          icon: "⚖️",
          description: "Legal advice and documents",
        },
        {
          id: "finance",
          name: "Finance",
          icon: "💰",
          description: "Financial advice, calculations",
        },
      ],
    };

    return categories[language] || categories.uz;
  }

  /**
   * Generate business content using AI
   */
  async generateContent(category, request, language = "uz") {
    try {
      const systemPrompt = this.getSystemPrompt(category, language);
      const response = await askAI(request, language, {
        context: systemPrompt,
      });

      return response;
    } catch (error) {
      console.error("Error generating business content:", error);
      throw error;
    }
  }

  /**
   * System prompt for business assistant
   */
  getSystemPrompt(category, language) {
    const prompts = {
      contract: {
        uz: "Siz huquqiy mutaxassissiz. Foydalanuvchi so'ragan shartnoma turi uchun to'liq, huquqiy jihatdan to'g'ri shartnoma namunasi yarating. Shartnoma O'zbekiston qonunchiligiga mos bo'lsin.",
        ru: "Вы юридический специалист. Создайте полный, юридически правильный образец договора для запрошенного пользователем типа договора. Договор должен соответствовать законодательству Узбекистана.",
        en: "You are a legal specialist. Create a complete, legally correct contract template for the contract type requested by the user. The contract must comply with the legislation of Uzbekistan.",
      },
      social_media: {
        uz: "Siz marketing mutaxassissiz. Foydalanuvchi so'ragan ijtimoiy tarmoq kontenti uchun professional, jozibali matn yarating. Instagram bio, post yoki reklama matni bo'lishi mumkin.",
        ru: "Вы специалист по маркетингу. Создайте профессиональный, привлекательный текст для запрошенного пользователем контента в социальных сетях. Это может быть Instagram bio, текст поста или реклама.",
        en: "You are a marketing specialist. Create professional, engaging text for the social media content requested by the user. It can be Instagram bio, post text or advertisement.",
      },
      business_plan: {
        uz: "Siz biznes konsultantisiz. Foydalanuvchi so'ragan biznes uchun to'liq, professional biznes reja yarating. Biznes reja strukturasi: kirish, bozor tahlili, marketing strategiyasi, moliyaviy reja.",
        ru: "Вы бизнес-консультант. Создайте полный, профессиональный бизнес-план для запрошенного пользователем бизнеса. Структура бизнес-плана: введение, анализ рынка, маркетинговая стратегия, финансовый план.",
        en: "You are a business consultant. Create a complete, professional business plan for the business requested by the user. Business plan structure: introduction, market analysis, marketing strategy, financial plan.",
      },
      marketing: {
        uz: "Siz marketing mutaxassissiz. Foydalanuvchi so'ragan marketing vazifasi uchun professional yechim bering. Marketing strategiyasi, reklama matnlari, kontent rejalari yaratish.",
        ru: "Вы специалист по маркетингу. Предоставьте профессиональное решение для запрошенной пользователем маркетинговой задачи. Создание маркетинговой стратегии, рекламных текстов, контент-планов.",
        en: "You are a marketing specialist. Provide a professional solution for the marketing task requested by the user. Creating marketing strategies, ad texts, content plans.",
      },
      legal: {
        uz: "Siz huquqiy maslahatchisiz. Foydalanuvchiga O'zbekiston qonunchiligiga mos huquqiy maslahat bering. Hujjatlar, shartnomalar, yuridik maslahatlar.",
        ru: "Вы юридический консультант. Предоставьте пользователю юридическую консультацию, соответствующую законодательству Узбекистана. Документы, договоры, юридические консультации.",
        en: "You are a legal consultant. Provide the user with legal advice that complies with the legislation of Uzbekistan. Documents, contracts, legal advice.",
      },
      finance: {
        uz: "Siz moliyaviy maslahatchisiz. Foydalanuvchiga biznes moliyasi, soliqlar, hisob-kitoblar bo'yicha professional maslahat bering.",
        ru: "Вы финансовый консультант. Предоставьте пользователю профессиональную консультацию по бизнес-финансам, налогам, расчетам.",
        en: "You are a financial consultant. Provide the user with professional advice on business finance, taxes, calculations.",
      },
    };

    const categoryPrompts = prompts[category] || prompts.contract;
    return categoryPrompts[language] || categoryPrompts.uz;
  }
}

module.exports = new BusinessAssistantService();

