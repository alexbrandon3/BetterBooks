import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { BaseController } from './base.controller';
import { JwtPayload } from '../types/express';
import { getDefaultAccounts } from '../seeders/seedDefaultAccounts';
import { AccountWeightService } from '../services/AccountWeightService';

export class AuthController extends BaseController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        this.sendError(res, 401, 'Invalid email or password');
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        this.sendError(res, 401, 'Invalid email or password');
        return;
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email
      };

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("❌ AUTH ERROR: JWT_SECRET environment variable is not defined");
        this.sendError(res, 500, 'Server configuration error');
        return;
      }

      const token = jwt.sign(
        payload,
        secret,
        { expiresIn: '24h' }
      );

      this.sendResponse(res, 200, { token });
    } catch (error) {
      console.error('Login error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const accountRepository = AppDataSource.getRepository(Account);

      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        this.sendError(res, 400, 'Email already registered');
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepository.create({
        email,
        password: hashedPassword
      });

      await userRepository.save(user);

      // Create default accounts for the new user
      try {
        const defaultAccounts = getDefaultAccounts(user.id);
        
        const createdAccounts: Account[] = [];
        
        for (const accountData of defaultAccounts) {
          const account = accountRepository.create(accountData);
          const savedAccount = await accountRepository.save(account);
          createdAccounts.push(savedAccount);
        }
        
        // Initialize default account weights for the new user
        try {
          console.log(`Starting to initialize default account weights for user ${user.id}...`);
          const accountWeightService = new AccountWeightService();
          await accountWeightService.initializeDefaultWeights(user.id);
          console.log(`Successfully initialized default account weights for user ${user.id}`);
        } catch (weightError) {
          console.error("Error initializing default account weights:", weightError);
          // Don't fail the registration if weight initialization fails
          // The user can still use the system and weights can be added later
        }
      } catch (accountError) {
        console.error("Error creating default accounts:", accountError);
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email
      };

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("❌ AUTH ERROR: JWT_SECRET environment variable is not defined");
        this.sendError(res, 500, 'Server configuration error');
        return;
      }

      const token = jwt.sign(
        payload,
        secret,
        { expiresIn: '24h' }
      );

      this.sendResponse(res, 201, { token });
    } catch (error) {
      console.error('Registration error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: Number(req.user?.userId) },
        select: ["id", "email", "displayName", "riskTolerance", "createdAt", "updatedAt"],
      });

      if (!user) {
        this.sendError(res, 404, 'User not found');
        return;
      }

      this.sendResponse(res, 200, user);
    } catch (error) {
      console.error('GetMe error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { displayName } = req.body;
      const userId = Number(req.user?.userId);

      if (!userId) {
        this.sendError(res, 401, 'User not authenticated');
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        this.sendError(res, 404, 'User not found');
        return;
      }

      // Update display name if provided
      if (displayName !== undefined) {
        user.displayName = displayName;
      }

      await userRepository.save(user);

      this.sendResponse(res, 200, { 
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          riskTolerance: user.riskTolerance
        }
      });
    } catch (error) {
      console.error('UpdateProfile error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }
} 