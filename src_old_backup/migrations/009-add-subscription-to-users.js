"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add subscription type enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_users_subscription_type" AS ENUM('free', 'premium', 'business', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add subscription columns
    await queryInterface.addColumn("users", "subscription_type", {
      type: Sequelize.ENUM("free", "premium", "business", "enterprise"),
      defaultValue: "free",
      allowNull: false,
    });

    await queryInterface.addColumn("users", "subscription_expires_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add index
    await queryInterface.addIndex("users", ["subscription_type"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", ["subscription_type"]);
    await queryInterface.removeColumn("users", "subscription_expires_at");
    await queryInterface.removeColumn("users", "subscription_type");
  },
};

