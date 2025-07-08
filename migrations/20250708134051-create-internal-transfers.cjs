'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_transfers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      from_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // Remove foreign key constraint for now
      },
      to_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // Remove foreign key constraint for now
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'SUCCESS', 'FAILED'),
        allowNull: false,
        defaultValue: 'SUCCESS'
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('internal_transfers', ['from_user_id']);
    await queryInterface.addIndex('internal_transfers', ['to_user_id']);
    await queryInterface.addIndex('internal_transfers', ['currency']);
    await queryInterface.addIndex('internal_transfers', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('internal_transfers');
  }
};