import express from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const paymentRouter = express.Router();

// User routes (protected)
paymentRouter.use(auth);

// Deposit endpoints
paymentRouter.post('/deposits', paymentController.createDepositRequest);
paymentRouter.get('/transactions', paymentController.getUserTransactions);
paymentRouter.get('/transactions/:transactionId', paymentController.getTransactionById);
paymentRouter.patch('/transactions/:transactionId/cancel', paymentController.cancelTransaction);

// Admin routes (TODO: Add admin middleware)
paymentRouter.get('/admin/transactions', paymentController.getAllTransactions);
paymentRouter.patch('/admin/transactions/:transactionId/complete', paymentController.completeDeposit);
paymentRouter.get('/admin/stats', paymentController.getPaymentStats);

// Testing routes
paymentRouter.post('/test/webhook', paymentController.simulateWebhook);

export default paymentRouter;
