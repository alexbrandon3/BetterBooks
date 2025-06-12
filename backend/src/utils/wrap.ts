import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest } from "../types/express";

type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function wrapAsync(handler: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req as AuthenticatedRequest, res, next))
      .then(() => {}) // Convert any returned value to void
      .catch(next);
  };
} 