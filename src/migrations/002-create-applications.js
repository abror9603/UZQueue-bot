'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
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
      applicationNumber: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: false
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      serviceType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
        allowNull: false
      },
      estimatedCompletionTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      documentData: {
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

    await queryInterface.addIndex('applications', ['userId']);
    await queryInterface.addIndex('applications', ['applicationNumber']);
    await queryInterface.addIndex('applications', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('applications');
  }
};

