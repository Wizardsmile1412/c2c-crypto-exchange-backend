import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.route.js";
import walletRouter from "./routes/wallet.route.js";

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/wallets", walletRouter);


app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

export default app;
