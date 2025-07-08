import { walletService } from '../services/walletService.js';

export const walletController = {
  getWallets: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const wallets = await walletService.getUserWallets(userId);

      res.json({
        success: true,
        data: wallets,
        message: 'Wallets retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getWalletByCurrency: async (req, res) => {
    try {
      const { currency } = req.params;
      const userId = req.user.id;

      if (!walletService.isValidCurrency(currency)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid currency code'
        });
      }

      const wallet = await walletService.getWalletByCurrency(userId, currency);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found'
        });
      }

      res.json({
        success: true,
        data: wallet
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getWalletSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const summary = await walletService.getWalletSummary(userId);

      res.json({
        success: true,
        data: summary,
        message: 'Wallet summary retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};