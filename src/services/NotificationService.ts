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

/**
 * NotificationService Class
 * Wrapper class for notification methods (for DeadlineManager compatibility)
 */
export class NotificationService {
  /**
   * Notify user about status change
   */
  async notifyStatusChange(
    requestId: mongoose.Types.ObjectId,
    newStatus: string,
    customMessage?: string
  ): Promise<void> {
    try {
      const request = await Request.findById(requestId)
        .populate('userId')
        .populate('assignedTo');

      if (!request) {
        log.warn('Request not found for notification', { requestId });
        return;
      }

      if (customMessage) {
        await bot.telegram.sendMessage(request.userTelegramId, customMessage, {
          parse_mode: 'Markdown'
        });
      } else {
        await notifyUserStatusChange(request.userTelegramId, request, newStatus);
      }
    } catch (error) {
      log.error('Error in notifyStatusChange', error, { requestId });
    }
  }

  /**
   * Notify organization about new assignment
   */
  async notifyOrganization(
    organizationId: mongoose.Types.ObjectId,
    requestId: mongoose.Types.ObjectId,
    customMessage?: string
  ): Promise<void> {
    try {
      const request = await Request.findById(requestId);
      if (!request) {
        log.warn('Request not found', { requestId });
        return;
      }

      if (customMessage) {
        const org = await Organization.findById(organizationId);
        if (org && org.telegramChatId) {
          await bot.telegram.sendMessage(org.telegramChatId, customMessage, {
            parse_mode: 'Markdown'
          });
        }
      } else {
        await notifyOrganization(organizationId, request);
      }
    } catch (error) {
      log.error('Error in notifyOrganization', error, { organizationId, requestId });
    }
  }

  /**
   * Send deadline reminder to user
   */
  async sendDeadlineReminder(
    requestId: mongoose.Types.ObjectId,
    daysLeft: number
  ): Promise<void> {
    try {
      const request = await Request.findById(requestId)
        .populate('userId')
        .populate('assignedTo');

      if (!request) {
        log.warn('Request not found for reminder', { requestId });
        return;
      }

      const user = await User.findByTelegramId(request.userTelegramId);
      if (!user) {
        return;
      }

      const language = user.language || 'uz';

      const messages = {
        uz: `⏰ *Murojaat muddati eslatmasi*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `📅 Qolgan kunlar: *${daysLeft} kun*\n` +
            `🏢 Tashkilot: ${request.assignedTo?.name?.uz || 'Tashkilot'}\n\n` +
            `Iltimos, javobni kuting. Holatni kuzatish: /track ${request.trackingId}`,
        ru: `⏰ *Напоминание о сроке запроса*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `📅 Осталось дней: *${daysLeft} дней*\n` +
            `🏢 Организация: ${request.assignedTo?.name?.ru || 'Организация'}\n\n` +
            `Пожалуйста, ожидайте ответа. Отследить статус: /track ${request.trackingId}`,
        en: `⏰ *Request Deadline Reminder*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `📅 Days left: *${daysLeft} days*\n` +
            `🏢 Organization: ${request.assignedTo?.name?.en || 'Organization'}\n\n` +
            `Please wait for response. Track status: /track ${request.trackingId}`
      };

      const message = messages[language] || messages.uz;

      await bot.telegram.sendMessage(request.userTelegramId, message, {
        parse_mode: 'Markdown'
      });

      log.info('Deadline reminder sent', {
        requestId: request._id,
        daysLeft,
        trackingId: request.trackingId
      });
    } catch (error) {
      log.error('Error sending deadline reminder', error, { requestId, daysLeft });
    }
  }

  /**
   * Notify about escalation
   */
  async notifyEscalation(
    requestId: mongoose.Types.ObjectId,
    toOrgId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<void> {
    try {
      const request = await Request.findById(requestId)
        .populate('userId')
        .populate('assignedTo');

      if (!request) {
        return;
      }

      const toOrg = await Organization.findById(toOrgId);
      if (!toOrg) {
        return;
      }

      const user = await User.findByTelegramId(request.userTelegramId);
      const language = user?.language || 'uz';

      const messages = {
        uz: `⬆️ *Murojaatingiz ko'tarildi*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `🏢 Yangi tashkilot: ${toOrg.name.uz}\n` +
            `📝 Sabab: ${reason}\n\n` +
            `Holatni kuzatish: /track ${request.trackingId}`,
        ru: `⬆️ *Ваш запрос эскалирован*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `🏢 Новая организация: ${toOrg.name.ru}\n` +
            `📝 Причина: ${reason}\n\n` +
            `Отследить статус: /track ${request.trackingId}`,
        en: `⬆️ *Your request has been escalated*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `🏢 New organization: ${toOrg.name.en}\n` +
            `📝 Reason: ${reason}\n\n` +
            `Track status: /track ${request.trackingId}`
      };

      const message = messages[language] || messages.uz;

      await bot.telegram.sendMessage(request.userTelegramId, message, {
        parse_mode: 'Markdown'
      });

      log.info('Escalation notification sent', {
        requestId: request._id,
        toOrgId
      });
    } catch (error) {
      log.error('Error notifying escalation', error, { requestId, toOrgId });
    }
  }
}

