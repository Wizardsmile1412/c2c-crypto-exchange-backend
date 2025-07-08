import db from '../models/index.js';
import { walletService } from './walletService.js';

const { Internal_transfer, User, sequelize } = db;

export const transferService = {
  /**
   * Execute internal transfer between users
   * @param {number} fromUserId - Sender user ID
   * @param {number} toUserId - Receiver user ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to transfer
   * @param {string} ipAddress - IP address of the sender
   * @param {string} note - Optional transfer note
   * @returns {Promise<Object>} Transfer record
   */
  executeTransfer: async (fromUserId, toUserId, currency, amount, ipAddress, note = '') => {
    if (!walletService.isValidCurrency(currency)) {
      throw new Error('Invalid currency');
    }

    if (parseFloat(amount) <= 0) {
      throw new Error('Amount must be positive');
    }

    if (fromUserId === toUserId) {
      throw new Error('Cannot transfer to yourself');
    }

    const transaction = await sequelize.transaction();

    try {
      const receiver = await User.findByPk(toUserId);
      if (!receiver) {
        throw new Error('Receiver not found');
      }
      const hasSufficientBalance = await walletService.hasSufficientBalance(
        fromUserId, currency, amount
      );
      if (!hasSufficientBalance) {
        throw new Error('Insufficient balance');
      }

      const walletResult = await walletService.transferBalance(
        fromUserId, toUserId, currency, amount
      );

      const transfer = await Internal_transfer.create({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        currency: currency.toUpperCase(),
        amount: parseFloat(amount),
        status: 'SUCCESS',
        ip_address: ipAddress,
        note: note || ''
      }, { transaction });

      await transaction.commit();

      const transferWithUsers = await Internal_transfer.findByPk(transfer.id, {
        include: [
          {
            model: User,
            as: 'fromUser',
            attributes: ['id', 'username', 'email']
          },
          {
            model: User,
            as: 'toUser', 
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      return transferWithUsers;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Transfer failed: ${error.message}`);
    }
  },

  /**
   * Find user by username or email for transfer
   * @param {string} identifier - Username or email
   * @returns {Promise<Object|null>} User object or null
   */
  findUserByIdentifier: async (identifier) => {
    try {
      const user = await User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { username: identifier },
            { email: identifier }
          ]
        },
        attributes: ['id', 'username', 'email', 'is_verified']
      });
      return user;
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  },

  /**
   * Get transfer history for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of transfers
   */
  getUserTransfers: async (userId, filters = {}) => {
    try {
      const where = {
        [db.Sequelize.Op.or]: [
          { from_user_id: userId },
          { to_user_id: userId }
        ]
      };

      if (filters.currency) {
        where.currency = filters.currency.toUpperCase();
      }

      if (filters.status) {
        where.status = filters.status;
      }

      const transfers = await Internal_transfer.findAll({
        where,
        include: [
          {
            model: User,
            as: 'fromUser',
            attributes: ['id', 'username', 'email']
          },
          {
            model: User,
            as: 'toUser',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });

      // Add transfer direction for each transfer
      const transfersWithDirection = transfers.map(transfer => {
        const transferData = transfer.toJSON();
        transferData.direction = transfer.from_user_id === userId ? 'SENT' : 'RECEIVED';
        return transferData;
      });

      return transfersWithDirection;
    } catch (error) {
      throw new Error(`Failed to get transfer history: ${error.message}`);
    }
  }
};