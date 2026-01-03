/**
 * Request Service
 * Handles request creation, validation, and tracking ID generation
 */

import { ExtendedContext } from '../types/context';
import { Request, RequestDocument } from '../models';
import { MediaFile, VoiceMessage, RequestPriority } from '../types';
import { TRACKING_ID_PREFIX, VALIDATION } from '../config/constants';
import { log } from '../utils/logger';
import { SystemLog } from '../models';
import mongoose from 'mongoose';

/**
 * Generate unique tracking ID
 * Format: UZQ-XXXXXX (6 digits)
 */
async function generateTrackingId(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
    const trackingId = `${TRACKING_ID_PREFIX}-${randomNum}`;

    const exists = await Request.findOne({ trackingId });
    if (!exists) {
      return trackingId;
    }

    attempts++;
  }

  // Fallback: use timestamp-based ID
  const timestamp = Date.now().toString().slice(-6);
  return `${TRACKING_ID_PREFIX}-${timestamp}`;
}

/**
 * Create a new request from text
 */
export async function createTextRequest(
  userId: mongoose.Types.ObjectId,
  userTelegramId: number,
  text: string,
  priority: RequestPriority = 'medium'
): Promise<RequestDocument> {
  try {
    // Validate text length
    if (text.length < VALIDATION.MIN_REQUEST_TEXT_LENGTH) {
      throw new Error(`Text must be at least ${VALIDATION.MIN_REQUEST_TEXT_LENGTH} characters`);
    }

    if (text.length > VALIDATION.MAX_REQUEST_TEXT_LENGTH) {
      throw new Error(`Text must not exceed ${VALIDATION.MAX_REQUEST_TEXT_LENGTH} characters`);
    }

    // Generate tracking ID
    const trackingId = await generateTrackingId();

    // Calculate deadline (7 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    // Create request
    const request = await Request.create({
      trackingId,
      userId,
      userTelegramId,
      text: text.trim(),
      status: 'pending',
      priority,
      deadline,
      aiConfidence: 0, // Will be set after AI classification
      keywords: [],
      category: 'OTHER', // Will be set after AI classification
      escalationLevel: 0,
      responses: [],
      escalationHistory: [],
      tags: []
    });

    // Log event
    await SystemLog.logEvent('user_action', 'request_created', {
      requestId: request._id,
      trackingId,
      userId: userTelegramId
    }, {
      userId: userTelegramId,
      requestId: request._id,
      result: 'success'
    });

    log.info('Text request created', {
      requestId: request._id,
      trackingId,
      userId: userTelegramId
    });

    // Trigger AI classification (async)
    const { processRequestAsync } = await import('./RequestProcessingService');
    processRequestAsync(request._id);

    return request;
  } catch (error) {
    log.error('Error creating text request', error);
    throw error;
  }
}

/**
 * Create a new request with media files
 */
export async function createMediaRequest(
  userId: mongoose.Types.ObjectId,
  userTelegramId: number,
  text: string,
  media: MediaFile[],
  priority: RequestPriority = 'medium'
): Promise<RequestDocument> {
  try {
    // Validate text
    if (text.length < VALIDATION.MIN_REQUEST_TEXT_LENGTH) {
      throw new Error(`Text must be at least ${VALIDATION.MIN_REQUEST_TEXT_LENGTH} characters`);
    }

    // Validate media count
    if (media.length > VALIDATION.MAX_MEDIA_FILES) {
      throw new Error(`Maximum ${VALIDATION.MAX_MEDIA_FILES} media files allowed`);
    }

    // Generate tracking ID
    const trackingId = await generateTrackingId();

    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    // Create request
    const request = await Request.create({
      trackingId,
      userId,
      userTelegramId,
      text: text.trim(),
      media,
      status: 'pending',
      priority,
      deadline,
      aiConfidence: 0,
      keywords: [],
      category: 'OTHER',
      escalationLevel: 0,
      responses: [],
      escalationHistory: [],
      tags: []
    });

    // Log event
    await SystemLog.logEvent('user_action', 'request_created_with_media', {
      requestId: request._id,
      trackingId,
      userId: userTelegramId,
      mediaCount: media.length
    }, {
      userId: userTelegramId,
      requestId: request._id,
      result: 'success'
    });

    log.info('Media request created', {
      requestId: request._id,
      trackingId,
      userId: userTelegramId,
      mediaCount: media.length
    });

    // Trigger AI classification (async)
    const { processRequestAsync } = await import('./RequestProcessingService');
    processRequestAsync(request._id);

    return request;
  } catch (error) {
    log.error('Error creating media request', error);
    throw error;
  }
}

/**
 * Create a new request with voice message
 */
export async function createVoiceRequest(
  userId: mongoose.Types.ObjectId,
  userTelegramId: number,
  text: string,
  voiceMessage: VoiceMessage,
  priority: RequestPriority = 'medium'
): Promise<RequestDocument> {
  try {
    // Validate voice duration
    if (voiceMessage.duration > VALIDATION.MAX_VOICE_DURATION) {
      throw new Error(`Voice message must not exceed ${VALIDATION.MAX_VOICE_DURATION} seconds`);
    }

    // Generate tracking ID
    const trackingId = await generateTrackingId();

    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    // Create request
    const request = await Request.create({
      trackingId,
      userId,
      userTelegramId,
      text: text.trim() || (voiceMessage.transcription || 'Ovozli xabar'),
      voiceMessage,
      status: 'pending',
      priority,
      deadline,
      aiConfidence: 0,
      keywords: [],
      category: 'OTHER',
      escalationLevel: 0,
      responses: [],
      escalationHistory: [],
      tags: []
    });

    // Log event
    await SystemLog.logEvent('user_action', 'request_created_with_voice', {
      requestId: request._id,
      trackingId,
      userId: userTelegramId,
      voiceDuration: voiceMessage.duration
    }, {
      userId: userTelegramId,
      requestId: request._id,
      result: 'success'
    });

    log.info('Voice request created', {
      requestId: request._id,
      trackingId,
      userId: userTelegramId
    });

    // TODO: Step 6.5 - Voice transcription
    // For now, trigger classification with placeholder text
    // In future, add voice transcription service
    const { processRequestAsync } = await import('./RequestProcessingService');
    processRequestAsync(request._id);

    return request;
  } catch (error) {
    log.error('Error creating voice request', error);
    throw error;
  }
}

/**
 * Get request by tracking ID
 */
export async function getRequestByTrackingId(
  trackingId: string
): Promise<RequestDocument | null> {
  try {
    return await Request.findByTrackingId(trackingId);
  } catch (error) {
    log.error('Error getting request by tracking ID', error);
    throw error;
  }
}

/**
 * Get user's requests
 */
export async function getUserRequests(
  userId: mongoose.Types.ObjectId,
  options?: {
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<RequestDocument[]> {
  try {
    return await Request.findByUser(userId, options);
  } catch (error) {
    log.error('Error getting user requests', error);
    throw error;
  }
}

/**
 * Update request status
 */
export async function updateRequestStatus(
  requestId: mongoose.Types.ObjectId,
  status: string,
  updatedBy?: number
): Promise<RequestDocument | null> {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return null;
    }

    request.status = status as any;
    await request.save();

    // Log event
    await SystemLog.logEvent('user_action', 'request_status_updated', {
      requestId,
      oldStatus: request.status,
      newStatus: status
    }, {
      userId: updatedBy,
      requestId,
      result: 'success'
    });

    return request;
  } catch (error) {
    log.error('Error updating request status', error);
    throw error;
  }
}

