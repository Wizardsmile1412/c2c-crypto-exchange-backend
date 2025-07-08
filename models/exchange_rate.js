'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Exchange_rate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Exchange_rate.init({
    base_currency: DataTypes.STRING,
    quote_currency: DataTypes.STRING,
    rate: DataTypes.DECIMAL,
    provider: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Exchange_rate',
  });
  return Exchange_rate;
};