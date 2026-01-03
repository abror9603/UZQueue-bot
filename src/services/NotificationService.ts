/**
 * Notification Service
 * Sends notifications to users and organizations
 */

import { bot } from '../bot';
import { Request, Organization, User } from '../models';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Notify user about request status change
 */
export async function notifyUserStatusChange(
  userTelegramId: number,
  request: any,
  newStatus: string
): Promise<void> {
  try {
    const user = await User.findByTelegramId(userTelegramId);
    if (!user) {
      return;
    }

    const language = user.language || 'uz';

    const statusMessages: Record<string, Record<string, string>> = {
      assigned: {
        uz: `✅ *Murojaatingiz tashkilotga yuborildi*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `📋 Kategoriya: ${request.category}\n` +
            `🏢 Tashkilot: ${request.assignedTo?.name?.uz || 'Tashkilot'}\n\n` +
            `Javobni kuting. Holatni kuzatish: /track ${request.trackingId}`,
        ru: `✅ *Ваш запрос отправлен в организацию*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `📋 Категория: ${request.category}\n` +
            `🏢 Организация: ${request.assignedTo?.name?.ru || 'Организация'}\n\n` +
            `Ожидайте ответа. Отследить статус: /track ${request.trackingId}`,
        en: `✅ *Your request has been sent to organization*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `📋 Category: ${request.category}\n` +
            `🏢 Organization: ${request.assignedTo?.name?.en || 'Organization'}\n\n` +
            `Wait for response. Track status: /track ${request.trackingId}`
      },
      in_progress: {
        uz: `🔄 *Murojaatingiz ko'rib chiqilmoqda*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Tashkilot murojaatingizni ko'rib chiqmoqda. Tez orada javob olasiz.`,
        ru: `🔄 *Ваш запрос рассматривается*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Организация рассматривает ваш запрос. Скоро вы получите ответ.`,
        en: `🔄 *Your request is being reviewed*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Organization is reviewing your request. You will receive a response soon.`
      },
      resolved: {
        uz: `✅ *Murojaatingiz hal qilindi!*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Tashkilot javob berdi. Batafsil: /track ${request.trackingId}`,
        ru: `✅ *Ваш запрос решен!*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Организация ответила. Подробнее: /track ${request.trackingId}`,
        en: `✅ *Your request has been resolved!*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Organization has responded. Details: /track ${request.trackingId}`
      }
    };

    const message = statusMessages[newStatus]?.[language] || 
                   statusMessages[newStatus]?.uz ||
                   `Status changed to ${newStatus}`;

    await bot.telegram.sendMessage(userTelegramId, message, {
      parse_mode: 'Markdown'
    });

    log.info('User notified about status change', {
      userTelegramId,
      requestId: request._id,
      newStatus
    });
  } catch (error) {
    log.error('Error notifying user', error, {
      userTelegramId,
      requestId: request._id
    });
  }
}

/**
 * Notify organization about new request assignment
 */
export async function notifyOrganization(
  organizationId: mongoose.Types.ObjectId,
  request: any
): Promise<void> {
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization || !organization.telegramChatId) {
      log.warn('Organization not found or no telegram chat ID', { organizationId });
      return;
    }

    const message = `📋 *Yangi murojaat*\n\n` +
      `🆔 Tracking ID: \`${request.trackingId}\`\n` +
      `📋 Kategoriya: ${request.category}\n` +
      `📝 Matn: ${request.text.substring(0, 200)}${request.text.length > 200 ? '...' : ''}\n` +
      `⏰ Muddati: ${new Date(request.deadline).toLocaleDateString('uz-UZ')}\n\n` +
      `Javob berish uchun /admin_respond ${request.trackingId}`;

    await bot.telegram.sendMessage(organization.telegramChatId, message, {
      parse_mode: 'Markdown'
    });

    log.info('Organization notified about new request', {
      organizationId,
      requestId: request._id
    });
  } catch (error) {
    log.error('Error notifying organization', error, {
      organizationId,
      requestId: request._id
    });
  }
}

/**
 * Notify super admin about request needing review
 */
export async function notifySuperAdmin(
  request: any,
  reason: string
): Promise<void> {
  try {
    // Get super admin IDs from environment
    const { getSuperAdminIds } = await import('../config/env');
    const superAdminIds = getSuperAdminIds();

    if (superAdminIds.length === 0) {
      log.warn('No super admin IDs configured');
      return;
    }

    const message = `⚠️ *Super Admin ko'rib chiqishi kerak*\n\n` +
      `🆔 Tracking ID: \`${request.trackingId}\`\n` +
      `📋 Kategoriya: ${request.category}\n` +
      `🤖 AI ishonch: ${request.aiConfidence}%\n` +
      `📝 Sabab: ${reason}\n\n` +
      `Ko'rib chiqish: /admin_review ${request.trackingId}`;

    for (const adminId of superAdminIds) {
      try {
        await bot.telegram.sendMessage(adminId, message, {
          parse_mode: 'Markdown'
        });
      } catch (error) {
        log.error('Error sending notification to super admin', error, { adminId });
      }
    }

    log.info('Super admin notified', {
      requestId: request._id,
      reason
    });
  } catch (error) {
    log.error('Error notifying super admin', error, {
      requestId: request._id
    });
  }
}

