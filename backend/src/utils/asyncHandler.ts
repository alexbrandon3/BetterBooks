import { Request, Response, NextFunction, RequestHandler } from "express";

export function wrapAuthedHandler<T extends Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<Response | undefined>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req as T, res, next)).catch(next);
  };
} 