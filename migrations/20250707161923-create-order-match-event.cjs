"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Order_match_events", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      buy_order_id: {
        type: Sequelize.INTEGER,
        references: { model: "Trade_orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sell_order_id: {
        type: Sequelize.INTEGER,
        references: { model: "Trade_orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      buyer_id: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      seller_id: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      matched_amount: {
        type: Sequelize.DECIMAL,
      },
      matched_price: {
        type: Sequelize.DECIMAL,
      },
      fiat_currency: {
        type: Sequelize.STRING,
      },
      total_price: {
        type: Sequelize.DECIMAL,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Order_match_events");
  },
};
