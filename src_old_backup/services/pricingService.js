// Pricing Service
// Manages pricing for different features and stages

class PricingService {
  /**
   * Stage 1 Pricing (MVP - Free with paid features)
   */
  getStage1Pricing() {
    return {
      // Free features
      free: {
        aiAdvice: { text: true, limit: 10 }, // 10 free per day
        documentText: { text: true, limit: 5 }, // 5 free per day
        voiceToText: { limit: 10 }, // 10 free per day
        faq: { unlimited: true },
        simpleQueue: { unlimited: true },
        servicesCatalog: { unlimited: true },
      },
      // Paid features
      paid: {
        documentPdf: {
          price: 2000, // so'm
          description: "PDF + rasim + QR bilan rasmiylashtirish",
          currency: "UZS",
        },
        aiAdviceFull: {
          price: 3000, // so'm
          description: "To'liq yo'l xaritasi + kerakli hujjatlar ro'yxati",
          currency: "UZS",
        },
        documentCheck: {
          price: 2000, // so'm
          description: "Hujjat xatolarini topish",
          currency: "UZS",
        },
        voicePremium: {
          price: 5000, // so'm
          description: "100 so'z uchun",
          currency: "UZS",
        },
        contractGeneration: {
          price: 3000, // so'm
          description: "1 ta shartnoma PDF",
          currency: "UZS",
        },
        ishonchnoma: {
          price: 2000, // so'm
          description: "1 ta ishonchnoma",
          currency: "UZS",
        },
      },
    };
  }

  /**
   * Stage 2 Pricing (Subscription + B2B)
   */
  getStage2Pricing() {
    return {
      subscription: {
        basic: {
          price: 0, // Free tier
          features: ["basic_ai", "basic_documents", "faq"],
          limit: "limited",
        },
        premium: {
          price: 10000, // so'm/month
          features: [
            "unlimited_ai",
            "unlimited_documents",
            "pdf_generation",
            "document_check",
            "voice_assistant",
          ],
          limit: "unlimited",
        },
        business: {
          price: 20000, // so'm/month
          features: [
            "all_premium",
            "crm_mini",
            "contract_generation",
            "priority_support",
          ],
          limit: "unlimited",
        },
      },
      b2b: {
        crmMini: {
          price: 25000, // so'm/month
          description: "Mini CRM - Mijozlar ro'yxati, murojaatlar, eslatmalar",
        },
        contractGeneration: {
          price: 5000, // so'm per contract
          description: "Shartnoma generatsiyasi",
        },
        advertising: {
          price: 2000, // so'm per click
          description: "Xususiy bizneslarga yo'naltirish (reklama)",
        },
      },
    };
  }

  /**
   * Stage 3 Pricing (Enterprise)
   */
  getStage3Pricing() {
    return {
      enterprise: {
        realQueueSystem: {
          price: "custom", // Kontrakt asosida
          description: "Real navbat tizimi",
        },
        businessIntegration: {
          price: "custom",
          description: "Biznes + davlat integratsiyasi",
        },
        mobileApp: {
          price: "custom",
          description: "Mobil ilova integratsiyasi",
        },
        extendedAI: {
          price: "custom",
          description: "Kengaytirilgan AI xizmatlari",
        },
      },
    };
  }

  /**
   * Get feature price
   */
  getFeaturePrice(featureName, stage = 1) {
    const pricing = this.getStage1Pricing();

    if (stage === 1) {
      return pricing.paid[featureName] || null;
    } else if (stage === 2) {
      const stage2Pricing = this.getStage2Pricing();
      return (
        stage2Pricing.b2b[featureName] || stage2Pricing.subscription[featureName] || null
      );
    }

    return null;
  }

  /**
   * Check if feature is free
   */
  isFeatureFree(featureName, stage = 1) {
    if (stage === 1) {
      const pricing = this.getStage1Pricing();
      return pricing.free[featureName] !== undefined;
    }
    return false;
  }

  /**
   * Format price for display
   */
  formatPrice(price, currency = "UZS") {
    if (price === "custom") {
      return "Kontrakt asosida";
    }
    return `${price.toLocaleString("uz-UZ")} ${currency}`;
  }

  /**
   * Get pricing info for feature
   */
  getPricingInfo(featureName, stage = 1) {
    const isFree = this.isFeatureFree(featureName, stage);
    const price = this.getFeaturePrice(featureName, stage);

    return {
      isFree,
      price: price ? this.formatPrice(price.price, price.currency) : null,
      description: price?.description || null,
    };
  }
}

module.exports = new PricingService();

