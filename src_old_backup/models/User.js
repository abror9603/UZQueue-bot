const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: false // Telegram user ID as primary key
  },
  telegramId: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'uz',
    allowNull: false
  },
  currentStep: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentSection: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  subscriptionType: {
    type: DataTypes.ENUM('free', 'premium', 'business', 'enterprise'),
    defaultValue: 'free',
    allowNull: false,
    field: 'subscription_type'
  },
  subscriptionExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'subscription_expires_at'
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;

