// types/express/index.d.ts
import { User } from '../../src/entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
