// src/controllers/user.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Account } from "../entities/Account";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { AuthenticatedRequest } from "../types/express";
import { getDefaultAccounts } from "../seeders/seedDefaultAccounts";

const userRepo = AppDataSource.getRepository(User);
const accountRepo = AppDataSource.getRepository(Account);

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await userRepo.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepo.create({
      email,
      password: hashedPassword,
    });

    await userRepo.save(user);

    // Create default accounts for the new user
    try {
      console.log(`Starting to create default accounts for user ${user.id}...`);
      const defaultAccounts = getDefaultAccounts(user.id);
      console.log(`Default accounts data prepared: ${defaultAccounts.length} accounts`);
      
      const createdAccounts: Account[] = [];
      
      for (const accountData of defaultAccounts) {
        console.log(`Creating account: ${accountData.name}`);
        const account = accountRepo.create(accountData);
        const savedAccount = await accountRepo.save(account);
        createdAccounts.push(savedAccount);
        console.log(`Successfully created account: ${savedAccount.name} (ID: ${savedAccount.id})`);
      }
      
      console.log(`Created ${createdAccounts.length} default accounts for user ${user.id}`);
    } catch (accountError) {
      console.error("Error creating default accounts:", accountError);
      // Don't fail the registration if account creation fails
      // The user can still use the system and create accounts manually
    }

    // Generate JWT token for automatic login
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Respond with the token and user info (similar to login)
    return res.status(201).json({
      message: "User registered successfully",
      token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error in registerUser:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await userRepo.findOneBy({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Respond with the token and user info
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userRepo.findOneBy({ id: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
