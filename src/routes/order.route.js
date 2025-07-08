import express from 'express';
import { orderController } from '../controllers/order.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const orderRouter = express.Router();

orderRouter.use(auth);

orderRouter.post('/', orderController.createOrder);

orderRouter.get('/', orderController.getUserOrders);

orderRouter.get('/market', orderController.getOpenOrders);

orderRouter.get('/:orderId', orderController.getOrderById);

orderRouter.patch('/:orderId/cancel', orderController.cancelOrder);

export default orderRouter;