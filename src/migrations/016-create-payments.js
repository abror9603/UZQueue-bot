'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      payment_method: {
        type: Sequelize.ENUM('telegram_wallet', 'payme'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'TON',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      premium_days: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        allowNull: false
      },
      telegram_invoice_payload: {
        type: Sequelize.STRING,
        allowNull: true
      },
      telegram_pre_checkout_query_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payme_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('payments', ['user_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['transaction_id']);
    await queryInterface.addIndex('payments', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};

