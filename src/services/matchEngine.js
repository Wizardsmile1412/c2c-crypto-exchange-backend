import db from "../models/index.js";
import { walletService } from "./walletService.js";

const { User, sequelize } = db;

export const matchEngine = {
  /**
   * Find matching orders for a given order
   * @param {Object} newOrder - The new order to match
   * @returns {Promise<Array>} Array of matching orders
   */
  findMatchingOrders: async (newOrder) => {
    try {
      let matchingOrders = [];

      if (newOrder.order_type === "BUY") {
        // Find SELL orders with price <= buyer's price
        matchingOrders = await sequelize.query(
          `
        SELECT * FROM "Trade_orders" 
        WHERE order_type = 'SELL' 
        AND currency = ? 
        AND fiat_currency = ? 
        AND (status = 'OPEN' OR status = 'PARTIALLY_FILLED')
        AND remaining_amount > 0 
        AND price_per_unit <= ?
        AND user_id != ?
        ORDER BY price_per_unit ASC, "createdAt" ASC;
      `,
          {
            replacements: [
              newOrder.currency,
              newOrder.fiat_currency,
              newOrder.price_per_unit,
              newOrder.user_id,
            ],
            type: sequelize.QueryTypes.SELECT,
          }
        );
      } else {
        // Find BUY orders with price >= seller's price
        matchingOrders = await sequelize.query(
          `
        SELECT * FROM "Trade_orders" 
        WHERE order_type = 'BUY' 
        AND currency = ? 
        AND fiat_currency = ? 
        AND (status = 'OPEN' OR status = 'PARTIALLY_FILLED')
        AND remaining_amount > 0 
        AND price_per_unit >= ?
        AND user_id != ?
        ORDER BY price_per_unit DESC, "createdAt" ASC;
      `,
          {
            replacements: [
              newOrder.currency,
              newOrder.fiat_currency,
              newOrder.price_per_unit,
              newOrder.user_id,
            ],
            type: sequelize.QueryTypes.SELECT,
          }
        );
      }

      return matchingOrders;
    } catch (error) {
      throw new Error(`Failed to find matching orders: ${error.message}`);
    }
  },

  /**
   * Execute a trade between two orders
   * @param {Object} buyOrder - Buy order
   * @param {Object} sellOrder - Sell order
   * @param {number} tradeAmount - Amount to trade
   * @param {number} tradePrice - Price per unit for the trade
   * @returns {Promise<Object>} Trade execution result
   */
  executeTrade: async (buyOrder, sellOrder, tradeAmount, tradePrice) => {
    const transaction = await sequelize.transaction();

    try {
      const totalValue = tradeAmount * tradePrice;

      // Calculate fees (0.1% for each side)
      const buyerFee = totalValue * 0.001;
      const sellerFee = tradeAmount * 0.001;

      // Update buyer: get crypto, pay fiat + fee
      await matchEngine.updateBuyerBalance(
        buyOrder.user_id,
        buyOrder.currency,
        buyOrder.fiat_currency,
        tradeAmount,
        totalValue + buyerFee,
        transaction
      );

      // Update seller: get fiat - fee, lose crypto
      await matchEngine.updateSellerBalance(
        sellOrder.user_id,
        sellOrder.currency,
        sellOrder.fiat_currency,
        tradeAmount - sellerFee,
        totalValue,
        transaction
      );

      // Update order amounts
      await matchEngine.updateOrderAmounts(
        buyOrder.id,
        tradeAmount,
        transaction
      );
      await matchEngine.updateOrderAmounts(
        sellOrder.id,
        tradeAmount,
        transaction
      );

      // Create trade record
      const tradeRecord = await matchEngine.createTradeRecord(
        buyOrder,
        sellOrder,
        tradeAmount,
        tradePrice,
        totalValue,
        buyerFee,
        sellerFee,
        transaction
      );

      await transaction.commit();

      return {
        trade: tradeRecord,
        buyOrder: {
          ...buyOrder,
          remaining_amount: buyOrder.remaining_amount - tradeAmount,
        },
        sellOrder: {
          ...sellOrder,
          remaining_amount: sellOrder.remaining_amount - tradeAmount,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Trade execution failed: ${error.message}`);
    }
  },

  /**
   * Update buyer's balance after trade
   */
  updateBuyerBalance: async (
    userId,
    cryptoCurrency,
    fiatCurrency,
    cryptoAmount,
    fiatAmount,
    transaction
  ) => {
    // Add crypto to buyer
    await sequelize.query(
      `
      UPDATE "Wallets" 
      SET balance = balance + ?
      WHERE user_id = ? AND currency = ?;
    `,
      {
        replacements: [cryptoAmount, userId, cryptoCurrency],
        type: sequelize.QueryTypes.UPDATE,
        transaction,
      }
    );

    // Deduct fiat from buyer's locked balance
    await sequelize.query(
      `
      UPDATE "Wallets" 
      SET locked_balance = locked_balance - ?
      WHERE user_id = ? AND currency = ?;
    `,
      {
        replacements: [fiatAmount, userId, fiatCurrency],
        type: sequelize.QueryTypes.UPDATE,
        transaction,
      }
    );
  },

  /**
   * Update seller's balance after trade
   */
  updateSellerBalance: async (
    userId,
    cryptoCurrency,
    fiatCurrency,
    cryptoAmount,
    fiatAmount,
    transaction
  ) => {
    // Deduct crypto from seller's locked balance
    await sequelize.query(
      `
      UPDATE "Wallets" 
      SET locked_balance = locked_balance - ?
      WHERE user_id = ? AND currency = ?;
    `,
      {
        replacements: [cryptoAmount, userId, cryptoCurrency],
        type: sequelize.QueryTypes.UPDATE,
        transaction,
      }
    );

    // Add fiat to seller
    await sequelize.query(
      `
      UPDATE "Wallets" 
      SET balance = balance + ?
      WHERE user_id = ? AND currency = ?;
    `,
      {
        replacements: [fiatAmount, userId, fiatCurrency],
        type: sequelize.QueryTypes.UPDATE,
        transaction,
      }
    );
  },

  /**
   * Update order matched and remaining amounts
   */
  updateOrderAmounts: async (orderId, tradeAmount, transaction) => {
    try {
      // Get the current order
      const order = await sequelize.query(
        `SELECT matched_amount, remaining_amount FROM "Trade_orders" WHERE id = ?`,
        {
          replacements: [orderId],
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      const currentOrder = order[0];
      const newMatchedAmount =
        parseFloat(currentOrder.matched_amount) + parseFloat(tradeAmount);
      const newRemainingAmount =
        parseFloat(currentOrder.remaining_amount) - parseFloat(tradeAmount);
      const newStatus = newRemainingAmount <= 0 ? "FILLED" : "PARTIALLY_FILLED";

      // Update the order
      await sequelize.query(
        `
      UPDATE "Trade_orders" 
      SET 
        matched_amount = ?,
        remaining_amount = ?,
        status = ?,
        "updatedAt" = NOW()
      WHERE id = ?;
    `,
        {
          replacements: [
            newMatchedAmount,
            newRemainingAmount,
            newStatus,
            orderId,
          ],
          type: sequelize.QueryTypes.UPDATE,
          transaction,
        }
      );
    } catch (error) {
      console.error("Error updating order amounts:", error);
      throw error;
    }
  },

  /**
   * Create trade record
   */
  createTradeRecord: async (
    buyOrder,
    sellOrder,
    amount,
    price,
    totalValue,
    buyerFee,
    sellerFee,
    transaction
  ) => {
    const [tradeResult] = await sequelize.query(
      `
      INSERT INTO "Order_match_events" 
      (buy_order_id, sell_order_id, buyer_id, seller_id, currency, fiat_currency, 
       amount, price_per_unit, total_value, buyer_fee, seller_fee, status, "createdAt", "updatedAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', NOW(), NOW())
      RETURNING *;
    `,
      {
        replacements: [
          buyOrder.id,
          sellOrder.id,
          buyOrder.user_id,
          sellOrder.user_id,
          buyOrder.currency,
          buyOrder.fiat_currency,
          amount,
          price,
          totalValue,
          buyerFee,
          sellerFee,
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction,
      }
    );

    return tradeResult[0];
  },

  /**
   * Process matching for a new order
   * @param {Object} newOrder - The new order to process
   * @returns {Promise<Array>} Array of executed trades
   */
  // In matchEngine.js, update the processOrderMatching function
  processOrderMatching: async (newOrder) => {
    try {
      const matchingOrders = await matchEngine.findMatchingOrders(newOrder);

      if (matchingOrders.length === 0) {
        return [];
      }

      const executedTrades = [];
      let remainingAmount = newOrder.remaining_amount;

      for (const matchingOrder of matchingOrders) {
        if (remainingAmount <= 0) break;

        const tradeAmount = Math.min(
          remainingAmount,
          matchingOrder.remaining_amount
        );
        const tradePrice = matchingOrder.price_per_unit;

        try {
          const tradeResult = await matchEngine.executeTrade(
            newOrder.order_type === "BUY" ? newOrder : matchingOrder,
            newOrder.order_type === "SELL" ? newOrder : matchingOrder,
            tradeAmount,
            tradePrice
          );

          executedTrades.push(tradeResult);
          remainingAmount -= tradeAmount;
          newOrder.remaining_amount = remainingAmount;
        } catch (tradeError) {
          console.error("Trade execution failed:", tradeError);
          throw tradeError;
        }
      }

      // Update final order status
      if (remainingAmount === 0) {
        await sequelize.query(
          `
        UPDATE "Trade_orders" 
        SET status = 'FILLED', "updatedAt" = NOW()
        WHERE id = ?;
      `,
          {
            replacements: [newOrder.id],
            type: sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return executedTrades;
    } catch (error) {
      console.error("=== Order matching failed ===");
      console.error("Error:", error);
      throw new Error(`Order matching failed: ${error.message}`);
    }
  },

  /**
   * Get trade history for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of trades
   */
  getUserTrades: async (userId, filters = {}) => {
    try {
      let whereClause = `(buyer_id = ${userId} OR seller_id = ${userId})`;

      if (filters.currency) {
        whereClause += ` AND currency = '${filters.currency.toUpperCase()}'`;
      }

      if (filters.fiatCurrency) {
        whereClause += ` AND fiat_currency = '${filters.fiatCurrency.toUpperCase()}'`;
      }

      const limit = filters.limit || 50;

      const trades = await sequelize.query(
        `
        SELECT 
          ome.*,
          buyer.username as buyer_username,
          buyer.email as buyer_email,
          seller.username as seller_username,
          seller.email as seller_email,
          CASE 
            WHEN ome.buyer_id = ${userId} THEN 'BUY'
            ELSE 'SELL'
          END as trade_side
        FROM "Order_match_events" ome
        LEFT JOIN "Users" buyer ON ome.buyer_id = buyer.id
        LEFT JOIN "Users" seller ON ome.seller_id = seller.id
        WHERE ${whereClause}
        ORDER BY ome."createdAt" DESC
        LIMIT ${limit};
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return trades;
    } catch (error) {
      throw new Error(`Failed to get trade history: ${error.message}`);
    }
  },

  /**
   * Get public trades (recent trades for market data)
   * @param {string} currency - Crypto currency
   * @param {string} fiatCurrency - Fiat currency
   * @param {number} limit - Number of trades to return
   * @returns {Promise<Array>} Array of recent trades
   */
  getPublicTrades: async (currency, fiatCurrency, limit = 20) => {
    try {
      const trades = await sequelize.query(
        `
        SELECT 
          ome.amount,
          ome.price_per_unit,
          ome.total_value,
          ome.currency,
          ome.fiat_currency,
          ome.status,
          ome."createdAt"
        FROM "Order_match_events" ome
        WHERE ome.currency = ? AND ome.fiat_currency = ?
        ORDER BY ome."createdAt" DESC
        LIMIT ?;
      `,
        {
          replacements: [currency, fiatCurrency, limit],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return trades;
    } catch (error) {
      throw new Error(`Failed to get public trades: ${error.message}`);
    }
  },

  /**
   * Get market statistics
   * @param {string} currency - Crypto currency
   * @param {string} fiatCurrency - Fiat currency
   * @returns {Promise<Object>} Market statistics
   */
  getMarketStats: async (currency, fiatCurrency) => {
    try {
      const [stats] = await sequelize.query(
        `
        SELECT 
          COUNT(*) as total_trades,
          SUM(amount) as total_volume,
          SUM(total_value) as total_value,
          AVG(price_per_unit) as avg_price,
          MIN(price_per_unit) as min_price,
          MAX(price_per_unit) as max_price,
          (SELECT price_per_unit FROM "Order_match_events" 
           WHERE currency = ? AND fiat_currency = ? 
           ORDER BY "createdAt" DESC LIMIT 1) as last_price
        FROM "Order_match_events" 
        WHERE currency = ? AND fiat_currency = ? 
        AND "createdAt" >= NOW() - INTERVAL '24 hours';
      `,
        {
          replacements: [currency, fiatCurrency, currency, fiatCurrency],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return (
        stats || {
          total_trades: 0,
          total_volume: 0,
          total_value: 0,
          avg_price: 0,
          min_price: 0,
          max_price: 0,
          last_price: 0,
        }
      );
    } catch (error) {
      throw new Error(`Failed to get market stats: ${error.message}`);
    }
  },
};
