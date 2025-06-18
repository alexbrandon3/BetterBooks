import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  }
];

export const validateRegister = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  }
];

export const validateTransaction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { amount, description, date, accountId } = req.body;

  if (!amount || typeof amount !== "number") {
    return res.status(400).json({ message: "Amount is required and must be a number" });
  }

  if (!description || typeof description !== "string") {
    return res.status(400).json({ message: "Description is required and must be a string" });
  }

  if (!date || !(date instanceof Date || !isNaN(Date.parse(date)))) {
    return res.status(400).json({ message: "Valid date is required" });
  }

  if (!accountId || typeof accountId !== "number") {
    return res.status(400).json({ message: "Account ID is required and must be a number" });
  }

  next();
}; 