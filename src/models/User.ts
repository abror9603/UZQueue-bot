/**
 * User Model
 * Represents a citizen, organization admin, or super admin
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole, Language } from '../types';

export interface UserDocument extends IUser, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true
    },
    username: {
      type: String,
      sparse: true
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    phoneNumber: {
      type: String,
      sparse: true
    },
    region: {
      type: String
    },
    role: {
      type: String,
      enum: ['citizen', 'org_admin', 'super_admin'],
      default: 'citizen',
      required: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['uz', 'ru', 'en'],
      default: 'uz',
      required: true
    },
    metadata: {
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
        default: null
      }
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Indexes for performance
UserSchema.index({ telegramId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ organizationId: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.username || 'User';
});

// Methods
UserSchema.methods.incrementRequestCount = function () {
  this.metadata.totalRequests += 1;
  return this.save();
};

UserSchema.methods.incrementResolvedCount = function () {
  this.metadata.resolvedRequests += 1;
  return this.save();
};

// Static methods
UserSchema.statics.findByTelegramId = function (telegramId: number) {
  return this.findOne({ telegramId, isActive: true });
};

UserSchema.statics.findAdmins = function (organizationId?: mongoose.Types.ObjectId) {
  const query: any = {
    role: { $in: ['org_admin', 'super_admin'] },
    isActive: true
  };
  
  if (organizationId) {
    query.organizationId = organizationId;
  }
  
  return this.find(query);
};

export const User = mongoose.model<UserDocument>('User', UserSchema);

