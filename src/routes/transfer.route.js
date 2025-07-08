import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { transferController } from '../controllers/transfer.controller.js';

const transferRouter = express.Router();

transferRouter.post('/', auth, transferController.createTransfer);

transferRouter.get('/history', auth, transferController.getTransferHistory);

transferRouter.get('/search-users', auth, transferController.searchUsers);

export default transferRouter;