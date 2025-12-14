"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employees", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
      },
      org_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "org_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      telegram_id: {
        type: Sequelize.BIGINT,
        unique: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM("admin", "staff"),
        defaultValue: "staff",
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("employees", ["employee_id"]);
    await queryInterface.addIndex("employees", ["org_id"]);
    await queryInterface.addIndex("employees", ["telegram_id"]);
    await queryInterface.addIndex("employees", ["role"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("employees");
  },
};
