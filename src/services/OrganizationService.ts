/**
 * Organization Service
 * Handles organization registration and management
 */

import { Organization, User } from '../models';
import { log } from '../utils/logger';
import { SystemLog } from '../models';
import mongoose from 'mongoose';

/**
 * Register new organization
 */
export async function registerOrganization(
  adminTelegramId: number,
  data: {
    name: { uz: string; ru: string; en: string };
    shortName: string;
    type: 'ministry' | 'department' | 'local_office' | 'utility';
    categories: string[];
    region?: string;
    level: 1 | 2 | 3;
    telegramChatId?: number;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
      workingHours?: string;
    };
  }
): Promise<any> {
  try {
    // Check if admin already has organization
    const existingUser = await User.findByTelegramId(adminTelegramId);
    if (existingUser?.organizationId) {
      throw new Error('User already has an organization');
    }

    // Create organization
    const organization = await Organization.create({
      ...data,
      isVerified: false, // Requires super admin approval
      isActive: false,
      adminUsers: [adminTelegramId],
      statistics: {
        totalRequests: 0,
        resolvedRequests: 0,
        avgResponseTime: 0,
        responseRate: 0,
        rating: 0
      }
    });

    // Update user role
    if (existingUser) {
      existingUser.role = 'org_admin';
      existingUser.organizationId = organization._id;
      await existingUser.save();
    } else {
      // Create user if doesn't exist
      await User.create({
        telegramId: adminTelegramId,
        role: 'org_admin',
        organizationId: organization._id,
        isActive: true,
        language: 'uz',
        metadata: {
          totalRequests: 0,
          resolvedRequests: 0
        }
      });
    }

    // Log event
    await SystemLog.logEvent('admin_action', 'organization_registered', {
      organizationId: organization._id,
      adminTelegramId,
      name: data.name.uz
    }, {
      userId: adminTelegramId,
      organizationId: organization._id,
      result: 'success'
    });

    log.info('Organization registered', {
      organizationId: organization._id,
      adminTelegramId
    });

    return organization;
  } catch (error) {
    log.error('Error registering organization', error);
    throw error;
  }
}

/**
 * Verify organization (super admin action)
 */
export async function verifyOrganization(
  organizationId: mongoose.Types.ObjectId,
  verifiedBy: number
): Promise<void> {
  try {
    await Organization.findByIdAndUpdate(organizationId, {
      isVerified: true,
      isActive: true
    });

    const organization = await Organization.findById(organizationId);
    if (organization && organization.telegramChatId) {
      // Notify organization admins
      const { bot } = await import('../bot');
      await bot.telegram.sendMessage(
        organization.telegramChatId,
        `✅ *Tashkilot tasdiqlandi!*\n\n` +
        `Sizning tashkilotingiz tasdiqlandi va faollashtirildi. ` +
        `Endi siz murojaatlarni qabul qila olasiz.`
      );
    }

    await SystemLog.logEvent('admin_action', 'organization_verified', {
      organizationId,
      verifiedBy
    }, {
      userId: verifiedBy,
      organizationId,
      result: 'success'
    });

    log.info('Organization verified', { organizationId, verifiedBy });
  } catch (error) {
    log.error('Error verifying organization', error);
    throw error;
  }
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(
  organizationId: mongoose.Types.ObjectId
): Promise<any> {
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const stats = organization.statistics || {
      totalRequests: 0,
      resolvedRequests: 0,
      avgResponseTime: 0,
      responseRate: 0,
      rating: 0
    };

    // Get recent requests
    const { Request } = await import('../models');
    const recentRequests = await Request.find({
      assignedTo: organizationId
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId');

    return {
      organization: {
        name: organization.name,
        shortName: organization.shortName,
        type: organization.type,
        region: organization.region
      },
      statistics: stats,
      recentRequests: recentRequests.map(req => ({
        trackingId: req.trackingId,
        status: req.status,
        category: req.category,
        createdAt: req.createdAt,
        deadline: req.deadline
      }))
    };
  } catch (error) {
    log.error('Error getting organization stats', error);
    throw error;
  }
}

/**
 * Get pending organizations (for super admin)
 */
export async function getPendingOrganizations(): Promise<any[]> {
  try {
    return await Organization.find({
      isVerified: false
    }).sort({ createdAt: -1 });
  } catch (error) {
    log.error('Error getting pending organizations', error);
    return [];
  }
}

