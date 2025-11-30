const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'telegramId'
    }
  },
  applicationNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    allowNull: false
  },
  estimatedCompletionTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  documentData: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'applications',
  timestamps: true
});

module.exports = Application;

