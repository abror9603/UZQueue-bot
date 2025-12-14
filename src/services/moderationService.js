const aiService = require('./aiService');
const { AiLog } = require('../models');
const userService = require('./userService');

/**
 * AI Moderation Service
 * Checks appeals for inappropriate content, spam, and violations
 */
class ModerationService {
  /**
   * Moderate appeal text using AI
   * @param {String} appealText - Appeal text to moderate
   * @param {Number} userId - User ID
   * @param {Number} appealId - Appeal ID (if exists)
   * @returns {Object} { approved: boolean, reason: string, score: number }
   */
  async moderateAppeal(appealText, userId, appealId = null) {
    try {
      const moderationPrompt = `Quyidagi murojaat matnini tekshiring va quyidagi mezonlarga ko'ra baholang:

1. Ma'nosi bor yoki ma'nosiz (spam, random text)
2. Behayo so'zlar yoki haqorat
3. Tahdid yoki provokatsiya
4. Siyosiy ekstremizm
5. Takroriy (copy-paste) murojaat

Murojaat matni:
"${appealText}"

Javobni JSON formatida qaytaring:
{
  "approved": true/false,
  "reason": "sabab",
  "score": 0-100 (100 = toza, 0 = yaroqsiz),
  "violations": ["violation1", "violation2"],
  "suggestion": "taklif (agar approved=false bo'lsa)"
}`;

      const response = await aiService.generateResponse(moderationPrompt, 'gpt-4o-mini');
      
      // Parse AI response
      let moderationResult;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          moderationResult = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: parse as text
          moderationResult = this._parseModerationResponse(response);
        }
      } catch (parseError) {
        console.error('Error parsing moderation response:', parseError);
        moderationResult = this._parseModerationResponse(response);
      }

      // Log moderation result
      await AiLog.create({
        appealId: appealId,
        userId: userId,
        prompt: moderationPrompt,
        response: JSON.stringify(moderationResult),
        model: 'gpt-4o-mini',
        tokensUsed: null
      });

      return {
        approved: moderationResult.approved !== false,
        reason: moderationResult.reason || 'Tekshiruvdan o\'tdi',
        score: moderationResult.score || 100,
        violations: moderationResult.violations || [],
        suggestion: moderationResult.suggestion || null
      };
    } catch (error) {
      console.error('Moderation error:', error);
      // On error, allow the appeal but log it
      return {
        approved: true,
        reason: 'Tekshiruv xatosi',
        score: 50,
        violations: [],
        suggestion: null
      };
    }
  }

  /**
   * Check if appeal text is spam (repeated content)
   * @param {String} appealText - Appeal text
   * @param {Number} userId - User ID
   * @returns {Object} { isSpam: boolean, reason: string }
   */
  async checkSpam(appealText, userId) {
    try {
      // Get user's recent appeals
      const { Appeal } = require('../models');
      const recentAppeals = await Appeal.findAll({
        where: {
          userId: userId,
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        limit: 10,
        order: [['createdAt', 'DESC']]
      });

      // Check for exact duplicates
      const normalizedText = appealText.trim().toLowerCase();
      for (const appeal of recentAppeals) {
        const normalizedAppeal = appeal.appealText.trim().toLowerCase();
        if (normalizedAppeal === normalizedText) {
          return {
            isSpam: true,
            reason: 'Bir xil murojaat qayta yuborilgan'
          };
        }

        // Check for high similarity (80%+)
        const similarity = this._calculateSimilarity(normalizedText, normalizedAppeal);
        if (similarity > 0.8) {
          return {
            isSpam: true,
            reason: 'O\'xshash murojaat yaqinda yuborilgan'
          };
        }
      }

      return { isSpam: false, reason: null };
    } catch (error) {
      console.error('Spam check error:', error);
      return { isSpam: false, reason: null };
    }
  }

  /**
   * Format appeal text to official style using AI
   * @param {String} informalText - Informal appeal text
   * @param {String} language - Language (uz/ru/en)
   * @returns {String} Formatted official text
   */
  async formatToOfficial(informalText, language = 'uz') {
    try {
      const languageNames = {
        uz: 'o\'zbek',
        ru: 'rus',
        en: 'english'
      };

      const prompt = `Quyidagi murojaat matnini rasmiy, davlat idorasiga mos formatda qayta yozing. 
Matn tushunarli, aniq va rasmiy uslubda bo'lishi kerak. 
Til: ${languageNames[language] || 'o\'zbek'}

Fuqaro matni:
"${informalText}"

Faqat rasmiy matnni qaytaring, boshqa izoh qo'shmang.`;

      const response = await aiService.generateResponse(prompt, 'gpt-4o-mini');
      return response.trim();
    } catch (error) {
      console.error('Format to official error:', error);
      return informalText; // Return original on error
    }
  }

  /**
   * Parse moderation response from AI
   */
  _parseModerationResponse(response) {
    const lowerResponse = response.toLowerCase();
    
    // Check for negative indicators
    const hasViolations = 
      lowerResponse.includes('yaroqsiz') ||
      lowerResponse.includes('spam') ||
      lowerResponse.includes('haqorat') ||
      lowerResponse.includes('behayo') ||
      lowerResponse.includes('tahdid') ||
      lowerResponse.includes('provokatsiya');

    return {
      approved: !hasViolations,
      reason: hasViolations ? 'Murojaat qoidalarga mos emas' : 'Tekshiruvdan o\'tdi',
      score: hasViolations ? 30 : 90,
      violations: hasViolations ? ['Qoidalarga mos emas'] : [],
      suggestion: hasViolations ? 'Iltimos, rasmiy va mazmunli murojaat yozing.' : null
    };
  }

  /**
   * Calculate similarity between two strings (simple Jaccard similarity)
   */
  _calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

module.exports = new ModerationService();

