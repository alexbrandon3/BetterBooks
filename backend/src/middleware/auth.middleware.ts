import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No authorization header or incorrect format.");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await AppDataSource.getRepository(User).findOneBy({
      id: decoded.userId,
    });

    if (!user) {
      console.error("❌ No user found for given token.");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("🧪 User authenticated:", user);

    // Attach user to the request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Authentication error:", error.message);
    } else {
      console.error("❌ Unknown authentication error.");
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
};
