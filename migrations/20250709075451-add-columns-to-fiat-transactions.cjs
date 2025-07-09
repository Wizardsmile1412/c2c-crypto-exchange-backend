'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to Fiat_transactions table
    await queryInterface.addColumn('Fiat_transactions', 'gateway_reference', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('Fiat_transactions', 'gateway_response', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Fiat_transactions', 'admin_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { 
        model: 'Users', 
        key: 'id' 
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('Fiat_transactions', 'admin_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Fiat_transactions', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Update existing columns to match our requirements
    await queryInterface.changeColumn('Fiat_transactions', 'provider', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'MOCK_GATEWAY'
    });

    await queryInterface.changeColumn('Fiat_transactions', 'amount', {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: false,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'currency', {
      type: Sequelize.STRING(10),
      allowNull: false,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'gateway_txn_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'ip_address', {
      type: Sequelize.STRING(45),
      allowNull: true,
    });

    // Update the ENUM to include PROCESSING status
    await queryInterface.changeColumn('Fiat_transactions', 'status', {
      type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Fiat_transactions', ['user_id'], {
      name: 'idx_fiat_transactions_user_id'
    });

    await queryInterface.addIndex('Fiat_transactions', ['status'], {
      name: 'idx_fiat_transactions_status'
    });

    await queryInterface.addIndex('Fiat_transactions', ['type'], {
      name: 'idx_fiat_transactions_type'
    });

    await queryInterface.addIndex('Fiat_transactions', ['currency'], {
      name: 'idx_fiat_transactions_currency'
    });

    await queryInterface.addIndex('Fiat_transactions', ['gateway_txn_id'], {
      name: 'idx_fiat_transactions_gateway_txn_id'
    });

    await queryInterface.addIndex('Fiat_transactions', ['createdAt'], {
      name: 'idx_fiat_transactions_created_at'
    });

    await queryInterface.addIndex('Fiat_transactions', ['admin_id'], {
      name: 'idx_fiat_transactions_admin_id'
    });

    console.log('✅ Added missing columns and indexes to Fiat_transactions table');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_user_id');
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_status');
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_type');
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_currency');
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_gateway_txn_id');
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_created_at');
    await queryInterface.removeIndex('Fiat_transactions', 'idx_fiat_transactions_admin_id');

    // Remove added columns
    await queryInterface.removeColumn('Fiat_transactions', 'gateway_reference');
    await queryInterface.removeColumn('Fiat_transactions', 'gateway_response');
    await queryInterface.removeColumn('Fiat_transactions', 'admin_id');
    await queryInterface.removeColumn('Fiat_transactions', 'admin_notes');
    await queryInterface.removeColumn('Fiat_transactions', 'completed_at');

    // Revert ENUM changes
    await queryInterface.changeColumn('Fiat_transactions', 'status', {
      type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      allowNull: false,
    });

    // Revert column changes
    await queryInterface.changeColumn('Fiat_transactions', 'provider', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'amount', {
      type: Sequelize.DECIMAL,
      allowNull: true,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'currency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'gateway_txn_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('Fiat_transactions', 'ip_address', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    console.log('✅ Reverted Fiat_transactions table changes');
  }
};