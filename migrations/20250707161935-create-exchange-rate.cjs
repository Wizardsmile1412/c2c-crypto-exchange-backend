'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Exchange_rates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      base_currency: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      quote_currency: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      rate: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'MANUAL'
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Exchange_rates', ['base_currency', 'quote_currency'], {
      unique: true
    });
    await queryInterface.addIndex('Exchange_rates', ['is_active']);
    await queryInterface.addIndex('Exchange_rates', ['last_updated']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Exchange_rates');
  }
};