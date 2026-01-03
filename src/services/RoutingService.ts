/**
 * Routing Service
 * Matches classified requests to appropriate organizations
 */

import { Organization, Request } from '../models';
import { ClassificationResult, RoutingResult } from '../types';
import { AI_CONFIG } from '../config/constants';
import { log } from '../utils/logger';
import { SystemLog } from '../models';
import mongoose from 'mongoose';

/**
 * Route request to appropriate organization
 */
export async function routeRequest(
  requestId: mongoose.Types.ObjectId,
  classification: ClassificationResult,
  userRegion?: string
): Promise<RoutingResult> {
  try {
    log.info('Routing request', { requestId, category: classification.category });

    // Step 1: Find candidate organizations
    const candidates = await findCandidateOrganizations(
      classification.category,
      userRegion
    );

    if (candidates.length === 0) {
      log.warn('No organizations found for category', {
        requestId,
        category: classification.category
      });

      // Mark for super admin review
      await Request.findByIdAndUpdate(requestId, {
        status: 'pending'
      });

      await SystemLog.logEvent('assignment', 'no_organizations_found', {
        requestId,
        category: classification.category
      }, {
        requestId,
        result: 'failure'
      });

      return {
        success: false,
        method: 'super_admin',
        reason: 'No organizations found for this category'
      };
    }

    // Step 2: Rank organizations by performance
    const ranked = rankByPerformance(candidates);

    // Step 3: Decision logic
    if (
      classification.confidence >= AI_CONFIG.MIN_CONFIDENCE_FOR_AUTO_ASSIGN &&
      ranked.length === 1 &&
      !classification.needsHumanReview
    ) {
      // Auto-assign with high confidence
      return await autoAssign(requestId, ranked[0], classification);
    } else if (
      classification.confidence >= AI_CONFIG.MIN_CONFIDENCE_FOR_ADMIN_REVIEW &&
      ranked.length > 0
    ) {
      // Request admin confirmation
      return await requestAdminConfirmation(requestId, ranked, classification);
    } else {
      // Send to super admin
      return await sendToSuperAdmin(requestId, classification);
    }
  } catch (error) {
    log.error('Error routing request', error, { requestId });
    
    await SystemLog.logEvent('error', 'routing_failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      requestId,
      result: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      method: 'super_admin',
      reason: 'Routing failed due to error'
    };
  }
}

/**
 * Find candidate organizations for category
 */
async function findCandidateOrganizations(
  category: string,
  region?: string
): Promise<any[]> {
  try {
    const query: any = {
      categories: category,
      isActive: true,
      isVerified: true
    };

    if (region) {
      query.region = region;
    }

    const organizations = await Organization.find(query);

    // If no organizations in user's region, try without region filter
    if (organizations.length === 0 && region) {
      const orgsWithoutRegion = await Organization.find({
        categories: category,
        isActive: true,
        isVerified: true
      });

      return orgsWithoutRegion;
    }

    return organizations;
  } catch (error) {
    log.error('Error finding candidate organizations', error);
    return [];
  }
}

/**
 * Rank organizations by performance metrics
 * Weight: responseRate (50%), avgResponseTime (30%), rating (20%)
 */
function rankByPerformance(organizations: any[]): any[] {
  return organizations
    .map(org => {
      const stats = org.statistics || {};
      
      // Normalize metrics (0-100 scale)
      const responseRate = Math.min(stats.responseRate || 0, 100);
      const rating = (stats.rating || 0) * 20; // Convert 0-5 to 0-100
      
      // Invert response time (lower is better)
      // Assume max response time is 168 hours (7 days)
      const maxResponseTime = 168;
      const responseTimeScore = Math.max(
        0,
        100 - ((stats.avgResponseTime || maxResponseTime) / maxResponseTime) * 100
      );

      // Calculate weighted score
      const score =
        responseRate * 0.5 +
        responseTimeScore * 0.3 +
        rating * 0.2;

      return {
        ...org.toObject(),
        _performanceScore: score
      };
    })
    .sort((a, b) => b._performanceScore - a._performanceScore);
}

/**
 * Auto-assign request to organization
 */
async function autoAssign(
  requestId: mongoose.Types.ObjectId,
  organization: any,
  classification: ClassificationResult
): Promise<RoutingResult> {
  try {
    await Request.findByIdAndUpdate(requestId, {
      assignedTo: organization._id,
      assignedBy: 'ai',
      assignedAt: new Date(),
      status: 'assigned'
    });

    // Update organization statistics
    await Organization.findByIdAndUpdate(organization._id, {
      $inc: { 'statistics.totalRequests': 1 }
    });

    // Log event
    await SystemLog.logEvent('assignment', 'auto_assigned', {
      requestId,
      organizationId: organization._id,
      organizationName: organization.name?.uz || organization.shortName,
      category: classification.category,
      confidence: classification.confidence
    }, {
      requestId,
      organizationId: organization._id,
      result: 'success'
    });

    log.info('Request auto-assigned', {
      requestId,
      organizationId: organization._id,
      confidence: classification.confidence
    });

    // Send notification to organization
    const { notifyOrganization } = await import('./NotificationService');
    const request = await Request.findById(requestId).populate('assignedTo');
    if (request) {
      await notifyOrganization(organization._id, request);
    }

    // Notify user
    const { notifyUserStatusChange } = await import('./NotificationService');
    await notifyUserStatusChange(request!.userTelegramId, request!, 'assigned');

    return {
      success: true,
      organizationId: organization._id,
      organizationName: organization.name?.uz || organization.shortName,
      method: 'auto'
    };
  } catch (error) {
    log.error('Error auto-assigning request', error, { requestId });
    throw error;
  }
}

/**
 * Request admin confirmation for assignment
 */
async function requestAdminConfirmation(
  requestId: mongoose.Types.ObjectId,
  candidates: any[],
  classification: ClassificationResult
): Promise<RoutingResult> {
  try {
    // For now, assign to top candidate but mark for review
    // In future, send notification to admin for confirmation
    const topCandidate = candidates[0];

    await Request.findByIdAndUpdate(requestId, {
      assignedTo: topCandidate._id,
      assignedBy: 'ai',
      assignedAt: new Date(),
      status: 'assigned',
      internalNotes: [
        ...(await Request.findById(requestId).then(r => r?.internalNotes || [])),
        `AI assigned with ${classification.confidence}% confidence. Requires admin review.`
      ]
    });

    // Update organization statistics
    await Organization.findByIdAndUpdate(topCandidate._id, {
      $inc: { 'statistics.totalRequests': 1 }
    });

    // Log event
    await SystemLog.logEvent('assignment', 'admin_review_required', {
      requestId,
      organizationId: topCandidate._id,
      category: classification.category,
      confidence: classification.confidence,
      candidatesCount: candidates.length
    }, {
      requestId,
      organizationId: topCandidate._id,
      result: 'success'
    });

    log.info('Request assigned (admin review required)', {
      requestId,
      organizationId: topCandidate._id,
      confidence: classification.confidence
    });

    // Send notification to organization
    const { notifyOrganization } = await import('./NotificationService');
    const request = await Request.findById(requestId).populate('assignedTo');
    if (request) {
      await notifyOrganization(topCandidate._id, request);
    }

    // Notify user
    const { notifyUserStatusChange } = await import('./NotificationService');
    await notifyUserStatusChange(request!.userTelegramId, request!, 'assigned');

    return {
      success: true,
      organizationId: topCandidate._id,
      organizationName: topCandidate.name?.uz || topCandidate.shortName,
      method: 'admin_confirm',
      candidates: candidates.map(c => c._id),
      reason: `Assigned with ${classification.confidence}% confidence. Admin review recommended.`
    };
  } catch (error) {
    log.error('Error requesting admin confirmation', error, { requestId });
    throw error;
  }
}

/**
 * Send to super admin for manual assignment
 */
async function sendToSuperAdmin(
  requestId: mongoose.Types.ObjectId,
  classification: ClassificationResult
): Promise<RoutingResult> {
  try {
    await Request.findByIdAndUpdate(requestId, {
      status: 'pending',
      internalNotes: [
        ...(await Request.findById(requestId).then(r => r?.internalNotes || [])),
        `Low confidence (${classification.confidence}%) or ambiguous. Requires super admin review.`
      ]
    });

    // Log event
    await SystemLog.logEvent('assignment', 'super_admin_review', {
      requestId,
      category: classification.category,
      confidence: classification.confidence,
      reasoning: classification.reasoning
    }, {
      requestId,
      result: 'pending'
    });

    log.info('Request sent to super admin', {
      requestId,
      confidence: classification.confidence
    });

    // Send notification to super admin
    const { notifySuperAdmin } = await import('./NotificationService');
    const request = await Request.findById(requestId);
    if (request) {
      await notifySuperAdmin(
        request,
        `Low confidence (${classification.confidence}%) or needs human review`
      );
    }

    return {
      success: false,
      method: 'super_admin',
      reason: `Low confidence (${classification.confidence}%) or needs human review`
    };
  } catch (error) {
    log.error('Error sending to super admin', error, { requestId });
    throw error;
  }
}

/**
 * Get routing statistics
 */
export async function getRoutingStats(): Promise<{
  totalRouted: number;
  autoAssigned: number;
  adminConfirmed: number;
  superAdminReview: number;
  avgConfidence: number;
}> {
  try {
    const requests = await Request.find({
      status: { $in: ['assigned', 'in_progress'] }
    });

    const stats = {
      totalRouted: requests.length,
      autoAssigned: 0,
      adminConfirmed: 0,
      superAdminReview: 0,
      avgConfidence: 0
    };

    let totalConfidence = 0;

    for (const request of requests) {
      if (request.assignedBy === 'ai' && request.aiConfidence >= AI_CONFIG.MIN_CONFIDENCE_FOR_AUTO_ASSIGN) {
        stats.autoAssigned++;
      } else if (request.assignedBy === 'ai') {
        stats.adminConfirmed++;
      } else {
        stats.superAdminReview++;
      }

      totalConfidence += request.aiConfidence || 0;
    }

    stats.avgConfidence = requests.length > 0 
      ? Math.round(totalConfidence / requests.length) 
      : 0;

    return stats;
  } catch (error) {
    log.error('Error getting routing stats', error);
    return {
      totalRouted: 0,
      autoAssigned: 0,
      adminConfirmed: 0,
      superAdminReview: 0,
      avgConfidence: 0
    };
  }
}

