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
  console.log(`🔐 AUTH DEBUG - ${req.method} ${req.path}`);
  console.log(`🔑 Auth header present: ${!!req.headers.authorization}`);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`❌ AUTH FAILED - No valid auth header`);
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "your-secret-key";

    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log(`✅ AUTH SUCCESS - User ID: ${decoded.userId}`);
    
    const user = await AppDataSource.getRepository(User).findOneBy({ id: Number(decoded.userId) });

    if (!user) {
      console.log(`❌ AUTH FAILED - User not found: ${decoded.userId}`);
      res.status(401).json({ message: "Unauthorized: User not found" });
      return;
    }

    (req as AuthenticatedRequest).user = decoded;
    console.log(`✅ AUTH COMPLETE - Proceeding to route handler`);
    next();
  } catch (error) {
    console.error("❌ AUTH ERROR:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
