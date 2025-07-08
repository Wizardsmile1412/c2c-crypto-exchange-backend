import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth.route.js';
import walletRouter from './routes/wallet.route.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/wallets', walletRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));