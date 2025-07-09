import crypto from 'crypto';

// Mock payment gateway to simulate real payment processing
export const mockGatewayService = {
  /**
   * Initialize payment with mock gateway
   * @param {number} transactionId - Internal transaction ID
   * @param {string} currency - Currency (THB, USD)
   * @param {number} amount - Amount
   * @param {string} type - Transaction type
   * @returns {Promise<Object>} Gateway response
   */
  initializePayment: async (transactionId, currency, amount, type) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock gateway IDs
      const gatewayTxnId = `MGW_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const reference = `REF_${transactionId}_${Date.now()}`;

      // Mock gateway response
      const gatewayResponse = {
        transactionId: gatewayTxnId,
        reference: reference,
        status: 'PROCESSING',
        currency: currency.toUpperCase(),
        amount: parseFloat(amount),
        type: type.toUpperCase(),
        gatewayName: 'Mock Payment Gateway',
        paymentUrl: `https://mock-gateway.example.com/pay/${gatewayTxnId}`,
        qrCode: `https://mock-gateway.example.com/qr/${gatewayTxnId}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        instructions: mockGatewayService.getPaymentInstructions(currency, amount),
        fees: mockGatewayService.calculateFees(currency, amount),
        createdAt: new Date()
      };

      return gatewayResponse;
    } catch (error) {
      throw new Error(`Mock gateway initialization failed: ${error.message}`);
    }
  },

  /**
   * Update payment status in mock gateway
   * @param {string} gatewayTxnId - Gateway transaction ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update response
   */
  updatePaymentStatus: async (gatewayTxnId, status) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        transactionId: gatewayTxnId,
        previousStatus: 'PROCESSING',
        newStatus: status.toUpperCase(),
        updatedAt: new Date(),
        message: `Payment status updated to ${status.toUpperCase()}`
      };
    } catch (error) {
      throw new Error(`Mock gateway status update failed: ${error.message}`);
    }
  },

  /**
   * Get payment instructions for different currencies
   * @param {string} currency - Currency
   * @param {number} amount - Amount
   * @returns {Object} Payment instructions
   */
  getPaymentInstructions: (currency, amount) => {
    const instructions = {
      THB: {
        method: 'Bank Transfer',
        bankName: 'Mock Bank Thailand',
        accountNumber: '123-456-789-0',
        accountName: 'Mock Exchange Ltd',
        amount: parseFloat(amount),
        reference: 'Use transaction reference in transfer memo',
        steps: [
          '1. Transfer the exact amount to the provided bank account',
          '2. Use the transaction reference in the transfer memo',
          '3. Keep your transfer receipt',
          '4. Funds will be credited within 30 minutes after verification'
        ]
      },
      USD: {
        method: 'Credit Card / PayPal',
        processor: 'Mock Payment Processor',
        amount: parseFloat(amount),
        reference: 'Use transaction reference for identification',
        steps: [
          '1. Click on the payment link provided',
          '2. Enter your payment details',
          '3. Confirm the transaction',
          '4. Funds will be credited immediately after successful payment'
        ]
      }
    };

    return instructions[currency.toUpperCase()] || instructions.USD;
  },

  /**
   * Calculate mock gateway fees
   * @param {string} currency - Currency
   * @param {number} amount - Amount
   * @returns {Object} Fee calculation
   */
  calculateFees: (currency, amount) => {
    const feeRates = {
      THB: 0.02, // 2% for THB
      USD: 0.029  // 2.9% for USD
    };

    const rate = feeRates[currency.toUpperCase()] || 0.029;
    const gatewayFee = parseFloat(amount) * rate;
    const netAmount = parseFloat(amount) - gatewayFee;

    return {
      gatewayFee: parseFloat(gatewayFee.toFixed(8)),
      netAmount: parseFloat(netAmount.toFixed(8)),
      feeRate: rate,
      currency: currency.toUpperCase()
    };
  },

  /**
   * Simulate webhook callback (for testing)
   * @param {string} gatewayTxnId - Gateway transaction ID
   * @param {string} status - Payment status
   * @returns {Object} Webhook payload
   */
  simulateWebhook: (gatewayTxnId, status) => {
    return {
      event: 'payment.status.changed',
      transactionId: gatewayTxnId,
      status: status.toUpperCase(),
      timestamp: new Date(),
      signature: crypto.createHmac('sha256', 'mock-secret-key')
        .update(`${gatewayTxnId}:${status}:${Date.now()}`)
        .digest('hex')
    };
  },

  /**
   * Verify webhook signature (for testing)
   * @param {Object} payload - Webhook payload
   * @returns {boolean} Verification result
   */
  verifyWebhookSignature: (payload) => {
    const expectedSignature = crypto.createHmac('sha256', 'mock-secret-key')
      .update(`${payload.transactionId}:${payload.status}:${payload.timestamp}`)
      .digest('hex');
    
    return payload.signature === expectedSignature;
  }
};