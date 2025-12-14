// AI Document Assistant Service
// Uses OpenAI GPT to generate professional documents

const { askAI } = require('./ai/aiHelper');

class DocumentService {
  async prepareDocument(situation, documentType, language = 'uz') {
    try {
      const prompt = this.getDocumentPrompt(situation, documentType, language);
      const document = await askAI(prompt, language);
      
      // If AI returns incomplete document, use template as fallback
      if (!document || document.length < 100) {
        console.warn('AI returned incomplete document, using template');
        return this.getTemplateDocument(documentType, language, situation);
      }

      return document;
    } catch (error) {
      console.error('Error generating document with AI, using template:', error);
      // Fallback to template
      return this.getTemplateDocument(documentType, language, situation);
    }
  }

  getDocumentPrompt(situation, documentType, language) {
    const documentTypes = {
      application: {
        uz: 'ariza',
        ru: 'заявление',
        en: 'application'
      },
      request: {
        uz: 'so\'rov',
        ru: 'запрос',
        en: 'request'
      },
      complaint: {
        uz: 'shikoyat',
        ru: 'жалоба',
        en: 'complaint'
      }
    };

    const docTypeName = documentTypes[documentType]?.[language] || documentTypes.application[language];

    const prompts = {
      uz: `O'zbekiston Respublikasidagi davlat idoralari uchun rasmiy ${docTypeName} tayyorlang.

Vaziyat: ${situation}

Quyidagi formatda ${docTypeName} tayyorlang:
1. Sarlavha (O'ZBEKISTON RESPUBLIKASI)
2. Qabul qiluvchi idora
3. Muallifning to'liq ismi
4. Asosiy matn (vaziyatga mos)
5. Sana va imzo joyi

Rasmiy, qisqa, aniq va O'zbekiston qonun-qoidalariga mos bo'lsin.`,
      ru: `Подготовьте официальное ${docTypeName} для государственных организаций Республики Узбекистан.

Ситуация: ${situation}

Подготовьте ${docTypeName} в следующем формате:
1. Заголовок (РЕСПУБЛИКА УЗБЕКИСТАН)
2. Получающая организация
3. Полное имя автора
4. Основной текст (соответствующий ситуации)
5. Дата и место для подписи

Документ должен быть официальным, кратким, точным и соответствовать законодательству Узбекистана.`,
      en: `Prepare an official ${docTypeName} for government organizations of the Republic of Uzbekistan.

Situation: ${situation}

Prepare ${docTypeName} in the following format:
1. Header (REPUBLIC OF UZBEKISTAN)
2. Receiving organization
3. Full name of author
4. Main text (appropriate to the situation)
5. Date and signature space

The document should be official, brief, precise, and comply with Uzbekistan's legislation.`
    };

    return prompts[language] || prompts.uz;
  }

  getTemplateDocument(documentType, language, situation) {
    const templates = {
      application: this.getApplicationTemplate(language, situation),
      request: this.getRequestTemplate(language, situation),
      complaint: this.getComplaintTemplate(language, situation)
    };

    return templates[documentType] || templates.application;
  }

  getApplicationTemplate(language, situation = '') {
    const templates = {
      uz: `O'ZBEKISTON RESPUBLIKASI
___________________________

                     ARIZA

Hurmatli ___________________!

Men ___________________ (F.I.O.) sizga murojaat qilmoqchiman.
Muammo: ${situation || '[Bu yerga muammo yoziladi]'}

Iltimos, muammoni hal qilishga yordam bering.

Sana: ${new Date().toLocaleDateString('uz-UZ')}
Imzo: ___________

___________________`,
      ru: `РЕСПУБЛИКА УЗБЕКИСТАН
___________________________

                     ЗАЯВЛЕНИЕ

Уважаемый ___________________!

Я, ___________________ (Ф.И.О.), обращаюсь к Вам с просьбой.
Проблема: ${situation || '[Здесь описание проблемы]'}

Пожалуйста, помогите решить проблему.

Дата: ${new Date().toLocaleDateString('ru-RU')}
Подпись: ___________

___________________`,
      en: `REPUBLIC OF UZBEKISTAN
___________________________

                     APPLICATION

Dear ___________________!

I, ___________________ (Full Name), am writing to you.
Problem: ${situation || '[Description of the problem here]'}

Please help resolve this issue.

Date: ${new Date().toLocaleDateString('en-US')}
Signature: ___________

___________________`
    };

    return templates[language] || templates.uz;
  }

  getRequestTemplate(language, situation = '') {
    return this.getApplicationTemplate(language, situation);
  }

  getComplaintTemplate(language, situation = '') {
    const templates = {
      uz: `SHIKOYAT

Hurmatli ___________________!

Men ___________________ (F.I.O.) sizga shikoyat bildirmoqchiman.
Muammo: ${situation || '[Bu yerga muammo yoziladi]'}

Iltimos, shikoyatni ko'rib chiqing.

Sana: ${new Date().toLocaleDateString('uz-UZ')}
Imzo: ___________`,
      ru: `ЖАЛОБА

Уважаемый ___________________!

Я, ___________________ (Ф.И.О.), хочу подать жалобу.
Проблема: ${situation || '[Здесь описание проблемы]'}

Пожалуйста, рассмотрите жалобу.

Дата: ${new Date().toLocaleDateString('ru-RU')}
Подпись: ___________`,
      en: `COMPLAINT

Dear ___________________!

I, ___________________ (Full Name), wish to file a complaint.
Problem: ${situation || '[Description of the problem here]'}

Please review this complaint.

Date: ${new Date().toLocaleDateString('en-US')}
Signature: ___________`
    };

    return templates[language] || templates.uz;
  }

  getRequiredDocuments(serviceType, language = 'uz') {
    // Use AI to get required documents, with fallback to static list
    const documents = {
      passport: ['Fotosurat 3x4', 'Tug\'ilganlik haqida guvohnoma', 'Ariza'],
      bank: ['Pasport', 'Ariza', 'Daromad ma\'lumotnomasi'],
      medical: ['Pasport', 'Davolanish tarixi']
    };

    return documents[serviceType] || documents.passport;
  }
}

module.exports = new DocumentService();
