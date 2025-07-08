import { orderService } from '../services/orderService.js';

export const orderController = {
  /**
   * Create a new order
   */
  createOrder: async (req, res) => {
    try {
      const { orderType, currency, fiatCurrency, amount, pricePerUnit } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      // Validation
      if (!orderType || !currency || !fiatCurrency || !amount || !pricePerUnit) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: orderType, currency, fiatCurrency, amount, pricePerUnit'
        });
      }

      if (!['BUY', 'SELL'].includes(orderType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Order type must be BUY or SELL'
        });
      }

      if (parseFloat(amount) <= 0 || parseFloat(pricePerUnit) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount and price must be positive numbers'
        });
      }

      const order = await orderService.createOrder(
        userId,
        orderType,
        currency,
        fiatCurrency,
        amount,
        pricePerUnit,
        ipAddress
      );

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get user's orders
   */
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const { orderType, currency, status, limit } = req.query;

      const filters = {};
      if (orderType) filters.orderType = orderType;
      if (currency) filters.currency = currency;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit);

      const orders = await orderService.getUserOrders(userId, filters);

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get all open orders (market view)
   */
  getOpenOrders: async (req, res) => {
    try {
      const { orderType, currency, fiatCurrency } = req.query;

      const filters = {};
      if (orderType) filters.orderType = orderType;
      if (currency) filters.currency = currency;
      if (fiatCurrency) filters.fiatCurrency = fiatCurrency;

      const orders = await orderService.getOpenOrders(filters);

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      if (!orderId || isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid order ID is required'
        });
      }

      const order = await orderService.cancelOrder(parseInt(orderId), userId);

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get order by ID
   */
  getOrderById: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      if (!orderId || isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid order ID is required'
        });
      }

      const order = await orderService.getOrderById(parseInt(orderId), userId);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};