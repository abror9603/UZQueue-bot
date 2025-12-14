"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_requests", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "telegramId",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      org_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "organizations",
          key: "org_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      request_number: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      request_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      responsible_organization: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      alternative_organizations: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      confidence_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          "collecting_info",
          "analyzing",
          "ready",
          "sent",
          "processing",
          "completed",
          "rejected"
        ),
        defaultValue: "collecting_info",
        allowNull: false,
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

    await queryInterface.addIndex("user_requests", ["request_number"]);
    await queryInterface.addIndex("user_requests", ["user_id"]);
    await queryInterface.addIndex("user_requests", ["org_id"]);
    await queryInterface.addIndex("user_requests", ["status"]);
    await queryInterface.addIndex("user_requests", ["category"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_requests");
  },
};

