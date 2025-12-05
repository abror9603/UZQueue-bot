"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("applications", "org_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "organizations",
        key: "org_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("applications", ["org_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("applications", ["org_id"]);
    await queryInterface.removeColumn("applications", "org_id");
  },
};
