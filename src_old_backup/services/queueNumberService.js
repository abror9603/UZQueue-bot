// Queue Number Service
// Generates simple virtual queue numbers (Stage 1 MVP)

class QueueNumberService {
  /**
   * Generate simple queue number
   */
  generateQueueNumber(serviceType = "general") {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const prefix = this.getServicePrefix(serviceType);

    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get service prefix
   */
  getServicePrefix(serviceType) {
    const prefixes = {
      general: "UZQ",
      passport: "PAS",
      healthcare: "MED",
      education: "EDU",
      business: "BIZ",
      document: "DOC",
    };

    return prefixes[serviceType] || prefixes.general;
  }

  /**
   * Format queue number for display
   */
  formatQueueNumber(queueNumber, language = "uz") {
    const messages = {
      uz: `🎫 Sizning tartib raqamingiz:\n\n${queueNumber}\n\n📅 Vaqt: ${new Date().toLocaleString("uz-UZ")}\n\nℹ️ Bu virtual tartib raqamidir. Haqiqiy navbat tizimi Stage 2 da qo'shiladi.`,
      ru: `🎫 Ваш номер очереди:\n\n${queueNumber}\n\n📅 Время: ${new Date().toLocaleString("ru-RU")}\n\nℹ️ Это виртуальный номер очереди. Реальная система очередей будет добавлена на Stage 2.`,
      en: `🎫 Your queue number:\n\n${queueNumber}\n\n📅 Time: ${new Date().toLocaleString("en-US")}\n\nℹ️ This is a virtual queue number. Real queue system will be added in Stage 2.`,
    };

    return messages[language] || messages.uz;
  }

  /**
   * Log queue number (for Stage 1, simple logging)
   */
  logQueueNumber(queueNumber, userId, serviceType) {
    const logEntry = {
      queueNumber,
      userId,
      serviceType,
      timestamp: new Date().toISOString(),
      stage: "Stage 1 - Virtual Queue",
    };

    // Simple console log for Stage 1
    // In Stage 2, this will be stored in database
    console.log("Queue Number Generated:", JSON.stringify(logEntry, null, 2));

    return logEntry;
  }
}

module.exports = new QueueNumberService();

