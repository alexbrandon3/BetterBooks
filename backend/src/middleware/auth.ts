import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { JwtPayload } from "../types/express";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JwtPayload;

    const userRepository = AppDataSource.getRepository(User);
    userRepository.findOne({
      where: { id: Number(decoded.userId) },
    }).then(user => {
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      req.user = decoded;
      next();
    }).catch(error => {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Invalid token" });
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
}; 