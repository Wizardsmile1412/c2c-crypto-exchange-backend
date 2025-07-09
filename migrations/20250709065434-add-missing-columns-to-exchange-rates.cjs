'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing columns
    await queryInterface.addColumn('Exchange_rates', 'last_updated', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    });

    await queryInterface.addColumn('Exchange_rates', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    console.log('Added missing columns to Exchange_rates table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Exchange_rates', 'last_updated');
    await queryInterface.removeColumn('Exchange_rates', 'is_active');
  }
};