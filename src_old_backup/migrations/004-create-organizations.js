"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("organizations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      org_id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("government", "private"),
        allowNull: false,
        defaultValue: "private",
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      owner: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      telegram_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      join_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    await queryInterface.addIndex("organizations", ["org_id"]);
    await queryInterface.addIndex("organizations", ["telegram_id"]);
    await queryInterface.addIndex("organizations", ["type"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("organizations");
  },
};
