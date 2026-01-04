/**
 * PrivacyService
 * Handles GDPR-like compliance and user data privacy
 * 
 * Features:
 * - User data deletion
 * - User data export
 * - Data anonymization
 * - Privacy policy management
 * - Data retention policies
 */

import { User } from '../models/User';
import { Request } from '../models/Request';
import { SystemLog } from '../models/SystemLog';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

export class PrivacyService {
  /**
   * Delete user data (GDPR right to be forgotten)
   * Anonymizes user data instead of hard deletion for audit purposes
   */
  async deleteUserData(userId: number): Promise<void> {
    try {
      log.info('Deleting user data', { userId });

      const user = await User.findByTelegramId(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Anonymize user data
      user.firstName = 'Deleted';
      user.lastName = 'User';
      user.username = undefined;
      user.phoneNumber = undefined;
      user.isActive = false;
      await user.save();

      // Anonymize user's requests (keep for statistics but remove personal info)
      await Request.updateMany(
        { userTelegramId: userId },
        {
          $set: {
            text: '[Content deleted by user request]',
            'userRating.comment': undefined
          }
        }
      );

      // Log the deletion
      await SystemLog.logEvent(
        'user_action',
        'user_data_deleted',
        {
          userId,
          deletedAt: new Date()
        },
        {
          userId,
          result: 'success'
        }
      );

      log.info('User data deleted successfully', { userId });
    } catch (error) {
      log.error('Error deleting user data', error, { userId });
      await SystemLog.logEvent(
        'error',
        'user_data_deletion_failed',
        {
          userId,
          error: String(error)
        },
        {
          userId,
          result: 'failure',
          errorMessage: String(error)
        }
      );
      throw error;
    }
  }

  /**
   * Export all user data (GDPR right to data portability)
   */
  async exportUserData(userId: number): Promise<any> {
    try {
      log.info('Exporting user data', { userId });

      const user = await User.findByTelegramId(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get all user's requests
      const requests = await Request.find({ userTelegramId: userId })
        .populate('assignedTo')
        .lean();

      // Get user's system logs
      const logs = await SystemLog.findByUser(userId, 1000);

      // Compile export data
      const exportData = {
        user: {
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          region: user.region,
          language: user.language,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          metadata: user.metadata
        },
        requests: requests.map(req => ({
          trackingId: req.trackingId,
          text: req.text,
          category: req.category,
          status: req.status,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          deadline: req.deadline,
          resolvedAt: req.resolvedAt,
          assignedTo: req.assignedTo ? {
            name: req.assignedTo.name,
            shortName: req.assignedTo.shortName
          } : null,
          responses: req.responses?.map((r: any) => ({
            text: r.text,
            timestamp: r.timestamp,
            isInternal: r.isInternal
          })),
          userRating: req.userRating
        })),
        systemLogs: logs.map(log => ({
          type: log.type,
          action: log.action,
          timestamp: log.timestamp,
          result: log.result
        })),
        exportedAt: new Date()
      };

      // Log the export
      await SystemLog.logEvent(
        'user_action',
        'user_data_exported',
        {
          userId,
          exportedAt: new Date()
        },
        {
          userId,
          result: 'success'
        }
      );

      log.info('User data exported successfully', { userId });
      return exportData;
    } catch (error) {
      log.error('Error exporting user data', error, { userId });
      await SystemLog.logEvent(
        'error',
        'user_data_export_failed',
        {
          userId,
          error: String(error)
        },
        {
          userId,
          result: 'failure',
          errorMessage: String(error)
        }
      );
      throw error;
    }
  }

  /**
   * Get privacy policy text
   */
  getPrivacyPolicy(language: 'uz' | 'ru' | 'en' = 'uz'): string {
    const policies = {
      uz: `🔒 *Maxfiylik Siyosati*\n\n` +
          `UZQueue Bot foydalanuvchilarining maxfiyligini himoya qilishga sodiq.\n\n` +
          `*Ma'lumotlar to'planishi:*\n` +
          `• Telegram ID\n` +
          `• Ism va familiya\n` +
          `• Telefon raqami (ixtiyoriy)\n` +
          `• Viloyat\n` +
          `• Murojaatlar va javoblar\n\n` +
          `*Ma'lumotlardan foydalanish:*\n` +
          `• Murojaatlarni tashkilotlarga yuborish\n` +
          `• Statistika va tahlil\n` +
          `• Xizmat sifatini yaxshilash\n\n` +
          `*Huquqlaringiz:*\n` +
          `• Ma'lumotlarni ko'rish\n` +
          `• Ma'lumotlarni eksport qilish\n` +
          `• Ma'lumotlarni o'chirish\n\n` +
          `*Ma'lumotlarni saqlash:*\n` +
          `• Murojaatlar: 1 yil\n` +
          `• Foydalanuvchi ma'lumotlari: 2 yil (faol bo'lmagan)\n\n` +
          `Savollar uchun: @uzqueue_support`,
      ru: `🔒 *Политика конфиденциальности*\n\n` +
          `UZQueue Bot привержен защите конфиденциальности пользователей.\n\n` +
          `*Сбор данных:*\n` +
          `• Telegram ID\n` +
          `• Имя и фамилия\n` +
          `• Номер телефона (опционально)\n` +
          `• Область\n` +
          `• Запросы и ответы\n\n` +
          `*Использование данных:*\n` +
          `• Отправка запросов в организации\n` +
          `• Статистика и анализ\n` +
          `• Улучшение качества услуг\n\n` +
          `*Ваши права:*\n` +
          `• Просмотр данных\n` +
          `• Экспорт данных\n` +
          `• Удаление данных\n\n` +
          `*Хранение данных:*\n` +
          `• Запросы: 1 год\n` +
          `• Данные пользователя: 2 года (неактивные)\n\n` +
          `Вопросы: @uzqueue_support`,
      en: `🔒 *Privacy Policy*\n\n` +
          `UZQueue Bot is committed to protecting user privacy.\n\n` +
          `*Data Collection:*\n` +
          `• Telegram ID\n` +
          `• First and last name\n` +
          `• Phone number (optional)\n` +
          `• Region\n` +
          `• Requests and responses\n\n` +
          `*Data Usage:*\n` +
          `• Sending requests to organizations\n` +
          `• Statistics and analytics\n` +
          `• Improving service quality\n\n` +
          `*Your Rights:*\n` +
          `• View data\n` +
          `• Export data\n` +
          `• Delete data\n\n` +
          `*Data Retention:*\n` +
          `• Requests: 1 year\n` +
          `• User data: 2 years (inactive)\n\n` +
          `Questions: @uzqueue_support`
    };

    return policies[language] || policies.uz;
  }

  /**
   * Clean up old data according to retention policy
   * Should be run periodically (e.g., monthly)
   */
  async cleanupOldData(): Promise<{
    archivedRequests: number;
    deletedUsers: number;
  }> {
    try {
      log.info('Starting data cleanup...');

      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

      // Archive requests older than 1 year (mark as archived, don't delete)
      const archivedRequests = await Request.updateMany(
        {
          createdAt: { $lt: oneYearAgo },
          status: { $in: ['resolved', 'rejected'] }
        },
        {
          $set: {
            tags: ['archived']
          }
        }
      );

      // Delete inactive users older than 2 years
      const deletedUsers = await User.deleteMany({
        isActive: false,
        updatedAt: { $lt: twoYearsAgo }
      });

      // Log cleanup
      await SystemLog.logEvent(
        'admin_action',
        'data_cleanup',
        {
          archivedRequests: archivedRequests.modifiedCount,
          deletedUsers: deletedUsers.deletedCount,
          cleanupDate: new Date()
        },
        {
          result: 'success'
        }
      );

      log.info('Data cleanup completed', {
        archivedRequests: archivedRequests.modifiedCount,
        deletedUsers: deletedUsers.deletedCount
      });

      return {
        archivedRequests: archivedRequests.modifiedCount,
        deletedUsers: deletedUsers.deletedCount
      };
    } catch (error) {
      log.error('Error during data cleanup', error);
      await SystemLog.logEvent(
        'error',
        'data_cleanup_failed',
        {
          error: String(error)
        },
        {
          result: 'failure',
          errorMessage: String(error)
        }
      );
      throw error;
    }
  }

  /**
   * Anonymize request data (remove personal information)
   */
  async anonymizeRequest(requestId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await Request.findByIdAndUpdate(requestId, {
        $set: {
          text: '[Content anonymized]',
          'userRating.comment': undefined
        }
      });

      log.info('Request anonymized', { requestId });
    } catch (error) {
      log.error('Error anonymizing request', error, { requestId });
      throw error;
    }
  }

  /**
   * Check if user has given consent (for future use)
   */
  async hasUserConsent(userId: number): Promise<boolean> {
    // For now, using the bot implies consent
    // In future, can add explicit consent tracking
    const user = await User.findByTelegramId(userId);
    return user !== null;
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();

