'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appealId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'appeals',
          key: 'id'
        },
        field: 'appeal_id'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        field: 'user_id'
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tokensUsed: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'tokens_used'
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
    await queryInterface.dropTable('ai_logs');
  }
};

