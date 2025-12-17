'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new enum values to organizations.type enum
    // PostgreSQL doesn't support adding values to existing enum directly,
    // so we need to recreate the enum with new values
    
    // First, create a new enum type with all values
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_organizations_type_new AS ENUM (
          'government', 
          'education', 
          'healthcare', 
          'hokimiyat', 
          'mahalla', 
          'other',
          'private',
          'committee',
          'ministry'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Alter the column to use the new enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE organizations 
      ALTER COLUMN type TYPE enum_organizations_type_new 
      USING type::text::enum_organizations_type_new;
    `);

    // Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_organizations_type;
    `);

    // Rename the new enum type to the original name
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_organizations_type_new RENAME TO enum_organizations_type;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert to original enum values
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_organizations_type_old AS ENUM (
          'government', 
          'education', 
          'healthcare', 
          'hokimiyat', 
          'mahalla', 
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // First, convert any new enum values back to 'other'
    await queryInterface.sequelize.query(`
      UPDATE organizations 
      SET type = 'other'::text::enum_organizations_type_old
      WHERE type::text IN ('private', 'committee', 'ministry');
    `);

    // Alter the column to use the old enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE organizations 
      ALTER COLUMN type TYPE enum_organizations_type_old 
      USING type::text::enum_organizations_type_old;
    `);

    // Drop the new enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_organizations_type;
    `);

    // Rename the old enum type back
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_organizations_type_old RENAME TO enum_organizations_type;
    `);
  }
};

