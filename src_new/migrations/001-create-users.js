'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: false
      },
      telegramId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        field: 'telegram_id'
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'first_name'
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'last_name'
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'uz',
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('users');
  }
};

