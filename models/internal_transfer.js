"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Internal_transfer extends Model {
    static associate(models) {
      // Define associations here
      Internal_transfer.belongsTo(models.User, {
        foreignKey: 'from_user_id',
        as: 'fromUser'
      });
      Internal_transfer.belongsTo(models.User, {
        foreignKey: 'to_user_id',
        as: 'toUser'
      });
    }
  }

  Internal_transfer.init({
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
      allowNull: false,
      defaultValue: 'SUCCESS'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Internal_transfer',
  });

  return Internal_transfer;
};