'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('telegram_groups', {
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
      districtId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'districts',
          key: 'id'
        },
        field: 'district_id'
      },
      neighborhoodId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'neighborhoods',
          key: 'id'
        },
        field: 'neighborhood_id'
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        field: 'organization_id'
      },
      chatId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        field: 'chat_id'
      },
      chatTitle: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'chat_title'
      },
      adminIds: {
        type: Sequelize.ARRAY(Sequelize.BIGINT),
        allowNull: true,
        defaultValue: [],
        field: 'admin_ids'
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
    await queryInterface.dropTable('telegram_groups');
  }
};

