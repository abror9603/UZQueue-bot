'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Allow regionId to be null for private organizations
    await queryInterface.sequelize.query(`
      ALTER TABLE telegram_groups 
      ALTER COLUMN region_id DROP NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert back to not null (but only if there are no null values)
    // First, set any null values to a default region (e.g., Toshkent)
    await queryInterface.sequelize.query(`
      UPDATE telegram_groups 
      SET region_id = (SELECT id FROM regions WHERE name_uz = 'Toshkent' LIMIT 1)
      WHERE region_id IS NULL;
    `);

    // Then change column back to not null
    await queryInterface.sequelize.query(`
      ALTER TABLE telegram_groups 
      ALTER COLUMN region_id SET NOT NULL;
    `);
  }
};

