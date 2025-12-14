'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appeals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appealId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        field: 'appeal_id'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'telegram_id'
        },
        field: 'user_id'
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
        allowNull: false,
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
      telegramGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'telegram_groups',
          key: 'id'
        },
        field: 'telegram_group_id'
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'full_name'
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      appealType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'appeal_type'
      },
      appealText: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'appeal_text'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      aiAnalysis: {
        type: Sequelize.JSONB,
        allowNull: true,
        field: 'ai_analysis'
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
    await queryInterface.dropTable('appeals');
  }
};

