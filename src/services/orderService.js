import db from '../models/index.js';
import { walletService } from './walletService.js';

const { User, sequelize } = db;

export const orderService = {
  /**
   * Create a new trade order
   * @param {number} userId - User ID
   * @param {string} orderType - 'BUY' or 'SELL'
   * @param {string} currency - Crypto currency (BTC, ETH, DOGE, XRP)
   * @param {string} fiatCurrency - Fiat currency (THB, USD)
   * @param {number} amount - Amount of crypto to buy/sell
   * @param {number} pricePerUnit - Price per unit in fiat currency
   * @param {string} ipAddress - IP address
   * @returns {Promise<Object>} Created order
   */
  createOrder: async (userId, orderType, currency, fiatCurrency, amount, pricePerUnit, ipAddress) => {
    // Validate inputs
    if (!['BUY', 'SELL'].includes(orderType.toUpperCase())) {
      throw new Error('Order type must be BUY or SELL');
    }

    if (!walletService.isCryptoCurrency(currency)) {
      throw new Error('Invalid crypto currency');
    }

    if (!walletService.isFiatCurrency(fiatCurrency)) {
      throw new Error('Invalid fiat currency');
    }

    if (parseFloat(amount) <= 0 || parseFloat(pricePerUnit) <= 0) {
      throw new Error('Amount and price must be positive');
    }

    const transaction = await sequelize.transaction();

    try {
      const totalPrice = parseFloat(amount) * parseFloat(pricePerUnit);

      // For BUY orders: lock fiat currency
      // For SELL orders: lock crypto currency
      if (orderType.toUpperCase() === 'BUY') {
        // Check and lock fiat balance
        const hasSufficientFiat = await walletService.hasSufficientBalance(
          userId, fiatCurrency, totalPrice
        );
        if (!hasSufficientFiat) {
          throw new Error('Insufficient fiat balance');
        }
        await walletService.lockBalance(userId, fiatCurrency, totalPrice);
      } else {
        // Check and lock crypto balance
        const hasSufficientCrypto = await walletService.hasSufficientBalance(
          userId, currency, amount
        );
        if (!hasSufficientCrypto) {
          throw new Error('Insufficient crypto balance');
        }
        await walletService.lockBalance(userId, currency, amount);
      }

      const [orderResult] = await sequelize.query(`
        INSERT INTO "Trade_orders" 
        (user_id, order_type, currency, fiat_currency, amount, matched_amount, remaining_amount, price_per_unit, status, "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'OPEN', NOW(), NOW())
        RETURNING *;
      `, {
        replacements: [
          userId,
          orderType.toUpperCase(),
          currency.toUpperCase(),
          fiatCurrency.toUpperCase(),
          parseFloat(amount),
          parseFloat(amount), // remaining_amount = amount initially
          parseFloat(pricePerUnit),
          'OPEN'
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });

      await transaction.commit();

      // Get user details for response
      const user = await User.findByPk(userId);
      const order = orderResult[0];

      return {
        ...order,
        total_price: totalPrice,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Order creation failed: ${error.message}`);
    }
  },

  /**
   * Get user's orders
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of orders
   */
  getUserOrders: async (userId, filters = {}) => {
    try {
      let whereClause = `user_id = ${userId}`;
      
      if (filters.orderType) {
        whereClause += ` AND order_type = '${filters.orderType.toUpperCase()}'`;
      }
      
      if (filters.currency) {
        whereClause += ` AND currency = '${filters.currency.toUpperCase()}'`;
      }
      
      if (filters.status) {
        whereClause += ` AND status = '${filters.status.toUpperCase()}'`;
      }

      const limit = filters.limit || 50;

      const orders = await sequelize.query(`
        SELECT 
          to_.*,
          u.username,
          u.email,
          (to_.amount * to_.price_per_unit) as total_price
        FROM "Trade_orders" to_
        LEFT JOIN "Users" u ON to_.user_id = u.id
        WHERE ${whereClause}
        ORDER BY to_."createdAt" DESC
        LIMIT ${limit};
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return orders;
    } catch (error) {
      throw new Error(`Failed to get user orders: ${error.message}`);
    }
  },

  /**
   * Get all open orders (for matching)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of open orders
   */
  getOpenOrders: async (filters = {}) => {
    try {
      let whereClause = `status = 'OPEN' AND remaining_amount > 0`;
      
      if (filters.orderType) {
        whereClause += ` AND order_type = '${filters.orderType.toUpperCase()}'`;
      }
      
      if (filters.currency) {
        whereClause += ` AND currency = '${filters.currency.toUpperCase()}'`;
      }

      if (filters.fiatCurrency) {
        whereClause += ` AND fiat_currency = '${filters.fiatCurrency.toUpperCase()}'`;
      }

      const orders = await sequelize.query(`
        SELECT 
          to_.*,
          u.username,
          u.email,
          (to_.remaining_amount * to_.price_per_unit) as remaining_value
        FROM "Trade_orders" to_
        LEFT JOIN "Users" u ON to_.user_id = u.id
        WHERE ${whereClause}
        ORDER BY 
          CASE WHEN to_.order_type = 'BUY' THEN to_.price_per_unit END DESC,
          CASE WHEN to_.order_type = 'SELL' THEN to_.price_per_unit END ASC,
          to_."createdAt" ASC;
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return orders;
    } catch (error) {
      throw new Error(`Failed to get open orders: ${error.message}`);
    }
  },

  /**
   * Cancel an order
   * @param {number} orderId - Order ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated order
   */
  cancelOrder: async (orderId, userId) => {
    const transaction = await sequelize.transaction();

    try {
      // Get the order
      const [orders] = await sequelize.query(`
        SELECT * FROM "Trade_orders" WHERE id = ? AND user_id = ? AND status = 'OPEN';
      `, {
        replacements: [orderId, userId],
        type: sequelize.QueryTypes.SELECT,
        transaction
      });

      if (!orders) {
        throw new Error('Order not found or cannot be cancelled');
      }

      const order = orders;

      // Calculate locked amount to release
      let currencyToUnlock, amountToUnlock;
      if (order.order_type === 'BUY') {
        currencyToUnlock = order.fiat_currency;
        amountToUnlock = order.remaining_amount * order.price_per_unit;
      } else {
        currencyToUnlock = order.currency;
        amountToUnlock = order.remaining_amount;
      }

      // Release locked balance
      await walletService.unlockBalance(userId, currencyToUnlock, amountToUnlock);

      // Update order status
      await sequelize.query(`
        UPDATE "Trade_orders" 
        SET status = 'CANCELLED', "updatedAt" = NOW()
        WHERE id = ? AND user_id = ?;
      `, {
        replacements: [orderId, userId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      });

      await transaction.commit();

      // Return updated order
      const [updatedOrder] = await sequelize.query(`
        SELECT 
          to_.*,
          u.username,
          u.email,
          (to_.amount * to_.price_per_unit) as total_price
        FROM "Trade_orders" to_
        LEFT JOIN "Users" u ON to_.user_id = u.id
        WHERE to_.id = ?;
      `, {
        replacements: [orderId],
        type: sequelize.QueryTypes.SELECT
      });

      return updatedOrder;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Order cancellation failed: ${error.message}`);
    }
  },

  /**
   * Get order by ID
   * @param {number} orderId - Order ID
   * @param {number} userId - User ID (optional, for authorization)
   * @returns {Promise<Object>} Order details
   */
  getOrderById: async (orderId, userId = null) => {
    try {
      let whereClause = `to_.id = ?`;
      const replacements = [orderId];

      if (userId) {
        whereClause += ` AND to_.user_id = ?`;
        replacements.push(userId);
      }

      const [order] = await sequelize.query(`
        SELECT 
          to_.*,
          u.username,
          u.email,
          (to_.amount * to_.price_per_unit) as total_price
        FROM "Trade_orders" to_
        LEFT JOIN "Users" u ON to_.user_id = u.id
        WHERE ${whereClause};
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }
};