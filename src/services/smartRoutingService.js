// AI Smart Routing Service
// TODO: Integrate with AI API for real routing
// For demo: returns mock recommendations

class SmartRoutingService {
  async analyzeProblem(problemText, language = 'uz') {
    // Simulate AI analysis
    // In production, this would call AI API:
    // const response = await fetch('AI_API_ENDPOINT', {
    //   method: 'POST',
    //   body: JSON.stringify({ problem: problemText, language })
    // });
    
    // Demo response based on keywords
    const lowerProblem = problemText.toLowerCase();
    
    let recommendation = {
      organization: '',
      department: '',
      requiredDocuments: [],
      bestDay: '',
      branch: '',
      description: ''
    };

    // Simple keyword matching for demo
    if (lowerProblem.includes('pasport') || lowerProblem.includes('паспорт') || lowerProblem.includes('passport')) {
      recommendation = {
        organization: 'Bosh migratsiya xizmati',
        department: 'Pasport bo\'limi',
        requiredDocuments: [
          'Fotosurat (3x4)',
          'Tug\'ilganlik haqida guvohnoma',
          'Ariza'
        ],
        bestDay: 'Dushanba-Chorshanba (8:00-12:00)',
        branch: 'Shahar markazi filiali',
        description: 'Pasport olish/aylantirish'
      };
    } else if (lowerProblem.includes('bank') || lowerProblem.includes('банк')) {
      recommendation = {
        organization: 'Davlat banklari',
        department: 'Xizmat ko\'rsatish bo\'limi',
        requiredDocuments: [
          'Pasport yoki ID karta',
          'Ariza',
          'Daromad ma\'lumotnomasi'
        ],
        bestDay: 'Juma (10:00-14:00)',
        branch: 'Eng yaqin bank filiali',
        description: 'Bank xizmatlari'
      };
    } else if (lowerProblem.includes('klinika') || lowerProblem.includes('клиника') || lowerProblem.includes('shifokor') || lowerProblem.includes('врач')) {
      recommendation = {
        organization: 'Sog\'liqni saqlash vazirligi',
        department: 'Poliklinika',
        requiredDocuments: [
          'Pasport',
          'Davolanish tarixi'
        ],
        bestDay: 'Har qanday kuni',
        branch: 'Sizga eng yaqin poliklinika',
        description: 'Tibbiy xizmatlar'
      };
    } else {
      // Default recommendation
      recommendation = {
        organization: 'Davlat xizmatlari markazi',
        department: 'Maslahat bo\'limi',
        requiredDocuments: [
          'Pasport',
          'Muammo haqida batafsil ma\'lumot'
        ],
        bestDay: 'Ish kunlari',
        branch: 'Markaziy filial',
        description: 'Umumiy maslahat'
      };
    }

    return recommendation;
  }
}

module.exports = new SmartRoutingService();

