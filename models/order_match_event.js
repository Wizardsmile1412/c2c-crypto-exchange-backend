"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order_match_event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Order_match_event belongsTo Trade_order as buy_order
      this.belongsTo(models.Trade_order, {
        foreignKey: "buy_order_id",
        as: "BuyOrder",
      });
      // Order_match_event belongsTo Trade_order as sell_order
      this.belongsTo(models.Trade_order, {
        foreignKey: "sell_order_id",
        as: "SellOrder",
      });
      // Order_match_event belongsTo User as buyer
      this.belongsTo(models.User, { foreignKey: "buyer_id", as: "Buyer" });
      // Order_match_event belongsTo User as seller
      this.belongsTo(models.User, { foreignKey: "seller_id", as: "Seller" });
    }
  }
  Order_match_event.init(
    {
      buy_order_id: DataTypes.INTEGER,
      sell_order_id: DataTypes.INTEGER,
      buyer_id: DataTypes.INTEGER,
      seller_id: DataTypes.INTEGER,
      matched_amount: DataTypes.DECIMAL,
      matched_price: DataTypes.DECIMAL,
      fiat_currency: DataTypes.STRING,
      total_price: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: "Order_match_event",
    }
  );
  return Order_match_event;
};
