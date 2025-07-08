// Auth controller
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { walletService } from '../services/walletService.js';

export const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Business logic - validate input, hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await User.create({
        username,
        email,
        password_hash: hashedPassword,
        is_verified: false
      });

      // Create initial wallets using wallet service
      await walletService.createInitialWallets(user.id);

      // Response formatting (don't send password)
      const { password_hash, ...userResponse } = user.toJSON();
      
      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User registered successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Business logic - find user, verify password
      const user = await User.findOne({ where: { email } });
      
      if (!user || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            is_verified: user.is_verified
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};