import { Request } from "express";
import { User } from "../entities/User";

export const getUser = (req: Request): User => {
  if (!req.user) {
    console.error("❌ No user found on request.");
    throw new Error("User not authenticated.");
  }
  console.log("🧪 Found user on request:", req.user);
  return req.user as User;
};
