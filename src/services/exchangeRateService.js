import db from '../models/index.js';
import axios from 'axios';

const { Exchange_rate, sequelize } = db;

export const exchangeRateService = {
  /**
   * Get exchange rate between two currencies
   * @param {string} baseCurrency - Base currency (e.g., 'BTC')
   * @param {string} quoteCurrency - Quote currency (e.g., 'THB')
   * @returns {Promise<Object>} Exchange rate object
   */
  getExchangeRate: async (baseCurrency, quoteCurrency) => {
    try {
      const rate = await Exchange_rate.findOne({
        where: {
          base_currency: baseCurrency.toUpperCase(),
          quote_currency: quoteCurrency.toUpperCase(),
          is_active: true
        },
        order: [['last_updated', 'DESC']]
      });

      if (!rate) {
        throw new Error(`Exchange rate not found for ${baseCurrency}/${quoteCurrency}`);
      }

      return rate;
    } catch (error) {
      throw new Error(`Failed to get exchange rate: ${error.message}`);
    }
  },

  /**
   * Get all active exchange rates
   * @returns {Promise<Array>} Array of exchange rates
   */
  getAllExchangeRates: async () => {
    try {
      const rates = await Exchange_rate.findAll({
        where: { is_active: true },
        order: [['base_currency', 'ASC'], ['quote_currency', 'ASC']]
      });

      return rates;
    } catch (error) {
      throw new Error(`Failed to get exchange rates: ${error.message}`);
    }
  },

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<Object>} Conversion result
   */
  convertCurrency: async (amount, fromCurrency, toCurrency) => {
    try {
      if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
        return {
          amount: parseFloat(amount),
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rate: 1,
          convertedAmount: parseFloat(amount)
        };
      }

      const rate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = parseFloat(amount) * parseFloat(rate.rate);

      return {
        amount: parseFloat(amount),
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rate: parseFloat(rate.rate),
        convertedAmount: convertedAmount,
        lastUpdated: rate.last_updated
      };
    } catch (error) {
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  },

  /**
   * Update exchange rate manually
   * @param {string} baseCurrency - Base currency
   * @param {string} quoteCurrency - Quote currency
   * @param {number} rate - Exchange rate
   * @param {string} provider - Rate provider
   * @returns {Promise<Object>} Updated exchange rate
   */
  updateExchangeRate: async (baseCurrency, quoteCurrency, rate, provider = 'MANUAL') => {
    try {
      const [exchangeRate, created] = await Exchange_rate.upsert({
        base_currency: baseCurrency.toUpperCase(),
        quote_currency: quoteCurrency.toUpperCase(),
        rate: parseFloat(rate),
        provider: provider.toUpperCase(),
        last_updated: new Date(),
        is_active: true
      });

      return exchangeRate;
    } catch (error) {
      throw new Error(`Failed to update exchange rate: ${error.message}`);
    }
  },

  /**
   * Fetch rates from external API (CoinGecko)
   * @returns {Promise<Array>} Array of updated rates
   */
  fetchExternalRates: async () => {
    try {
      const cryptoCurrencies = ['bitcoin', 'ethereum', 'dogecoin', 'ripple'];
      const fiatCurrencies = ['thb', 'usd'];
      
      const updatedRates = [];

      for (const crypto of cryptoCurrencies) {
        try {
          const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
            params: {
              ids: crypto,
              vs_currencies: fiatCurrencies.join(','),
              include_last_updated_at: true
            }
          });

          const data = response.data[crypto];
          if (data) {
            // Map CoinGecko IDs to our currency codes
            const currencyMap = {
              'bitcoin': 'BTC',
              'ethereum': 'ETH',
              'dogecoin': 'DOGE',
              'ripple': 'XRP'
            };

            const baseCurrency = currencyMap[crypto];

            for (const fiat of fiatCurrencies) {
              if (data[fiat]) {
                const rate = await exchangeRateService.updateExchangeRate(
                  baseCurrency,
                  fiat.toUpperCase(),
                  data[fiat],
                  'COINGECKO'
                );
                updatedRates.push(rate);
              }
            }
          }
        } catch (cryptoError) {
          console.error(`Failed to fetch rate for ${crypto}:`, cryptoError.message);
        }
      }

      return updatedRates;
    } catch (error) {
      throw new Error(`Failed to fetch external rates: ${error.message}`);
    }
  },

  /**
   * Get currency pairs available for trading
   * @returns {Promise<Array>} Array of trading pairs
   */
  getTradingPairs: async () => {
    try {
      const pairs = await sequelize.query(`
        SELECT 
          base_currency,
          quote_currency,
          rate,
          last_updated,
          provider,
          CONCAT(base_currency, '/', quote_currency) as pair
        FROM "Exchange_rates"
        WHERE is_active = true
        ORDER BY base_currency, quote_currency;
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return pairs;
    } catch (error) {
      throw new Error(`Failed to get trading pairs: ${error.message}`);
    }
  },

  /**
   * Get market prices for dashboard
   * @returns {Promise<Object>} Market prices grouped by currency
   */
  getMarketPrices: async () => {
    try {
      const rates = await sequelize.query(`
        SELECT 
          base_currency,
          quote_currency,
          rate,
          last_updated,
          provider
        FROM "Exchange_rates"
        WHERE is_active = true
        ORDER BY base_currency, quote_currency;
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      const marketPrices = {};
      
      rates.forEach(rate => {
        if (!marketPrices[rate.base_currency]) {
          marketPrices[rate.base_currency] = {};
        }
        marketPrices[rate.base_currency][rate.quote_currency] = {
          rate: parseFloat(rate.rate),
          lastUpdated: rate.last_updated,
          provider: rate.provider
        };
      });

      return marketPrices;
    } catch (error) {
      throw new Error(`Failed to get market prices: ${error.message}`);
    }
  },

  /**
   * Calculate portfolio value in specific currency
   * @param {Object} portfolio - Portfolio with currency amounts
   * @param {string} targetCurrency - Target currency for valuation
   * @returns {Promise<Object>} Portfolio valuation
   */
  calculatePortfolioValue: async (portfolio, targetCurrency = 'THB') => {
    try {
      const valuation = {
        targetCurrency: targetCurrency.toUpperCase(),
        totalValue: 0,
        breakdown: {}
      };

      for (const [currency, amount] of Object.entries(portfolio)) {
        if (parseFloat(amount) > 0) {
          try {
            const conversion = await exchangeRateService.convertCurrency(
              amount,
              currency,
              targetCurrency
            );
            
            valuation.breakdown[currency] = {
              amount: parseFloat(amount),
              rate: conversion.rate,
              value: conversion.convertedAmount
            };
            
            valuation.totalValue += conversion.convertedAmount;
          } catch (conversionError) {
            // If conversion fails, set value to 0
            valuation.breakdown[currency] = {
              amount: parseFloat(amount),
              rate: 0,
              value: 0,
              error: conversionError.message
            };
          }
        }
      }

      return valuation;
    } catch (error) {
      throw new Error(`Portfolio valuation failed: ${error.message}`);
    }
  },

  /**
   * Initialize default exchange rates
   * @returns {Promise<Array>} Array of created rates
   */
  initializeDefaultRates: async () => {
    try {
      const defaultRates = [
        // BTC rates
        { base: 'BTC', quote: 'THB', rate: 1500000 },
        { base: 'BTC', quote: 'USD', rate: 45000 },
        
        // ETH rates
        { base: 'ETH', quote: 'THB', rate: 80000 },
        { base: 'ETH', quote: 'USD', rate: 2400 },
        
        // DOGE rates
        { base: 'DOGE', quote: 'THB', rate: 2.5 },
        { base: 'DOGE', quote: 'USD', rate: 0.075 },
        
        // XRP rates
        { base: 'XRP', quote: 'THB', rate: 20 },
        { base: 'XRP', quote: 'USD', rate: 0.6 },
        
        // Fiat cross rates
        { base: 'USD', quote: 'THB', rate: 33.5 },
        { base: 'THB', quote: 'USD', rate: 0.0299 }
      ];

      const createdRates = [];
      
      for (const rateData of defaultRates) {
        try {
          const rate = await exchangeRateService.updateExchangeRate(
            rateData.base,
            rateData.quote,
            rateData.rate,
            'DEFAULT'
          );
          createdRates.push(rate);
        } catch (error) {
          console.error(`Failed to create rate ${rateData.base}/${rateData.quote}:`, error.message);
        }
      }

      return createdRates;
    } catch (error) {
      throw new Error(`Failed to initialize default rates: ${error.message}`);
    }
  }
};
