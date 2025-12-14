const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiLog = sequelize.define('AiLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appealId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'appeals',
      key: 'id'
    },
    field: 'appeal_id'
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'user_id'
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tokensUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tokens_used'
  }
}, {
  tableName: 'ai_logs',
  timestamps: true
});

module.exports = AiLog;

