'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appeal_status_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appealId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'appeals',
          key: 'id'
        },
        onDelete: 'CASCADE',
        field: 'appeal_id'
      },
      oldStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'old_status'
      },
      newStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'new_status'
      },
      changedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        field: 'changed_by'
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('appeal_status_logs');
  }
};

