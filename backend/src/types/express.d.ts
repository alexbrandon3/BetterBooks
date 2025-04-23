// backend/src/types/express.d.ts
import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export {}; // ensure it's treated as a module
