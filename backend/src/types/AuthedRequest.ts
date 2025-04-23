import { Request } from 'express';
import { User } from '../entities/User';

export interface AuthedRequest extends Request {
  user: User;
}
