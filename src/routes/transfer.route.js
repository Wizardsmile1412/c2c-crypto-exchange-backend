import express from 'express';
import { transferController } from '../controllers/transfer.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const transferRouter = express.Router();

transferRouter.use(auth);

transferRouter.post('/', transferController.createTransfer);

transferRouter.get('/history', transferController.getTransferHistory);

transferRouter.get('/search-users', transferController.searchUsers);

export default transferRouter;