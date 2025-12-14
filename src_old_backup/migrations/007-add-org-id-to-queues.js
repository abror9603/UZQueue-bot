"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("queues", "org_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "organizations",
        key: "org_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("queues", ["org_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("queues", ["org_id"]);
    await queryInterface.removeColumn("queues", "org_id");
  },
};
