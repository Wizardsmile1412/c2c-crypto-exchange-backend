import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { walletController } from '../controllers/wallet.controller.js';

const walletRouter = express.Router();

walletRouter.get('/', auth, walletController.getWallets);

walletRouter.get('/summary', auth, walletController.getWalletSummary);

walletRouter.get('/:currency', auth, walletController.getWalletByCurrency);

export default walletRouter;
