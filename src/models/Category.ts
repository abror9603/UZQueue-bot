/**
 * Category Model
 * AI learning and classification categories
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ICategory, CategoryKeywords, CategoryExample } from '../types';

export interface CategoryDocument extends ICategory, Document {}

const CategoryKeywordsSchema = new Schema<CategoryKeywords>(
  {
    uz: {
      type: [String],
      default: []
    },
    ru: {
      type: [String],
      default: []
    },
    en: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const CategoryExampleSchema = new Schema<CategoryExample>(
  {
    text: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['uz', 'ru', 'en'],
      required: true
    }
  },
  { _id: false }
);

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      uz: { type: String, required: true },
      ru: { type: String, required: true },
      en: { type: String, required: true }
    },
    keywords: {
      type: CategoryKeywordsSchema,
      required: true
    },
    relatedOrganizations: {
      type: [Schema.Types.ObjectId],
      ref: 'Organization',
      default: []
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    examples: {
      type: [CategoryExampleSchema],
      default: []
    },
    statistics: {
      totalRequests: {
        type: Number,
        default: 0
      },
      avgConfidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      accuracyRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  },
  {
    timestamps: true,
    collection: 'categories'
  }
);

// Indexes
CategorySchema.index({ 'name.uz': 1 });
CategorySchema.index({ 'name.ru': 1 });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ 'statistics.totalRequests': -1 });

// Methods
CategorySchema.methods.incrementRequestCount = function () {
  this.statistics.totalRequests += 1;
  return this.save();
};

CategorySchema.methods.updateConfidence = function (confidence: number) {
  const currentAvg = this.statistics.avgConfidence;
  const totalRequests = this.statistics.totalRequests;
  
  if (totalRequests === 0) {
    this.statistics.avgConfidence = confidence;
  } else {
    // Calculate new average
    this.statistics.avgConfidence = 
      ((currentAvg * (totalRequests - 1)) + confidence) / totalRequests;
  }
  
  return this.save();
};

CategorySchema.methods.updateAccuracy = function (isCorrect: boolean) {
  const currentAccuracy = this.statistics.accuracyRate;
  const totalRequests = this.statistics.totalRequests;
  
  if (totalRequests === 0) {
    this.statistics.accuracyRate = isCorrect ? 100 : 0;
  } else {
    // Calculate new accuracy rate
    const correctCount = Math.round((currentAccuracy / 100) * (totalRequests - 1));
    const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
    this.statistics.accuracyRate = (newCorrectCount / totalRequests) * 100;
  }
  
  return this.save();
};

// Static methods
CategorySchema.statics.findByName = function (name: string, language: 'uz' | 'ru' | 'en' = 'uz') {
  return this.findOne({ [`name.${language}`]: name });
};

CategorySchema.statics.findByKeyword = function (keyword: string, language: 'uz' | 'ru' | 'en' = 'uz') {
  return this.find({
    [`keywords.${language}`]: { $in: [keyword] }
  });
};

export const Category = mongoose.model<CategoryDocument>('Category', CategorySchema);

