import { Request } from 'express';
import { User } from '../entities/User';

export function getUser(req: Request): User {
    if (!req.user) {
      const err = new Error('User not authenticated');
      // @ts-ignore
      err.status = 401;
      throw err;
    }
    return req.user;
  }
  