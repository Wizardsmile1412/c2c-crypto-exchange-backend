
import { paymentService } from '../services/paymentService.js';
import { mockGatewayService } from '../services/mockGatewayService.js';

export const paymentController = {
  /**
   * Create a deposit request
   */
  createDepositRequest: async (req, res) => {
    try {
      const { currency, amount, provider = 'MOCK_GATEWAY' } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      // Validation
      if (!currency || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Currency and amount are required'
        });
      }

      if (!['THB', 'USD'].includes(currency.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Only THB and USD deposits are supported'
        });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be positive'
        });
      }

      const result = await paymentService.createDepositRequest(
        userId,
        currency,
        amount,
        provider,
        ipAddress
      );

      res.status(201).json({
        success: true,
        data: result.transaction,
        gatewayInfo: result.gatewayInfo,
        message: 'Deposit request created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get user's payment transactions
   */
  getUserTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type, currency, status, limit } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (currency) filters.currency = currency;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit);

      const transactions = await paymentService.getUserTransactions(userId, filters);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get transaction by ID
   */
  getTransactionById: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid transaction ID is required'
        });
      }

      const transaction = await paymentService.getTransactionById(
        parseInt(transactionId),
        userId
      );

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Cancel a pending transaction
   */
  cancelTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid transaction ID is required'
        });
      }

      const transaction = await paymentService.cancelTransaction(
        parseInt(transactionId),
        userId
      );

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // === ADMIN ENDPOINTS ===

  /**
   * Get all transactions (admin)
   */
  getAllTransactions: async (req, res) => {
    try {
      const { type, currency, status, userId, limit } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (currency) filters.currency = currency;
      if (status) filters.status = status;
      if (userId) filters.userId = parseInt(userId);
      if (limit) filters.limit = parseInt(limit);

      const transactions = await paymentService.getAllTransactions(filters);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Complete a deposit (admin)
   */
  completeDeposit: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = req.user.id;

      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid transaction ID is required'
        });
      }

      if (!status || !['COMPLETED', 'FAILED', 'CANCELLED'].includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Status must be COMPLETED, FAILED, or CANCELLED'
        });
      }

      const result = await paymentService.completeDeposit(
        parseInt(transactionId),
        adminId,
        status,
        adminNotes
      );

      res.json({
        success: true,
        data: result.transaction,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get payment statistics (admin)
   */
  getPaymentStats: async (req, res) => {
    try {
      const stats = await paymentService.getPaymentStats();

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
   * Simulate webhook for testing
   */
  simulateWebhook: async (req, res) => {
    try {
      const { gatewayTxnId, status } = req.body;

      if (!gatewayTxnId || !status) {
        return res.status(400).json({
          success: false,
          error: 'Gateway transaction ID and status are required'
        });
      }

      const webhookPayload = mockGatewayService.simulateWebhook(gatewayTxnId, status);

      res.json({
        success: true,
        data: webhookPayload,
        message: 'Webhook simulated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};