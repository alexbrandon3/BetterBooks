import { Response } from "express";

export abstract class BaseController {
  protected sendResponse<T>(res: Response, statusCode: number, data: T): void {
    res.status(statusCode).json(data);
  }

  protected sendError(res: Response, statusCode: number, message: string | { message: string; error?: string }): void {
    if (typeof message === 'string') {
      res.status(statusCode).json({ message });
    } else {
      res.status(statusCode).json(message);
    }
  }
} 