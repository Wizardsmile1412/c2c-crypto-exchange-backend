'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes only if they don't exist
    try {
      await queryInterface.addIndex('Exchange_rates', ['base_currency', 'quote_currency'], {
        unique: true,
        name: 'exchange_rates_base_quote_unique'
      });
    } catch (error) {
      console.log('Index base_currency, quote_currency already exists');
    }
    
    try {
      await queryInterface.addIndex('Exchange_rates', ['is_active'], {
        name: 'exchange_rates_is_active_index'
      });
    } catch (error) {
      console.log('Index is_active already exists');
    }
    
    try {
      await queryInterface.addIndex('Exchange_rates', ['last_updated'], {
        name: 'exchange_rates_last_updated_index'
      });
    } catch (error) {
      console.log('Index last_updated already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Exchange_rates', 'exchange_rates_base_quote_unique');
    await queryInterface.removeIndex('Exchange_rates', 'exchange_rates_is_active_index');
    await queryInterface.removeIndex('Exchange_rates', 'exchange_rates_last_updated_index');
  }
};