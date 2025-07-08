"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Fiat_transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Fiat_transaction belongsTo User
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  Fiat_transaction.init(
    {
      user_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      provider: DataTypes.STRING,
      amount: DataTypes.DECIMAL,
      currency: DataTypes.STRING,
      status: DataTypes.STRING,
      gateway_txn_id: DataTypes.STRING,
      ip_address: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Fiat_transaction",
      timestamps: true,
    }
  );
  return Fiat_transaction;
};
