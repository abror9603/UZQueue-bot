/**
 * Request Handlers
 * Handles request creation from text, media, and voice messages
 */

import { ExtendedContext } from '../types/context';
import { sendUserNotRegisteredMessage } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createTextRequest,
  createMediaRequest,
  createVoiceRequest
} from '../services/RequestService';
import { MediaFile, VoiceMessage } from '../types';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Handle text message as request
 */
export const handleTextRequest = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleTextRequest: Invalid context');
    return;
  }

  // Check if user is registered (set by loadUserMiddleware)
  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  // Skip if it's a command
  if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/')) {
    return;
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const language = ctx.language || 'uz';

  if (!text || text.trim().length < 10) {
    const messages = {
      uz: '❌ Murojaat matni kamida 10 ta belgidan iborat bo\'lishi kerak.',
      ru: '❌ Текст запроса должен содержать не менее 10 символов.',
      en: '❌ Request text must be at least 10 characters.'
    };
    await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
    return;
  }

  try {
    // Show processing message
    const processingMessages = {
      uz: '⏳ Murojaatingiz qayta ishlanmoqda...',
      ru: '⏳ Ваш запрос обрабатывается...',
      en: '⏳ Processing your request...'
    };
    const processingMsg = await ctx.reply(
      processingMessages[language as keyof typeof processingMessages] || processingMessages.uz
    );

    // Create request
    const userId = ctx.user._id instanceof mongoose.Types.ObjectId
      ? ctx.user._id
      : new mongoose.Types.ObjectId(String(ctx.user._id));
    const request = await createTextRequest(
      userId,
      ctx.user.telegramId,
      text
    );

    // Send confirmation
    const successMessages = {
      uz: `✅ *Murojaatingiz qabul qilindi!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `📝 Murojaatingiz AI tomonidan tahlil qilinmoqda. ` +
          `Tegishli tashkilotga yuborilgandan so'ng sizga xabar yuboramiz.\n\n` +
          `📊 Holatni kuzatish: /track ${request.trackingId}`,
      ru: `✅ *Ваш запрос принят!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `📝 Ваш запрос анализируется AI. ` +
          `Мы отправим вам уведомление после отправки в соответствующую организацию.\n\n` +
          `📊 Отследить статус: /track ${request.trackingId}`,
      en: `✅ *Your request has been accepted!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `📝 Your request is being analyzed by AI. ` +
          `We will notify you after sending it to the appropriate organization.\n\n` +
          `📊 Track status: /track ${request.trackingId}`
    };

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      processingMsg.message_id,
      undefined,
      successMessages[language as keyof typeof successMessages] || successMessages.uz,
      { parse_mode: 'Markdown' }
    );

    log.info('Text request created', { requestId: request._id, trackingId: request.trackingId });
  } catch (error) {
    log.error('Error handling text request', error);
    const errorMessages = {
      uz: '❌ Murojaat yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
      ru: '❌ Ошибка при создании запроса. Пожалуйста, попробуйте снова.',
      en: '❌ Error creating request. Please try again.'
    };
    await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
  }
});

/**
 * Handle photo/document as request
 */
export const handleMediaRequest = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleMediaRequest: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  const language = ctx.language || 'uz';
  const mediaFiles: MediaFile[] = [];

  // Extract photos
  if (ctx.message && 'photo' in ctx.message && ctx.message.photo) {
    const photos = ctx.message.photo;
    // Get the largest photo
    const largestPhoto = photos[photos.length - 1];
    mediaFiles.push({
      type: 'photo',
      fileId: largestPhoto.file_id
    });
  }

  // Extract document
  if (ctx.message && 'document' in ctx.message && ctx.message.document) {
    const doc = ctx.message.document;
    mediaFiles.push({
      type: 'document',
      fileId: doc.file_id,
      fileName: doc.file_name
    });
  }

  // Extract video
  if (ctx.message && 'video' in ctx.message && ctx.message.video) {
    const video = ctx.message.video;
    mediaFiles.push({
      type: 'video',
      fileId: video.file_id,
      fileName: video.file_name
    });
  }

  if (mediaFiles.length === 0) {
    return;
  }

  // Get caption as text
  const text = (ctx.message && 'caption' in ctx.message && ctx.message.caption) || 
               (language === 'uz' ? 'Rasm/hujjat bilan murojaat' :
                language === 'ru' ? 'Запрос с фото/документом' :
                'Request with photo/document');

  try {
    const processingMessages = {
      uz: '⏳ Murojaatingiz qayta ishlanmoqda...',
      ru: '⏳ Ваш запрос обрабатывается...',
      en: '⏳ Processing your request...'
    };
    const processingMsg = await ctx.reply(
      processingMessages[language as keyof typeof processingMessages] || processingMessages.uz
    );

    // Create request with media
    const userId = ctx.user._id instanceof mongoose.Types.ObjectId
      ? ctx.user._id
      : new mongoose.Types.ObjectId(String(ctx.user._id));
    const request = await createMediaRequest(
      userId,
      ctx.user.telegramId,
      text,
      mediaFiles
    );

    const successMessages = {
      uz: `✅ *Murojaatingiz qabul qilindi!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `📎 ${mediaFiles.length} ta fayl qo'shildi\n\n` +
          `📝 Murojaatingiz AI tomonidan tahlil qilinmoqda.\n\n` +
          `📊 Holatni kuzatish: /track ${request.trackingId}`,
      ru: `✅ *Ваш запрос принят!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `📎 Добавлено ${mediaFiles.length} файлов\n\n` +
          `📝 Ваш запрос анализируется AI.\n\n` +
          `📊 Отследить статус: /track ${request.trackingId}`,
      en: `✅ *Your request has been accepted!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `📎 ${mediaFiles.length} files added\n\n` +
          `📝 Your request is being analyzed by AI.\n\n` +
          `📊 Track status: /track ${request.trackingId}`
    };

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      processingMsg.message_id,
      undefined,
      successMessages[language as keyof typeof successMessages] || successMessages.uz,
      { parse_mode: 'Markdown' }
    );

    log.info('Media request created', { requestId: request._id, trackingId: request.trackingId });
  } catch (error) {
    log.error('Error handling media request', error);
    const errorMessages = {
      uz: '❌ Murojaat yaratishda xatolik yuz berdi.',
      ru: '❌ Ошибка при создании запроса.',
      en: '❌ Error creating request.'
    };
    await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
  }
});

/**
 * Handle voice message as request
 */
export const handleVoiceRequest = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleVoiceRequest: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  if (!ctx.message || !('voice' in ctx.message) || !ctx.message.voice) {
    return;
  }

  const language = ctx.language || 'uz';
  const voice = ctx.message.voice;

  try {
    const processingMessages = {
      uz: '⏳ Ovozli xabaringiz qayta ishlanmoqda...',
      ru: '⏳ Ваше голосовое сообщение обрабатывается...',
      en: '⏳ Processing your voice message...'
    };
    const processingMsg = await ctx.reply(
      processingMessages[language as keyof typeof processingMessages] || processingMessages.uz
    );

    // Create voice message object
    const voiceMessage: VoiceMessage = {
      fileId: voice.file_id,
      duration: voice.duration,
      transcription: undefined // Will be set after transcription (Step 6)
    };

    // Create request with voice
    const userId = ctx.user._id instanceof mongoose.Types.ObjectId
      ? ctx.user._id
      : new mongoose.Types.ObjectId(String(ctx.user._id));
    const request = await createVoiceRequest(
      userId,
      ctx.user.telegramId,
      language === 'uz' ? 'Ovozli xabar' :
      language === 'ru' ? 'Голосовое сообщение' :
      'Voice message',
      voiceMessage
    );

    const successMessages = {
      uz: `✅ *Ovozli murojaatingiz qabul qilindi!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `🎤 Ovozli xabar qabul qilindi (${voice.duration}s)\n\n` +
          `📝 Murojaatingiz AI tomonidan tahlil qilinmoqda.\n\n` +
          `📊 Holatni kuzatish: /track ${request.trackingId}`,
      ru: `✅ *Ваше голосовое обращение принято!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `🎤 Голосовое сообщение получено (${voice.duration}s)\n\n` +
          `📝 Ваш запрос анализируется AI.\n\n` +
          `📊 Отследить статус: /track ${request.trackingId}`,
      en: `✅ *Your voice request has been accepted!*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
          `🎤 Voice message received (${voice.duration}s)\n\n` +
          `📝 Your request is being analyzed by AI.\n\n` +
          `📊 Track status: /track ${request.trackingId}`
    };

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      processingMsg.message_id,
      undefined,
      successMessages[language as keyof typeof successMessages] || successMessages.uz,
      { parse_mode: 'Markdown' }
    );

    log.info('Voice request created', { requestId: request._id, trackingId: request.trackingId });
  } catch (error) {
    log.error('Error handling voice request', error);
    const errorMessages = {
      uz: '❌ Ovozli murojaat yaratishda xatolik yuz berdi.',
      ru: '❌ Ошибка при создании голосового запроса.',
      en: '❌ Error creating voice request.'
    };
    await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
  }
});

/**
 * Handle /track command
 */
export const handleTrack = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleTrack: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  const language = ctx.language || 'uz';
  const args = ctx.message && 'text' in ctx.message 
    ? ctx.message.text.split(' ').slice(1) 
    : [];

  if (args.length === 0) {
    const messages = {
      uz: '📌 *Murojaat holatini tekshirish*\n\n' +
          'Tracking ID ni kiriting:\n' +
          'Misol: /track UZQ-123456',
      ru: '📌 *Проверка статуса запроса*\n\n' +
          'Введите Tracking ID:\n' +
          'Пример: /track UZQ-123456',
      en: '📌 *Check request status*\n\n' +
          'Enter Tracking ID:\n' +
          'Example: /track UZQ-123456'
    };
    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      parse_mode: 'Markdown'
    });
    return;
  }

  const trackingId = args[0].toUpperCase();

  try {
    const { getRequestByTrackingId } = await import('../services/RequestService');
    const request = await getRequestByTrackingId(trackingId);

    if (!request || request.userId.toString() !== ctx.user._id.toString()) {
      const messages = {
        uz: '❌ Murojaat topilmadi yoki sizga tegishli emas.',
        ru: '❌ Запрос не найден или не принадлежит вам.',
        en: '❌ Request not found or does not belong to you.'
      };
      await ctx.reply(messages[language as keyof typeof messages] || messages.uz);
      return;
    }

    // Format status message
    const statusEmojis: Record<string, string> = {
      pending: '⏳',
      analyzing: '🔍',
      assigned: '📋',
      in_progress: '🔄',
      resolved: '✅',
      rejected: '❌',
      escalated: '⬆️'
    };

    const statusTexts: Record<string, Record<string, string>> = {
      pending: { uz: 'Kutilmoqda', ru: 'Ожидает', en: 'Pending' },
      analyzing: { uz: 'Tahlil qilinmoqda', ru: 'Анализируется', en: 'Analyzing' },
      assigned: { uz: 'Tayinlangan', ru: 'Назначено', en: 'Assigned' },
      in_progress: { uz: 'Jarayonda', ru: 'В процессе', en: 'In Progress' },
      resolved: { uz: 'Hal qilindi', ru: 'Решено', en: 'Resolved' },
      rejected: { uz: 'Rad etildi', ru: 'Отклонено', en: 'Rejected' },
      escalated: { uz: 'Ko\'tarildi', ru: 'Эскалировано', en: 'Escalated' }
    };

    const statusEmoji = statusEmojis[request.status] || '❓';
    const statusText = statusTexts[request.status]?.[language] || request.status;

    // Get category display name
    const { getCategoryDisplayName } = await import('../services/ClassificationService');
    const categoryName = getCategoryDisplayName(request.category, language);

    const messages = {
      uz: `${statusEmoji} *Murojaat holati*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n` +
          `📅 Yaratilgan: ${new Date(request.createdAt).toLocaleDateString('uz-UZ')}\n` +
          `🔔 Holat: ${statusText}\n` +
          `📋 Kategoriya: ${categoryName}\n` +
          (request.aiConfidence > 0 ? `🤖 AI ishonch: ${request.aiConfidence}%\n` : '') +
          `⏰ Muddati: ${new Date(request.deadline).toLocaleDateString('uz-UZ')}\n\n` +
          (request.assignedTo ? `🏢 Tashkilot: ${request.assignedTo}\n` : ''),
      ru: `${statusEmoji} *Статус запроса*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n` +
          `📅 Создан: ${new Date(request.createdAt).toLocaleDateString('ru-RU')}\n` +
          `🔔 Статус: ${statusText}\n` +
          `📋 Категория: ${categoryName}\n` +
          (request.aiConfidence > 0 ? `🤖 AI уверенность: ${request.aiConfidence}%\n` : '') +
          `⏰ Срок: ${new Date(request.deadline).toLocaleDateString('ru-RU')}\n\n` +
          (request.assignedTo ? `🏢 Организация: ${request.assignedTo}\n` : ''),
      en: `${statusEmoji} *Request Status*\n\n` +
          `🆔 Tracking ID: \`${request.trackingId}\`\n` +
          `📅 Created: ${new Date(request.createdAt).toLocaleDateString('en-US')}\n` +
          `🔔 Status: ${statusText}\n` +
          `📋 Category: ${categoryName}\n` +
          (request.aiConfidence > 0 ? `🤖 AI Confidence: ${request.aiConfidence}%\n` : '') +
          `⏰ Deadline: ${new Date(request.deadline).toLocaleDateString('en-US')}\n\n` +
          (request.assignedTo ? `🏢 Organization: ${request.assignedTo}\n` : '')
    };

    await ctx.reply(messages[language as keyof typeof messages] || messages.uz, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    log.error('Error handling track command', error);
    const errorMessages = {
      uz: '❌ Murojaat holatini tekshirishda xatolik yuz berdi.',
      ru: '❌ Ошибка при проверке статуса запроса.',
      en: '❌ Error checking request status.'
    };
    await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
  }
});

/**
 * Handle /my_requests command
 */
export const handleMyRequests = asyncHandler(async (ctx: ExtendedContext) => {
  // Defensive check: Ensure context is valid
  if (!ctx || typeof ctx.reply !== 'function') {
    log.warn('handleMyRequests: Invalid context');
    return;
  }

  if (!ctx.user) {
    await sendUserNotRegisteredMessage(ctx);
    return;
  }

  const language = ctx.language || 'uz';

  try {
    const { getUserRequests } = await import('../services/RequestService');
    const userId = ctx.user._id instanceof mongoose.Types.ObjectId
      ? ctx.user._id
      : new mongoose.Types.ObjectId(String(ctx.user._id));
    const requests = await getUserRequests(
      userId,
      { limit: 10 }
    );

    if (requests.length === 0) {
      const messages = {
        uz: '📝 Hozircha murojaatlar yo\'q.\n\nYangi murojaat yuborish uchun xabar yuboring.',
        ru: '📝 Пока нет запросов.\n\nОтправьте сообщение для нового запроса.',
        en: '📝 No requests yet.\n\nSend a message to create a new request.'
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
      ? '📝 *Mening murojaatlarim:*\n\n'
      : language === 'ru'
      ? '📝 *Мои запросы:*\n\n'
      : '📝 *My Requests:*\n\n';

    requests.forEach((req, index) => {
      const emoji = statusEmojis[req.status] || '❓';
      message += `${index + 1}. ${emoji} \`${req.trackingId}\` - ${req.status}\n`;
    });

    message += `\n📊 Batafsil: /track <ID>`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    log.error('Error handling my_requests command', error);
    const errorMessages = {
      uz: '❌ Murojaatlarni olishda xatolik yuz berdi.',
      ru: '❌ Ошибка при получении запросов.',
      en: '❌ Error getting requests.'
    };
    await ctx.reply(errorMessages[language as keyof typeof errorMessages] || errorMessages.uz);
  }
});

