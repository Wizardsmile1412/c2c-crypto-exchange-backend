"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class External_transfer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // External_transfer belongsTo User
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }
  External_transfer.init(
    {
      user_id: DataTypes.INTEGER,
      currency: DataTypes.STRING,
      amount: DataTypes.DECIMAL,
      to_address: DataTypes.STRING,
      network: DataTypes.STRING,
      status: DataTypes.STRING,
      tx_hash: DataTypes.STRING,
      ip_address: DataTypes.STRING,
      requested_at: DataTypes.DATE,
      processed_at: DataTypes.DATE,
      error_message: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "External_transfer",
    }
  );
  return External_transfer;
};
