import db from '../models/index.js';
import { Op } from "sequelize";

const { Wallet, User } = db;

export const walletService = {
  /**
   * Get all wallets for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of wallet objects
   */
  getUserWallets: async (userId) => {
    try {
      const wallets = await Wallet.findAll({
        where: { user_id: userId },
        attributes: [
          "id",
          "currency",
          "balance",
          "locked_balance",
          "createdAt",
          "updatedAt",
        ],
        order: [["currency", "ASC"]],
      });
      return wallets;
    } catch (error) {
      throw new Error(`Failed to get user wallets: ${error.message}`);
    }
  },

  /**
   * Get wallet by currency for a specific user
   * @param {number} userId - User ID
   * @param {string} currency - Currency code (THB, USD, BTC, ETH, DOGE, XRP)
   * @returns {Promise<Object|null>} Wallet object or null if not found
   */
  getWalletByCurrency: async (userId, currency) => {
    try {
      const wallet = await Wallet.findOne({
        where: {
          user_id: userId,
          currency: currency.toUpperCase(),
        },
        attributes: [
          "id",
          "currency",
          "balance",
          "locked_balance",
          "createdAt",
          "updatedAt",
        ],
      });
      return wallet;
    } catch (error) {
      throw new Error(`Failed to get wallet by currency: ${error.message}`);
    }
  },

  /**
   * Check if user has sufficient balance for a transaction
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to check
   * @returns {Promise<boolean>} True if sufficient balance, false otherwise
   */
  hasSufficientBalance: async (userId, currency, amount) => {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency: currency.toUpperCase() },
        attributes: ["balance"],
      });

      if (!wallet) {
        return false;
      }

      return parseFloat(wallet.balance) >= parseFloat(amount);
    } catch (error) {
      throw new Error(`Failed to check balance: ${error.message}`);
    }
  },

  /**
   * Lock balance for pending transactions (e.g., trades, withdrawals)
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to lock
   * @returns {Promise<Object>} Updated wallet object
   */
  lockBalance: async (userId, currency, amount) => {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency: currency.toUpperCase() },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const availableBalance = parseFloat(wallet.balance);
      const lockAmount = parseFloat(amount);

      if (availableBalance < lockAmount) {
        throw new Error("Insufficient balance to lock");
      }

      // Move amount from balance to locked_balance
      const updatedWallet = await wallet.update({
        balance: availableBalance - lockAmount,
        locked_balance: parseFloat(wallet.locked_balance) + lockAmount,
      });

      return updatedWallet;
    } catch (error) {
      throw new Error(`Failed to lock balance: ${error.message}`);
    }
  },

  /**
   * Unlock balance (e.g., when canceling an order)
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to unlock
   * @returns {Promise<Object>} Updated wallet object
   */
  unlockBalance: async (userId, currency, amount) => {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency: currency.toUpperCase() },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const lockedBalance = parseFloat(wallet.locked_balance);
      const unlockAmount = parseFloat(amount);

      if (lockedBalance < unlockAmount) {
        throw new Error("Insufficient locked balance to unlock");
      }

      // Move amount from locked_balance back to balance
      const updatedWallet = await wallet.update({
        balance: parseFloat(wallet.balance) + unlockAmount,
        locked_balance: lockedBalance - unlockAmount,
      });

      return updatedWallet;
    } catch (error) {
      throw new Error(`Failed to unlock balance: ${error.message}`);
    }
  },

  /**
   * Add balance to wallet (e.g., fiat deposits, trade settlements)
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to add
   * @returns {Promise<Object>} Updated wallet object
   */
  addBalance: async (userId, currency, amount) => {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency: currency.toUpperCase() },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const updatedWallet = await wallet.update({
        balance: parseFloat(wallet.balance) + parseFloat(amount),
      });

      return updatedWallet;
    } catch (error) {
      throw new Error(`Failed to add balance: ${error.message}`);
    }
  },

  /**
   * Deduct balance from wallet (e.g., successful withdrawals)
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to deduct
   * @returns {Promise<Object>} Updated wallet object
   */
  deductBalance: async (userId, currency, amount) => {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency: currency.toUpperCase() },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const currentBalance = parseFloat(wallet.balance);
      const deductAmount = parseFloat(amount);

      if (currentBalance < deductAmount) {
        throw new Error("Insufficient balance to deduct");
      }

      const updatedWallet = await wallet.update({
        balance: currentBalance - deductAmount,
      });

      return updatedWallet;
    } catch (error) {
      throw new Error(`Failed to deduct balance: ${error.message}`);
    }
  },

  /**
   * Deduct from locked balance (e.g., when completing a withdrawal)
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to deduct from locked balance
   * @returns {Promise<Object>} Updated wallet object
   */
  deductLockedBalance: async (userId, currency, amount) => {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency: currency.toUpperCase() },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const lockedBalance = parseFloat(wallet.locked_balance);
      const deductAmount = parseFloat(amount);

      if (lockedBalance < deductAmount) {
        throw new Error("Insufficient locked balance to deduct");
      }

      const updatedWallet = await wallet.update({
        locked_balance: lockedBalance - deductAmount,
      });

      return updatedWallet;
    } catch (error) {
      throw new Error(`Failed to deduct locked balance: ${error.message}`);
    }
  },

  /**
   * Transfer balance between two users (internal transfer)
   * @param {number} fromUserId - Sender user ID
   * @param {number} toUserId - Receiver user ID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to transfer
   * @returns {Promise<Object>} Object containing both updated wallets
   */
  transferBalance: async (fromUserId, toUserId, currency, amount) => {
    try {
      const fromWallet = await Wallet.findOne({
        where: { user_id: fromUserId, currency: currency.toUpperCase() },
      });

      const toWallet = await Wallet.findOne({
        where: { user_id: toUserId, currency: currency.toUpperCase() },
      });

      if (!fromWallet || !toWallet) {
        throw new Error("One or both wallets not found");
      }

      const transferAmount = parseFloat(amount);
      const fromBalance = parseFloat(fromWallet.balance);

      if (fromBalance < transferAmount) {
        throw new Error("Insufficient balance for transfer");
      }

      const updatedFromWallet = await fromWallet.update({
        balance: fromBalance - transferAmount,
      });

      const updatedToWallet = await toWallet.update({
        balance: parseFloat(toWallet.balance) + transferAmount,
      });

      return {
        fromWallet: updatedFromWallet,
        toWallet: updatedToWallet,
      };
    } catch (error) {
      throw new Error(`Failed to transfer balance: ${error.message}`);
    }
  },

  /**
   * Create initial wallets for new user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of created wallet objects
   */
  createInitialWallets: async (userId) => {
    try {
      const currencies = ["THB", "USD", "BTC", "ETH", "DOGE", "XRP"];

      const walletPromises = currencies.map((currency) =>
        Wallet.create({
          user_id: userId,
          currency,
          balance: 0,
          locked_balance: 0,
        })
      );

      const wallets = await Promise.all(walletPromises);
      return wallets;
    } catch (error) {
      throw new Error(`Failed to create initial wallets: ${error.message}`);
    }
  },

  /**
   * Get wallet summary for a user (total balances)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Wallet summary object
   */
  getWalletSummary: async (userId) => {
    try {
      const wallets = await Wallet.findAll({
        where: { user_id: userId },
        attributes: ["currency", "balance", "locked_balance"],
      });

      const summary = {
        totalWallets: wallets.length,
        fiatWallets: wallets.filter((w) => ["THB", "USD"].includes(w.currency)),
        cryptoWallets: wallets.filter((w) =>
          ["BTC", "ETH", "DOGE", "XRP"].includes(w.currency)
        ),
        totalBalance: {},
        totalLockedBalance: {},
      };

      // Calculate totals by currency
      wallets.forEach((wallet) => {
        summary.totalBalance[wallet.currency] = parseFloat(wallet.balance);
        summary.totalLockedBalance[wallet.currency] = parseFloat(
          wallet.locked_balance
        );
      });

      return summary;
    } catch (error) {
      throw new Error(`Failed to get wallet summary: ${error.message}`);
    }
  },

  /**
   * Validate currency code
   * @param {string} currency - Currency code to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidCurrency: (currency) => {
    const validCurrencies = ["THB", "USD", "BTC", "ETH", "DOGE", "XRP"];
    return validCurrencies.includes(currency.toUpperCase());
  },

  /**
   * Check if currency is fiat
   * @param {string} currency - Currency code
   * @returns {boolean} True if fiat currency, false otherwise
   */
  isFiatCurrency: (currency) => {
    const fiatCurrencies = ["THB", "USD"];
    return fiatCurrencies.includes(currency.toUpperCase());
  },

  /**
   * Check if currency is crypto
   * @param {string} currency - Currency code
   * @returns {boolean} True if crypto currency, false otherwise
   */
  isCryptoCurrency: (currency) => {
    const cryptoCurrencies = ["BTC", "ETH", "DOGE", "XRP"];
    return cryptoCurrencies.includes(currency.toUpperCase());
  },
};
