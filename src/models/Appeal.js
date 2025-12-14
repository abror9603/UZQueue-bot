const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appeal = sequelize.define('Appeal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appealId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'appeal_id'
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'telegramId'
    },
    field: 'user_id'
  },
  regionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'regions',
      key: 'id'
    },
    field: 'region_id'
  },
  districtId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'districts',
      key: 'id'
    },
    field: 'district_id'
  },
  neighborhoodId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'neighborhoods',
      key: 'id'
    },
    field: 'neighborhood_id'
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    },
    field: 'organization_id'
  },
  telegramGroupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'telegram_groups',
      key: 'id'
    },
    field: 'telegram_group_id'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  appealType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'appeal_type'
  },
  appealText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'appeal_text'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  aiAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'ai_analysis'
  },
  groupMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'group_message_id'
  }
}, {
  tableName: 'appeals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Appeal;

