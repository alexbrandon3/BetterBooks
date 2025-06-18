import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { BaseController } from './base.controller';
import { JwtPayload } from '../types/express';

export class AuthController extends BaseController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log("Login attempt for:", email);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        console.log("User not found:", email);
        this.sendError(res, 401, 'Invalid email or password');
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for user:", email);
        this.sendError(res, 401, 'Invalid email or password');
        return;
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: '24h' }
      );

      console.log("Login successful for:", email);
      this.sendResponse(res, 200, { token });
    } catch (error) {
      console.error('Login error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log("Registration attempt for:", email);

      const userRepository = AppDataSource.getRepository(User);
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
      console.log("User registered successfully:", email);

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your-secret-key",
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
      console.log("GetMe called, user from request:", req.user);
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: Number(req.user?.userId) },
        select: ["id", "email", "createdAt", "updatedAt"],
      });

      console.log("User found:", user);

      if (!user) {
        console.log("User not found for userId:", req.user?.userId);
        this.sendError(res, 404, 'User not found');
        return;
      }

      console.log("GetMe successful for user:", user.email);
      this.sendResponse(res, 200, user);
    } catch (error) {
      console.error('GetMe error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }
} 