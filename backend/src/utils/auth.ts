import { Request } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AppError } from "./errors";
import { JwtPayload } from "../types/express";
import * as bcrypt from 'bcrypt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const getUser = async (req: Request): Promise<User | null> => {
  try {
    if (!req.user?.userId) {
      return null;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: req.user.userId },
      select: ["id", "email"]
    });

    if (!user) {
      throw new AppError(401, "User not found");
    }

    return user;
  } catch (error) {
    console.error("Error in getUser:", error);
    throw error;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}; 