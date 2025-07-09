import { exchangeRateService } from '../services/exchangeRateService.js';

export const exchangeController = {
  /**
   * Get all exchange rates
   */
  getExchangeRates: async (req, res) => {
    try {
      const rates = await exchangeRateService.getAllExchangeRates();

      res.json({
        success: true,
        data: rates,
        count: rates.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get specific exchange rate
   */
  getExchangeRate: async (req, res) => {
    try {
      const { base, quote } = req.params;

      if (!base || !quote) {
        return res.status(400).json({
          success: false,
          error: 'Base and quote currencies are required'
        });
      }

      const rate = await exchangeRateService.getExchangeRate(base, quote);

      res.json({
        success: true,
        data: rate
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Convert currency
   */
  convertCurrency: async (req, res) => {
    try {
      const { amount, from, to } = req.query;

      if (!amount || !from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Amount, from, and to parameters are required'
        });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be positive'
        });
      }

      const conversion = await exchangeRateService.convertCurrency(amount, from, to);

      res.json({
        success: true,
        data: conversion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Update exchange rate (admin only)
   */
  updateExchangeRate: async (req, res) => {
    try {
      const { baseCurrency, quoteCurrency, rate, provider } = req.body;

      if (!baseCurrency || !quoteCurrency || !rate) {
        return res.status(400).json({
          success: false,
          error: 'Base currency, quote currency, and rate are required'
        });
      }

      if (parseFloat(rate) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Rate must be positive'
        });
      }

      const updatedRate = await exchangeRateService.updateExchangeRate(
        baseCurrency,
        quoteCurrency,
        rate,
        provider
      );

      res.json({
        success: true,
        data: updatedRate,
        message: 'Exchange rate updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Fetch rates from external API
   */
  fetchExternalRates: async (req, res) => {
    try {
      const rates = await exchangeRateService.fetchExternalRates();

      res.json({
        success: true,
        data: rates,
        count: rates.length,
        message: 'External rates fetched successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get trading pairs
   */
  getTradingPairs: async (req, res) => {
    try {
      const pairs = await exchangeRateService.getTradingPairs();

      res.json({
        success: true,
        data: pairs,
        count: pairs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get market prices
   */
  getMarketPrices: async (req, res) => {
    try {
      const prices = await exchangeRateService.getMarketPrices();

      res.json({
        success: true,
        data: prices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Calculate portfolio value
   */
  calculatePortfolioValue: async (req, res) => {
    try {
      const { targetCurrency = 'THB' } = req.query;
      const userId = req.user.id;

      // Get user's wallet balances
      const { walletService } = await import('../services/walletService.js');
      const wallets = await walletService.getUserWallets(userId);
      
      const portfolio = {};
      wallets.forEach(wallet => {
        portfolio[wallet.currency] = parseFloat(wallet.balance);
      });

      const valuation = await exchangeRateService.calculatePortfolioValue(
        portfolio,
        targetCurrency
      );

      res.json({
        success: true,
        data: valuation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Initialize default rates
   */
  initializeDefaultRates: async (req, res) => {
    try {
      const rates = await exchangeRateService.initializeDefaultRates();

      res.json({
        success: true,
        data: rates,
        count: rates.length,
        message: 'Default exchange rates initialized successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};