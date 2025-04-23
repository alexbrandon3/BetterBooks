import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

export interface AuthedRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid Authorization format' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const user = await AppDataSource.getRepository(User).findOneBy({ email: decoded.email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
