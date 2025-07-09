"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Wallet belongsTo User
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  Wallet.init(
    {
      user_id: DataTypes.INTEGER,
      currency: DataTypes.STRING,
      balance: DataTypes.DECIMAL,
      locked_balance: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: "Wallet",
    }
  );
  return Wallet;
};
