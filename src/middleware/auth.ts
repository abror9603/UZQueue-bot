/**
 * Authentication Middleware
 * Verifies user permissions and roles
 */

import { Context } from 'telegraf';
import { ExtendedContext } from '../types/context';
import { User } from '../models';
import { getSuperAdminIds } from '../config/env';
import { log } from '../utils/logger';

/**
 * Middleware to load user from database
 * 
 * CRITICAL: This middleware MUST be defensive because:
 * 1. Telegraf context may not have `from` for all update types (channel posts, etc.)
 * 2. Context might be partially initialized during certain operations
 * 3. Some updates don't have user information (e.g., channel_post updates)
 */
export function loadUserMiddleware() {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    // Defensive check: Ensure context exists
    if (!ctx) {
      log.warn('loadUserMiddleware: Context is undefined');
      return next();
    }

    // Defensive check: Ensure update exists
    if (!ctx.update) {
      log.warn('loadUserMiddleware: Update is undefined');
      return next();
    }

    // Defensive check: Only process updates that have user information
    // Some update types (like channel_post, edited_channel_post) don't have ctx.from
    if (!ctx.from) {
      // This is normal for certain update types - just continue
      ctx.language = 'uz'; // Set default language
      return next();
    }

    // Defensive check: Ensure from.id exists
    if (!ctx.from.id) {
      log.warn('loadUserMiddleware: ctx.from.id is undefined', {
        updateType: ctx.updateType,
        from: ctx.from
      });
      ctx.language = 'uz';
      return next();
    }

    try {
      const user = await User.findByTelegramId(ctx.from.id);
      
      if (user) {
        ctx.user = user.toObject() as any;
        ctx.language = user.language;
      } else {
        // User doesn't exist yet - will be created during onboarding
        ctx.language = 'uz'; // Default
      }

      return next();
    } catch (error) {
      log.error('Error loading user', error, {
        userId: ctx.from?.id,
        updateType: ctx.updateType
      });
      // Continue even if user load fails - don't break the request flow
      ctx.language = 'uz'; // Set default on error
      return next();
    }
  };
}

/**
 * Middleware to require user to be registered
 * 
 * CRITICAL: This middleware MUST validate context before using ctx.reply
 * Only use this in bot.use() chains, NEVER manually invoke inside handlers
 */
export function requireUser() {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    // Defensive check: Ensure context is valid Telegraf context
    if (!ctx || typeof ctx.reply !== 'function') {
      log.warn('requireUser: Invalid context - ctx.reply is not a function');
      return next();
    }

    if (!ctx.user) {
      const language = ctx.language || 'uz';
      const messages = {
        uz: '❌ Avval ro\'yxatdan o\'ting. /start buyrug\'ini yuboring.',
        ru: '❌ Сначала зарегистрируйтесь. Отправьте команду /start.',
        en: '❌ Please register first. Send /start command.'
      };

      // Defensive: Check if reply is available
      if (ctx.chat && ctx.from) {
        await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
          .catch((error) => {
            log.error('requireUser: Failed to send reply', error);
          });
      }
      return;
    }

    return next();
  };
}

/**
 * Helper function to check if user exists (for use in handlers)
 * This is NOT middleware - use this in handlers instead of calling requireUser()
 */
export function checkUserExists(ctx: ExtendedContext): boolean {
  return !!ctx.user;
}

/**
 * Helper function to send "user not registered" message (for use in handlers)
 */
export async function sendUserNotRegisteredMessage(ctx: ExtendedContext): Promise<void> {
  if (!ctx || typeof ctx.reply !== 'function' || !ctx.chat || !ctx.from) {
    log.warn('sendUserNotRegisteredMessage: Invalid context');
    return;
  }

  const language = ctx.language || 'uz';
  const messages = {
    uz: '❌ Avval ro\'yxatdan o\'ting. /start buyrug\'ini yuboring.',
    ru: '❌ Сначала зарегистрируйтесь. Отправьте команду /start.',
    en: '❌ Please register first. Send /start command.'
  };

  await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
    .catch((error) => {
      log.error('sendUserNotRegisteredMessage: Failed to send', error);
    });
}

/**
 * Middleware to require admin role
 * 
 * CRITICAL: Only use in bot.use() chains, NEVER manually invoke
 */
export function requireAdmin() {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    // Defensive check: Ensure context is valid
    if (!ctx || typeof ctx.reply !== 'function') {
      log.warn('requireAdmin: Invalid context');
      return next();
    }

    if (!ctx.user) {
      // Use requireUser middleware properly
      const requireUserMiddleware = requireUser();
      return requireUserMiddleware(ctx, next);
    }

    // Defensive check: Ensure from exists
    if (!ctx.from || !ctx.from.id) {
      log.warn('requireAdmin: ctx.from.id is undefined');
      return next();
    }

    const isSuperAdmin = getSuperAdminIds().includes(ctx.from.id);
    const isOrgAdmin = ctx.user.role === 'org_admin' || ctx.user.role === 'super_admin';

    if (!isSuperAdmin && !isOrgAdmin) {
      const language = ctx.language || 'uz';
      const messages = {
        uz: '❌ Sizda admin huquqi yo\'q.',
        ru: '❌ У вас нет прав администратора.',
        en: '❌ You do not have admin permissions.'
      };

      // Defensive: Check if reply is available
      if (ctx.chat && ctx.from) {
        await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
          .catch((error) => {
            log.error('requireAdmin: Failed to send reply', error);
          });
      }
      return;
    }

    return next();
  };
}

/**
 * Helper function to check if user is admin (for use in handlers)
 */
export function checkIsAdmin(ctx: ExtendedContext): boolean {
  if (!ctx.user || !ctx.from) {
    return false;
  }

  const isSuperAdmin = getSuperAdminIds().includes(ctx.from.id);
  const isOrgAdmin = ctx.user.role === 'org_admin' || ctx.user.role === 'super_admin';
  
  return isSuperAdmin || isOrgAdmin;
}

/**
 * Middleware to require super admin role
 * 
 * CRITICAL: Only use in bot.use() chains, NEVER manually invoke
 * 
 * WRONG: requireSuperAdmin()(handler) ❌
 * RIGHT: bot.command('cmd', requireSuperAdmin(), handler) ✅
 * OR: bot.command('cmd', handler) where handler checks ctx.user ✅
 */
export function requireSuperAdmin() {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    // Defensive check: Ensure context is valid
    if (!ctx || typeof ctx.reply !== 'function') {
      log.warn('requireSuperAdmin: Invalid context');
      return next();
    }

    if (!ctx.user) {
      // Use requireUser middleware properly
      const requireUserMiddleware = requireUser();
      return requireUserMiddleware(ctx, next);
    }

    // Defensive check: Ensure from exists
    if (!ctx.from || !ctx.from.id) {
      log.warn('requireSuperAdmin: ctx.from.id is undefined');
      return next();
    }

    const isSuperAdmin = getSuperAdminIds().includes(ctx.from.id) || 
                         ctx.user.role === 'super_admin';

    if (!isSuperAdmin) {
      const language = ctx.language || 'uz';
      const messages = {
        uz: '❌ Sizda super admin huquqi yo\'q.',
        ru: '❌ У вас нет прав супер-администратора.',
        en: '❌ You do not have super admin permissions.'
      };

      // Defensive: Check if reply is available
      if (ctx.chat && ctx.from) {
        await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
          .catch((error) => {
            log.error('requireSuperAdmin: Failed to send reply', error);
          });
      }
      return;
    }

    return next();
  };
}

/**
 * Helper function to check if user is super admin (for use in handlers)
 */
export function checkIsSuperAdmin(ctx: ExtendedContext): boolean {
  if (!ctx.user || !ctx.from) {
    return false;
  }

  return getSuperAdminIds().includes(ctx.from.id) || 
         ctx.user.role === 'super_admin';
}

/**
 * Middleware to require organization admin for specific org
 * 
 * CRITICAL: Only use in bot.use() chains
 */
export function requireOrgAdmin(organizationId: string) {
  return async (ctx: ExtendedContext, next: () => Promise<void>) => {
    // Defensive check: Ensure context is valid
    if (!ctx || typeof ctx.reply !== 'function') {
      log.warn('requireOrgAdmin: Invalid context');
      return next();
    }

    if (!ctx.user) {
      const requireUserMiddleware = requireUser();
      return requireUserMiddleware(ctx, next);
    }

    // Defensive check: Ensure from exists
    if (!ctx.from || !ctx.from.id) {
      log.warn('requireOrgAdmin: ctx.from.id is undefined');
      return next();
    }

    const isSuperAdmin = getSuperAdminIds().includes(ctx.from.id) || 
                         ctx.user.role === 'super_admin';
    
    const isOrgAdmin = ctx.user.organizationId?.toString() === organizationId &&
                       ctx.user.role === 'org_admin';

    if (!isSuperAdmin && !isOrgAdmin) {
      const language = ctx.language || 'uz';
      const messages = {
        uz: '❌ Sizda bu tashkilot uchun admin huquqi yo\'q.',
        ru: '❌ У вас нет прав администратора для этой организации.',
        en: '❌ You do not have admin permissions for this organization.'
      };

      // Defensive: Check if reply is available
      if (ctx.chat && ctx.from) {
        await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
          .catch((error) => {
            log.error('requireOrgAdmin: Failed to send reply', error);
          });
      }
      return;
    }

    return next();
  };
}

/**
 * Helper function to check if user is org admin (for use in handlers)
 */
export function checkIsOrgAdmin(ctx: ExtendedContext, organizationId: string): boolean {
  if (!ctx.user || !ctx.from) {
    return false;
  }

  const isSuperAdmin = getSuperAdminIds().includes(ctx.from.id) || 
                       ctx.user.role === 'super_admin';
  
  const isOrgAdmin = ctx.user.organizationId?.toString() === organizationId &&
                     ctx.user.role === 'org_admin';

  return isSuperAdmin || isOrgAdmin;
}

