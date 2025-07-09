"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Trade_orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      order_type: {
        type: Sequelize.ENUM("BUY", "SELL"),
      },
      currency: {
        type: Sequelize.STRING,
      },
      fiat_currency: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.DECIMAL,
      },
      matched_amount: {
        type: Sequelize.DECIMAL,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL,
      },
      price_per_unit: {
        type: Sequelize.DECIMAL,
      },
      status: {
        type: Sequelize.ENUM("OPEN", "PARTIALLY_FILLED", "FILLED", "CANCELLED"),
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
    await queryInterface.dropTable("Trade_orders");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Trade_orders_order_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Trade_orders_status";'
    );
  },
};
