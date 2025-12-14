'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('districts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      regionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regions',
          key: 'id'
        },
        field: 'region_id'
      },
      nameUz: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name_uz'
      },
      nameRu: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name_ru'
      },
      nameEn: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name_en'
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('districts');
  }
};

