import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.route.js";
import walletRouter from "./routes/wallet.route.js";
import transferRouter from "./routes/transfer.route.js";

dotenv.config();

const app = express();
app.use(express.json());

// Trust proxy for IP address
app.set('trust proxy', true);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/wallets", walletRouter);
app.use("/api/transfer", transferRouter); 

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

export default app;
