const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppealStatusLog = sequelize.define('AppealStatusLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appealId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'appeals',
      key: 'id'
    },
    field: 'appeal_id'
  },
  oldStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'old_status'
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'new_status'
  },
  changedBy: {
    type: DataTypes.BIGINT,
    allowNull: true, // Telegram user ID of admin who changed status
    field: 'changed_by'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'appeal_status_logs',
  timestamps: true
});

module.exports = AppealStatusLog;

