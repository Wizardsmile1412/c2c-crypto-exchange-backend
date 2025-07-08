"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, let's check what constraints exist and remove them
    const [results] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'Wallets' AND constraint_type = 'FOREIGN KEY'
    `);

    // Remove existing foreign key constraints on user_id
    for (const constraint of results) {
      try {
        await queryInterface.removeConstraint("Wallets", constraint.constraint_name);
        console.log(`Removed constraint: ${constraint.constraint_name}`);
      } catch (error) {
        console.log(`Could not remove constraint ${constraint.constraint_name}:`, error.message);
      }
    }

    // Clean up orphaned wallet records (wallets that reference non-existent users)
    const [orphanedWallets] = await queryInterface.sequelize.query(`
      DELETE FROM "Wallets" 
      WHERE user_id NOT IN (SELECT id FROM "Users")
      RETURNING user_id
    `);

    if (orphanedWallets.length > 0) {
      console.log(`Removed ${orphanedWallets.length} orphaned wallet records for user IDs:`, 
                  orphanedWallets.map(w => w.user_id));
    }

    // Add the foreign key constraint with proper CASCADE
    await queryInterface.addConstraint("Wallets", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_wallets_user_id_cascade",
      references: {
        table: "Users",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    console.log("Added foreign key constraint with CASCADE");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("Wallets", "fk_wallets_user_id_cascade");
  },
};