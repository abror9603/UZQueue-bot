'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appeal_files', {
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
      fileId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'file_id'
      },
      fileType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'file_type'
      },
      fileName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'file_name'
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'file_url'
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
    await queryInterface.dropTable('appeal_files');
  }
};

