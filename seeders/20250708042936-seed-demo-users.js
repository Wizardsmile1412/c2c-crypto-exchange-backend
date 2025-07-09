"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // USERS
    await queryInterface.bulkInsert("Users", [
      {
        id: 1,
        username: "alice",
        email: "alice@example.com",
        password_hash: "hashed_pw1",
        is_verified: true,
      },
      {
        id: 2,
        username: "bob",
        email: "bob@example.com",
        password_hash: "hashed_pw2",
        is_verified: false,
      },
    ]);

    // WALLETS
    await queryInterface.bulkInsert("Wallets", [
      {
        id: 1,
        user_id: 1,
        currency: "BTC",
        balance: 0.5,
        locked_balance: 0.1,
      },
      {
        id: 2,
        user_id: 1,
        currency: "USDT",
        balance: 1000,
        locked_balance: 0,
      },
      {
        id: 3,
        user_id: 2,
        currency: "BTC",
        balance: 1.2,
        locked_balance: 0.2,
      },
      {
        id: 4,
        user_id: 2,
        currency: "USDT",
        balance: 500,
        locked_balance: 100,
      },
    ]);

    // EXCHANGE RATES
    await queryInterface.bulkInsert("Exchange_rates", [
      {
        id: 1,
        base_currency: "BTC",
        quote_currency: "USDT",
        rate: 60000,
        provider: "Binance",
      },
      {
        id: 2,
        base_currency: "ETH",
        quote_currency: "USDT",
        rate: 3000,
        provider: "Binance",
      },
      {
        id: 3,
        base_currency: "USDT",
        quote_currency: "THB",
        rate: 36,
        provider: "Bitkub",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Wallets", null, {});
    await queryInterface.bulkDelete("Exchange_rates", null, {});
    await queryInterface.bulkDelete("Users", null, {});
  },
};
