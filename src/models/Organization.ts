/**
 * Organization Model
 * Represents government organizations and departments
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IOrganization, OrganizationType, OrganizationLevel } from '../types';

export interface OrganizationDocument extends IOrganization, Document {}

const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    name: {
      uz: { type: String, required: true },
      ru: { type: String, required: true },
      en: { type: String, required: true }
    },
    shortName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['ministry', 'department', 'local_office', 'utility'],
      required: true
    },
    telegramChatId: {
      type: Number,
      sparse: true
    },
    categories: {
      type: [String],
      default: []
    },
    level: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
      default: 1
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    region: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    adminUsers: {
      type: [Number], // Telegram IDs
      default: []
    },
    contactInfo: {
      phone: String,
      email: String,
      address: String,
      workingHours: String
    },
    statistics: {
      totalRequests: {
        type: Number,
        default: 0
      },
      resolvedRequests: {
        type: Number,
        default: 0
      },
      avgResponseTime: {
        type: Number,
        default: 0 // in hours
      },
      responseRate: {
        type: Number,
        default: 0 // percentage
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    }
  },
  {
    timestamps: true,
    collection: 'organizations'
  }
);

// Indexes
OrganizationSchema.index({ shortName: 1 });
OrganizationSchema.index({ type: 1 });
OrganizationSchema.index({ level: 1 });
OrganizationSchema.index({ region: 1 });
OrganizationSchema.index({ categories: 1 });
OrganizationSchema.index({ isActive: 1, isVerified: 1 });
OrganizationSchema.index({ parentId: 1 });

// Virtual for response rate calculation
OrganizationSchema.virtual('calculatedResponseRate').get(function (this: OrganizationDocument) {
  if (this.statistics.totalRequests === 0) {
    return 0;
  }
  return (this.statistics.resolvedRequests / this.statistics.totalRequests) * 100;
});

// Methods
OrganizationSchema.methods.incrementRequestCount = function () {
  this.statistics.totalRequests += 1;
  return this.save();
};

OrganizationSchema.methods.incrementResolvedCount = function () {
  this.statistics.resolvedRequests += 1;
  this.statistics.responseRate = this.calculatedResponseRate;
  return this.save();
};

OrganizationSchema.methods.updateResponseTime = function (hours: number) {
  const currentAvg = this.statistics.avgResponseTime;
  const totalResolved = this.statistics.resolvedRequests;
  
  if (totalResolved === 0) {
    this.statistics.avgResponseTime = hours;
  } else {
    // Calculate new average
    this.statistics.avgResponseTime = 
      ((currentAvg * (totalResolved - 1)) + hours) / totalResolved;
  }
  
  return this.save();
};

OrganizationSchema.methods.updateRating = function (newRating: number) {
  const currentRating = this.statistics.rating;
  const totalResolved = this.statistics.resolvedRequests;
  
  if (totalResolved === 0) {
    this.statistics.rating = newRating;
  } else {
    // Calculate new average rating
    this.statistics.rating = 
      ((currentRating * (totalResolved - 1)) + newRating) / totalResolved;
  }
  
  return this.save();
};

// Static methods
OrganizationSchema.statics.findByCategory = function (category: string, region?: string) {
  const query: any = {
    categories: category,
    isActive: true,
    isVerified: true
  };
  
  if (region) {
    query.region = region;
  }
  
  return this.find(query).sort({ 'statistics.rating': -1, 'statistics.responseRate': -1 });
};

OrganizationSchema.statics.findByRegion = function (region: string) {
  return this.find({
    region,
    isActive: true,
    isVerified: true
  });
};

OrganizationSchema.statics.findTopPerformers = function (limit: number = 10) {
  return this.find({
    isActive: true,
    isVerified: true,
    'statistics.totalRequests': { $gt: 0 }
  })
    .sort({
      'statistics.rating': -1,
      'statistics.responseRate': -1,
      'statistics.avgResponseTime': 1
    })
    .limit(limit);
};

export const Organization = mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);

