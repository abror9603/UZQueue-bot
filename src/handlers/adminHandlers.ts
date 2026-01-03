/**
 * Admin Handlers
 * Handles organization admin and super admin commands
 */

import { ExtendedContext } from '../types/context';
import { checkIsSuperAdmin, sendUserNotRegisteredMessage } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Organization, Request } from '../models';
import { verifyOrganization, getOrganizationStats, getPendingOrganizations } from '../services/OrganizationService';
import { notifyUserStatusChange } from '../services/NotificationService';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * /admin_register - Organization registration
 * 
 * NOTE: loadUserMiddleware already sets ctx.user, so we just check it
 */
export const handleAdminRegister = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleAdminRegister: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  const language = ctx.language || 'uz';

  // Check if already has organization
  if (ctx.user.organizationId) {
    const messages = {
      uz: '❌ Sizda allaqachon tashkilot bor.',
      ru: '❌ У вас уже есть организация.',
      en: '❌ You already have an organization.'
    };
    await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
    return;
  }

  // Start registration flow
  ctx.session = {
    step: 'org_reg_name',
    data: {}
  };

  const messages = {
    uz: `📋 *Tashkilot ro'yxatdan o'tkazish*\n\n` +
        `Tashkilotingizni ro'yxatdan o'tkazish uchun quyidagi ma'lumotlarni kiriting:\n\n` +
        `1️⃣ Tashkilot nomini kiriting (O'zbek tilida):`,
    ru: `📋 *Регистрация организации*\n\n` +
        `Для регистрации вашей организации введите следующие данные:\n\n` +
        `1️⃣ Введите название организации (на узбекском):`,
    en: `📋 *Organization Registration*\n\n` +
        `To register your organization, enter the following information:\n\n` +
        `1️⃣ Enter organization name (in Uzbek):`
  };

  await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
    parse_mode: 'Markdown'
  });
});

/**
 * /admin_dashboard - Organization dashboard
 */
export const handleAdminDashboard = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleAdminDashboard: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  if (!ctx.user.organizationId) {
    const language = ctx.language || 'uz';
    const messages = {
      uz: '❌ Sizda tashkilot yo\'q. /admin_register buyrug\'ini yuboring.',
      ru: '❌ У вас нет организации. Отправьте команду /admin_register.',
      en: '❌ You don\'t have an organization. Send /admin_register command.'
    };
    await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
      .catch((error) => {
        log.error('handleAdminDashboard: Failed to send reply', error);
      });
    return;
  }

  const language = ctx.language || 'uz';

  try {
    const orgId = ctx.user.organizationId instanceof mongoose.Types.ObjectId
      ? ctx.user.organizationId
      : new mongoose.Types.ObjectId(String(ctx.user.organizationId));
    const stats = await getOrganizationStats(orgId);

    const messages = {
      uz: `📊 *Tashkilot Dashboard*\n\n` +
          `🏢 *${stats.organization.name.uz}*\n` +
          `📋 Turi: ${stats.organization.type}\n` +
          `📍 Viloyat: ${stats.organization.region || 'N/A'}\n\n` +
          `*Statistika:*\n` +
          `📝 Jami murojaatlar: ${stats.statistics.totalRequests}\n` +
          `✅ Hal qilingan: ${stats.statistics.resolvedRequests}\n` +
          `⏱ O'rtacha javob vaqti: ${stats.statistics.avgResponseTime.toFixed(1)} soat\n` +
          `📈 Javob foizi: ${stats.statistics.responseRate.toFixed(1)}%\n` +
          `⭐ Reyting: ${stats.statistics.rating.toFixed(1)}/5\n\n` +
          `*So'nggi murojaatlar:*\n` +
          (stats.recentRequests.length > 0
            ? stats.recentRequests
                .slice(0, 5)
                .map(
                  (req: any, idx: number) =>
                    `${idx + 1}. ${req.trackingId} - ${req.status}`
                )
                .join('\n')
            : 'Hozircha murojaatlar yo\'q'),
      ru: `📊 *Панель организации*\n\n` +
          `🏢 *${stats.organization.name.ru}*\n` +
          `📋 Тип: ${stats.organization.type}\n` +
          `📍 Область: ${stats.organization.region || 'N/A'}\n\n` +
          `*Статистика:*\n` +
          `📝 Всего запросов: ${stats.statistics.totalRequests}\n` +
          `✅ Решено: ${stats.statistics.resolvedRequests}\n` +
          `⏱ Среднее время ответа: ${stats.statistics.avgResponseTime.toFixed(1)} часов\n` +
          `📈 Процент ответов: ${stats.statistics.responseRate.toFixed(1)}%\n` +
          `⭐ Рейтинг: ${stats.statistics.rating.toFixed(1)}/5\n\n` +
          `*Последние запросы:*\n` +
          (stats.recentRequests.length > 0
            ? stats.recentRequests
                .slice(0, 5)
                .map(
                  (req: any, idx: number) =>
                    `${idx + 1}. ${req.trackingId} - ${req.status}`
                )
                .join('\n')
            : 'Пока нет запросов'),
      en: `📊 *Organization Dashboard*\n\n` +
          `🏢 *${stats.organization.name.en}*\n` +
          `📋 Type: ${stats.organization.type}\n` +
          `📍 Region: ${stats.organization.region || 'N/A'}\n\n` +
          `*Statistics:*\n` +
          `📝 Total Requests: ${stats.statistics.totalRequests}\n` +
          `✅ Resolved: ${stats.statistics.resolvedRequests}\n` +
          `⏱ Avg Response Time: ${stats.statistics.avgResponseTime.toFixed(1)} hours\n` +
          `📈 Response Rate: ${stats.statistics.responseRate.toFixed(1)}%\n` +
          `⭐ Rating: ${stats.statistics.rating.toFixed(1)}/5\n\n` +
          `*Recent Requests:*\n` +
          (stats.recentRequests.length > 0
            ? stats.recentRequests
                .slice(0, 5)
                .map(
                  (req: any, idx: number) =>
                    `${idx + 1}. ${req.trackingId} - ${req.status}`
                )
                .join('\n')
            : 'No requests yet')
    };

    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    log.error('Error showing admin dashboard', error);
    const errorMessages = {
      uz: '❌ Dashboard ko\'rsatishda xatolik yuz berdi.',
      ru: '❌ Ошибка при отображении панели.',
      en: '❌ Error showing dashboard.'
    };
    await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
  }
});

/**
 * /admin_requests - Show organization requests
 */
export const handleAdminRequests = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleAdminRequests: Invalid context');
    return;
  }

  if (!ctx.user || !ctx.user.organizationId) {
    if (!ctx.user) {
      await sendUserNotRegisteredMessage(ctx);
    } else {
      const language = ctx.language || 'uz';
      const messages = {
        uz: '❌ Sizda tashkilot yo\'q.',
        ru: '❌ У вас нет организации.',
        en: '❌ You don\'t have an organization.'
      };
      await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
        .catch((error) => {
          log.error('handleAdminRequests: Failed to send reply', error);
        });
    }
    return;
  }

  const language = ctx.language || 'uz';

  try {
    const orgId = ctx.user.organizationId instanceof mongoose.Types.ObjectId
      ? ctx.user.organizationId
      : new mongoose.Types.ObjectId(String(ctx.user.organizationId));
    const requests = await Request.find({
      assignedTo: orgId
    })
      .sort({ createdAt: -1 })
      .limit(20);

    if (requests.length === 0) {
      const messages = {
        uz: '📝 Hozircha murojaatlar yo\'q.',
        ru: '📝 Пока нет запросов.',
        en: '📝 No requests yet.'
      };
      await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
      return;
    }

    const statusEmojis: Record<string, string> = {
      pending: '⏳',
      analyzing: '🔍',
      assigned: '📋',
      in_progress: '🔄',
      resolved: '✅',
      rejected: '❌',
      escalated: '⬆️'
    };

    let message = language === 'uz'
      ? '📝 *Murojaatlar ro\'yxati:*\n\n'
      : language === 'ru'
      ? '📝 *Список запросов:*\n\n'
      : '📝 *Requests List:*\n\n';

    requests.forEach((req, idx) => {
      const emoji = statusEmojis[req.status] || '❓';
      message += `${idx + 1}. ${emoji} \`${req.trackingId}\` - ${req.status}\n`;
    });

    message += `\n📊 Batafsil: /admin_respond <ID>`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    log.error('Error showing admin requests', error);
  }
});

/**
 * /admin_respond <trackingId> - Respond to request
 */
export const handleAdminRespond = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleAdminRespond: Invalid context');
    return;
  }

  if (!ctx.user || !ctx.user.organizationId) {
    if (!ctx.user) {
      await sendUserNotRegisteredMessage(ctx);
    } else {
      const language = ctx.language || 'uz';
      const messages = {
        uz: '❌ Sizda tashkilot yo\'q.',
        ru: '❌ У вас нет организации.',
        en: '❌ You don\'t have an organization.'
      };
      await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
        .catch((error) => {
          log.error('handleAdminRespond: Failed to send reply', error);
        });
    }
    return;
  }

  const language = ctx.language || 'uz';
  const args = ctx.message && 'text' in ctx.message
    ? ctx.message.text.split(' ').slice(1)
    : [];

  if (args.length === 0) {
    const messages = {
      uz: '📌 *Javob berish*\n\nTracking ID ni kiriting:\nMisol: /admin_respond UZQ-123456',
      ru: '📌 *Ответить на запрос*\n\nВведите Tracking ID:\nПример: /admin_respond UZQ-123456',
      en: '📌 *Respond to Request*\n\nEnter Tracking ID:\nExample: /admin_respond UZQ-123456'
    };
    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      parse_mode: 'Markdown'
    });
    return;
  }

  const trackingId = args[0].toUpperCase();

  try {
    const orgId = ctx.user.organizationId instanceof mongoose.Types.ObjectId
      ? ctx.user.organizationId
      : new mongoose.Types.ObjectId(String(ctx.user.organizationId));
    const request = await Request.findOne({
      trackingId,
      assignedTo: orgId
    });

    if (!request) {
      const messages = {
        uz: '❌ Murojaat topilmadi yoki sizga tegishli emas.',
        ru: '❌ Запрос не найден или не принадлежит вам.',
        en: '❌ Request not found or does not belong to you.'
      };
      await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
      return;
    }

    // Set session for response input
    ctx.session = {
      step: 'admin_respond',
      data: {
        requestId: request._id.toString(),
        trackingId: request.trackingId
      }
    };

    const messages = {
      uz: `📝 *Javob yozish*\n\n` +
          `Murojaat: \`${request.trackingId}\`\n` +
          `Matn: ${request.text.substring(0, 100)}...\n\n` +
          `Javobingizni yuboring:`,
      ru: `📝 *Написать ответ*\n\n` +
          `Запрос: \`${request.trackingId}\`\n` +
          `Текст: ${request.text.substring(0, 100)}...\n\n` +
          `Отправьте ваш ответ:`,
      en: `📝 *Write Response*\n\n` +
          `Request: \`${request.trackingId}\`\n` +
          `Text: ${request.text.substring(0, 100)}...\n\n` +
          `Send your response:`
    };

    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    log.error('Error handling admin respond', error);
  }
});

/**
 * Handle admin response text
 */
export const handleAdminResponseText = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleAdminResponseText: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  if (ctx.session?.step !== 'admin_respond') {
    return;
  }

  const language = ctx.language || 'uz';
  const requestId = ctx.session.data?.requestId;
  const trackingId = ctx.session.data?.trackingId;

  if (!requestId || !ctx.message || !('text' in ctx.message)) {
    return;
  }

  const responseText = ctx.message.text;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return;
    }

    // Add response
    const orgId = ctx.user.organizationId instanceof mongoose.Types.ObjectId
      ? ctx.user.organizationId
      : new mongoose.Types.ObjectId(String(ctx.user.organizationId));
    request.responses.push({
      fromUserId: ctx.user.telegramId,
      fromOrgId: orgId,
      text: responseText,
      timestamp: new Date(),
      isInternal: false
    });

    // Update status
    request.status = 'resolved';
    request.resolvedAt = new Date();

    // Calculate response time
    if (request.assignedAt) {
      const hours = (request.resolvedAt.getTime() - request.assignedAt.getTime()) / (1000 * 60 * 60);
      request.responseTime = Math.round(hours * 100) / 100;
    }

    await request.save();

    // Update organization statistics
    const organization = await Organization.findById(ctx.user.organizationId);
    if (organization) {
      organization.statistics.resolvedRequests += 1;
      organization.statistics.responseRate =
        (organization.statistics.resolvedRequests / organization.statistics.totalRequests) * 100;

      if (request.responseTime) {
        const currentAvg = organization.statistics.avgResponseTime;
        const totalResolved = organization.statistics.resolvedRequests;
        organization.statistics.avgResponseTime =
          ((currentAvg * (totalResolved - 1)) + request.responseTime) / totalResolved;
      }

      await organization.save();
    }

    // Notify user
    await notifyUserStatusChange(request.userTelegramId, request, 'resolved');

    // Clear session
    ctx.session = undefined;

    const messages = {
      uz: `✅ *Javob yuborildi!*\n\n` +
          `Murojaat: \`${trackingId}\`\n` +
          `Foydalanuvchi javobni oldi.`,
      ru: `✅ *Ответ отправлен!*\n\n` +
          `Запрос: \`${trackingId}\`\n` +
          `Пользователь получил ответ.`,
      en: `✅ *Response Sent!*\n\n` +
          `Request: \`${trackingId}\`\n` +
          `User has received the response.`
    };

    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    log.error('Error processing admin response', error);
  }
});

/**
 * /admin_verify <orgId> - Super admin verify organization
 * 
 * CRITICAL: We check ctx.user directly instead of calling middleware
 * Middleware should only be used in bot.use() chains, not manually invoked
 */
export const handleAdminVerify = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleAdminVerify: Invalid context');
    return;
  }

  // Check if user exists (set by loadUserMiddleware)
  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  // Check if user is super admin (using helper function, not middleware)
  if (!checkIsSuperAdmin(ctx)) {
    const language = ctx.language || 'uz';
    const messages = {
      uz: '❌ Sizda super admin huquqi yo\'q.',
      ru: '❌ У вас нет прав супер-администратора.',
      en: '❌ You do not have super admin permissions.'
    };
    await ctx.reply(messages[language as keyof typeof messages] || messages.uz)
      .catch((error) => {
        log.error('handleAdminVerify: Failed to send reply', error);
      });
    return;
  }

  const language = ctx.language || 'uz';
    const args = ctx.message && 'text' in ctx.message
      ? ctx.message.text.split(' ').slice(1)
      : [];

    if (args.length === 0) {
      // Show pending organizations
      const pending = await getPendingOrganizations();

      if (pending.length === 0) {
        const messages = {
          uz: '✅ Tasdiqlash kerak bo\'lgan tashkilotlar yo\'q.',
          ru: '✅ Нет организаций для подтверждения.',
          en: '✅ No organizations to verify.'
        };
        await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
        return;
      }

      let message = language === 'uz'
        ? '📋 *Tasdiqlash kerak bo\'lgan tashkilotlar:*\n\n'
        : language === 'ru'
        ? '📋 *Организации для подтверждения:*\n\n'
        : '📋 *Organizations to Verify:*\n\n';

      pending.forEach((org, idx) => {
        message += `${idx + 1}. ${org.name.uz} (${org.shortName})\n`;
        message += `   ID: ${org._id}\n`;
        message += `   /admin_verify ${org._id}\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });
      return;
    }

    const orgId = args[0];

    try {
      await verifyOrganization(
        new mongoose.Types.ObjectId(orgId),
        ctx.from!.id
      );

      const messages = {
        uz: `✅ Tashkilot tasdiqlandi!`,
        ru: `✅ Организация подтверждена!`,
        en: `✅ Organization verified!`
      };

      await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
    } catch (error) {
      log.error('Error verifying organization', error);
      const errorMessages = {
        uz: '❌ Tashkilotni tasdiqlashda xatolik.',
        ru: '❌ Ошибка при подтверждении организации.',
        en: '❌ Error verifying organization.'
      };
      await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
    }
  }
);

