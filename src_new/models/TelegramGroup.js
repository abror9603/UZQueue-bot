const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TelegramGroup = sequelize.define('TelegramGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    allowNull: true, // Can be null for region-level groups
    references: {
      model: 'districts',
      key: 'id'
    },
    field: 'district_id'
  },
  neighborhoodId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Can be null for district-level groups
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
  chatId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    field: 'chat_id'
  },
  chatTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'chat_title'
  },
  adminIds: {
    type: DataTypes.ARRAY(DataTypes.BIGINT),
    allowNull: true,
    defaultValue: [],
    field: 'admin_ids'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'telegram_groups',
  timestamps: true
});

module.exports = TelegramGroup;

