import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';

const accountRepo = AppDataSource.getRepository(Account);

export const getAllAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = await accountRepo.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, type, balance, number } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const newAccount = accountRepo.create({ name, type, balance, number });
    const savedAccount = await accountRepo.save(newAccount);
    res.status(201).json(savedAccount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
};
