// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthenticatedRequest, JwtPayload } from "../types/express";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error("❌ AUTH ERROR: JWT_SECRET environment variable is not defined");
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    const user = await AppDataSource.getRepository(User).findOneBy({ id: Number(decoded.userId) });

    if (!user) {
      res.status(401).json({ message: "Unauthorized: User not found" });
      return;
    }

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    console.error("❌ AUTH ERROR:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
