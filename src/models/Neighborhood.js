const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Neighborhood = sequelize.define('Neighborhood', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  tableName: 'neighborhoods',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Neighborhood;

