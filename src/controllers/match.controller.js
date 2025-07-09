import { matchEngine } from '../services/matchEngine.js';

export const matchController = {
  /**
   * Get trade history for user
   */
  getUserTrades: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currency, fiatCurrency, limit } = req.query;

      const filters = {};
      if (currency) filters.currency = currency;
      if (fiatCurrency) filters.fiatCurrency = fiatCurrency;
      if (limit) filters.limit = parseInt(limit);

      const trades = await matchEngine.getUserTrades(userId, filters);

      res.json({
        success: true,
        data: trades,
        count: trades.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get market statistics
   */
  getMarketStats: async (req, res) => {
    try {
      const { currency, fiatCurrency } = req.query;

      if (!currency || !fiatCurrency) {
        return res.status(400).json({
          success: false,
          error: 'Currency and fiatCurrency parameters are required'
        });
      }

      const stats = await matchEngine.getMarketStats(
        currency.toUpperCase(),
        fiatCurrency.toUpperCase()
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get all recent trades (public market data)
   */
  getRecentTrades: async (req, res) => {
    try {
      const { currency, fiatCurrency, limit = 20 } = req.query;

      if (!currency || !fiatCurrency) {
        return res.status(400).json({
          success: false,
          error: 'Currency and fiatCurrency parameters are required'
        });
      }

      const trades = await matchEngine.getPublicTrades(
        currency.toUpperCase(),
        fiatCurrency.toUpperCase(),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: trades,
        count: trades.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
