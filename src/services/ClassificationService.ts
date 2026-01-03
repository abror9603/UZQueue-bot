/**
 * Classification Service
 * Uses OpenAI API to classify citizen requests
 */

import OpenAI from 'openai';
import { getEnv } from '../config/env';
import { ClassificationResult, RequestPriority } from '../types';
import { CATEGORIES, AI_CONFIG } from '../config/constants';
import { log } from '../utils/logger';
import { SystemLog } from '../models';
import { Request } from '../models';
import mongoose from 'mongoose';

// Initialize OpenAI client
const env = getEnv();
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
});

/**
 * Classification prompt template
 */
const CLASSIFICATION_PROMPT = `You are an expert in Uzbekistan's government structure and citizen services.

Analyze this citizen request and classify it accurately.

REQUEST TEXT:
{request_text}

AVAILABLE CATEGORIES:
1. TAX - Soliq masalalari (soliq to'lovlari, qarzdorlik, deklaratsiya, soliq yengilligi)
2. UTILITIES - Kommunal xizmatlar (suv, elektr, gaz, issiqlik, kommunal xizmatlar)
3. CONSTRUCTION - Qurilish va ruxsatlar (bino qurish, ruxsatnoma, rekonstruksiya, qurilish litsenziyasi)
4. EDUCATION - Ta'lim (maktab, universitet, bog'cha, ta'lim olish)
5. HEALTHCARE - Sog'liqni saqlash (shifoxona, poliklinika, dori, tibbiy yordam)
6. BUSINESS - Tadbirkorlik (litsenziya, ro'yxat, biznes yuritish, tadbirkorlik)
7. SOCIAL - Ijtimoiy yordam (nafaqa, imtiyoz, yordam, ijtimoiy himoya)
8. INFRASTRUCTURE - Infratuzilma (yo'l, transport, park, kommunal infratuzilma)
9. OTHER - Boshqa masalalar

Respond with valid JSON object only (no markdown, no code blocks):

{
  "category": "CATEGORY_NAME",
  "confidence": 85,
  "keywords": ["keyword1", "keyword2"],
  "reasoning": "Brief explanation in English",
  "urgency": "low|medium|high|urgent",
  "suggestedOrganization": "Organization name if clear"
}

IMPORTANT:
- category must be one of: TAX, UTILITIES, CONSTRUCTION, EDUCATION, HEALTHCARE, BUSINESS, SOCIAL, INFRASTRUCTURE, OTHER
- confidence must be 0-100 (integer)
- If confidence < 70%, choose "OTHER" and explain why
- Extract 3-5 relevant keywords in original language (Uzbek or Russian)
- Consider Uzbek and Russian language nuances
- Determine urgency based on request content (low, medium, high, urgent)
- Suggest organization only if it's very clear from the request

Examples:
- "Soliq qarzdorligimni qanday tekshiraman?" → {"category": "TAX", "confidence": 95, "keywords": ["soliq", "qarzdorlik", "tekshirish"], "urgency": "medium"}
- "Uyimizga suv kelmayapti" → {"category": "UTILITIES", "confidence": 90, "keywords": ["suv", "uy", "kommunal"], "urgency": "high"}
- "Yordam kerak" → {"category": "OTHER", "confidence": 50, "keywords": ["yordam"], "urgency": "medium"}
`;

/**
 * Classify request using Claude API
 */
export async function classifyRequest(
  requestId: mongoose.Types.ObjectId,
  text: string,
  language: 'uz' | 'ru' | 'en' = 'uz'
): Promise<ClassificationResult> {
  try {
    log.aiEvent('classification_started', { requestId, language });

    // Update request status to analyzing
    await Request.findByIdAndUpdate(requestId, {
      status: 'analyzing'
    });

    // Prepare prompt
    const prompt = CLASSIFICATION_PROMPT.replace('{request_text}', text);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4o' for better accuracy
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Uzbekistan\'s government structure and citizen services. Analyze requests and classify them accurately. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    // Extract response
    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    let classification: ClassificationResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      classification = {
        category: mapCategoryName(parsed.category),
        confidence: parsed.confidence || 0,
        keywords: parsed.keywords || [],
        reasoning: parsed.reasoning || '',
        urgency: parsed.urgency || 'medium',
        suggestedOrganization: parsed.suggestedOrganization,
        needsHumanReview: parsed.confidence < AI_CONFIG.MIN_CONFIDENCE_FOR_ADMIN_REVIEW
      };
    } catch (parseError) {
      log.error('Error parsing OpenAI response', parseError, { responseText });
      
      // Fallback classification
      classification = {
        category: 'OTHER',
        confidence: 0,
        keywords: extractKeywordsFallback(text),
        reasoning: 'Failed to parse AI response',
        urgency: 'medium',
        needsHumanReview: true
      };
    }

    // Validate confidence
    if (classification.confidence < 0 || classification.confidence > 100) {
      classification.confidence = 0;
      classification.needsHumanReview = true;
    }

    // Update request with classification
    await Request.findByIdAndUpdate(requestId, {
      category: classification.category,
      aiConfidence: classification.confidence,
      keywords: classification.keywords,
      priority: classification.urgency as RequestPriority,
      status: classification.needsHumanReview ? 'pending' : 'analyzing'
    });

    // Log event
    await SystemLog.logEvent('ai_classification', 'request_classified', {
      requestId,
      category: classification.category,
      confidence: classification.confidence,
      keywords: classification.keywords,
      needsHumanReview: classification.needsHumanReview
    }, {
      requestId,
      result: classification.confidence >= AI_CONFIG.MIN_CONFIDENCE_FOR_ADMIN_REVIEW ? 'success' : 'failure'
    });

    log.aiEvent('classification_completed', {
      requestId,
      category: classification.category,
      confidence: classification.confidence
    });

    return classification;
  } catch (error) {
    log.error('Error classifying request', error, { requestId });

    // Log error
    await SystemLog.logEvent('error', 'ai_classification_failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      requestId,
      result: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    // Fallback classification
    const fallback: ClassificationResult = {
      category: 'OTHER',
      confidence: 0,
      keywords: extractKeywordsFallback(text),
      reasoning: 'AI classification failed, needs human review',
      urgency: 'medium',
      needsHumanReview: true
    };

    // Update request
    await Request.findByIdAndUpdate(requestId, {
      category: fallback.category,
      aiConfidence: fallback.confidence,
      keywords: fallback.keywords,
      status: 'pending'
    });

    return fallback;
  }
}

/**
 * Map category name to constant
 */
function mapCategoryName(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim();

  if (normalized.includes('soliq') || normalized.includes('tax')) {
    return 'TAX';
  }
  if (normalized.includes('kommunal') || normalized.includes('utilit')) {
    return 'UTILITIES';
  }
  if (normalized.includes('qurilish') || normalized.includes('construction')) {
    return 'CONSTRUCTION';
  }
  if (normalized.includes('ta\'lim') || normalized.includes('education')) {
    return 'EDUCATION';
  }
  if (normalized.includes('sog\'liq') || normalized.includes('health')) {
    return 'HEALTHCARE';
  }
  if (normalized.includes('tadbirkor') || normalized.includes('business')) {
    return 'BUSINESS';
  }
  if (normalized.includes('ijtimoiy') || normalized.includes('social')) {
    return 'SOCIAL';
  }
  if (normalized.includes('infratuzilma') || normalized.includes('infrastructure')) {
    return 'INFRASTRUCTURE';
  }

  return 'OTHER';
}

/**
 * Extract keywords fallback (simple keyword extraction)
 */
function extractKeywordsFallback(text: string): string[] {
  const commonWords = ['va', 'uchun', 'bilan', 'dan', 'ga', 'ni', 'da', 'de', 'и', 'в', 'на', 'для', 'the', 'a', 'an', 'and', 'or', 'but'];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word));

  // Return top 5 unique words
  return [...new Set(words)].slice(0, 5);
}

/**
 * Validate classification result
 */
export function validateClassification(result: ClassificationResult): boolean {
  if (!result.category || !result.keywords || result.keywords.length === 0) {
    return false;
  }

  if (result.confidence < 0 || result.confidence > 100) {
    return false;
  }

  if (!['low', 'medium', 'high', 'urgent'].includes(result.urgency)) {
    return false;
  }

  return true;
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string, language: 'uz' | 'ru' | 'en' = 'uz'): string {
  const names: Record<string, Record<string, string>> = {
    TAX: {
      uz: 'Soliq masalalari',
      ru: 'Налоговые вопросы',
      en: 'Tax Issues'
    },
    UTILITIES: {
      uz: 'Kommunal xizmatlar',
      ru: 'Коммунальные услуги',
      en: 'Utilities'
    },
    CONSTRUCTION: {
      uz: 'Qurilish va ruxsatlar',
      ru: 'Строительство и разрешения',
      en: 'Construction'
    },
    EDUCATION: {
      uz: "Ta'lim",
      ru: 'Образование',
      en: 'Education'
    },
    HEALTHCARE: {
      uz: "Sog'liqni saqlash",
      ru: 'Здравоохранение',
      en: 'Healthcare'
    },
    BUSINESS: {
      uz: 'Tadbirkorlik',
      ru: 'Предпринимательство',
      en: 'Business'
    },
    SOCIAL: {
      uz: 'Ijtimoiy yordam',
      ru: 'Социальная помощь',
      en: 'Social Assistance'
    },
    INFRASTRUCTURE: {
      uz: 'Infratuzilma',
      ru: 'Инфраструктура',
      en: 'Infrastructure'
    },
    OTHER: {
      uz: 'Boshqa',
      ru: 'Другое',
      en: 'Other'
    }
  };

  return names[category]?.[language] || names[category]?.uz || category;
}

