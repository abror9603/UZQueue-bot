'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('regions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        unique: true,
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
    await queryInterface.dropTable('regions');
  }
};

