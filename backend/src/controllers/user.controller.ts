// src/controllers/user.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

const userRepo = AppDataSource.getRepository(User);

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

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Error in registerUser:", err);
    res.status(500).send("Internal Server Error");
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
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
