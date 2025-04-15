import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Account } from '../models/Account';
import { User } from '../models/User';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const accountRepository = AppDataSource.getRepository(Account);
const userRepository = AppDataSource.getRepository(User);

export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, subType, description, balance, isActive } = req.body;

    // Create or get test user
    let testUser = await userRepository.findOne({ where: { email: 'test@example.com' } });
    if (!testUser) {
      testUser = userRepository.create({
        id: uuidv4(),
        email: 'test@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User'
      });
      await userRepository.save(testUser);
      logger.info('Created test user:', testUser.id);
    }

    const account = accountRepository.create({
      name,
      type,
      subType,
      description,
      balance: balance || 0,
      isActive: isActive !== undefined ? isActive : true,
      userId: testUser.id
    });

    await accountRepository.save(account);
    logger.info('Created account:', account.id);

    res.status(201).json({
      status: 'success',
      data: {
        account,
      },
    });
  } catch (error) {
    logger.error('Error creating account:', error);
    next(error);
  }
};

export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await accountRepository.find({
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

export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const account = await accountRepository.findOne({
      where: { id },
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

export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, subType, description, isActive } = req.body;

    const account = await accountRepository.findOne({
      where: { id },
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

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const account = await accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    await accountRepository.remove(account);

    res.json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 