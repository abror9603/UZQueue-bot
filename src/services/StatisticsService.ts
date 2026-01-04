/**
 * StatisticsService
 * Generates statistics and analytics for dashboard
 * 
 * Features:
 * - Real-time statistics
 * - Organization performance metrics
 * - Request analytics
 * - Response time tracking
 * - User satisfaction scores
 */

import { Request } from '../models/Request';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { SystemLog } from '../models/SystemLog';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

export interface Statistics {
  // Overall
  totalUsers: number;
  totalRequests: number;
  totalOrganizations: number;
  
  // Request metrics
  requestsByStatus: {
    pending: number;
    analyzing: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    escalated: number;
  };
  
  requestsByCategory: Record<string, number>;
  
  avgResponseTime: number; // hours
  avgResolutionTime: number; // hours
  
  // Organization metrics
  topPerformers: {
    orgName: string;
    orgId: mongoose.Types.ObjectId;
    resolvedCount: number;
    avgTime: number;
    rating: number;
    responseRate: number;
  }[];
  
  // AI metrics
  aiAccuracy: number;
  avgConfidence: number;
  humanReviewRate: number;
  
  // Time-based
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  
  // User satisfaction
  avgRating: number;
  totalRatings: number;
  
  // Escalation metrics
  totalEscalations: number;
  escalationRate: number; // percentage
}

export class StatisticsService {
  /**
   * Get overall statistics
   */
  async getOverallStatistics(organizationId?: mongoose.Types.ObjectId): Promise<Statistics> {
    try {
      const [
        totalUsers,
        totalRequests,
        totalOrganizations,
        requestsByStatus,
        requestsByCategory,
        avgResponseTime,
        avgResolutionTime,
        topPerformers,
        aiMetrics,
        timeBasedStats,
        userSatisfaction,
        escalationMetrics
      ] = await Promise.all([
        this.getTotalUsers(organizationId),
        this.getTotalRequests(organizationId),
        this.getTotalOrganizations(),
        this.getRequestsByStatus(organizationId),
        this.getRequestsByCategory(organizationId),
        this.getAvgResponseTime(organizationId),
        this.getAvgResolutionTime(organizationId),
        this.getTopPerformers(organizationId),
        this.getAIMetrics(organizationId),
        this.getTimeBasedStats(organizationId),
        this.getUserSatisfaction(organizationId),
        this.getEscalationMetrics(organizationId)
      ]);

      return {
        totalUsers,
        totalRequests,
        totalOrganizations,
        requestsByStatus,
        requestsByCategory,
        avgResponseTime,
        avgResolutionTime,
        topPerformers,
        aiAccuracy: aiMetrics.accuracy,
        avgConfidence: aiMetrics.avgConfidence,
        humanReviewRate: aiMetrics.humanReviewRate,
        requestsToday: timeBasedStats.today,
        requestsThisWeek: timeBasedStats.week,
        requestsThisMonth: timeBasedStats.month,
        avgRating: userSatisfaction.avgRating,
        totalRatings: userSatisfaction.totalRatings,
        totalEscalations: escalationMetrics.total,
        escalationRate: escalationMetrics.rate
      };
    } catch (error) {
      log.error('Error getting overall statistics', error);
      throw error;
    }
  }

  /**
   * Get total users count
   */
  private async getTotalUsers(organizationId?: mongoose.Types.ObjectId): Promise<number> {
    if (organizationId) {
      // Count users who have requests to this organization
      const requests = await Request.distinct('userId', { assignedTo: organizationId });
      return requests.length;
    }
    return User.countDocuments({ isActive: true });
  }

  /**
   * Get total requests count
   */
  private async getTotalRequests(organizationId?: mongoose.Types.ObjectId): Promise<number> {
    const query: any = {};
    if (organizationId) {
      query.assignedTo = organizationId;
    }
    return Request.countDocuments(query);
  }

  /**
   * Get total organizations count
   */
  private async getTotalOrganizations(): Promise<number> {
    return Organization.countDocuments({ isActive: true, isVerified: true });
  }

  /**
   * Get requests grouped by status
   */
  private async getRequestsByStatus(organizationId?: mongoose.Types.ObjectId): Promise<Statistics['requestsByStatus']> {
    const query: any = {};
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const statuses = ['pending', 'analyzing', 'assigned', 'in_progress', 'resolved', 'rejected', 'escalated'];
    const counts = await Promise.all(
      statuses.map(status => 
        Request.countDocuments({ ...query, status })
      )
    );

    return {
      pending: counts[0],
      analyzing: counts[1],
      assigned: counts[2],
      inProgress: counts[3],
      resolved: counts[4],
      rejected: counts[5],
      escalated: counts[6]
    };
  }

  /**
   * Get requests grouped by category
   */
  private async getRequestsByCategory(organizationId?: mongoose.Types.ObjectId): Promise<Record<string, number>> {
    const query: any = {};
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const results = await Request.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryMap: Record<string, number> = {};
    results.forEach(result => {
      categoryMap[result._id] = result.count;
    });

    return categoryMap;
  }

  /**
   * Get average response time (time from assignment to first response)
   */
  private async getAvgResponseTime(organizationId?: mongoose.Types.ObjectId): Promise<number> {
    const query: any = {
      status: { $in: ['resolved', 'in_progress'] },
      assignedAt: { $exists: true },
      responses: { $exists: true, $ne: [] }
    };
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const requests = await Request.find(query)
      .select('assignedAt responses')
      .lean();

    if (requests.length === 0) {
      return 0;
    }

    let totalHours = 0;
    let count = 0;

    for (const request of requests) {
      if (request.responses && request.responses.length > 0) {
        const firstResponse = request.responses[0];
        if (request.assignedAt && firstResponse.timestamp) {
          const hours = (firstResponse.timestamp.getTime() - request.assignedAt.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          count++;
        }
      }
    }

    return count > 0 ? Math.round((totalHours / count) * 100) / 100 : 0;
  }

  /**
   * Get average resolution time (time from creation to resolution)
   */
  private async getAvgResolutionTime(organizationId?: mongoose.Types.ObjectId): Promise<number> {
    const query: any = {
      status: 'resolved',
      resolvedAt: { $exists: true }
    };
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const requests = await Request.find(query)
      .select('createdAt resolvedAt')
      .lean();

    if (requests.length === 0) {
      return 0;
    }

    let totalHours = 0;
    for (const request of requests) {
      if (request.createdAt && request.resolvedAt) {
        const hours = (request.resolvedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    }

    return Math.round((totalHours / requests.length) * 100) / 100;
  }

  /**
   * Get top performing organizations
   */
  private async getTopPerformers(organizationId?: mongoose.Types.ObjectId, limit: number = 10): Promise<Statistics['topPerformers']> {
    const query: any = { isActive: true, isVerified: true };
    if (organizationId) {
      query._id = organizationId;
    }

    const orgs = await Organization.find(query)
      .select('name statistics')
      .sort({
        'statistics.rating': -1,
        'statistics.responseRate': -1,
        'statistics.avgResponseTime': 1
      })
      .limit(limit)
      .lean();

    return orgs.map(org => ({
      orgName: org.name.uz || org.name.en || org.name.ru,
      orgId: org._id,
      resolvedCount: org.statistics?.resolvedRequests || 0,
      avgTime: org.statistics?.avgResponseTime || 0,
      rating: org.statistics?.rating || 0,
      responseRate: org.statistics?.responseRate || 0
    }));
  }

  /**
   * Get AI metrics
   */
  private async getAIMetrics(organizationId?: mongoose.Types.ObjectId): Promise<{
    accuracy: number;
    avgConfidence: number;
    humanReviewRate: number;
  }> {
    const query: any = {};
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    // Get all requests with AI classification
    const requests = await Request.find(query)
      .select('aiConfidence assignedBy')
      .lean();

    if (requests.length === 0) {
      return { accuracy: 0, avgConfidence: 0, humanReviewRate: 0 };
    }

    // Calculate average confidence
    const totalConfidence = requests.reduce((sum, req) => sum + (req.aiConfidence || 0), 0);
    const avgConfidence = Math.round((totalConfidence / requests.length) * 100) / 100;

    // Calculate human review rate (requests assigned by admin vs AI)
    const humanReviewed = requests.filter(req => req.assignedBy === 'admin').length;
    const humanReviewRate = Math.round((humanReviewed / requests.length) * 100 * 100) / 100;

    // AI accuracy - this would need feedback data to calculate properly
    // For now, we'll use a placeholder based on confidence
    // In production, track correct/incorrect classifications
    const accuracy = Math.round(avgConfidence * 0.9); // Simplified calculation

    return {
      accuracy,
      avgConfidence,
      humanReviewRate
    };
  }

  /**
   * Get time-based statistics
   */
  private async getTimeBasedStats(organizationId?: mongoose.Types.ObjectId): Promise<{
    today: number;
    week: number;
    month: number;
  }> {
    const query: any = {};
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayCount, weekCount, monthCount] = await Promise.all([
      Request.countDocuments({ ...query, createdAt: { $gte: today } }),
      Request.countDocuments({ ...query, createdAt: { $gte: weekAgo } }),
      Request.countDocuments({ ...query, createdAt: { $gte: monthAgo } })
    ]);

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount
    };
  }

  /**
   * Get user satisfaction metrics
   */
  private async getUserSatisfaction(organizationId?: mongoose.Types.ObjectId): Promise<{
    avgRating: number;
    totalRatings: number;
  }> {
    const query: any = {
      userRating: { $exists: true }
    };
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const requests = await Request.find(query)
      .select('userRating')
      .lean();

    if (requests.length === 0) {
      return { avgRating: 0, totalRatings: 0 };
    }

    const totalRating = requests.reduce((sum, req) => {
      return sum + (req.userRating?.score || 0);
    }, 0);

    const avgRating = Math.round((totalRating / requests.length) * 100) / 100;

    return {
      avgRating,
      totalRatings: requests.length
    };
  }

  /**
   * Get escalation metrics
   */
  private async getEscalationMetrics(organizationId?: mongoose.Types.ObjectId): Promise<{
    total: number;
    rate: number;
  }> {
    const query: any = {
      status: 'escalated'
    };
    if (organizationId) {
      query.assignedTo = organizationId;
    }

    const [escalatedCount, totalCount] = await Promise.all([
      Request.countDocuments(query),
      Request.countDocuments(organizationId ? { assignedTo: organizationId } : {})
    ]);

    const rate = totalCount > 0
      ? Math.round((escalatedCount / totalCount) * 100 * 100) / 100
      : 0;

    return {
      total: escalatedCount,
      rate
    };
  }

  /**
   * Generate dashboard message for admin
   */
  async generateDashboard(organizationId?: mongoose.Types.ObjectId, language: 'uz' | 'ru' | 'en' = 'uz'): Promise<string> {
    const stats = await this.getOverallStatistics(organizationId);

    const messages = {
      uz: `📊 *UZQueue Dashboard*\n\n` +
          `👥 Foydalanuvchilar: *${stats.totalUsers}*\n` +
          `📝 Murojaatlar: *${stats.totalRequests}*\n` +
          `🏢 Tashkilotlar: *${stats.totalOrganizations}*\n\n` +
          `*Holat bo'yicha:*\n` +
          `⏳ Kutilmoqda: ${stats.requestsByStatus.pending}\n` +
          `🔍 Tahlil qilinmoqda: ${stats.requestsByStatus.analyzing}\n` +
          `📋 Tayinlangan: ${stats.requestsByStatus.assigned}\n` +
          `🔄 Jarayonda: ${stats.requestsByStatus.inProgress}\n` +
          `✅ Hal qilindi: ${stats.requestsByStatus.resolved}\n` +
          `❌ Rad etildi: ${stats.requestsByStatus.rejected}\n` +
          `⬆️ Ko'tarildi: ${stats.requestsByStatus.escalated}\n\n` +
          `*O'rtacha vaqt:*\n` +
          `⏱ Javob: *${stats.avgResponseTime}h*\n` +
          `✔️ Hal qilish: *${stats.avgResolutionTime}h*\n\n` +
          `*AI samaradorligi:*\n` +
          `🎯 Aniqlik: *${stats.aiAccuracy}%*\n` +
          `🤖 O'rtacha ishonch: *${stats.avgConfidence}%*\n` +
          `👤 Admin ko'rib chiqish: *${stats.humanReviewRate}%*\n\n` +
          `*Vaqt bo'yicha:*\n` +
          `📅 Bugun: ${stats.requestsToday}\n` +
          `📆 Bu hafta: ${stats.requestsThisWeek}\n` +
          `📆 Bu oy: ${stats.requestsThisMonth}\n\n` +
          `*Foydalanuvchi qoniqishi:*\n` +
          `⭐ O'rtacha reyting: *${stats.avgRating}/5*\n` +
          `📊 Jami baholar: ${stats.totalRatings}\n\n` +
          `*Ko'tarilgan murojaatlar:*\n` +
          `⬆️ Jami: ${stats.totalEscalations}\n` +
          `📈 Ko'tarilish darajasi: *${stats.escalationRate}%*`,
      ru: `📊 *UZQueue Dashboard*\n\n` +
          `👥 Пользователи: *${stats.totalUsers}*\n` +
          `📝 Запросы: *${stats.totalRequests}*\n` +
          `🏢 Организации: *${stats.totalOrganizations}*\n\n` +
          `*По статусу:*\n` +
          `⏳ Ожидание: ${stats.requestsByStatus.pending}\n` +
          `🔍 Анализ: ${stats.requestsByStatus.analyzing}\n` +
          `📋 Назначено: ${stats.requestsByStatus.assigned}\n` +
          `🔄 В процессе: ${stats.requestsByStatus.inProgress}\n` +
          `✅ Решено: ${stats.requestsByStatus.resolved}\n` +
          `❌ Отклонено: ${stats.requestsByStatus.rejected}\n` +
          `⬆️ Эскалировано: ${stats.requestsByStatus.escalated}\n\n` +
          `*Среднее время:*\n` +
          `⏱ Ответ: *${stats.avgResponseTime}ч*\n` +
          `✔️ Решение: *${stats.avgResolutionTime}ч*\n\n` +
          `*Эффективность AI:*\n` +
          `🎯 Точность: *${stats.aiAccuracy}%*\n` +
          `🤖 Средняя уверенность: *${stats.avgConfidence}%*\n` +
          `👤 Проверка админом: *${stats.humanReviewRate}%*\n\n` +
          `*По времени:*\n` +
          `📅 Сегодня: ${stats.requestsToday}\n` +
          `📆 Эта неделя: ${stats.requestsThisWeek}\n` +
          `📆 Этот месяц: ${stats.requestsThisMonth}\n\n` +
          `*Удовлетворенность пользователей:*\n` +
          `⭐ Средний рейтинг: *${stats.avgRating}/5*\n` +
          `📊 Всего оценок: ${stats.totalRatings}\n\n` +
          `*Эскалированные запросы:*\n` +
          `⬆️ Всего: ${stats.totalEscalations}\n` +
          `📈 Уровень эскалации: *${stats.escalationRate}%*`,
      en: `📊 *UZQueue Dashboard*\n\n` +
          `👥 Users: *${stats.totalUsers}*\n` +
          `📝 Requests: *${stats.totalRequests}*\n` +
          `🏢 Organizations: *${stats.totalOrganizations}*\n\n` +
          `*By Status:*\n` +
          `⏳ Pending: ${stats.requestsByStatus.pending}\n` +
          `🔍 Analyzing: ${stats.requestsByStatus.analyzing}\n` +
          `📋 Assigned: ${stats.requestsByStatus.assigned}\n` +
          `🔄 In Progress: ${stats.requestsByStatus.inProgress}\n` +
          `✅ Resolved: ${stats.requestsByStatus.resolved}\n` +
          `❌ Rejected: ${stats.requestsByStatus.rejected}\n` +
          `⬆️ Escalated: ${stats.requestsByStatus.escalated}\n\n` +
          `*Average Time:*\n` +
          `⏱ Response: *${stats.avgResponseTime}h*\n` +
          `✔️ Resolution: *${stats.avgResolutionTime}h*\n\n` +
          `*AI Performance:*\n` +
          `🎯 Accuracy: *${stats.aiAccuracy}%*\n` +
          `🤖 Avg Confidence: *${stats.avgConfidence}%*\n` +
          `👤 Human Review: *${stats.humanReviewRate}%*\n\n` +
          `*Time-based:*\n` +
          `📅 Today: ${stats.requestsToday}\n` +
          `📆 This Week: ${stats.requestsThisWeek}\n` +
          `📆 This Month: ${stats.requestsThisMonth}\n\n` +
          `*User Satisfaction:*\n` +
          `⭐ Avg Rating: *${stats.avgRating}/5*\n` +
          `📊 Total Ratings: ${stats.totalRatings}\n\n` +
          `*Escalated Requests:*\n` +
          `⬆️ Total: ${stats.totalEscalations}\n` +
          `📈 Escalation Rate: *${stats.escalationRate}%*`
    };

    return messages[language] || messages.uz;
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();

