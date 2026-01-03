/**
 * Core TypeScript types for UZQueue Bot v2
 * All types are defined here for type safety and reusability
 */

import { ObjectId } from 'mongoose';

// ================================
// USER TYPES
// ================================

export type UserRole = 'citizen' | 'org_admin' | 'super_admin';
export type Language = 'uz' | 'ru' | 'en';

export interface IUser {
  _id: ObjectId;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  region?: string;
  role: UserRole;
  organizationId?: ObjectId;
  isActive: boolean;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalRequests: number;
    resolvedRequests: number;
    avgResponseTime?: number;
  };
}

// ================================
// ORGANIZATION TYPES
// ================================

export type OrganizationType = 'ministry' | 'department' | 'local_office' | 'utility';
export type OrganizationLevel = 1 | 2 | 3;

export interface IOrganization {
  _id: ObjectId;
  name: {
    uz: string;
    ru: string;
    en: string;
  };
  shortName: string;
  type: OrganizationType;
  telegramChatId?: number;
  categories: string[];
  level: OrganizationLevel;
  parentId?: ObjectId;
  region?: string;
  isVerified: boolean;
  isActive: boolean;
  adminUsers: number[];
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
    workingHours?: string;
  };
  statistics: {
    totalRequests: number;
    resolvedRequests: number;
    avgResponseTime: number;
    responseRate: number;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// REQUEST TYPES
// ================================

export type RequestStatus = 
  | 'pending' 
  | 'analyzing' 
  | 'assigned' 
  | 'in_progress' 
  | 'resolved' 
  | 'rejected' 
  | 'escalated';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MediaFile {
  type: 'photo' | 'document' | 'video';
  fileId: string;
  fileName?: string;
}

export interface VoiceMessage {
  fileId: string;
  duration: number;
  transcription?: string;
}

export interface RequestResponse {
  fromUserId: number;
  fromOrgId?: ObjectId;
  text: string;
  media?: MediaFile[];
  timestamp: Date;
  isInternal: boolean;
}

export interface EscalationHistory {
  fromOrgId?: ObjectId;
  toOrgId: ObjectId;
  reason: string;
  date: Date;
  escalatedBy: 'system' | 'admin';
}

export interface UserRating {
  score: number;
  comment?: string;
  ratedAt: Date;
}

export interface IRequest {
  _id: ObjectId;
  trackingId: string;
  userId: ObjectId;
  userTelegramId: number;
  
  // Request content
  text: string;
  media?: MediaFile[];
  voiceMessage?: VoiceMessage;
  
  // Classification
  category: string;
  subCategory?: string;
  aiConfidence: number;
  keywords: string[];
  
  // Assignment
  status: RequestStatus;
  assignedTo?: ObjectId;
  assignedBy?: 'ai' | 'admin';
  assignedAt?: Date;
  
  // Timing
  createdAt: Date;
  updatedAt: Date;
  deadline: Date;
  resolvedAt?: Date;
  responseTime?: number;
  
  // Escalation
  escalationLevel: number;
  escalationHistory: EscalationHistory[];
  
  // Communication
  responses: RequestResponse[];
  
  // Metadata
  priority: RequestPriority;
  tags: string[];
  internalNotes?: string[];
  
  // User feedback
  userRating?: UserRating;
}

// ================================
// CATEGORY TYPES
// ================================

export interface CategoryKeywords {
  uz: string[];
  ru: string[];
  en: string[];
}

export interface CategoryExample {
  text: string;
  language: string;
}

export interface ICategory {
  _id: ObjectId;
  name: {
    uz: string;
    ru: string;
    en: string;
  };
  keywords: CategoryKeywords;
  relatedOrganizations: ObjectId[];
  parentCategory?: ObjectId;
  examples: CategoryExample[];
  statistics: {
    totalRequests: number;
    avgConfidence: number;
    accuracyRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// SYSTEM LOG TYPES
// ================================

export type SystemLogType = 
  | 'ai_classification' 
  | 'assignment' 
  | 'escalation' 
  | 'user_action' 
  | 'admin_action' 
  | 'error';

export interface ISystemLog {
  _id: ObjectId;
  type: SystemLogType;
  requestId?: ObjectId;
  userId?: number;
  organizationId?: ObjectId;
  action: string;
  details: any;
  result?: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
}

// ================================
// AI CLASSIFICATION TYPES
// ================================

export interface ClassificationResult {
  category: string;
  confidence: number;
  keywords: string[];
  reasoning: string;
  urgency: RequestPriority;
  suggestedOrganization?: string;
  needsHumanReview: boolean;
}

// ================================
// ROUTING TYPES
// ================================

export interface RoutingResult {
  success: boolean;
  organizationId?: ObjectId;
  organizationName?: string;
  method: 'auto' | 'admin_confirm' | 'super_admin';
  candidates?: ObjectId[];
  reason?: string;
}

// ================================
// STATISTICS TYPES
// ================================

export interface RequestStatusCounts {
  pending: number;
  inProgress: number;
  resolved: number;
  escalated: number;
}

export interface TopPerformer {
  orgName: string;
  resolvedCount: number;
  avgTime: number;
  rating: number;
}

export interface IStatistics {
  totalUsers: number;
  totalRequests: number;
  totalOrganizations: number;
  requestsByStatus: RequestStatusCounts;
  requestsByCategory: Record<string, number>;
  avgResponseTime: number;
  avgResolutionTime: number;
  topPerformers: TopPerformer[];
  aiAccuracy: number;
  avgConfidence: number;
  humanReviewRate: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
}

// ================================
// TELEGRAM CONTEXT TYPES
// ================================

export interface BotContext {
  user?: IUser;
  organization?: IOrganization;
  language: Language;
}

// ================================
// ERROR TYPES
// ================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

export class AIError extends AppError {
  constructor(message: string) {
    super(message, 503);
    this.name = 'AIError';
  }
}

