/**
 * ResponseService
 * Handles organization responses and user feedback collection
 * 
 * Features:
 * - Organization can respond to requests
 * - Multiple responses allowed
 * - Internal notes (not visible to user)
 * - Media support in responses
 * - User feedback collection
 * - Rating system
 */

import { Request, RequestDocument } from '../models/Request';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { NotificationService } from './NotificationService';
import { SystemLog } from '../models/SystemLog';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

export interface ResponseContent {
  text: string;
  media?: Array<{
    type: 'photo' | 'document' | 'video';
    fileId: string;
    fileName?: string;
  }>;
  isInternal?: boolean;
}

export class ResponseService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create response to a request
   */
  async createResponse(
    requestId: mongoose.Types.ObjectId,
    organizationId: mongoose.Types.ObjectId,
    userId: number,
    content: ResponseContent
  ): Promise<void> {
    try {
      const request = await Request.findById(requestId)
        .populate('userId')
        .populate('assignedTo');

      if (!request) {
        throw new Error('Request not found');
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Verify user is admin of this organization
      if (!organization.adminUsers.includes(userId)) {
        throw new Error('User is not admin of this organization');
      }

      // Add response to request
      const response = {
        fromUserId: userId,
        fromOrgId: organizationId,
        text: content.text,
        media: content.media || [],
        timestamp: new Date(),
        isInternal: content.isInternal || false
      };

      await request.addResponse(response);

      // Update request status if not internal
      if (!content.isInternal) {
        if (request.status === 'assigned') {
          request.status = 'in_progress';
          await request.save();
        }

        // Notify user
        await this.notifyUserAboutResponse(request, response, organization);
      }

      // Log the response
      await SystemLog.logEvent(
        'admin_action',
        'response_created',
        {
          requestId: request._id,
          organizationId,
          userId,
          isInternal: content.isInternal || false
        },
        {
          requestId: request._id,
          organizationId,
          result: 'success'
        }
      );

      log.info('Response created', {
        requestId: request._id,
        organizationId,
        isInternal: content.isInternal
      });
    } catch (error) {
      log.error('Error creating response', error, {
        requestId,
        organizationId,
        userId
      });
      await SystemLog.logEvent(
        'error',
        'response_creation_failed',
        {
          requestId,
          organizationId,
          error: String(error)
        },
        {
          requestId,
          result: 'failure',
          errorMessage: String(error)
        }
      );
      throw error;
    }
  }

  /**
   * Resolve request with resolution message
   */
  async resolveRequest(
    requestId: mongoose.Types.ObjectId,
    resolution: string,
    userId: number
  ): Promise<void> {
    try {
      const request = await Request.findById(requestId)
        .populate('assignedTo')
        .populate('userId');

      if (!request) {
        throw new Error('Request not found');
      }

      // Add resolution as response
      const organizationId = request.assignedTo as any;
      if (organizationId) {
        await this.createResponse(
          requestId,
          organizationId._id,
          userId,
          {
            text: resolution,
            isInternal: false
          }
        );
      }

      // Mark as resolved
      await request.resolve();

      // Update organization statistics
      if (organizationId) {
        const org = await Organization.findById(organizationId._id);
        if (org) {
          await org.incrementResolvedCount();
          if (request.responseTime) {
            await org.updateResponseTime(request.responseTime);
          }
        }
      }

      // Notify user
      await this.notificationService.notifyStatusChange(
        requestId,
        'resolved',
        `✅ *Murojaatingiz hal qilindi!*\n\n` +
        `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
        `${resolution}\n\n` +
        `Xizmat sifatini baholang: /rate ${request.trackingId}`
      );

      // Request user feedback
      await this.requestFeedback(requestId);

      // Log resolution
      await SystemLog.logEvent(
        'admin_action',
        'request_resolved',
        {
          requestId: request._id,
          organizationId: organizationId?._id,
          userId
        },
        {
          requestId: request._id,
          result: 'success'
        }
      );

      log.info('Request resolved', {
        requestId: request._id,
        trackingId: request.trackingId
      });
    } catch (error) {
      log.error('Error resolving request', error, { requestId, userId });
      throw error;
    }
  }

  /**
   * Request user feedback after resolution
   */
  private async requestFeedback(requestId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const request = await Request.findById(requestId)
        .populate('userId');

      if (!request || request.userRating) {
        // Already rated or request not found
        return;
      }

      const user = await User.findByTelegramId(request.userTelegramId);
      if (!user) {
        return;
      }

      const language = user.language || 'uz';

      const messages = {
        uz: `⭐ *Xizmat sifatini baholang*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Murojaatingiz hal qilindi. Xizmat sifatini baholang:\n\n` +
            `1 ⭐ - Juda yomon\n` +
            `2 ⭐ - Yomon\n` +
            `3 ⭐ - O'rtacha\n` +
            `4 ⭐ - Yaxshi\n` +
            `5 ⭐ - Juda yaxshi\n\n` +
            `Baholash: /rate ${request.trackingId} <1-5>`,
        ru: `⭐ *Оцените качество услуги*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Ваш запрос решен. Оцените качество услуги:\n\n` +
            `1 ⭐ - Очень плохо\n` +
            `2 ⭐ - Плохо\n` +
            `3 ⭐ - Средне\n` +
            `4 ⭐ - Хорошо\n` +
            `5 ⭐ - Отлично\n\n` +
            `Оценить: /rate ${request.trackingId} <1-5>`,
        en: `⭐ *Rate Service Quality*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n\n` +
            `Your request has been resolved. Rate the service quality:\n\n` +
            `1 ⭐ - Very Poor\n` +
            `2 ⭐ - Poor\n` +
            `3 ⭐ - Average\n` +
            `4 ⭐ - Good\n` +
            `5 ⭐ - Excellent\n\n` +
            `Rate: /rate ${request.trackingId} <1-5>`
      };

      const message = messages[language] || messages.uz;

      const { bot } = await import('../bot');
      await bot.telegram.sendMessage(request.userTelegramId, message, {
        parse_mode: 'Markdown'
      });

      log.info('Feedback requested', { requestId: request._id });
    } catch (error) {
      log.error('Error requesting feedback', error, { requestId });
    }
  }

  /**
   * Collect user feedback (rating and optional comment)
   */
  async collectFeedback(
    requestId: mongoose.Types.ObjectId,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const request = await Request.findById(requestId)
        .populate('assignedTo');

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.userRating) {
        throw new Error('Request already rated');
      }

      // Add rating to request
      await request.addRating(rating, comment);

      // Update organization rating
      const organizationId = request.assignedTo as any;
      if (organizationId) {
        const org = await Organization.findById(organizationId._id);
        if (org) {
          await org.updateRating(rating);
        }
      }

      // Thank user
      const user = await User.findByTelegramId(request.userTelegramId);
      const language = user?.language || 'uz';

      const thankYouMessages = {
        uz: `✅ *Rahmat!*\n\n` +
            `Fikringiz biz uchun muhim. Sizning bahoingiz xizmat sifatini yaxshilashga yordam beradi.`,
        ru: `✅ *Спасибо!*\n\n` +
            `Ваше мнение важно для нас. Ваша оценка поможет улучшить качество услуг.`,
        en: `✅ *Thank you!*\n\n` +
            `Your feedback is important to us. Your rating helps improve service quality.`
      };

      const thankYouMessage = thankYouMessages[language] || thankYouMessages.uz;

      const { bot } = await import('../bot');
      await bot.telegram.sendMessage(request.userTelegramId, thankYouMessage, {
        parse_mode: 'Markdown'
      });

      // Log feedback
      await SystemLog.logEvent(
        'user_action',
        'feedback_collected',
        {
          requestId: request._id,
          rating,
          hasComment: !!comment
        },
        {
          requestId: request._id,
          result: 'success'
        }
      );

      log.info('Feedback collected', {
        requestId: request._id,
        rating,
        hasComment: !!comment
      });
    } catch (error) {
      log.error('Error collecting feedback', error, { requestId, rating });
      throw error;
    }
  }

  /**
   * Notify user about new response
   */
  private async notifyUserAboutResponse(
    request: RequestDocument,
    response: any,
    organization: any
  ): Promise<void> {
    try {
      const user = await User.findByTelegramId(request.userTelegramId);
      if (!user) {
        return;
      }

      const language = user.language || 'uz';

      const messages = {
        uz: `📨 *Yangi javob*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `🏢 Tashkilot: ${organization.name.uz}\n\n` +
            `${response.text}\n\n` +
            `Batafsil: /track ${request.trackingId}`,
        ru: `📨 *Новый ответ*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `🏢 Организация: ${organization.name.ru}\n\n` +
            `${response.text}\n\n` +
            `Подробнее: /track ${request.trackingId}`,
        en: `📨 *New Response*\n\n` +
            `🆔 Tracking ID: \`${request.trackingId}\`\n` +
            `🏢 Organization: ${organization.name.en}\n\n` +
            `${response.text}\n\n` +
            `Details: /track ${request.trackingId}`
      };

      const message = messages[language] || messages.uz;

      const { bot } = await import('../bot');
      await bot.telegram.sendMessage(request.userTelegramId, message, {
        parse_mode: 'Markdown'
      });

      // Send media if any
      if (response.media && response.media.length > 0) {
        for (const media of response.media) {
          try {
            if (media.type === 'photo') {
              await bot.telegram.sendPhoto(request.userTelegramId, media.fileId, {
                caption: `📎 ${request.trackingId}`
              });
            } else if (media.type === 'document') {
              await bot.telegram.sendDocument(request.userTelegramId, media.fileId, {
                caption: `📎 ${request.trackingId}`
              });
            } else if (media.type === 'video') {
              await bot.telegram.sendVideo(request.userTelegramId, media.fileId, {
                caption: `📎 ${request.trackingId}`
              });
            }
          } catch (error) {
            log.error('Error sending media in response', error, { media });
          }
        }
      }
    } catch (error) {
      log.error('Error notifying user about response', error, {
        requestId: request._id
      });
    }
  }

  /**
   * Add internal note (not visible to user)
   */
  async addInternalNote(
    requestId: mongoose.Types.ObjectId,
    organizationId: mongoose.Types.ObjectId,
    userId: number,
    note: string
  ): Promise<void> {
    await this.createResponse(requestId, organizationId, userId, {
      text: note,
      isInternal: true
    });
  }
}

// Export singleton instance
export const responseService = new ResponseService();

