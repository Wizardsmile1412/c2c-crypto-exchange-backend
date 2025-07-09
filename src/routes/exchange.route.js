
import express from 'express';
import { exchangeController } from '../controllers/exchange.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const exchangeRouter = express.Router();

// Public routes
exchangeRouter.get('/rates', exchangeController.getExchangeRates);
exchangeRouter.get('/rates/:base/:quote', exchangeController.getExchangeRate);
exchangeRouter.get('/convert', exchangeController.convertCurrency);
exchangeRouter.get('/pairs', exchangeController.getTradingPairs);
exchangeRouter.get('/prices', exchangeController.getMarketPrices);

// Protected routes
exchangeRouter.get('/portfolio-value', auth, exchangeController.calculatePortfolioValue);

// Admin routes (add admin middleware later)
exchangeRouter.post('/rates', exchangeController.updateExchangeRate);
exchangeRouter.post('/rates/fetch', exchangeController.fetchExternalRates);
exchangeRouter.post('/rates/initialize', exchangeController.initializeDefaultRates);

export default exchangeRouter;