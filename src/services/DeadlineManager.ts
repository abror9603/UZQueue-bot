/**
 * DeadlineManager Service
 * Manages request deadlines, reminders, and auto-escalation
 * 
 * Features:
 * - 7-day deadline from creation
 * - Automated reminders (day 3, 5, 6)
 * - Auto-escalation if no response by day 7
 * - Multi-level escalation (local → regional → national)
 * - Notification to all parties
 */

import cron from 'node-cron';
import { Request, RequestDocument } from '../models/Request';
import { Organization } from '../models/Organization';
import { NotificationService } from './NotificationService';
import { SystemLog } from '../models/SystemLog';
import { log } from '../utils/logger';

export class DeadlineManager {
  private notificationService: NotificationService;
  private isRunning: boolean = false;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Schedule deadline checks (runs every 6 hours)
   */
  scheduleDeadlineChecks(): void {
    if (this.isRunning) {
      log.warn('DeadlineManager is already running');
      return;
    }

    // Run every 6 hours at minute 0
    cron.schedule('0 */6 * * *', async () => {
      await this.checkUpcomingDeadlines();
      await this.checkOverdueRequests();
    });

    // Also run immediately on startup
    this.checkUpcomingDeadlines().catch(err => {
      log.error('Error in initial deadline check', err);
    });
    this.checkOverdueRequests().catch(err => {
      log.error('Error in initial overdue check', err);
    });

    this.isRunning = true;
    log.info('✅ DeadlineManager scheduled (every 6 hours)');
  }

  /**
   * Check upcoming deadlines and send reminders
   */
  async checkUpcomingDeadlines(): Promise<void> {
    try {
      log.info('Checking upcoming deadlines...');

      const requests = await Request.find({
        status: { $in: ['assigned', 'in_progress'] },
        deadline: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }).populate('userId').populate('assignedTo');

      let remindersSent = 0;

      for (const request of requests) {
        const daysLeft = this.calculateDaysLeft(request.deadline);

        // Send reminders on day 3, 5, and 6
        if ([3, 5, 6].includes(daysLeft)) {
          await this.sendReminder(request, daysLeft);
          remindersSent++;
        }
      }

      log.info(`✅ Deadline check complete. ${remindersSent} reminders sent`);
    } catch (error) {
      log.error('Error checking upcoming deadlines', error);
      await SystemLog.logEvent('error', 'deadline_check_failed', { error: String(error) });
    }
  }

  /**
   * Check overdue requests and escalate
   */
  async checkOverdueRequests(): Promise<void> {
    try {
      log.info('Checking overdue requests...');

      const overdueRequests = await Request.find({
        status: { $nin: ['resolved', 'rejected'] },
        deadline: { $lt: new Date() }
      }).populate('userId').populate('assignedTo');

      let escalated = 0;

      for (const request of overdueRequests) {
        await this.escalateRequest(request);
        escalated++;
      }

      log.info(`✅ Overdue check complete. ${escalated} requests escalated`);
    } catch (error) {
      log.error('Error checking overdue requests', error);
      await SystemLog.logEvent('error', 'overdue_check_failed', { error: String(error) });
    }
  }

  /**
   * Calculate days until deadline
   */
  private calculateDaysLeft(deadline: Date): number {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  /**
   * Send deadline reminder
   */
  private async sendReminder(
    request: RequestDocument,
    daysLeft: number
  ): Promise<void> {
    try {
      // Check if reminder already sent for this day
      const reminderKey = `reminder_${daysLeft}_${request._id}`;
      // In production, use Redis or database to track sent reminders
      // For now, we'll send it every time (can be optimized later)

      await this.notificationService.sendDeadlineReminder(
        request._id,
        daysLeft
      );

      // Log the reminder
      await SystemLog.logEvent(
        'user_action',
        'deadline_reminder_sent',
        {
          requestId: request._id,
          daysLeft,
          trackingId: request.trackingId
        },
        {
          requestId: request._id,
          result: 'success'
        }
      );

      log.info(`Reminder sent for request ${request.trackingId} (${daysLeft} days left)`);
    } catch (error) {
      log.error(`Error sending reminder for request ${request.trackingId}`, error);
      await SystemLog.logEvent(
        'error',
        'reminder_send_failed',
        {
          requestId: request._id,
          error: String(error)
        },
        {
          requestId: request._id,
          result: 'failure',
          errorMessage: String(error)
        }
      );
    }
  }

  /**
   * Escalate overdue request
   */
  async escalateRequest(request: RequestDocument): Promise<void> {
    try {
      if (!request.assignedTo) {
        // No organization assigned - send to super admin
        await this.notifySuperAdmin(request, 'No organization assigned');
        return;
      }

      const currentOrg = await Organization.findById(request.assignedTo);
      if (!currentOrg) {
        await this.notifySuperAdmin(request, 'Organization not found');
        return;
      }

      // Find parent organization
      const parentOrg = currentOrg.parentId
        ? await Organization.findById(currentOrg.parentId)
        : null;

      if (parentOrg && parentOrg.isActive && parentOrg.isVerified) {
        // Escalate to parent organization
        await this.performEscalation(request, currentOrg, parentOrg);
      } else {
        // Already at top level - create public notification
        await this.createPublicNotification(request, currentOrg);
      }

      // Log escalation
      await SystemLog.logEvent(
        'escalation',
        'request_escalated',
        {
          requestId: request._id,
          fromOrgId: currentOrg._id,
          toOrgId: parentOrg?._id || null,
          escalationLevel: request.escalationLevel + 1,
          reason: 'Deadline exceeded'
        },
        {
          requestId: request._id,
          organizationId: currentOrg._id,
          result: 'success'
        }
      );
    } catch (error) {
      log.error(`Error escalating request ${request.trackingId}`, error);
      await SystemLog.logEvent(
        'error',
        'escalation_failed',
        {
          requestId: request._id,
          error: String(error)
        },
        {
          requestId: request._id,
          result: 'failure',
          errorMessage: String(error)
        }
      );
    }
  }

  /**
   * Perform escalation to parent organization
   */
  private async performEscalation(
    request: RequestDocument,
    fromOrg: any,
    toOrg: any
  ): Promise<void> {
    const reason = `Deadline exceeded (${this.calculateDaysLeft(request.deadline)} days overdue). Escalated from ${fromOrg.name.uz}`;

    // Update request
    await request.escalate(toOrg._id, reason, 'system');

    // Notify new organization
    await this.notificationService.notifyOrganization(
      toOrg._id,
      request._id,
      `New escalated request: ${request.trackingId}`
    );

    // Notify user
    await this.notificationService.notifyStatusChange(
      request._id,
      'escalated',
      `Murojaatingiz yuqori tashkilotga ko'tarildi: ${toOrg.name.uz}`
    );

    // Notify old organization
    await this.notificationService.notifyOrganization(
      fromOrg._id,
      request._id,
      `Request escalated to parent organization: ${toOrg.name.uz}`
    );

    log.info(`Request ${request.trackingId} escalated from ${fromOrg.name.uz} to ${toOrg.name.uz}`);
  }

  /**
   * Create public notification for top-level escalation
   */
  private async createPublicNotification(
    request: RequestDocument,
    org: any
  ): Promise<void> {
    // Mark request as escalated but keep assigned to current org
    request.status = 'escalated';
    request.escalationLevel += 1;
    request.escalationHistory.push({
      fromOrgId: org._id,
      toOrgId: org._id, // Same org, but marked as escalated
      reason: 'Deadline exceeded - public notification required',
      date: new Date(),
      escalatedBy: 'system'
    });
    await request.save();

    // Notify super admins
    await this.notifySuperAdmin(
      request,
      `Top-level escalation required for ${org.name.uz}`
    );

    // Notify user
    await this.notificationService.notifyStatusChange(
      request._id,
      'escalated',
      'Murojaatingiz muddati o\'tdi. Super admin ko\'rib chiqmoqda.'
    );

    log.warn(`Request ${request.trackingId} escalated to top level (${org.name.uz})`);
  }

  /**
   * Notify super admin about critical issues
   */
  private async notifySuperAdmin(
    request: RequestDocument,
    reason: string
  ): Promise<void> {
    try {
      const { getEnv } = await import('../config/env');
      const env = getEnv();
      const superAdminIds = env.SUPER_ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];

      if (superAdminIds.length === 0) {
        log.warn('No super admin IDs configured');
        return;
      }

      // Import bot to send notifications
      const { bot } = await import('../bot');

      const message = `🚨 *Critical: Request Escalation*\n\n` +
        `Tracking ID: ${request.trackingId}\n` +
        `Reason: ${reason}\n` +
        `Status: ${request.status}\n` +
        `Deadline: ${request.deadline.toLocaleDateString()}\n` +
        `Escalation Level: ${request.escalationLevel}\n\n` +
        `Please review and take action.`;

      for (const adminId of superAdminIds) {
        try {
          await bot.telegram.sendMessage(adminId, message, { parse_mode: 'Markdown' });
        } catch (error) {
          log.error(`Failed to notify super admin ${adminId}`, error);
        }
      }

      log.info(`Super admins notified about request ${request.trackingId}`);
    } catch (error) {
      log.error('Error notifying super admin', error);
    }
  }

  /**
   * Manually trigger deadline check (for testing)
   */
  async manualCheck(): Promise<{ upcoming: number; overdue: number }> {
    log.info('Manual deadline check triggered');
    
    const upcomingBefore = await Request.countDocuments({
      status: { $in: ['assigned', 'in_progress'] },
      deadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const overdueBefore = await Request.countDocuments({
      status: { $nin: ['resolved', 'rejected'] },
      deadline: { $lt: new Date() }
    });

    await this.checkUpcomingDeadlines();
    await this.checkOverdueRequests();

    return {
      upcoming: upcomingBefore,
      overdue: overdueBefore
    };
  }
}

// Export singleton instance
export const deadlineManager = new DeadlineManager();

