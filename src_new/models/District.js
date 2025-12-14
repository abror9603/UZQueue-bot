const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const District = sequelize.define('District', {
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
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'districts',
  timestamps: true
});

module.exports = District;

