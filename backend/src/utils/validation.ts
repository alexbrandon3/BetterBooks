import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './errors';

// Generic body validation
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
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
  return async (req: Request, _res: Response, next: NextFunction) => {
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
  return async (req: Request, _res: Response, next: NextFunction) => {
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

const idValidation = z
  .string()
  .refine(val => val.trim() !== '', { message: 'ID is required' })
  .refine(val => !isNaN(Number(val)), { message: 'ID must be a number' })
  .transform(val => Number(val))
  .refine(val => Number.isInteger(val) && val > 0, { message: 'ID must be a positive integer' });

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
    description: z.string().min(1, 'Description is required'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format'
    }),
    type: z.enum(['INCOME', 'EXPENSE']),
    entries: z.array(
      z.object({
        accountId: z.coerce.number()
          .int()
          .positive()
          .refine(val => !isNaN(val), {
            message: 'Account ID must be a valid number',
          }),
        amount: z.coerce.number()
          .positive()
          .refine(val => !isNaN(val), {
            message: 'Amount must be a valid number',
          }),
        type: z.enum(['DEBIT', 'CREDIT'])
      })
    ).min(2, 'At least two entries are required for double-entry accounting'),
    isRecurring: z.boolean().optional(),
    recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date format'
    }).optional(),
  }),

  createSplitTransaction: z.object({
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['INCOME', 'EXPENSE']),
    entries: z.array(
      z.object({
        amount: z.coerce.number()
          .positive()
          .refine(val => !isNaN(val), {
            message: 'Amount must be a valid number',
          }),
        accountId: z.coerce.number()
          .int()
          .positive()
          .refine(val => !isNaN(val), {
            message: 'Account ID must be a valid number',
          }),
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
    id: z.coerce.number()
      .int()
      .positive()
      .refine(val => !isNaN(val), {
        message: 'ID must be a valid number',
      }),
  }),

  recurringTransactions: z.object({
    userId: z
      .coerce
      .number()
      .int()
      .positive()
      .refine(val => !isNaN(val), { message: "User ID must be a valid number" })
      .optional(),
  }),
}; 