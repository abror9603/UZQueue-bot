'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('queues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'telegramId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: false
      },
      branch: {
        type: Sequelize.STRING,
        allowNull: false
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false
      },
      appointmentDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      queueNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'scheduled',
        allowNull: false
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('queues', ['userId']);
    await queryInterface.addIndex('queues', ['appointmentDate']);
    await queryInterface.addIndex('queues', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('queues');
  }
};

