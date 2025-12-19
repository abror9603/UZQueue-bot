'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Find and drop foreign key constraint if it exists
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'telegram_groups' 
      AND constraint_type = 'FOREIGN KEY'
      AND (constraint_name LIKE '%region_id%' OR constraint_name LIKE '%district_id%' OR constraint_name LIKE '%neighborhood_id%');
    `);

    for (const constraint of constraints) {
      await queryInterface.sequelize.query(`
        ALTER TABLE telegram_groups 
        DROP CONSTRAINT IF EXISTS ${constraint.constraint_name} CASCADE;
      `);
    }

    // Allow region_id, district_id, and neighborhood_id to be null for private organizations
    await queryInterface.sequelize.query(`
      ALTER TABLE telegram_groups 
      ALTER COLUMN region_id DROP NOT NULL,
      ALTER COLUMN district_id DROP NOT NULL,
      ALTER COLUMN neighborhood_id DROP NOT NULL;
    `);

    // Re-add foreign key constraints (nullable)
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- Add region_id foreign key if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'telegram_groups_region_id_fkey' 
          AND table_name = 'telegram_groups'
        ) THEN
          ALTER TABLE telegram_groups 
          ADD CONSTRAINT telegram_groups_region_id_fkey 
          FOREIGN KEY (region_id) REFERENCES regions(id);
        END IF;

        -- Add district_id foreign key if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'telegram_groups_district_id_fkey' 
          AND table_name = 'telegram_groups'
        ) THEN
          ALTER TABLE telegram_groups 
          ADD CONSTRAINT telegram_groups_district_id_fkey 
          FOREIGN KEY (district_id) REFERENCES districts(id);
        END IF;

        -- Add neighborhood_id foreign key if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'telegram_groups_neighborhood_id_fkey' 
          AND table_name = 'telegram_groups'
        ) THEN
          ALTER TABLE telegram_groups 
          ADD CONSTRAINT telegram_groups_neighborhood_id_fkey 
          FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id);
        END IF;
      END $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // First, set any null values to default values
    await queryInterface.sequelize.query(`
      UPDATE telegram_groups 
      SET region_id = (SELECT id FROM regions WHERE name_uz = 'Toshkent' LIMIT 1)
      WHERE region_id IS NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE telegram_groups 
      SET district_id = (SELECT id FROM districts WHERE region_id = telegram_groups.region_id LIMIT 1)
      WHERE district_id IS NULL AND region_id IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE telegram_groups 
      SET neighborhood_id = (SELECT id FROM neighborhoods WHERE district_id = telegram_groups.district_id LIMIT 1)
      WHERE neighborhood_id IS NULL AND district_id IS NOT NULL;
    `);

    // Then change columns back to not null
    await queryInterface.sequelize.query(`
      ALTER TABLE telegram_groups 
      ALTER COLUMN region_id SET NOT NULL,
      ALTER COLUMN district_id SET NOT NULL,
      ALTER COLUMN neighborhood_id SET NOT NULL;
    `);
  }
};
