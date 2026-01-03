/**
 * Request Model
 * Represents a citizen's request to a government organization
 */

import mongoose, { Schema, Document } from 'mongoose';
import { 
  IRequest, 
  RequestStatus, 
  RequestPriority,
  MediaFile,
  VoiceMessage,
  RequestResponse,
  EscalationHistory,
  UserRating
} from '../types';

export interface RequestDocument extends IRequest, Document {}

const MediaFileSchema = new Schema<MediaFile>(
  {
    type: {
      type: String,
      enum: ['photo', 'document', 'video'],
      required: true
    },
    fileId: {
      type: String,
      required: true
    },
    fileName: {
      type: String
    }
  },
  { _id: false }
);

const VoiceMessageSchema = new Schema<VoiceMessage>(
  {
    fileId: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    transcription: {
      type: String
    }
  },
  { _id: false }
);

const RequestResponseSchema = new Schema<RequestResponse>(
  {
    fromUserId: {
      type: Number,
      required: true
    },
    fromOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    text: {
      type: String,
      required: true
    },
    media: {
      type: [MediaFileSchema],
      default: []
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const EscalationHistorySchema = new Schema<EscalationHistory>(
  {
    fromOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    toOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    escalatedBy: {
      type: String,
      enum: ['system', 'admin'],
      required: true
    }
  },
  { _id: false }
);

const UserRatingSchema = new Schema<UserRating>(
  {
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const RequestSchema = new Schema<RequestDocument>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userTelegramId: {
      type: Number,
      required: true
    },
    
    // Request content
    text: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000
    },
    media: {
      type: [MediaFileSchema],
      default: []
    },
    voiceMessage: {
      type: VoiceMessageSchema
    },
    
    // Classification
    category: {
      type: String,
      required: true
    },
    subCategory: {
      type: String
    },
    aiConfidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    keywords: {
      type: [String],
      default: []
    },
    
    // Assignment
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'assigned', 'in_progress', 'resolved', 'rejected', 'escalated'],
      default: 'pending',
      required: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    assignedBy: {
      type: String,
      enum: ['ai', 'admin']
    },
    assignedAt: {
      type: Date
    },
    
    // Timing
    deadline: {
      type: Date,
      required: true
    },
    resolvedAt: {
      type: Date
    },
    responseTime: {
      type: Number // in hours
    },
    
    // Escalation
    escalationLevel: {
      type: Number,
      default: 0
    },
    escalationHistory: {
      type: [EscalationHistorySchema],
      default: []
    },
    
    // Communication
    responses: {
      type: [RequestResponseSchema],
      default: []
    },
    
    // Metadata
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    tags: {
      type: [String],
      default: []
    },
    internalNotes: {
      type: [String],
      default: []
    },
    
    // User feedback
    userRating: {
      type: UserRatingSchema
    }
  },
  {
    timestamps: true,
    collection: 'requests'
  }
);

// Indexes for performance
RequestSchema.index({ trackingId: 1 });
RequestSchema.index({ userId: 1 });
RequestSchema.index({ userTelegramId: 1 });
RequestSchema.index({ status: 1 });
RequestSchema.index({ category: 1 });
RequestSchema.index({ assignedTo: 1 });
RequestSchema.index({ deadline: 1 });
RequestSchema.index({ priority: 1 });
RequestSchema.index({ createdAt: -1 });
RequestSchema.index({ status: 1, deadline: 1 }); // For deadline queries

// Compound indexes
RequestSchema.index({ userId: 1, status: 1 });
RequestSchema.index({ assignedTo: 1, status: 1 });

// Virtual for days until deadline
RequestSchema.virtual('daysUntilDeadline').get(function (this: RequestDocument) {
  const now = new Date();
  const diff = this.deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
RequestSchema.virtual('isOverdue').get(function (this: RequestDocument) {
  return new Date() > this.deadline && 
         !['resolved', 'rejected'].includes(this.status);
});

// Methods
RequestSchema.methods.addResponse = function (response: RequestResponse) {
  this.responses.push(response);
  return this.save();
};

RequestSchema.methods.escalate = function (
  toOrgId: mongoose.Types.ObjectId,
  reason: string,
  escalatedBy: 'system' | 'admin'
) {
  this.escalationHistory.push({
    fromOrgId: this.assignedTo,
    toOrgId,
    reason,
    date: new Date(),
    escalatedBy
  });
  
  this.assignedTo = toOrgId;
  this.escalationLevel += 1;
  this.status = 'escalated';
  this.assignedAt = new Date();
  
  return this.save();
};

RequestSchema.methods.resolve = function (responseTime?: number) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  
  if (responseTime !== undefined) {
    this.responseTime = responseTime;
  } else if (this.assignedAt) {
    // Calculate response time in hours
    const hours = (this.resolvedAt.getTime() - this.assignedAt.getTime()) / (1000 * 60 * 60);
    this.responseTime = Math.round(hours * 100) / 100;
  }
  
  return this.save();
};

RequestSchema.methods.addRating = function (score: number, comment?: string) {
  this.userRating = {
    score,
    comment,
    ratedAt: new Date()
  };
  return this.save();
};

// Static methods
RequestSchema.statics.findByTrackingId = function (trackingId: string) {
  return this.findOne({ trackingId }).populate('userId').populate('assignedTo');
};

RequestSchema.statics.findByUser = function (userId: mongoose.Types.ObjectId, options?: {
  status?: RequestStatus;
  limit?: number;
  skip?: number;
}) {
  const query: any = { userId };
  
  if (options?.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('assignedTo')
    .sort({ createdAt: -1 })
    .limit(options?.limit || 10)
    .skip(options?.skip || 0);
};

RequestSchema.statics.findOverdue = function () {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $nin: ['resolved', 'rejected'] }
  }).populate('assignedTo');
};

RequestSchema.statics.findUpcomingDeadlines = function (days: number) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    deadline: { $gte: now, $lte: future },
    status: { $in: ['assigned', 'in_progress'] }
  }).populate('assignedTo');
};

export const Request = mongoose.model<RequestDocument>('Request', RequestSchema);

