const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppealFile = sequelize.define('AppealFile', {
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
  fileId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_id'
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_type'
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_name'
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_url'
  }
}, {
  tableName: 'appeal_files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AppealFile;

