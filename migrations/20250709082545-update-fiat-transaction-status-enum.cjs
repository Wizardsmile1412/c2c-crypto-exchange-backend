'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // For PostgreSQL, we need to add the new enum value
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Fiat_transactions_status" 
      ADD VALUE 'PROCESSING' BEFORE 'COMPLETED';
    `);
    
    console.log('✅ Added PROCESSING status to Fiat_transactions status enum');
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL doesn't support removing enum values directly
    // We need to recreate the enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE "Fiat_transactions" 
      ALTER COLUMN status TYPE VARCHAR(20);
    `);
    
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Fiat_transactions_status";
    `);
    
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Fiat_transactions_status" AS ENUM (
        'PENDING',
        'COMPLETED', 
        'FAILED',
        'CANCELLED'
      );
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Fiat_transactions" 
      ALTER COLUMN status TYPE "enum_Fiat_transactions_status" 
      USING status::"enum_Fiat_transactions_status";
    `);
    
    console.log('✅ Removed PROCESSING status from Fiat_transactions status enum');
  }
};