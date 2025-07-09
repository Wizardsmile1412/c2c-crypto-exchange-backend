import db from '../models/index.js';
import { walletService } from './walletService.js';
import { mockGatewayService } from './mockGatewayService.js';

const { Fiat_transaction, User, sequelize } = db;

export const paymentService = {
  /**
   * Create a fiat deposit request
   * @param {number} userId - User ID
   * @param {string} currency - Currency (THB, USD)
   * @param {number} amount - Amount to deposit
   * @param {string} provider - Payment provider
   * @param {string} ipAddress - User's IP address
   * @returns {Promise<Object>} Deposit transaction
   */
  createDepositRequest: async (userId, currency, amount, provider = 'MOCK_GATEWAY', ipAddress) => {
    try {
      // Validate currency
      if (!['THB', 'USD'].includes(currency.toUpperCase())) {
        throw new Error('Only THB and USD deposits are supported');
      }

      // Validate amount
      if (parseFloat(amount) <= 0) {
        throw new Error('Amount must be positive');
      }

      // Minimum deposit amounts
      const minAmounts = { THB: 100, USD: 10 };
      if (parseFloat(amount) < minAmounts[currency.toUpperCase()]) {
        throw new Error(`Minimum deposit amount is ${minAmounts[currency.toUpperCase()]} ${currency.toUpperCase()}`);
      }

      // Create deposit transaction
      const transaction = await Fiat_transaction.create({
        user_id: userId,
        type: 'DEPOSIT',
        provider: provider.toUpperCase(),
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        status: 'PENDING',
        ip_address: ipAddress
      });

      // Initialize payment gateway
      const gatewayResult = await mockGatewayService.initializePayment(
        transaction.id,
        currency,
        amount,
        'DEPOSIT'
      );

      // Update transaction with gateway info
      const updatedTransaction = await transaction.update({
        gateway_txn_id: gatewayResult.transactionId,
        gateway_reference: gatewayResult.reference,
        gateway_response: JSON.stringify(gatewayResult),
        status: 'PROCESSING'
      });

      return {
        transaction: updatedTransaction,
        gatewayInfo: gatewayResult
      };
    } catch (error) {
      throw new Error(`Failed to create deposit request: ${error.message}`);
    }
  },

  /**
   * Process deposit completion (for admin)
   * @param {number} transactionId - Transaction ID
   * @param {number} adminId - Admin user ID
   * @param {string} status - New status (COMPLETED, FAILED, CANCELLED)
   * @param {string} adminNotes - Admin notes
   * @returns {Promise<Object>} Updated transaction
   */
  completeDeposit: async (transactionId, adminId, status, adminNotes = '') => {
    const dbTransaction = await sequelize.transaction();

    try {
      // Get transaction
      const fiatTransaction = await Fiat_transaction.findByPk(transactionId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!fiatTransaction) {
        throw new Error('Transaction not found');
      }

      if (fiatTransaction.status !== 'PROCESSING' && fiatTransaction.status !== 'PENDING') {
        throw new Error('Transaction is not in a processable state');
      }

      // Update transaction status
      const updatedTransaction = await fiatTransaction.update({
        status: status.toUpperCase(),
        admin_id: adminId,
        admin_notes: adminNotes,
        completed_at: new Date()
      }, { transaction: dbTransaction });

      // If completed successfully, update user's wallet balance
      if (status.toUpperCase() === 'COMPLETED') {
        await walletService.addBalance(
          fiatTransaction.user_id,
          fiatTransaction.currency,
          fiatTransaction.amount
        );

        // Update gateway status
        await mockGatewayService.updatePaymentStatus(
          fiatTransaction.gateway_txn_id,
          'COMPLETED'
        );
      }

      await dbTransaction.commit();

      return {
        transaction: updatedTransaction,
        message: `Deposit ${status.toLowerCase()} successfully`
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(`Failed to complete deposit: ${error.message}`);
    }
  },

  /**
   * Get user's fiat transactions
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of transactions
   */
  getUserTransactions: async (userId, filters = {}) => {
    try {
      const where = { user_id: userId };

      if (filters.type) {
        where.type = filters.type.toUpperCase();
      }

      if (filters.currency) {
        where.currency = filters.currency.toUpperCase();
      }

      if (filters.status) {
        where.status = filters.status.toUpperCase();
      }

      const transactions = await Fiat_transaction.findAll({
        where,
        include: [
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });

      return transactions;
    } catch (error) {
      throw new Error(`Failed to get user transactions: ${error.message}`);
    }
  },

  /**
   * Get all transactions (admin view)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of transactions
   */
  getAllTransactions: async (filters = {}) => {
    try {
      const where = {};

      if (filters.type) {
        where.type = filters.type.toUpperCase();
      }

      if (filters.currency) {
        where.currency = filters.currency.toUpperCase();
      }

      if (filters.status) {
        where.status = filters.status.toUpperCase();
      }

      if (filters.userId) {
        where.user_id = filters.userId;
      }

      const transactions = await Fiat_transaction.findAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          },
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 100
      });

      return transactions;
    } catch (error) {
      throw new Error(`Failed to get all transactions: ${error.message}`);
    }
  },

  /**
   * Get transaction by ID
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID (optional, for user access control)
   * @returns {Promise<Object>} Transaction details
   */
  getTransactionById: async (transactionId, userId = null) => {
    try {
      const where = { id: transactionId };
      
      if (userId) {
        where.user_id = userId;
      }

      const transaction = await Fiat_transaction.findOne({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          },
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  },

  /**
   * Cancel a pending transaction
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated transaction
   */
  cancelTransaction: async (transactionId, userId) => {
    try {
      const transaction = await Fiat_transaction.findOne({
        where: {
          id: transactionId,
          user_id: userId,
          status: ['PENDING', 'PROCESSING']
        }
      });

      if (!transaction) {
        throw new Error('Transaction not found or cannot be cancelled');
      }

      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(transaction.status)) {
      throw new Error('Transaction is already completed and cannot be cancelled');
    }

      const updatedTransaction = await transaction.update({
        status: 'CANCELLED',
        completed_at: new Date()
      });

      // Update gateway status
      if (transaction.gateway_txn_id) {
        await mockGatewayService.updatePaymentStatus(
          transaction.gateway_txn_id,
          'CANCELLED'
        );
      }

      return updatedTransaction;
    } catch (error) {
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  },

  /**
   * Get payment statistics
   * @returns {Promise<Object>} Payment statistics
   */
  getPaymentStats: async () => {
    try {
      const stats = await sequelize.query(`
        SELECT 
          type,
          currency,
          status,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM "Fiat_transactions"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY type, currency, status
        ORDER BY type, currency, status;
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      const summary = await sequelize.query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as total_completed_amount,
          SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as total_pending_amount,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_transactions,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_transactions,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_transactions
        FROM "Fiat_transactions"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days';
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return {
        detailed: stats,
        summary: summary[0] || {}
      };
    } catch (error) {
      throw new Error(`Failed to get payment stats: ${error.message}`);
    }
  }
};