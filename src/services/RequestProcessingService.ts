/**
 * Request Processing Service
 * Orchestrates request creation, AI classification, and routing
 */

import { ExtendedContext } from '../types/context';
import { Request, User } from '../models';
import { classifyRequest } from './ClassificationService';
import { routeRequest } from './RoutingService';
import { log } from '../utils/logger';
import { AI_CONFIG } from '../config/constants';
import mongoose from 'mongoose';

/**
 * Process newly created request
 * 1. Classify with AI
 * 2. Update request status
 * 3. Trigger routing (Step 7)
 */
export async function processRequest(
  requestId: mongoose.Types.ObjectId
): Promise<void> {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      log.error('Request not found for processing', { requestId });
      return;
    }

    log.info('Processing request', { requestId, trackingId: request.trackingId });

    // Get request text (from text or voice transcription)
    let requestText = request.text;
    
    if (request.voiceMessage?.transcription) {
      requestText = request.voiceMessage.transcription;
    }

    if (!requestText || requestText.trim().length === 0) {
      log.warn('Request has no text for classification', { requestId });
      await Request.findByIdAndUpdate(requestId, {
        status: 'pending',
        category: 'OTHER',
        aiConfidence: 0
      });
      return;
    }

    // Classify request
    const classification = await classifyRequest(
      requestId,
      requestText,
      'uz' // Default language, can be improved with user language
    );

    log.info('Request classified', {
      requestId,
      category: classification.category,
      confidence: classification.confidence,
      needsHumanReview: classification.needsHumanReview
    });

    // Get user region for routing
    const user = await User.findById(request.userId);
    const userRegion = user?.region;

    // Trigger routing
    const routingResult = await routeRequest(
      requestId,
      classification,
      userRegion
    );

    log.info('Request routed', {
      requestId,
      success: routingResult.success,
      method: routingResult.method,
      organizationId: routingResult.organizationId
    });

  } catch (error) {
    log.error('Error processing request', error, { requestId });
    
    // Mark request as pending for manual review
    await Request.findByIdAndUpdate(requestId, {
      status: 'pending',
      category: 'OTHER',
      aiConfidence: 0
    });
  }
}

/**
 * Process request asynchronously (non-blocking)
 */
export function processRequestAsync(requestId: mongoose.Types.ObjectId): void {
  // Process in background without blocking
  setImmediate(() => {
    processRequest(requestId).catch(error => {
      log.error('Error in async request processing', error, { requestId });
    });
  });
}

