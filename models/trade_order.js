"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Trade_order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Trade_order belongsTo User
      this.belongsTo(models.User, { foreignKey: "user_id" });
      // Trade_order hasMany Order_match_event as buy_order
      this.hasMany(models.Order_match_event, {
        foreignKey: "buy_order_id",
        as: "BuyMatches",
      });
      // Trade_order hasMany Order_match_event as sell_order
      this.hasMany(models.Order_match_event, {
        foreignKey: "sell_order_id",
        as: "SellMatches",
      });
    }
  }
  Trade_order.init(
    {
      user_id: DataTypes.INTEGER,
      order_type: DataTypes.STRING,
      currency: DataTypes.STRING,
      fiat_currency: DataTypes.STRING,
      amount: DataTypes.DECIMAL,
      matched_amount: DataTypes.DECIMAL,
      remaining_amount: DataTypes.DECIMAL,
      price_per_unit: DataTypes.DECIMAL,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Trade_order",
    }
  );
  return Trade_order;
};
