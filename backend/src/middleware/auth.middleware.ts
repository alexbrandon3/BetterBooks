// src/middleware/auth.middleware.ts
import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { AuthedRequest } from './auth'; // path might vary depending on where you defined it

export const authenticate = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const userId = typeof decoded === 'object' && 'id' in decoded
      ? decoded.id
      : null;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
