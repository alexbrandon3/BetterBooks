import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Account } from '../models/Account';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';

const accountRepository = AppDataSource.getRepository(Account);

export const createAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, subType, description } = req.body;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const account = accountRepository.create({
      name,
      type,
      subType,
      description,
      user: req.user,
    });

    await accountRepository.save(account);

    res.status(201).json({
      status: 'success',
      data: {
        account,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAccounts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const accounts = await accountRepository.find({
      where: { user: { id: req.user.id } },
      relations: ['transactions'],
    });

    res.json({
      status: 'success',
      data: {
        accounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const account = await accountRepository.findOne({
      where: { id, user: { id: req.user.id } },
      relations: ['transactions'],
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    res.json({
      status: 'success',
      data: {
        account,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, subType, description, isActive } = req.body;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const account = await accountRepository.findOne({
      where: { id, user: { id: req.user.id } },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    account.name = name || account.name;
    account.type = type || account.type;
    account.subType = subType || account.subType;
    account.description = description || account.description;
    account.isActive = isActive !== undefined ? isActive : account.isActive;

    await accountRepository.save(account);

    res.json({
      status: 'success',
      data: {
        account,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const account = await accountRepository.findOne({
      where: { id, user: { id: req.user.id } },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    await accountRepository.remove(account);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 