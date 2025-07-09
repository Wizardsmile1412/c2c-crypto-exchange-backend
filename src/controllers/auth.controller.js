import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { walletService } from "../services/walletService.js";

const { User } = db;

export const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "Username, email, and password are required"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters long"
        });
      }

      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          error: "User with this email already exists"
        });
      }

      const existingUserByUsername = await User.findOne({ where: { username } });
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          error: "User with this username already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password_hash: hashedPassword,
        is_verified: false,
      });

      await walletService.createInitialWallets(user.id);

      const { password_hash, ...userResponse } = user.toJSON();

      res.status(201).json({
        success: true,
        data: userResponse,
        message: "User registered successfully",
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        errors: error.errors 
      });
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: validationErrors
        });
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        return res.status(400).json({
          success: false,
          error: `${field} already exists`
        });
      }

      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required"
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password"
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password"
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      const { password_hash, ...userResponse } = user.toJSON();

      res.json({
        success: true,
        data: {
          token,
          user: userResponse
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
};