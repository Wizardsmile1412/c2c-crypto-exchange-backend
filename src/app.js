import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.route.js";
import walletRouter from "./routes/wallet.route.js";
import transferRouter from "./routes/transfer.route.js";
import orderRouter from "./routes/order.route.js";
import matchRouter from "./routes/match.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.set('trust proxy', true);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/wallets", walletRouter);
app.use("/api/transfer", transferRouter); 
app.use("/api/orders", orderRouter);
app.use("/api/matches", matchRouter);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

export default app;
