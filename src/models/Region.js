const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Region = sequelize.define('Region', {
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'regions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Region;

