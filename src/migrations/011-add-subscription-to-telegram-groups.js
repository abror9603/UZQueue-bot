'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('telegram_groups', 'subscription_status', {
      type: Sequelize.ENUM('inactive', 'active', 'suspended', 'expired'),
      defaultValue: 'inactive',
      allowNull: false
    });

    await queryInterface.addColumn('telegram_groups', 'subscription_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('telegram_groups', 'responsible_person', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('telegram_groups', 'responsible_phone', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('telegram_groups', 'subscription_status');
    await queryInterface.removeColumn('telegram_groups', 'subscription_expires_at');
    await queryInterface.removeColumn('telegram_groups', 'responsible_person');
    await queryInterface.removeColumn('telegram_groups', 'responsible_phone');
  }
};

