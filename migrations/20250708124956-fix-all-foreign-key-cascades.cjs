"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Starting foreign key cascade fixes...");

    // Define all tables and their foreign key relationships that need CASCADE
    const foreignKeyConfigs = [
      {
        table: "Trade_orders",
        field: "user_id",
        constraintName: "fk_trade_orders_user_id_cascade",
        references: { table: "Users", field: "id" }
      },
      {
        table: "Fiat_transactions", 
        field: "user_id",
        constraintName: "fk_fiat_transactions_user_id_cascade",
        references: { table: "Users", field: "id" }
      },
      {
        table: "External_transfers",
        field: "user_id", 
        constraintName: "fk_external_transfers_user_id_cascade",
        references: { table: "Users", field: "id" }
      },
      // Order_match_events - buyer_id and seller_id (keeping SET NULL as designed)
      {
        table: "Order_match_events",
        field: "buy_order_id",
        constraintName: "fk_order_match_events_buy_order_cascade",
        references: { table: "Trade_orders", field: "id" },
        onDelete: "SET NULL" // Keep as SET NULL for audit trail
      },
      {
        table: "Order_match_events", 
        field: "sell_order_id",
        constraintName: "fk_order_match_events_sell_order_cascade", 
        references: { table: "Trade_orders", field: "id" },
        onDelete: "SET NULL" // Keep as SET NULL for audit trail
      }
    ];

    for (const config of foreignKeyConfigs) {
      try {
        // Get existing constraints for this table
        const [existingConstraints] = await queryInterface.sequelize.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = '${config.table}' AND constraint_type = 'FOREIGN KEY'
        `);

        // Remove existing foreign key constraints that might conflict
        for (const constraint of existingConstraints) {
          try {
            await queryInterface.removeConstraint(config.table, constraint.constraint_name);
            console.log(`Removed constraint: ${constraint.constraint_name} from ${config.table}`);
          } catch (error) {
            console.log(`Could not remove constraint ${constraint.constraint_name}:`, error.message);
          }
        }

        // Clean up orphaned records if needed (only for user_id references)
        if (config.field === "user_id") {
          const [orphanedRecords] = await queryInterface.sequelize.query(`
            DELETE FROM "${config.table}" 
            WHERE ${config.field} NOT IN (SELECT id FROM "Users")
            RETURNING ${config.field}
          `);

          if (orphanedRecords.length > 0) {
            console.log(`Removed ${orphanedRecords.length} orphaned records from ${config.table}`);
          }
        }

        // Add the new foreign key constraint
        await queryInterface.addConstraint(config.table, {
          fields: [config.field],
          type: "foreign key",
          name: config.constraintName,
          references: config.references,
          onDelete: config.onDelete || "CASCADE",
          onUpdate: "CASCADE",
        });

        console.log(`Added foreign key constraint: ${config.constraintName} to ${config.table}`);

      } catch (error) {
        console.error(`Error processing ${config.table}.${config.field}:`, error.message);
      }
    }

    console.log("Foreign key cascade fixes completed!");
  },

  async down(queryInterface, Sequelize) {
    // Remove all the constraints we added
    const constraintNames = [
      "fk_trade_orders_user_id_cascade",
      "fk_fiat_transactions_user_id_cascade", 
      "fk_external_transfers_user_id_cascade",
      "fk_order_match_events_buy_order_cascade",
      "fk_order_match_events_sell_order_cascade"
    ];

    for (const constraintName of constraintNames) {
      try {
        // Determine table name from constraint name
        const tableName = constraintName.split('_')[1] + '_' + constraintName.split('_')[2];
        await queryInterface.removeConstraint(tableName, constraintName);
        console.log(`Removed constraint: ${constraintName}`);
      } catch (error) {
        console.log(`Could not remove constraint ${constraintName}:`, error.message);
      }
    }
  },
};