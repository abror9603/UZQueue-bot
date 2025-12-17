const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nameUz: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name_uz'
  },
  nameRu: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name_ru'
  },
  nameEn: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name_en'
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('government', 'education', 'healthcare', 'hokimiyat', 'mahalla', 'other', 'private', 'committee', 'ministry'),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'organizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Organization;

