
import express from 'express';
import { matchController } from '../controllers/match.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const matchRouter = express.Router();

matchRouter.get('/trades', auth, matchController.getUserTrades);

matchRouter.get('/market-stats', matchController.getMarketStats);

matchRouter.get('/recent', matchController.getRecentTrades);

export default matchRouter;