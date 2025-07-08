import { transferService } from '../services/transferService.js';

export const transferController = {

  createTransfer: async (req, res) => {
    try {
      const { recipient, currency, amount, note } = req.body;
      const fromUserId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      if (!recipient || !currency || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: recipient, currency, amount'
        });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be positive'
        });
      }

      // Find recipient user
      let toUserId;
      if (typeof recipient === 'number' || !isNaN(recipient)) {
        toUserId = parseInt(recipient);
      } else {
        const recipientUser = await transferService.findUserByIdentifier(recipient);
        if (!recipientUser) {
          return res.status(404).json({
            success: false,
            error: 'Recipient not found'
          });
        }
        toUserId = recipientUser.id;
      }


      const transfer = await transferService.executeTransfer(
        fromUserId,
        toUserId,
        currency,
        amount,
        ipAddress,
        note
      );

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'Transfer completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getTransferHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currency, status, limit } = req.query;

      const filters = {};
      if (currency) filters.currency = currency;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit);

      const transfers = await transferService.getUserTransfers(userId, filters);

      res.json({
        success: true,
        data: transfers,
        count: transfers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },


  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 3 characters'
        });
      }

      const user = await transferService.findUserByIdentifier(query);
      
      if (!user) {
        return res.json({
          success: true,
          data: [],
          message: 'No users found'
        });
      }

      res.json({
        success: true,
        data: [user]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};