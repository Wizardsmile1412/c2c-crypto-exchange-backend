"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User hasMany Wallet
      this.hasMany(models.Wallet, { foreignKey: "user_id" });
      // User hasMany Trade_order
      this.hasMany(models.Trade_order, { foreignKey: "user_id" });
      // User hasMany Fiat_transaction
      this.hasMany(models.Fiat_transaction, { foreignKey: "user_id" });
      // User hasMany External_transfer
      this.hasMany(models.External_transfer, { foreignKey: "user_id" });

      // User hasMany Internal_transfer as SentTransfers
      this.hasMany(models.Internal_transfer, {
        foreignKey: "from_user_id",
        as: "SentTransfers",
      });
      // User hasMany Internal_transfer as ReceivedTransfers
      this.hasMany(models.Internal_transfer, {
        foreignKey: "to_user_id",
        as: "ReceivedTransfers",
      });

      // User hasMany Order_match_event as buyer
      this.hasMany(models.Order_match_event, {
        foreignKey: "buyer_id",
        as: "BuyOrderMatches",
      });
      // User hasMany Order_match_event as seller
      this.hasMany(models.Order_match_event, {
        foreignKey: "seller_id",
        as: "SellOrderMatches",
      });
    }
  }
  User.init(
    {
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password_hash: DataTypes.STRING,
      is_verified: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
