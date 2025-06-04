import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './errors';

// Generic body validation
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError(JSON.stringify(errors)));
      } else {
        next(error);
      }
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError(JSON.stringify(errors)));
      } else {
        next(error);
      }
    }
  };
};

// Validate route parameters
export const validateParams = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError(JSON.stringify(errors)));
      } else {
        next(error);
      }
    }
  };
};

// All Zod schemas
export const schemas = {
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  createAccount: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
    balance: z.number(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    financialCategory: z.string().optional(),
    financialSubcategory: z.string().optional(),
  }),

  createTransaction: z.object({
    amount: z.number(),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['INCOME', 'EXPENSE']),
    accountId: z.number(),
  }),

  createRecurringTransaction: z.object({
    amount: z.number(),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['INCOME', 'EXPENSE']),
    accountId: z.number(),
    interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    }).optional(),
  }),

  createSplitTransaction: z.object({
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['INCOME', 'EXPENSE']),
    entries: z.array(
      z.object({
        amount: z.number(),
        accountId: z.number(),
      })
    ).min(1, 'At least one entry is required'),
  }),

  suggestAccount: z.object({
    description: z.string().min(1, 'Description is required'),
  }),

  dateRange: z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
  }),

  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }),
}; 