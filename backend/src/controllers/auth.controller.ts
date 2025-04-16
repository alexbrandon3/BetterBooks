import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

const userRepo = AppDataSource.getRepository(User);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const existing = await userRepo.findOneBy({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = userRepo.create({ email, password: hashedPassword });
    await userRepo.save(user);

    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Signup failed', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await userRepo.findOneBy({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err });
  }
};
