import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
    };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
