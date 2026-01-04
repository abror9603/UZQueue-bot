/**
 * Environment variables validation and configuration
 * Ensures all required environment variables are present
 */

import { z } from 'zod';
import { log } from '../utils/logger';

// Environment schema
const envSchema = z.object({
  // Required
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  MONGO_URI: z.string().url('MONGO_URI must be a valid URL'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Optional
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  SUPER_ADMIN_IDS: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(), // Legacy support
  
  // Support settings (optional)
  SUPPORT_CHAT_ID: z.string().optional(),
  SUPPORT_TELEGRAM: z.string().optional(),
  SUPPORT_PHONE: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional()
});

type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

/**
 * Validate and load environment variables
 */
export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    log.info('✅ Environment variables validated');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      log.error('❌ Environment validation failed', {
        errors: missingVars
      });
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }
    throw error;
  }
}

/**
 * Get validated environment config
 */
export function getEnv(): EnvConfig {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

/**
 * Get super admin IDs as array
 */
export function getSuperAdminIds(): number[] {
  const env = getEnv();
  if (!env.SUPER_ADMIN_IDS) {
    return [];
  }
  
  return env.SUPER_ADMIN_IDS
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

/**
 * Get support chat ID
 */
export function getSupportChatId(): number | null {
  const env = getEnv();
  if (!env.SUPPORT_CHAT_ID) {
    return null;
  }
  
  const chatId = parseInt(env.SUPPORT_CHAT_ID.trim(), 10);
  return isNaN(chatId) ? null : chatId;
}

/**
 * Get support contact info
 */
export function getSupportContacts(): {
  telegram: string;
  phone: string;
  email: string;
} {
  const env = getEnv();
  return {
    telegram: env.SUPPORT_TELEGRAM || '@UZQueue_Support',
    phone: env.SUPPORT_PHONE || '+998 71 123-45-67',
    email: env.SUPPORT_EMAIL || 'support@uzqueue.uz'
  };
}

// Validate on import
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnv();
  } catch (error) {
    log.error('Failed to validate environment', error);
    process.exit(1);
  }
}

