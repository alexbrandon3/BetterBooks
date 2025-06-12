import { Request } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AppError } from "./errors";

export const getUser = async (req: Request): Promise<User | null> => {
  try {
    if (!req.user?.id) {
      return null;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: req.user.id },
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