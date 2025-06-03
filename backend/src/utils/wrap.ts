import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthedRequest } from "../middleware/auth.middleware";

type AsyncRequestHandler = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function wrapAsync(handler: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req as AuthedRequest, res, next))
      .then(() => {}) // Convert any returned value to void
      .catch(next);
  };
} 