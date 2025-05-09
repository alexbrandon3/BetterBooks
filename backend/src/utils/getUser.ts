import { Request } from "express";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppDataSource } from "../config/data-source";
import { JWT_SECRET } from "../config";

const userRepo = AppDataSource.getRepository(User);

export const getUser = async (req: Request): Promise<User | null> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error("No authorization header found");
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await userRepo.findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.error("User not found in database");
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error decoding user:", error);
    return null;
  }
};
