/**
 * SystemLog Model
 * Logs all system events for auditing and analytics
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ISystemLog, SystemLogType } from '../types';

export interface SystemLogDocument extends ISystemLog, Document {}

const SystemLogSchema = new Schema<SystemLogDocument>(
  {
    type: {
      type: String,
      enum: ['ai_classification', 'assignment', 'escalation', 'user_action', 'admin_action', 'error'],
      required: true
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'Request'
    },
    userId: {
      type: Number
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    result: {
      type: String,
      enum: ['success', 'failure']
    },
    errorMessage: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false, // We use custom timestamp field
    collection: 'system_logs'
  }
);

// Indexes for querying
SystemLogSchema.index({ type: 1, timestamp: -1 });
SystemLogSchema.index({ requestId: 1, timestamp: -1 });
SystemLogSchema.index({ userId: 1, timestamp: -1 });
SystemLogSchema.index({ organizationId: 1, timestamp: -1 });
SystemLogSchema.index({ timestamp: -1 }); // For time-based queries

// TTL index - logs older than 1 year will be automatically deleted
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

// Static methods
SystemLogSchema.statics.logEvent = function (
  type: SystemLogType,
  action: string,
  details: any,
  options?: {
    requestId?: mongoose.Types.ObjectId;
    userId?: number;
    organizationId?: mongoose.Types.ObjectId;
    result?: 'success' | 'failure';
    errorMessage?: string;
  }
) {
  return this.create({
    type,
    action,
    details,
    requestId: options?.requestId,
    userId: options?.userId,
    organizationId: options?.organizationId,
    result: options?.result,
    errorMessage: options?.errorMessage,
    timestamp: new Date()
  });
};

SystemLogSchema.statics.findByRequest = function (requestId: mongoose.Types.ObjectId, limit: number = 50) {
  return this.find({ requestId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

SystemLogSchema.statics.findByUser = function (userId: number, limit: number = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

SystemLogSchema.statics.findByType = function (type: SystemLogType, limit: number = 100) {
  return this.find({ type })
    .sort({ timestamp: -1 })
    .limit(limit);
};

SystemLogSchema.statics.findErrors = function (days: number = 7, limit: number = 100) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return this.find({
    type: 'error',
    timestamp: { $gte: since }
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

export const SystemLog = mongoose.model<SystemLogDocument>('SystemLog', SystemLogSchema);

